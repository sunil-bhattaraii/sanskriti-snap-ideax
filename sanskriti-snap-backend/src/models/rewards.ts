/**
 * Rewards and redemptions.
 *
 * MVP simplification: the docs model `businesses` as a separate collection and
 * have rewards reference it by id. This sprint inlines `businessName` on the
 * reward instead, which removes a collection and a join from the only two
 * places businesses are read. Splitting it back out is a field-level change,
 * not a migration, because no other document depends on it.
 */

import { Schema, model, type InferSchemaType } from "mongoose";

const RewardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pointRequirement: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: ["FOOD_AND_DRINK", "EXPERIENCE", "CULTURE", "OTHER"],
      required: true,
      default: "OTHER",
    },
    terms: { type: String, default: null },
    imageUrl: { type: String, default: null },
    businessName: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED"],
      required: true,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

RewardSchema.index({ status: 1, pointRequirement: 1 });

export type RewardDoc = InferSchemaType<typeof RewardSchema>;
export const Reward = model("Reward", RewardSchema);

/* ------------------------------------------------------------ redemptions */

const RedemptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rewardId: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
    /** Snapshot, so history survives a reward being renamed or repriced. */
    rewardTitle: { type: String, required: true },
    businessName: { type: String, required: true },
    pointsSpent: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["CONFIRMED", "FULFILLED", "CANCELLED"],
      required: true,
      default: "CONFIRMED",
    },
    /** Server-generated; the only thing the user shows at the business. */
    code: { type: String, default: null },
    redeemedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

RedemptionSchema.index({ userId: 1, redeemedAt: -1 });
// One redemption per user per reward, ever. A second attempt is a 409, not a
// second charge (docs/API Contract.md 8).
RedemptionSchema.index({ userId: 1, rewardId: 1 }, { unique: true });

export type RedemptionDoc = InferSchemaType<typeof RedemptionSchema>;
export const Redemption = model("Redemption", RedemptionSchema);
