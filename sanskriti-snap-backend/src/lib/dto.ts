/**
 * Document -> DTO mapping.
 *
 * AGENTS.md: never return a raw MongoDB document. Every response is shaped here
 * so the projection is auditable in one place — `_id` becomes `id`, and
 * `clerkUserId`, `embedding`, `createdBy` and other users' `accountStatus`
 * cannot leak by accident.
 */

import type { AccountStatus, Role, UserProfile } from "./contracts";

/**
 * Structural, rather than `InferSchemaType<typeof UserSchema>`: the mapper is
 * fed lean query results, and the fields it reads are a deliberate subset of
 * the document.
 *
 * `createdAt` is optional only because Mongoose does not model
 * `timestamps: true` in the inferred type. Every document this schema writes
 * has it, so the epoch fallback below is unreachable — it exists to keep the
 * DTO field non-nullable.
 */
export type UserProfileSource = {
  _id: unknown;
  username: string;
  displayName: string;
  profileImage?: { url?: string | null } | null;
  role: string;
  accountStatus: string;
  lifetimeXp: number;
  pointsBalance: number;
  notifications?: { enabled?: boolean; radiusMeters?: number } | null;
  createdAt?: Date | string | null;
};

export function toUserProfile(user: UserProfileSource): UserProfile {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.profileImage?.url ?? null,
    role: user.role as Role,
    accountStatus: user.accountStatus as AccountStatus,
    lifetimeXp: user.lifetimeXp,
    pointsBalance: user.pointsBalance,
    notifications: {
      enabled: user.notifications?.enabled ?? false,
      radiusMeters: user.notifications?.radiusMeters ?? 1000,
    },
    createdAt: new Date(user.createdAt ?? 0).toISOString(),
  };
}
