/**
 * Application user record.
 *
 * Clerk owns authentication and identity; this collection owns profile, role,
 * gamification, and preferences. No password is ever stored
 * (docs/DB Schemas.md 4).
 */

import { Schema, model, type InferSchemaType } from "mongoose";

const ProfileImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
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
export const User = model("User", UserSchema);
