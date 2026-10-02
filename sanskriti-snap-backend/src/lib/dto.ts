/**
 * Document -> DTO mapping.
 *
 * AGENTS.md: never return a raw MongoDB document. Every response is shaped here
 * so the projection is auditable in one place — `_id` becomes `id`, and
 * `clerkUserId`, `embedding`, `createdBy` and other users' `accountStatus`
 * cannot leak by accident.
 */

import type {
  AccountStatus,
  AdminContribution,
  AdminVerificationAttempt,
  ContributionStatus,
  CvStatus,
  GpsStatus,
  Role,
  UserProfile,
  VerificationAttempt,
  VerificationStatus,
} from "./contracts";
import { imageUrl } from "./cloudinary";

/**
 * Admin view of an attempt. `flagReason` is `select: false` on the model, so a
 * caller that wants it must ask for it explicitly; `cvVerification.model` and
 * `matchedReferenceIds` are absent from the public DTO because they name the
 * reference images a user's photo was compared against.
 */
export type AdminVerificationAttemptSource = VerificationAttemptSource & {
  flagReason?: string | null;
  cvVerification?:
    | (NonNullable<VerificationAttemptSource["cvVerification"]> & {
        model?: { name: string; version: string } | null;
        matchedReferenceIds?: unknown[] | null;
      })
    | null;
  review?: {
    reviewedBy: unknown;
    reviewedAt: Date | string;
    decision: string;
    note?: string | null;
  } | null;
};

export function toAdminVerificationAttempt(
  attempt: AdminVerificationAttemptSource,
  artifact: ArtifactSummaryPickSource,
  user: { _id: unknown; username: string; displayName: string },
): AdminVerificationAttempt {
  const base = toVerificationAttempt(attempt, artifact);

  return {
    ...base,
    user: {
      id: String(user._id),
      username: user.username,
      displayName: user.displayName,
    },
    cv: base.cv
      ? {
          ...base.cv,
          model: attempt.cvVerification?.model ?? null,
          matchedReferenceIds: (attempt.cvVerification?.matchedReferenceIds ?? []).map(
            String,
          ),
        }
      : null,
    flagReason: attempt.flagReason ?? null,
    review: attempt.review
      ? {
          reviewedBy: String(attempt.review.reviewedBy),
          reviewedAt: new Date(attempt.review.reviewedAt).toISOString(),
          decision: attempt.review.decision as "APPROVED" | "REJECTED",
          note: attempt.review.note ?? null,
        }
      : null,
  };
}

/**
 * Structural, rather than `InferSchemaType<typeof UserSchema>`: the mapper is
 * fed lean query results, and the fields it reads are a deliberate subset of
 * the document.
 *
 * `createdAt` is optional only because Mongoose does not model
 * `timestamps: true` in the inferred type. Every document this schema writes
 * has it, so the epoch fallback below is unreachable — it exists to keep the
 * DTO field non-nullable.
 */
export type UserProfileSource = {
  _id: unknown;
  username: string;
  displayName: string;
  profileImage?: { url?: string | null } | null;
  role: string;
  accountStatus: string;
  lifetimeXp: number;
  pointsBalance: number;
  notifications?: { enabled?: boolean; radiusMeters?: number } | null;
  createdAt?: Date | string | null;
};

export function toUserProfile(user: UserProfileSource): UserProfile {
  return {
    id: String(user._id),
    username: user.username,
    displayName: user.displayName,
    profileImageUrl: user.profileImage?.url ?? null,
    role: user.role as Role,
    accountStatus: user.accountStatus as AccountStatus,
    lifetimeXp: user.lifetimeXp,
    pointsBalance: user.pointsBalance,
    notifications: {
      enabled: user.notifications?.enabled ?? false,
      radiusMeters: user.notifications?.radiusMeters ?? 1000,
    },
    createdAt: new Date(user.createdAt ?? 0).toISOString(),
  };
}

/**
 * Structural, for the same reason as `UserProfileSource`: the mapper is fed lean
 * query results and reads a deliberate subset of the document.
 *
 * `photos` is stored as `{url, publicId}` pairs; only the URL is exposed. The
 * publicId is a server-side handle used to delete the asset, and a reviewer has
 * no action that takes one.
 */
export type AdminContributionSource = {
  _id: unknown;
  name: string;
  description: string;
  category: string;
  tags?: string[] | null;
  location: { coordinates: number[] };
  humanReadableLocation?: string | null;
  culturalSignificance: string;
  photos?: { url: string }[] | null;
  status: string;
  submittedBy: unknown;
  review?: {
    reviewedBy: unknown;
    reviewedAt: Date | string;
    note?: string | null;
  } | null;
  officialArtifactId?: unknown | null;
  createdAt: Date | string;
};

export function toAdminContribution(
  contribution: AdminContributionSource,
  user: { _id: unknown; username: string; displayName: string },
): AdminContribution {
  return {
    id: String(contribution._id),
    name: contribution.name,
    description: contribution.description,
    category: contribution.category,
    tags: contribution.tags ?? [],
    humanReadableLocation: contribution.humanReadableLocation ?? null,
    culturalSignificance: contribution.culturalSignificance,
    // GeoJSON is [longitude, latitude] — reversed at the API boundary so the
    // stored order never reaches a client (AGENTS.md).
    latitude: contribution.location.coordinates[1],
    longitude: contribution.location.coordinates[0],
    photos: (contribution.photos ?? []).map((photo) => photo.url),
    status: contribution.status as ContributionStatus,
    submittedBy: {
      id: String(user._id),
      username: user.username,
      displayName: user.displayName,
    },
    review: contribution.review
      ? {
          reviewedBy: String(contribution.review.reviewedBy),
          reviewedAt: new Date(contribution.review.reviewedAt).toISOString(),
          note: contribution.review.note ?? null,
        }
      : null,
    officialArtifactId: contribution.officialArtifactId
      ? String(contribution.officialArtifactId)
      : null,
    createdAt: new Date(contribution.createdAt).toISOString(),
  };
}

export type ArtifactSummaryPickSource = {
  _id: unknown;
  name: string;
  coverImageUrl?: string | null;
  humanReadableLocation: string;
  xpReward: number;
  verificationRadiusMeters?: number;
};

export type VerificationAttemptSource = {
  _id: unknown;
  artifactId: unknown;
  status: string;
  rejectionReason?: string | null;
  submittedAt: Date | string;
  verificationImage?: { publicId?: string | null; url?: string | null } | null;
  locationEvidence: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number | null;
    altitudeMeters?: number | null;
    capturedAt: Date | string;
  };
  gpsVerification: {
    status: string;
    distanceMeters?: number | null;
  };
  cvVerification?: {
    status: string;
    similarityScore?: number | null;
    threshold?: number | null;
    topK?: number | null;
    processedAt?: Date | string | null;
  } | null;
  discoveryId?: unknown | null;
  supersedesAttemptId?: unknown | null;
};

export function toVerificationAttempt(
  attempt: VerificationAttemptSource,
  artifact: ArtifactSummaryPickSource,
): VerificationAttempt {
  const imgUrl = attempt.verificationImage?.publicId
    ? imageUrl(attempt.verificationImage.publicId)
    : attempt.verificationImage?.url ?? null;

  return {
    id: String(attempt._id),
    artifactId: String(attempt.artifactId),
    artifact: {
      id: String(artifact._id),
      name: artifact.name,
      coverImageUrl: artifact.coverImageUrl ?? null,
      humanReadableLocation: artifact.humanReadableLocation,
      xpReward: artifact.xpReward,
    },
    status: attempt.status as VerificationStatus,
    rejectionReason: attempt.rejectionReason ?? null,
    submittedAt: new Date(attempt.submittedAt).toISOString(),
    verificationImageUrl: imgUrl,
    gps: {
      status: attempt.gpsVerification.status as GpsStatus,
      distanceMeters: attempt.gpsVerification.distanceMeters ?? null,
      requiredMeters: artifact.verificationRadiusMeters ?? 150,
      capturedAt: new Date(attempt.locationEvidence.capturedAt).toISOString(),
    },
    cv: attempt.cvVerification
      ? {
          required: attempt.cvVerification.status !== "NOT_REQUIRED",
          status: attempt.cvVerification.status as CvStatus,
          similarityScore: attempt.cvVerification.similarityScore ?? null,
          threshold: attempt.cvVerification.threshold ?? null,
          topK: attempt.cvVerification.topK ?? null,
          processedAt: attempt.cvVerification.processedAt
            ? new Date(attempt.cvVerification.processedAt).toISOString()
            : null,
        }
      : null,
    discoveryId: attempt.discoveryId ? String(attempt.discoveryId) : null,
    supersedesAttemptId: attempt.supersedesAttemptId
      ? String(attempt.supersedesAttemptId)
      : null,
  };
}
