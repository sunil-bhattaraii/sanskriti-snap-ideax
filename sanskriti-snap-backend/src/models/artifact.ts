/**
 * Artifacts and their CV reference datasets.
 *
 * Artifacts are independent collectible entities with no parent/child
 * relationship; quests provide the grouping (docs/Project Requirements Doc.md
 * 7.1). Location is authoritative for GPS verification and is stored as a
 * GeoJSON Point.
 */

import mongoose, {
  Schema,
  model,
  type Model,
  type InferSchemaType,
} from "mongoose";

/**
 * GeoJSON is [longitude, latitude] — the reverse of the intuitive order and a
 * frequent source of bugs. The API converts to flat latitude/longitude so the
 * stored order never reaches the client, whose map library expects [lng, lat]
 * (docs/API Contract.md 2.8).
 */
const PointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) =>
          v.length === 2 &&
          v[0] >= -180 && v[0] <= 180 &&
          v[1] >= -90 && v[1] <= 90,
        message: "coordinates must be [longitude, latitude] within range",
      },
    },
  },
  { _id: false },
);

const CvConfigurationSchema = new Schema(
  {
    threshold: { type: Number, required: true, min: 0, max: 1 },
    topK: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const ArtifactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },

    description: { type: String, required: true },
    story: { type: String, required: false },

    category: {
      type: String,
      required: true,
      enum: [
        "TEMPLE",
        "SITE",
        "STATUE",
        "CARVING",
        "ARCHITECTURE",
        "MONUMENT",
        "COURTYARD",
        "CULTURAL_OBJECT",
        "OTHER",
      ],
    },
    tags: { type: [String], default: [] },

    /**
     * Uploader-defined, not derived from discoveryCount or category
     * (docs/API Contract.md 11.5). TitleCase to match the DTO; the client renders
     * this string rather than mapping category to a label.
     */
    rarity: {
      type: String,
      required: true,
      enum: ["Common", "Rare", "Epic", "Legendary"],
      default: "Common",
    },

    location: { type: PointSchema, required: true },
    humanReadableLocation: { type: String, required: true },
    altitudeMeters: { type: Number, default: null },

    storyUnlockRadiusMeters: { type: Number, required: true, min: 1 },
    verificationRadiusMeters: { type: Number, required: true, min: 1 },

    xpReward: { type: Number, required: true, min: 0 },

    /** Admin form label is "Require a snap". false means a photo is optional. */
    requiresSnap: { type: Boolean, required: true, default: true },
    requiresCV: { type: Boolean, required: true, default: false },

    cvConfiguration: { type: CvConfigurationSchema, default: null },

    /**
     * Denormalised cover for list queries. Maintained by the backend from the
     * designated cover ArtifactReference; never writable by a client
     * (docs/API Contract.md 3.1).
     */
    coverImageUrl: { type: String, default: null },

    warnings: { type: String, default: null },

    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "DISABLED"],
      default: "DRAFT",
    },

    discoveryCount: { type: Number, required: true, default: 0, min: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Mandatory for $geoNear on the Explore map.
ArtifactSchema.index({ location: "2dsphere" });
ArtifactSchema.index({ status: 1 });
ArtifactSchema.index({ category: 1 });
ArtifactSchema.index({ tags: 1 });
ArtifactSchema.index({ name: "text", description: "text" });

export type ArtifactDoc = InferSchemaType<typeof ArtifactSchema>;
export const Artifact =
  (mongoose.models["Artifact"] as Model<ArtifactDoc>) ??
  model("Artifact", ArtifactSchema);

/* --------------------------------------------------- artifactReferences -- */

const ArtifactReferenceSchema = new Schema(
  {
    artifactId: {
      type: Schema.Types.ObjectId,
      ref: "Artifact",
      required: true,
    },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, default: null },

    /**
     * select:false — a reference vector must never ride along on an incidental
     * read. CV comparisons load it explicitly.
     *
     * A reference row is written the moment its image is registered, before the
     * CV service has produced a vector for it — docs/API Contract.md 9 splits
     * "add reference" from "add embedding" into two calls. It therefore starts
     * empty, and `embeddingDimension: 0` is the not-yet-embedded marker. That is
     * why neither field carries `min`/`required`: the pending state is legal.
     * A comparison must skip dimension 0 rather than score an empty vector.
     */
    embedding: { type: [Number], default: [], select: false },
    embeddingDimension: { type: Number, default: 0 },

    /**
     * Stamped so embeddings generated by different models are never compared
     * against each other (docs/Backend TDS.md 83).
     */
    cvModel: {
      name: { type: String, required: true },
      version: { type: String, required: true },
    },

    isCover: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// CV verification loads references for exactly one artifact; this index is on
// the hot path (docs/DB Schemas.md 6).
ArtifactReferenceSchema.index({ artifactId: 1 });
ArtifactReferenceSchema.index({ artifactId: 1, isCover: 1 });

export type ArtifactReferenceDoc = InferSchemaType<typeof ArtifactReferenceSchema>;
export const ArtifactReference =
  (mongoose.models["ArtifactReference"] as Model<ArtifactReferenceDoc>) ??
  model("ArtifactReference", ArtifactReferenceSchema);
