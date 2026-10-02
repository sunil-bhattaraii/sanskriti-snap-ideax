/**
 * Reading and writing the caller's own profile.
 *
 * `AuthContext.user` is a deliberately narrow projection -- no `profileImage`,
 * `notifications` or `createdAt` -- so every route that answers with a
 * `UserProfile` re-reads the document rather than widening the auth context,
 * which would put profile data in the path of every authenticated request.
 */

import { Types } from "mongoose";
import type { UserProfile } from "./contracts";
import { toUserProfile } from "./dto";
import { ApiError } from "./errors";
import { User } from "@/models/user";

/** The document is gone between auth and this read -- the session is stale. */
function missingAccount(): ApiError {
  return ApiError.unauthenticated("Your account is no longer available.");
}

export async function loadOwnProfile(
  userId: Types.ObjectId,
): Promise<UserProfile> {
  const user = await User.findById(userId).lean();
  if (!user) throw missingAccount();
  return toUserProfile(user);
}

/**
 * Applies `update` and returns the resulting profile, so a mutation answers with
 * the same shape as `GET /api/v1/me` (docs/API Contract.md 4).
 *
 * An empty update is a documented no-op, not an error: `PATCH /api/v1/me` with
 * `{}` returns the current profile.
 */
export async function updateOwnProfile(
  userId: Types.ObjectId,
  update: Record<string, unknown>,
): Promise<UserProfile> {
  if (Object.keys(update).length === 0) return loadOwnProfile(userId);

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) throw missingAccount();
  return toUserProfile(updated);
}
