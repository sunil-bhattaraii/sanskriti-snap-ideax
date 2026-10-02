/**
 * Shared API contract: enums, request schemas, response DTOs.
 *
 * This module is the handoff artifact for the mobile and CV lanes. Both are
 * expected to derive their types from here rather than hand-writing them, so
 * that a schema change surfaces as a type error instead of a runtime surprise.
 *
 * Sources: docs/API Contract.md (DTO catalogue, request rules),
 * docs/DB Schemas.md (field names, enums, constraints).
 */

import { z } from "zod";

/* ------------------------------------------------------------------ enums */

export const ArtifactCategory = z.enum([
  "TEMPLE",
  "SITE",
  "STATUE",
  "CARVING",
  "ARCHITECTURE",
  "MONUMENT",
  "COURTYARD",
  "CULTURAL_OBJECT",
  "OTHER",
]);
export type ArtifactCategory = z.infer<typeof ArtifactCategory>;

/** docs/API Contract.md 11.7 — editorial lifecycle, not just availability. */
export const ArtifactStatus = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "DISABLED",
]);
export type ArtifactStatus = z.infer<typeof ArtifactStatus>;

/**
 * docs/API Contract.md 11.5 — uploader-set on the artifact, not derived from
 * `discoveryCount` and not a client-side category switch.
 *
 * TitleCase, unlike every other enum here. That is deliberate: it is the casing
 * the contract's DTO examples already use (`"rarity": "Rare"`) and the label the
 * client displays verbatim. Recorded as an exception in API Contract.md 2.8.
 */
export const Rarity = z.enum(["Common", "Rare", "Epic", "Legendary"]);
export type Rarity = z.infer<typeof Rarity>;

export const Role = z.enum(["USER", "EXPERT", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const AccountStatus = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);
export type AccountStatus = z.infer<typeof AccountStatus>;

/**
 * Only three states are ever persisted. CV is synchronous, so there is no
 * intermediate state to store (docs/DB Schemas.md 8).
 */
export const VerificationStatus = z.enum(["VERIFIED", "FLAGGED", "REJECTED"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const GpsStatus = z.enum(["PASSED", "FAILED"]);
export type GpsStatus = z.infer<typeof GpsStatus>;

export const CvStatus = z.enum(["NOT_REQUIRED", "PASSED", "FAILED"]);
export type CvStatus = z.infer<typeof CvStatus>;

export const BadgeConditionType = z.enum([
  "FIRST_DISCOVERY",
  "DISCOVERY_COUNT",
  "QUEST_COMPLETION",
  "CATEGORY_COUNT",
]);
export type BadgeConditionType = z.infer<typeof BadgeConditionType>;

/** docs/DB Schemas.md 21a — `type` carries the sign, `amount` is positive. */
export const PointsTransactionType = z.enum(["EARNED", "SPENT", "ADJUSTED"]);
export const PointsTransactionReason = z.enum([
  "DISCOVERY",
  "QUEST_COMPLETION",
  "BADGE_EARNED",
  "REWARD_REDEMPTION",
  "ADMIN_ADJUSTMENT",
]);

export const XpTransactionType = z.enum([
  "DISCOVERY",
  "QUEST_COMPLETION",
  "BADGE",
  "ADMIN_ADJUSTMENT",
  "ROLLBACK",
]);

/** Maps to a fixed Cloudinary folder; the client cannot choose a path. */
export const MediaPurpose = z.enum([
  "VERIFICATION_SNAP",
  "VERIFICATION_GALLERY",
  "PROFILE_IMAGE",
  "COMMUNITY_SNAP",
  "CONTRIBUTION_PHOTO",
]);
export type MediaPurpose = z.infer<typeof MediaPurpose>;

/* -------------------------------------------------------------- locations */

const EARTH_RADIUS_METERS = 6_371_008.8;
const MAX_ACCURACY_METERS = 100;
const MAX_CAPTURE_AGE_MS = 10 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;

export const GeoLocation = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    /** Required. A 2 km accuracy fix is not evidence for a 150 m radius. */
    accuracyMeters: z.number().positive().max(MAX_ACCURACY_METERS),
    altitudeMeters: z.number().nullish(),
    capturedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((loc, ctx) => {
    // A stale or future timestamp means the client replayed an earlier
    // position, so the evidence itself is not trustworthy.
    const at = Date.parse(loc.capturedAt);
    const now = Date.now();
    if (Number.isNaN(at)) return;
    if (now - at > MAX_CAPTURE_AGE_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "Location timestamp is too old. Capture a fresh position.",
      });
    }
    if (at - now > MAX_CLOCK_SKEW_MS) {
      ctx.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "Location timestamp is in the future.",
      });
    }
  });
export type GeoLocation = z.infer<typeof GeoLocation>;

/* --------------------------------------------------------------- requests */

/**
 * docs/API Contract.md 6.5 — the client sends evidence only.
 *
 * `.strict()` is load-bearing: any attempt to send `status`, `similarityScore`,
 * `xpAwarded`, `userId`, etc. is a 422 rather than a silently dropped key. The
 * current client asserts a perfect CV score on its own rows, so quietly
 * ignoring those fields would hide exactly the bug this contract exists to
 * prevent.
 */
export const CreateVerificationAttemptRequest = z
  .object({
    artifactId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid artifact id."),
    verificationImagePublicId: z.string().min(1).nullish(),
    additionalPhotos: z
      .array(
        z
          .object({
            publicId: z.string().min(1),
            caption: z.string().max(280).nullish(),
          })
          .strict(),
      )
      .max(6)
      .optional(),
    location: GeoLocation,
    privateNote: z.string().max(500).nullish(),
  })
  .strict();

export type CreateVerificationAttemptRequest = z.infer<
  typeof CreateVerificationAttemptRequest
>;

export const RecheckAttemptRequest = z.object({ location: GeoLocation }).strict();
export type RecheckAttemptRequest = z.infer<typeof RecheckAttemptRequest>;

export const UnlockStoryRequest = z
  .object({ location: GeoLocation })
  .strict();
export type UnlockStoryRequest = z.infer<typeof UnlockStoryRequest>;

export const MediaSignRequest = z
  .object({
    purpose: MediaPurpose,
    contentType: z.enum(["image/jpeg", "image/png"]),
  })
  .strict();
export type MediaSignRequest = z.infer<typeof MediaSignRequest>;

export const PatchProfileRequest = z
  .object({
    displayName: z.string().min(1).max(60).optional(),
    profileImagePublicId: z.string().min(1).optional(),
  })
  .strict();
export type PatchProfileRequest = z.infer<typeof PatchProfileRequest>;

export const UsernameRequest = z
  .object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores."),
  })
  .strict();

export const PatchPreferencesRequest = z
  .object({
    enabled: z.boolean().optional(),
    radiusMeters: z.number().int().positive().max(50_000).optional(),
  })
  .strict()
  .refine((v) => v.enabled !== undefined || v.radiusMeters !== undefined, {
    message: "Provide at least one field.",
  });

export const CreateArtifactRequest = z
  .object({
    name: z.string().min(1).max(160),
    slug: z
      .string()
      .min(1)
      .max(180)
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens.")
      .optional(),
    description: z.string().min(1).max(2000),
    category: ArtifactCategory,
    /**
     * Uploader's judgement, not a derivation (docs/API Contract.md 11.5).
     * Optional on create; the model defaults to Common.
     */
    rarity: Rarity.optional(),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitudeMeters: z.number().nullish(),
    humanReadableLocation: z.string().min(1).max(240),
    story: z.string().max(20_000).optional(),
    storyUnlockRadiusMeters: z.number().int().positive().max(5_000),
    verificationRadiusMeters: z.number().int().positive().max(5_000),
    xpReward: z.number().int().min(0).max(100_000),
    /** Label in the admin form is "Require a snap". */
    requiresSnap: z.boolean(),
    requiresCV: z.boolean(),
    warnings: z.string().max(500).nullish(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  })
  .strict();

export type CreateArtifactRequest = z.infer<typeof CreateArtifactRequest>;

export const UpdateArtifactRequest = CreateArtifactRequest.partial().extend({
  status: ArtifactStatus.optional(),
});
export type UpdateArtifactRequest = z.infer<typeof UpdateArtifactRequest>;

export const CreateReferenceRequest = z
  .object({
    imagePublicId: z.string().min(1),
    isCover: z.boolean().optional(),
  })
  .strict();

export const CreateQuestRequest = z
  .object({
    name: z.string().min(1).max(120),
    description: z.string().min(1).max(1000),
    artifactIds: z
      .array(z.string().regex(/^[a-f0-9]{24}$/i))
      .min(1)
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Duplicate artifact ids.",
      }),
    xpReward: z.number().int().min(0).max(100_000).default(0),
    badgeId: z.string().regex(/^[a-f0-9]{24}$/i).nullish(),
  })
  .strict();
export type CreateQuestRequest = z.infer<typeof CreateQuestRequest>;

export const BadgeCondition = z
  .object({
    type: BadgeConditionType,
    value: z.number().int().positive().nullish(),
    questId: z.string().regex(/^[a-f0-9]{24}$/i).nullish(),
    category: ArtifactCategory.nullish(),
  })
  .strict();

export const CreateBadgeRequest = z
  .object({
    name: z.string().min(1).max(80),
    description: z.string().min(1).max(400),
    iconUrl: z.url().nullish(),
    condition: BadgeCondition,
  })
  .strict();
export type CreateBadgeRequest = z.infer<typeof CreateBadgeRequest>;

export const XpAdjustmentRequest = z
  .object({
    userId: z.string().regex(/^[a-f0-9]{24}$/i),
    amount: z.number().int().refine((n) => n !== 0, "Amount must be non-zero."),
    reason: z.string().min(1).max(500),
    referenceId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  })
  .strict();
export type XpAdjustmentRequest = z.infer<typeof XpAdjustmentRequest>;

export const CreateRewardRequest = z
  .object({
    description: z.string().min(1).max(240),
    pointRequirement: z.number().int().positive().max(1_000_000),
    category: z
      .enum(["FOOD_AND_DRINK", "EXPERIENCE", "CULTURE", "OTHER"])
      .default("OTHER"),
    terms: z.string().max(1000).nullish(),
    imageUrl: z.url().nullish(),
    businessName: z.string().min(1).max(120).optional(),
  })
  .strict();
export type CreateRewardRequest = z.infer<typeof CreateRewardRequest>;

export const ReviewDecisionRequest = z
  .object({
    note: z.string().max(1000).nullish(),
    reason: z.string().min(1).max(500).optional(),
  })
  .strict();

/* ------------------------------------------------------------ query params */

export const PaginationQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuery>;

/**
 * docs/API Contract.md 5.1 — the cap is server-side and non-negotiable. The
 * current client passes 2147483647 in two places to force a full scan.
 */
export const NEARBY_MAX_RADIUS_METERS = 50_000;
export const NEARBY_DEFAULT_RADIUS_METERS = 5_000;
export const SEARCH_MAX_LIMIT = 25;
export const GEOFENCE_MAX_REGIONS = 20;

export const NearbyQuery = z
  .object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radiusMeters: z.coerce
      .number()
      .int()
      .positive()
      .max(NEARBY_MAX_RADIUS_METERS)
      .default(NEARBY_DEFAULT_RADIUS_METERS),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .strict();

export const SearchQuery = z
  .object({
    q: z.string().min(1).max(120),
    category: ArtifactCategory.optional(),
    limit: z.coerce.number().int().min(1).max(SEARCH_MAX_LIMIT).default(8),
  })
  .strict();

export const DistanceQuery = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

/* ------------------------------------------------------------------- DTOs */

export type ArtifactSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ArtifactCategory;
  tags: string[];
  latitude: number;
  longitude: number;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  discoveryCount: number;
  /** Denormalised first reference image. Never indexed into an array client-side. */
  coverImageUrl: string | null;
  rarity: Rarity;
  /** Present only when the request supplied a location. */
  distanceMeters?: number | null;
};

type ArtifactDetailBase = ArtifactSummary & {
  altitudeMeters: number | null;
  referenceImageUrls: string[];
  storyUnlocked: boolean;
  discovered: boolean;
  discoveredAt: string | null;
  questIds: string[];
  attemptSummary: {
    latestAttemptId: string | null;
    latestAttemptStatus: VerificationStatus | null;
  };
};

/**
 * `story` is a conditional property, not a nullable one. Expressing it as a
 * discriminated union makes it a compile error to read `detail.story` without
 * first checking `storyUnlocked`, and keeps the "must be absent, not null" rule
 * from docs/API Contract.md 3.2 enforceable by the type system.
 */
export type ArtifactDetail =
  | (ArtifactDetailBase & { storyUnlocked: false })
  | (ArtifactDetailBase & { storyUnlocked: true; story: string });

export type VerificationAttempt = {
  id: string;
  artifactId: string;
  artifact: Pick<
    ArtifactSummary,
    "id" | "name" | "coverImageUrl" | "humanReadableLocation" | "xpReward"
  >;
  status: VerificationStatus;
  rejectionReason: string | null;
  submittedAt: string;
  /** Short-lived signed URL, regenerated per request. Never a permanent one. */
  verificationImageUrl: string | null;
  gps: {
    status: GpsStatus;
    distanceMeters: number | null;
    requiredMeters: number;
    capturedAt: string;
  };
  cv: {
    required: boolean;
    status: z.infer<typeof CvStatus>;
    similarityScore: number | null;
    threshold: number | null;
    topK: number | null;
    processedAt: string | null;
  } | null;
  discoveryId: string | null;
  supersedesAttemptId: string | null;
};

/** Admin-only extension. Adds the fields the public DTO deliberately hides. */
export type AdminVerificationAttempt = VerificationAttempt & {
  user: { id: string; username: string; displayName: string };
  cv: (VerificationAttempt["cv"] & {
    model: { name: string; version: string } | null;
    matchedReferenceIds: string[];
  }) | null;
  flagReason: string | null;
  review: {
    reviewedBy: string;
    reviewedAt: string;
    decision: "APPROVED" | "REJECTED";
    note: string | null;
  } | null;
};

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  /** Own profile only. Never returned for arbitrary other users. */
  role: Role;
  accountStatus: AccountStatus;
  lifetimeXp: number;
  pointsBalance: number;
  notifications: { enabled: boolean; radiusMeters: number };
  createdAt: string;
};

export type QuestSummary = {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  artifactCount: number;
  discoveredCount: number;
  /** Computed server-side. The client must not divide. */
  progressPercent: number;
  completed: boolean;
  badge: { id: string; name: string } | null;
};

export type QuestDetail = QuestSummary & {
  artifacts: Array<{
    id: string;
    name: string;
    humanReadableLocation: string;
    coverImageUrl: string | null;
    category: ArtifactCategory;
    discovered: boolean;
  }>;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  unlocked: boolean;
  earnedAt: string | null;
  progress?: { current: number; required: number };
};

export type DiscoveryReceipt = {
  id: string;
  discoveredAt: string;
  xpAwarded: number;
  pointsAwarded: number;
  artifact: Pick<ArtifactSummary, "id" | "name" | "category" | "coverImageUrl">;
  verificationAttemptId: string;
  quest: { id: string; name: string; discoveredCount: number; artifactCount: number } | null;
  /** Only badges awarded BY this discovery, or null. */
  badge: { name: string; iconUrl: string | null } | null;
  lifetimeXp: number;
  pointsBalance: number;
};

export type CollectionItem = {
  id: string;
  title: string;
  humanReadableLocation: string;
  xp: number;
  coverImageUrl: string | null;
  rarity: Rarity;
  discoveredAt: string;
  discovered: true;
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  /** CDN URL, never a signed URL — per-row signing is not viable here. */
  profileImageUrl: string | null;
  lifetimeXp: number;
};

export type RewardItem = {
  id: string;
  title: string;
  description: string;
  pointCost: number;
  imageUrl: string | null;
  businessName: string;
  /** Server-computed. The current client derives this itself. */
  affordable: boolean;
  redeemed: boolean;
};

export type RedemptionItem = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  businessName: string;
  pointsSpent: number;
  status: "CONFIRMED" | "FULFILLED" | "CANCELLED";
  code: string | null;
  redeemedAt: string;
};

export type PointsLedgerEntry = {
  id: string;
  type: z.infer<typeof PointsTransactionType>;
  amount: number;
  balanceAfter: number;
  reason: z.infer<typeof PointsTransactionReason>;
  note: string | null;
  createdAt: string;
};

export type Page = {
  nextCursor: string | null;
  hasMore: boolean;
};
export type Paged<T> = { items: T[]; page: Page };

/* ------------------------------------------------------- verification body */

/**
 * Response body for POST /api/v1/verification-attempts (docs/API Contract.md
 * 6.2). There is no `202` and no terminal flag: a 201 always carries a
 * complete verdict.
 */
export type VerificationResult = {
  attemptId: string;
  status: VerificationStatus;
  discoveryId: string | null;
  gps: { status: GpsStatus; distanceMeters: number | null; requiredMeters: number };
  cv: {
    required: boolean;
    status: z.infer<typeof CvStatus>;
    similarityScore?: number;
    threshold?: number;
    topK?: number;
  };
  xpAwarded: number;
  pointsAwarded: number;
  pointsBalance: number;
  newlyUnlockedStory: boolean;
  quest: { id: string; discoveredCount: number; artifactCount: number } | null;
  badge: { name: string; iconUrl: string | null } | null;
  message?: string;
};

/* ------------------------------------------------------------------- geo */

/** Haversine, in meters. */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}
