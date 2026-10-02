/**
 * Gamification: quests, badges, and the two ledgers.
 *
 * XP and points are separate currencies. XP is never spent and never decreases
 * except by explicit admin adjustment; points are spendable and decrease on
 * redemption. Conflating them was a defect in the previous implementation
 * (docs/DB Schemas.md 21a).
 */

import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

/* ----------------------------------------------------------------- quests */

const QuestSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    artifactIds: {
      type: [Schema.Types.ObjectId],
      ref: "Artifact",
      required: true,
      validate: {
        validator: (ids: unknown[]) => new Set(ids.map(String)).size === ids.length,
        message: "A quest cannot list the same artifact twice",
      },
    },
    xpReward: { type: Number, required: true, default: 0, min: 0 },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", default: null },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      required: true,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export type QuestDoc = InferSchemaType<typeof QuestSchema>;
export const Quest =
  (mongoose.models["Quest"] as Model<QuestDoc>) ??
  model("Quest", QuestSchema);

/* ------------------------------------------------------ userQuestProgress */

const UserQuestProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true },
    discoveredArtifactIds: { type: [Schema.Types.ObjectId], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserQuestProgressSchema.index({ userId: 1, questId: 1 }, { unique: true });

export type UserQuestProgressDoc = InferSchemaType<typeof UserQuestProgressSchema>;
export const UserQuestProgress =
  (mongoose.models["UserQuestProgress"] as Model<UserQuestProgressDoc>) ??
  model("UserQuestProgress", UserQuestProgressSchema);

/* ----------------------------------------------------------------- badges */

const BadgeConditionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["FIRST_DISCOVERY", "DISCOVERY_COUNT", "QUEST_COMPLETION", "CATEGORY_COUNT"],
      required: true,
    },
    value: { type: Number, default: null },
    questId: { type: Schema.Types.ObjectId, ref: "Quest", default: null },
    category: { type: String, default: null },
  },
  { _id: false },
);

const BadgeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    iconUrl: { type: String, default: null },
    condition: { type: BadgeConditionSchema, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "DISABLED"],
      required: true,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

export type BadgeDoc = InferSchemaType<typeof BadgeSchema>;
export const Badge =
  (mongoose.models["Badge"] as Model<BadgeDoc>) ??
  model("Badge", BadgeSchema);

const UserBadgeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
    /**
     * Which discovery earned this badge. Lets the receipt answer "badges
     * awarded by THIS discovery" instead of "most recent badge", which
     * otherwise re-celebrates an old badge on an unrelated later discovery
     * (docs/API Contract.md 7.2).
     */
    discoveryId: { type: Schema.Types.ObjectId, ref: "Discovery", default: null },
    earnedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
UserBadgeSchema.index({ discoveryId: 1 });

export type UserBadgeDoc = InferSchemaType<typeof UserBadgeSchema>;
export const UserBadge =
  (mongoose.models["UserBadge"] as Model<UserBadgeDoc>) ??
  model("UserBadge", UserBadgeSchema);

/* --------------------------------------------------------- xpTransactions */

/**
 * Append-only. Every XP award writes a row here, and users.lifetimeXp is a
 * cached aggregate of this ledger (docs/DB Schemas.md 14, 28).
 */
const XpTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Signed. Negative is permitted only for ROLLBACK / ADMIN_ADJUSTMENT. */
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["DISCOVERY", "QUEST_COMPLETION", "BADGE", "ADMIN_ADJUSTMENT", "ROLLBACK"],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["DISCOVERY", "QUEST", "BADGE", "ADMIN", "VERIFICATION"],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    reason: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

XpTransactionSchema.index({ userId: 1, createdAt: -1 });

export type XpTransactionDoc = InferSchemaType<typeof XpTransactionSchema>;
export const XpTransaction =
  (mongoose.models["XpTransaction"] as Model<XpTransactionDoc>) ??
  model("XpTransaction", XpTransactionSchema);

/* ----------------------------------------------------- pointsTransactions */

/**
 * Append-only ledger of spendable points. This is the source of truth;
 * users.pointsBalance is a cache that must always equal its sum
 * (docs/DB Schemas.md 21a, invariant 23).
 *
 * `amount` is always positive — `type` carries the direction, which is what
 * makes "points spent" distinguishable from "points revoked".
 */
const PointsTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["EARNED", "SPENT", "ADJUSTED"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    /** Running total, so the ledger is auditable on its own. */
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: [
        "DISCOVERY",
        "QUEST_COMPLETION",
        "BADGE_EARNED",
        "REWARD_REDEMPTION",
        "ADMIN_ADJUSTMENT",
      ],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    note: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PointsTransactionSchema.index({ userId: 1, createdAt: -1 });
// Stops a single discovery or redemption being credited twice.
PointsTransactionSchema.index({ userId: 1, referenceId: 1 });

export type PointsTransactionDoc = InferSchemaType<typeof PointsTransactionSchema>;
export const PointsTransaction =
  (mongoose.models["PointsTransaction"] as Model<PointsTransactionDoc>) ??
  model("PointsTransaction", PointsTransactionSchema);
