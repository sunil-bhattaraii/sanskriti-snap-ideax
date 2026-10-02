/**
 * Application user record.
 *
 * Clerk owns authentication and identity; this collection owns profile, role,
 * gamification, and preferences. No password is ever stored
 * (docs/DB Schemas.md 4).
 */

import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

const ProfileImageSchema = new Schema(
  {
    /** Always displayable. Never a signed URL (docs/API Contract.md 7.6). */
    url: { type: String, required: true },
    /**
     * Null when the asset is not ours to manage — a Clerk-hosted avatar, say.
     * Non-null only for an image uploaded through POST /api/v1/media/sign,
     * which is the only case where the backend may later delete it.
     */
    publicId: { type: String, default: null },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    // select:false so a stray read can never leak the external identity key.
    // Queries on it still work.
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    username: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },

    profileImage: { type: ProfileImageSchema, default: null },

    role: {
      type: String,
      enum: ["USER", "EXPERT", "ADMIN"],
      required: true,
      default: "USER",
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DELETED"],
      required: true,
      default: "ACTIVE",
    },

    lifetimeXp: { type: Number, required: true, default: 0, min: 0 },

    /**
     * A cache, never the record. It must always equal the sum of this user's
     * pointsTransactions, and is written in the same transaction as the ledger
     * entry that changes it (docs/DB Schemas.md 21a, invariant 23).
     */
    pointsBalance: { type: Number, required: true, default: 0, min: 0 },

    notifications: {
      enabled: { type: Boolean, required: true, default: false },
      radiusMeters: { type: Number, required: true, default: 1000, min: 1 },
    },
  },
  { timestamps: true },
);

// Supports the leaderboard's $setWindowFields rank on XP (docs/DB Schemas.md 4).
UserSchema.index({ lifetimeXp: -1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User =
  (mongoose.models["User"] as Model<UserDoc>) ??
  model("User", UserSchema);
