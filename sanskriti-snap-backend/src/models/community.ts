/**
 * Community content, moderation, and the admin audit log.
 *
 * These collections are not on the discovery loop and are the first thing to
 * cut under time pressure, but the schemas are written now so the
 * `verificationAttempts` -> `communitySnaps` provenance link and the
 * `adminActions` audit trail are not retrofitted awkwardly later.
 */

import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

/* --------------------------------------------------------- communitySnaps */

const MediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const CommunitySnapSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", default: null },

    /**
     * Provenance. Makes
     * CommunitySnap -> VerificationAttempt -> User/Artifact reconstructable, so
     * a moderator can tell whether a public photo passed verification. Null
     * only for admin-imported content.
     */
    verificationAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "VerificationAttempt",
      default: null,
    },

    media: { type: MediaSchema, required: true },
    caption: { type: String, default: null },

    /**
     * The only visibility control. Deliberately not a boolean alongside the
     * status — two representations of one fact can contradict each other
     * (docs/API Contract.md 11.6).
     */
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "HIDDEN", "REMOVED"],
      required: true,
      default: "PENDING",
    },
  },
  { timestamps: true },
);

CommunitySnapSchema.index({ artifactId: 1, status: 1, createdAt: -1 });
CommunitySnapSchema.index({ userId: 1, createdAt: -1 });

export type CommunitySnapDoc = InferSchemaType<typeof CommunitySnapSchema>;
export const CommunitySnap =
  (mongoose.models["CommunitySnap"] as Model<CommunitySnapDoc>) ??
  model("CommunitySnap", CommunitySnapSchema);

/* ---------------------------------------------------------------- reports */

const ReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: {
      type: String,
      enum: ["COMMUNITY_SNAP", "VERIFICATION_ATTEMPT", "CONTRIBUTION", "ARTIFACT"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["FAKE", "IRRELEVANT", "OFFENSIVE", "PRIVACY", "OTHER"],
      required: true,
    },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ["OPEN", "DISMISSED", "HIDDEN", "REMOVED"],
      required: true,
      default: "OPEN",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });

export type ReportDoc = InferSchemaType<typeof ReportSchema>;
export const Report =
  (mongoose.models["Report"] as Model<ReportDoc>) ??
  model("Report", ReportSchema);

/* ----------------------------------------------------------- contributions */

const ContributionSchema = new Schema(
  {
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    location: {
      type: new Schema(
        {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], required: true },
        },
        { _id: false },
      ),
      required: true,
    },
    humanReadableLocation: { type: String, default: null },
    culturalSignificance: { type: String, required: true },
    photos: { type: [MediaSchema], default: [] },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      required: true,
      default: "SUBMITTED",
    },
    review: {
      type: new Schema(
        {
          reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
          reviewedAt: { type: Date, required: true },
          note: { type: String, default: null },
        },
        { _id: false },
      ),
      default: null,
    },
    officialArtifactId: {
      type: Schema.Types.ObjectId,
      ref: "Artifact",
      default: null,
    },
  },
  { timestamps: true },
);

ContributionSchema.index({ status: 1, createdAt: 1 });
ContributionSchema.index({ submittedBy: 1, createdAt: -1 });

export type ContributionDoc = InferSchemaType<typeof ContributionSchema>;
export const Contribution =
  (mongoose.models["Contribution"] as Model<ContributionDoc>) ??
  model("Contribution", ContributionSchema);

/* ----------------------------------------------------------- adminActions */

/**
 * Every administrative mutation writes one of these in the same transaction as
 * the change it records, so the audit trail cannot disagree with the data
 * (docs/API Contract.md 9, docs/DB Schemas.md 18).
 */
const AdminActionSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "ARTIFACT_CREATED",
        "ARTIFACT_UPDATED",
        "ARTIFACT_ARCHIVED",
        "ARTIFACT_DISABLED",
        "VERIFICATION_APPROVED",
        "VERIFICATION_REJECTED",
        "CONTRIBUTION_APPROVED",
        "CONTRIBUTION_REJECTED",
        "QUEST_CREATED",
        "QUEST_UPDATED",
        "QUEST_ARCHIVED",
        "BADGE_CREATED",
        "BADGE_UPDATED",
        "COMMUNITY_CONTENT_HIDDEN",
        "COMMUNITY_CONTENT_REMOVED",
        "USER_SUSPENDED",
        "USER_REACTIVATED",
        "USER_UPDATED",
        "ADMIN_ADJUSTMENT",
      ],
      required: true,
    },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AdminActionSchema.index({ targetType: 1, targetId: 1 });
AdminActionSchema.index({ adminId: 1, createdAt: -1 });

export type AdminActionDoc = InferSchemaType<typeof AdminActionSchema>;
export const AdminAction =
  (mongoose.models["AdminAction"] as Model<AdminActionDoc>) ??
  model("AdminAction", AdminActionSchema);
