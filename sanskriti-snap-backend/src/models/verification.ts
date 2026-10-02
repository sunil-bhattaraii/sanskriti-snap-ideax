/**
 * Verification attempts, discoveries, and story unlocks.
 *
 * The distinction between these three is the backbone of the domain:
 *   - a VerificationAttempt is one submission of evidence,
 *   - a Discovery is a successful, reward-bearing collection,
 *   - a StoryUnlock is proximity only, and is independent of both.
 */

import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

/* ------------------------------------------------ verificationAttempts -- */

const MediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const AdditionalPhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, default: null },
  },
  { _id: false },
);

const LocationEvidenceSchema = new Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMeters: { type: Number, default: null },
    altitudeMeters: { type: Number, default: null },
    capturedAt: { type: Date, required: true },
  },
  { _id: false },
);

const GpsVerificationSchema = new Schema(
  {
    status: { type: String, enum: ["PASSED", "FAILED"], required: true },
    distanceMeters: { type: Number, default: null },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false },
);

const CvVerificationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["NOT_REQUIRED", "PASSED", "FAILED"],
      required: true,
    },
    similarityScore: { type: Number, default: null },
    threshold: { type: Number, default: null },
    topK: { type: Number, default: null },
    /** Persisted for admin review; never returned by the public DTO. */
    matchedReferenceIds: { type: [Schema.Types.ObjectId], default: [] },
    perReference: {
      type: [
        new Schema(
          {
            referenceId: { type: Schema.Types.ObjectId, required: true },
            score: { type: Number, required: true },
          },
          { _id: false },
        ),
      ],
      default: undefined,
      select: false,
    },
    model: {
      name: { type: String, required: true },
      version: { type: String, required: true },
    },
    processedAt: { type: Date, default: null },
  },
  { _id: false },
);

const ReviewSchema = new Schema(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedAt: { type: Date, required: true },
    decision: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
    note: { type: String, default: null },
  },
  { _id: false },
);

const VerificationAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", required: true },

    verificationImage: { type: MediaSchema, default: null },

    /**
     * Always private, with no visibility flag. A photo becomes public only by
     * creating a separate communitySnaps document, so the evidence the
     * verification system depends on can never be flipped public in place
     * (docs/API Contract.md 11.3).
     */
    additionalPhotos: { type: [AdditionalPhotoSchema], default: [] },

    locationEvidence: { type: LocationEvidenceSchema, required: true },
    gpsVerification: { type: GpsVerificationSchema, required: true },
    cvVerification: { type: CvVerificationSchema, default: null },

    /**
     * Only three states are ever persisted. A row is written inside the award
     * transaction, after the verdict is known, so there is no instant at which
     * a non-final status could exist (docs/DB Schemas.md 8, invariant 24).
     */
    status: {
      type: String,
      enum: ["VERIFIED", "FLAGGED", "REJECTED"],
      required: true,
    },

    /** Why automatic verification flagged it. Admin-only. */
    flagReason: { type: String, default: null, select: false },

    rejectionReason: { type: String, default: null },
    review: { type: ReviewSchema, default: null },

    /** Set when this attempt came from POST /:id/recheck. Never mutated in place. */
    supersedesAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "VerificationAttempt",
      default: null,
    },

    /** Set when this attempt produced a discovery. */
    discoveryId: { type: Schema.Types.ObjectId, ref: "Discovery", default: null },

    privateNote: { type: String, default: null },

    capturedAt: { type: Date, required: true },
    submittedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

VerificationAttemptSchema.index({ userId: 1, createdAt: -1 });
VerificationAttemptSchema.index({ artifactId: 1 });
VerificationAttemptSchema.index({ status: 1, createdAt: 1 });

export type VerificationAttemptDoc = InferSchemaType<typeof VerificationAttemptSchema>;
export const VerificationAttempt =
  (mongoose.models["VerificationAttempt"] as Model<VerificationAttemptDoc>) ??
  model("VerificationAttempt", VerificationAttemptSchema);

/* ------------------------------------------------------------ discoveries */

const DiscoverySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", required: true },
    verificationAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "VerificationAttempt",
      required: true,
    },
    discoveredAt: { type: Date, required: true, default: () => new Date() },
    /** Snapshot of the artifact's XP at discovery time. */
    xpAwarded: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

/**
 * The primary duplicate-discovery defense. Two concurrent requests can both
 * pass an `if (!alreadyDiscovered)` check, so the index is what actually
 * guarantees one award per artifact (docs/DB Schemas.md 9, 27).
 */
DiscoverySchema.index({ userId: 1, artifactId: 1 }, { unique: true });
DiscoverySchema.index({ artifactId: 1, createdAt: -1 });

export type DiscoveryDoc = InferSchemaType<typeof DiscoverySchema>;
export const Discovery =
  (mongoose.models["Discovery"] as Model<DiscoveryDoc>) ??
  model("Discovery", DiscoverySchema);

/* ---------------------------------------------------------- storyUnlocks - */

/**
 * Records that a user came within storyUnlockRadiusMeters and may read the
 * story. Independent of discovery in both directions: a FLAGGED attempt still
 * keeps the unlock it earned by walking there, and collecting is not required
 * to read (docs/DB Schemas.md 21c, invariant 21).
 */
const StoryUnlockSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", required: true },
    unlockedAt: { type: Date, required: true, default: () => new Date() },
    unlockedBy: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      distanceMeters: { type: Number, required: true },
      capturedAt: { type: Date, required: true },
    },
  },
  { timestamps: false },
);

StoryUnlockSchema.index({ userId: 1, artifactId: 1 }, { unique: true });
StoryUnlockSchema.index({ userId: 1 });

export type StoryUnlockDoc = InferSchemaType<typeof StoryUnlockSchema>;
export const StoryUnlock =
  (mongoose.models["StoryUnlock"] as Model<StoryUnlockDoc>) ??
  model("StoryUnlock", StoryUnlockSchema);

/* -------------------------------------------------------- idempotencyKeys - */

/**
 * Stores response payloads for Idempotency-Key headers (docs/API Contract.md 2.7).
 * TTL index clears keys automatically after 24 hours (86400 seconds).
 */
const IdempotencyKeySchema = new Schema(
  {
    key: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    statusCode: { type: Number, required: true },
    responseBody: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: () => new Date(), expires: 86400 },
  },
  { timestamps: false },
);

IdempotencyKeySchema.index({ key: 1, userId: 1 }, { unique: true });

export type IdempotencyKeyDoc = InferSchemaType<typeof IdempotencyKeySchema>;
export const IdempotencyKey =
  (mongoose.models["IdempotencyKey"] as Model<IdempotencyKeyDoc>) ??
  model("IdempotencyKey", IdempotencyKeySchema);
