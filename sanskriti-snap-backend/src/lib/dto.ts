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
  CvStatus,
  GpsStatus,
  Role,
  UserProfile,
  VerificationAttempt,
  VerificationStatus,
} from "./contracts";
import { imageUrl } from "./cloudinary";

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
