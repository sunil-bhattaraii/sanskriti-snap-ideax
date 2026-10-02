/**
 * Identity resolution and authorization.
 *
 * The single most important rule in this contract: the backend derives the user
 * exclusively from the Clerk session token. A client never sends a user id for
 * a resource it does not own, and a user id in a body is a 422, not a lookup
 * (docs/API Contract.md 2.2-2.3).
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { connect } from "./db";
import { ApiError } from "./errors";
import { User } from "@/models/user";
import type { AccountStatus, Role } from "./contracts";

/** The caller, resolved from the token. `user` is null when signed out. */
export type AuthContext = {
  clerkUserId: string;
  user: {
    _id: Types.ObjectId;
    username: string;
    displayName: string;
    role: Role;
    accountStatus: AccountStatus;
    lifetimeXp: number;
    pointsBalance: number;
  };
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function sanitizeUsernameCandidate(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
  return USERNAME_RE.test(cleaned) ? cleaned : "";
}

/**
 * Application user records are created lazily on first authenticated request
 * rather than via Clerk webhooks, which is sufficient at hackathon scale
 * (docs/Backend TDS.md 100). The unique index on clerkUserId makes this
 * idempotent, so two concurrent first requests cannot create duplicates.
 */
async function provisionUser(clerkUserId: string): Promise<AuthContext["user"]> {
  const clerkUser = await currentUser();

  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
  const base =
    sanitizeUsernameCandidate(clerkUser?.username ?? "") ||
    sanitizeUsernameCandidate(email.split("@")[0] ?? "") ||
    `user_${clerkUserId.slice(-8)}`;

  // The unique index is the real guarantee; this loop only avoids surfacing a
  // 409 to the user on a routine collision.
  let username = base;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const taken = await User.exists({ username });
    if (!taken) break;
    const suffix = `_${clerkUserId.slice(-4)}${attempt > 1 ? attempt : ""}`;
    username = `${base.slice(0, 30 - suffix.length)}${suffix}`;
  }

  const created = await User.create({
    clerkUserId,
    username,
    displayName:
      clerkUser?.firstName ||
      clerkUser?.lastName ||
      clerkUser?.username ||
      email.split("@")[0] ||
      "Explorer",
    profileImage: clerkUser?.imageUrl
      ? { url: clerkUser.imageUrl, publicId: clerkUser.imageUrl }
      : null,
  });

  return created;
}

function toAuthUser(doc: InstanceType<typeof User>): AuthContext["user"] {
  return {
    _id: doc._id as Types.ObjectId,
    username: doc.username,
    displayName: doc.displayName,
    role: doc.role as Role,
    accountStatus: doc.accountStatus as AccountStatus,
    lifetimeXp: doc.lifetimeXp,
    pointsBalance: doc.pointsBalance,
  };
}

/**
 * Resolves the caller, or null when signed out. Safe to call on routes with
 * optional auth, where an anonymous caller gets a reduced payload.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  await connect();
  // clerkUserId is select:false, so ask for it explicitly.
  const existing = await User.findOne({ clerkUserId: userId }).select(
    "+clerkUserId",
  );

  const user = existing ? toAuthUser(existing) : await provisionUser(userId);
  return { clerkUserId: userId, user };
}

/** For `required` routes. Throws 401 UNAUTHENTICATED. */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw ApiError.unauthenticated();
  if (ctx.user.accountStatus !== "ACTIVE") {
    throw new ApiError(
      "ACCOUNT_SUSPENDED",
      "This account is not currently active.",
    );
  }
  return ctx;
}

/**
 * Role check for a route. Backend-enforced only — hiding UI in the client is
 * not security (docs/Backend TDS.md 10).
 *
 * EXPERT is a USER plus contribution review and nothing else, so admin routes
 * must not accept it (docs/API Contract.md 15).
 */
export async function requireRole(...roles: Role[]): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!roles.includes(ctx.user.role)) throw ApiError.forbidden();
  return ctx;
}

export function requireAdmin(): Promise<AuthContext> {
  return requireRole("ADMIN");
}

/** Expert or admin — contribution review only. */
export function requireReviewer(): Promise<AuthContext> {
  return requireRole("EXPERT", "ADMIN");
}
