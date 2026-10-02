import mongoose from "mongoose";

process.loadEnvFile(".env");

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const admin = await db
  .collection("users")
  .findOne({ role: "ADMIN" });
console.log("admin:", String(admin._id), admin.username);

// Mirror the route's write exactly, but standalone so the error is visible.
const ArtifactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    story: { type: String, required: false },
    category: {
      type: String,
      required: true,
      enum: ["TEMPLE", "SITE", "STATUE", "CARVING", "ARCHITECTURE", "MONUMENT", "COURTYARD", "CULTURAL_OBJECT", "OTHER"],
    },
    tags: { type: [String], default: [] },
    rarity: {
      type: String,
      required: true,
      enum: ["Common", "Rare", "Epic", "Legendary"],
      default: "Common",
    },
    location: {
      type: new mongoose.Schema(
        {
          type: { type: String, enum: ["Point"], required: true, default: "Point" },
          coordinates: {
            type: [Number],
            required: true,
            validate: {
              validator: (v) =>
                v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90,
              message: "coordinates must be [longitude, latitude] within range",
            },
          },
        },
        { _id: false },
      ),
      required: true,
    },
    humanReadableLocation: { type: String, required: true },
    altitudeMeters: { type: Number, default: null },
    storyUnlockRadiusMeters: { type: Number, required: true, min: 1 },
    verificationRadiusMeters: { type: Number, required: true, min: 1 },
    xpReward: { type: Number, required: true, min: 0 },
    requiresSnap: { type: Boolean, required: true, default: true },
    requiresCV: { type: Boolean, required: true, default: false },
    warnings: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED", "DISABLED"],
      default: "DRAFT",
    },
    discoveryCount: { type: Number, required: true, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, autoIndex: false },
);

const Artifact = mongoose.model("ReproArtifact", ArtifactSchema);

const AdminActionSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: [
        "ARTIFACT_CREATED", "ARTIFACT_UPDATED", "ARTIFACT_ARCHIVED", "ARTIFACT_DISABLED",
        "VERIFICATION_APPROVED", "VERIFICATION_REJECTED", "CONTRIBUTION_APPROVED",
        "CONTRIBUTION_REJECTED", "QUEST_CREATED", "QUEST_UPDATED", "QUEST_ARCHIVED",
        "BADGE_CREATED", "BADGE_UPDATED", "COMMUNITY_CONTENT_HIDDEN", "COMMUNITY_CONTENT_REMOVED",
        "USER_SUSPENDED", "USER_REACTIVATED", "ADMIN_ADJUSTMENT",
      ],
      required: true,
    },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, autoIndex: false },
);

const AdminAction = mongoose.model("ReproAdminAction", AdminActionSchema);

const payload = {
  name: "Repro Temple",
  slug: "repro-temple-xyz",
  description: "standalone reproduction",
  category: "TEMPLE",
  latitude: 27.6727,
  longitude: 85.3194,
  humanReadableLocation: "Patan, Lalitpur",
  xpReward: 100,
  storyUnlockRadiusMeters: 50,
  verificationRadiusMeters: 50,
  requiresSnap: false,
  requiresCV: false,
};

try {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const { latitude, longitude, ...rest } = payload;
      const [c] = await Artifact.create(
        [
          {
            ...rest,
            location: { type: "Point", coordinates: [longitude, latitude] },
            createdBy: admin._id,
            updatedBy: admin._id,
            status: "DRAFT",
            discoveryCount: 0,
          },
        ],
        { session },
      );
      created = c;
      await AdminAction.create(
        [
          {
            adminId: admin._id,
            action: "ARTIFACT_CREATED",
            targetType: "ARTIFACT",
            targetId: c._id,
            metadata: { name: c.name, slug: c.slug, status: c.status },
          },
        ],
        { session },
      );
    });
    console.log("OK created:", String(created._id));
  } finally {
    await session.endSession();
  }
} catch (err) {
  console.log("FAILED:", err.constructor.name);
  console.log(err.message);
  if (err.errors) {
    for (const [k, v] of Object.entries(err.errors)) console.log("  field", k, "->", v.message);
  }
}

await mongoose.disconnect();