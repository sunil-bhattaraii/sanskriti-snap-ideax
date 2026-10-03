/**
 * Verification domain service.
 *
 * Implements the atomic verification and discovery pipeline per:
 *  - docs/API Contract.md 6.2 - 6.5
 *  - docs/DB Schemas.md 26 (Discovery Transaction) & 27 (Duplicate Protection)
 *
 * Handler order is load-bearing (AGENTS.md):
 *  1. validate + resolve identity + artifact   -> 422 / 404
 *  2. GPS distance                            -> 422, nothing persisted
 *  3. duplicate-discovery check               -> 409 with existing discoveryId
 *  4. CV compare                              -> 503 / 504, nothing persisted
 *  5. ONE transaction: attempt, discovery, XP, points, quests, badges
 */

import { Types } from "mongoose";
import { grantDiscoveryAwards } from "./awards";
import { assertMediaOwnership, imageUrl } from "./cloudinary";
import type {
  GeoLocation,
  VerificationResult,
} from "./contracts";
import { distanceMeters } from "./contracts";
import { getCvClient } from "./cv";
import { CvServiceUnavailableError } from "./cv-contract";
import { withTransaction } from "./db";
import { isCvConfigured } from "./env";
import { ApiError } from "./errors";
import { Artifact } from "@/models/artifact";
import { User } from "@/models/user";
import {
  Discovery,
  StoryUnlock,
  VerificationAttempt,
} from "@/models/verification";

export type VerificationInput = {
  artifactId: string;
  verificationImagePublicId?: string | null;
  additionalPhotos?: Array<{ publicId: string; caption?: string | null }>;
  location: GeoLocation;
  privateNote?: string | null;
  supersedesAttemptId?: Types.ObjectId | null;
};

export async function processVerificationAttempt(
  userId: Types.ObjectId,
  input: VerificationInput,
): Promise<VerificationResult> {
  const user = await User.findById(userId).lean();
  if (!user || user.accountStatus !== "ACTIVE") {
    throw ApiError.unauthenticated("User account is not active.");
  }

  // 1. Resolve artifact
  if (!Types.ObjectId.isValid(input.artifactId)) {
    throw ApiError.notFound("Artifact not found.");
  }
  const artifact = await Artifact.findById(input.artifactId).lean();
  if (!artifact || artifact.status !== "PUBLISHED") {
    throw ApiError.notFound("Artifact not found.");
  }

  // Media ownership validation
  if (artifact.requiresSnap && !input.verificationImagePublicId) {
    throw new ApiError("IMAGE_REQUIRED", "A photo is required to verify this discovery.");
  }

  if (input.verificationImagePublicId) {
    const valid = assertMediaOwnership(
      input.verificationImagePublicId,
      "VERIFICATION_SNAP",
      userId,
    );
    if (!valid) {
      throw ApiError.validation("Verification image was not signed for this user.");
    }
  }

  if (input.additionalPhotos && input.additionalPhotos.length > 0) {
    for (const photo of input.additionalPhotos) {
      const valid = assertMediaOwnership(
        photo.publicId,
        "VERIFICATION_GALLERY",
        userId,
      );
      if (!valid) {
        throw ApiError.validation("Additional photo was not signed for this user.");
      }
    }
  }

  // 2. GPS Distance check
  const [artifactLng, artifactLat] = artifact.location.coordinates;
  const dist = distanceMeters(
    { latitude: input.location.latitude, longitude: input.location.longitude },
    { latitude: artifactLat, longitude: artifactLng },
  );

  const roundedDistance = Math.round(dist);
  const requiredRadius = artifact.verificationRadiusMeters;

  if (dist > requiredRadius) {
    const shortfall = Math.round(dist - requiredRadius);
    throw new ApiError(
      "GPS_OUTSIDE_RADIUS",
      `You are ${roundedDistance} m away. Move within ${requiredRadius} m to verify this discovery.`,
      {
        distanceMeters: roundedDistance,
        requiredMeters: requiredRadius,
        shortfallMeters: shortfall,
      },
    );
  }

  // 3. Duplicate-discovery check (before CV call to save GPU time)
  const existingDiscovery = await Discovery.findOne({
    userId,
    artifactId: artifact._id,
  }).lean();

  if (existingDiscovery) {
    throw new ApiError(
      "ALREADY_DISCOVERED",
      "You already collected this artifact.",
      {
        discoveryId: String(existingDiscovery._id),
        discoveredAt: new Date(existingDiscovery.discoveredAt).toISOString(),
      },
    );
  }

  // 4. CV Compare (if required)
  let cvResultData: {
    required: boolean;
    status: "NOT_REQUIRED" | "PASSED" | "FAILED";
    similarityScore?: number;
    threshold?: number;
    topK?: number;
    matchedReferenceIds?: string[];
    model?: { name: string; version: string };
  } = {
    required: false,
    status: "NOT_REQUIRED",
  };

  let isFlagged = false;
  let flagReasonText: string | null = null;

  if (artifact.requiresCV) {
    if (!isCvConfigured()) {
      throw new ApiError(
        "CV_UNAVAILABLE",
        "Verification is temporarily unavailable. Please try again.",
        { retryable: true, retryAfterSeconds: 30 },
      );
    }

    if (!input.verificationImagePublicId) {
      throw new ApiError("IMAGE_REQUIRED", "A photo is required for CV comparison.");
    }

    const threshold = artifact.cvConfiguration?.threshold ?? 0.72;
    const topK = artifact.cvConfiguration?.topK ?? 3;
    const cvClient = getCvClient();

    try {
      console.info("[verification] starting cv compare", {
        userId,
        artifactId: String(artifact._id),
        threshold,
        topK,
      });
      const compareResp = await cvClient.compare({
        image: imageUrl(input.verificationImagePublicId),
        artifactId: String(artifact._id),
        topK,
      });

      const passed = compareResp.similarityScore >= threshold;
      console.info("[verification] cv compare completed", {
        userId,
        artifactId: String(artifact._id),
        passed,
        similarityScore: compareResp.similarityScore,
        referenceCount: compareResp.referenceCount,
        model: compareResp.model,
      });
      cvResultData = {
        required: true,
        status: passed ? "PASSED" : "FAILED",
        similarityScore: compareResp.similarityScore,
        threshold,
        topK: compareResp.topK,
        matchedReferenceIds: compareResp.matchedReferenceIds,
        model: compareResp.model,
      };

      if (!passed) {
        isFlagged = true;
        flagReasonText = `Similarity score ${compareResp.similarityScore.toFixed(3)} below threshold ${threshold}`;
      }
    } catch (err) {
      console.error("[verification] cv compare failed", {
        userId,
        artifactId: String(artifact._id),
        error: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof CvServiceUnavailableError) {
        if (err.reason === "timeout") {
          throw new ApiError(
            "CV_TIMEOUT",
            "Verification service timed out. Please try again.",
            { retryable: true, retryAfterSeconds: 15 },
          );
        }
        throw new ApiError(
          "CV_UNAVAILABLE",
          "Verification is temporarily unavailable. Please try again.",
          { retryable: true, retryAfterSeconds: 30 },
        );
      }
      throw err;
    }
  }

  // Evaluate story proximity unlock
  const existingUnlock = await StoryUnlock.findOne({
    userId,
    artifactId: artifact._id,
  }).lean();

  const newlyUnlockedStory =
    !existingUnlock && dist <= artifact.storyUnlockRadiusMeters;

  if (newlyUnlockedStory) {
    await StoryUnlock.updateOne(
      { userId, artifactId: artifact._id },
      {
        $setOnInsert: {
          unlockedAt: new Date(),
          unlockedBy: {
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            distanceMeters: roundedDistance,
            capturedAt: new Date(input.location.capturedAt),
          },
        },
      },
      { upsert: true },
    );
  }

  // 5. If FLAGGED: persist attempt only, no discovery or reward
  if (isFlagged) {
    const attempt = await VerificationAttempt.create({
      userId,
      artifactId: artifact._id,
      verificationImage: input.verificationImagePublicId
        ? {
          url: imageUrl(input.verificationImagePublicId),
          publicId: input.verificationImagePublicId,
        }
        : null,
      additionalPhotos: (input.additionalPhotos ?? []).map((p) => ({
        url: imageUrl(p.publicId),
        publicId: p.publicId,
        caption: p.caption ?? null,
      })),
      locationEvidence: {
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        accuracyMeters: input.location.accuracyMeters ?? null,
        altitudeMeters: input.location.altitudeMeters ?? null,
        capturedAt: new Date(input.location.capturedAt),
      },
      gpsVerification: {
        status: "PASSED",
        distanceMeters: roundedDistance,
        verifiedAt: new Date(),
      },
      cvVerification: {
        status: "FAILED",
        similarityScore: cvResultData.similarityScore ?? null,
        threshold: cvResultData.threshold ?? null,
        topK: cvResultData.topK ?? null,
        matchedReferenceIds: cvResultData.matchedReferenceIds?.map((id) => new Types.ObjectId(id)) ?? [],
        model: cvResultData.model ?? { name: "unknown", version: "1.0" },
        processedAt: new Date(),
      },
      status: "FLAGGED",
      flagReason: flagReasonText,
      supersedesAttemptId: input.supersedesAttemptId ?? null,
      privateNote: input.privateNote ?? null,
      capturedAt: new Date(input.location.capturedAt),
      submittedAt: new Date(),
    });

    return {
      attemptId: String(attempt._id),
      status: "FLAGGED",
      discoveryId: null,
      gps: {
        status: "PASSED",
        distanceMeters: roundedDistance,
        requiredMeters: requiredRadius,
      },
      cv: {
        required: true,
        status: "FAILED",
        similarityScore: cvResultData.similarityScore,
        threshold: cvResultData.threshold,
        topK: cvResultData.topK,
      },
      xpAwarded: 0,
      pointsAwarded: 0,
      pointsBalance: user.pointsBalance,
      newlyUnlockedStory,
      quest: null,
      badge: null,
      message: "Your photo needs review. This usually takes a few hours.",
    };
  }

  // 6. VERIFIED: Atomic 7-collection transaction
  return await withTransaction(async (session) => {
    // a. Create VerificationAttempt
    const [attempt] = await VerificationAttempt.create(
      [
        {
          userId,
          artifactId: artifact._id,
          verificationImage: input.verificationImagePublicId
            ? {
              url: imageUrl(input.verificationImagePublicId),
              publicId: input.verificationImagePublicId,
            }
            : null,
          additionalPhotos: (input.additionalPhotos ?? []).map((p) => ({
            url: imageUrl(p.publicId),
            publicId: p.publicId,
            caption: p.caption ?? null,
          })),
          locationEvidence: {
            latitude: input.location.latitude,
            longitude: input.location.longitude,
            accuracyMeters: input.location.accuracyMeters ?? null,
            altitudeMeters: input.location.altitudeMeters ?? null,
            capturedAt: new Date(input.location.capturedAt),
          },
          gpsVerification: {
            status: "PASSED",
            distanceMeters: roundedDistance,
            verifiedAt: new Date(),
          },
          cvVerification: artifact.requiresCV
            ? {
              status: "PASSED",
              similarityScore: cvResultData.similarityScore ?? null,
              threshold: cvResultData.threshold ?? null,
              topK: cvResultData.topK ?? null,
              matchedReferenceIds: cvResultData.matchedReferenceIds?.map((id) => new Types.ObjectId(id)) ?? [],
              model: cvResultData.model ?? { name: "unknown", version: "1.0" },
              processedAt: new Date(),
            }
            : null,
          status: "VERIFIED",
          supersedesAttemptId: input.supersedesAttemptId ?? null,
          privateNote: input.privateNote ?? null,
          capturedAt: new Date(input.location.capturedAt),
          submittedAt: new Date(),
        },
      ],
      { session },
    );

    // b-h. Discovery, ledgers, quests, user counters and badges. Shared with the
    // admin approval path so the two can never drift apart.
    const award = await grantDiscoveryAwards(session, {
      userId,
      artifact: {
        _id: artifact._id,
        xpReward: artifact.xpReward,
        category: artifact.category,
      },
      attemptId: attempt._id,
    });

    return {
      attemptId: String(attempt._id),
      status: "VERIFIED",
      discoveryId: award.discoveryId,
      gps: {
        status: "PASSED",
        distanceMeters: roundedDistance,
        requiredMeters: requiredRadius,
      },
      cv: {
        required: artifact.requiresCV,
        status: artifact.requiresCV ? "PASSED" : "NOT_REQUIRED",
        similarityScore: cvResultData.similarityScore,
        threshold: cvResultData.threshold,
        topK: cvResultData.topK,
      },
      xpAwarded: award.xpAwarded,
      pointsAwarded: award.pointsAwarded,
      pointsBalance: award.pointsBalance,
      newlyUnlockedStory,
      quest: award.quest,
      badge: award.badge,
    };
  });
}
