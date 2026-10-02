import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthContext, requireAdmin } from "@/lib/auth";
import {
  DistanceQuery,
  distanceMeters,
  type ArtifactDetail,
  type ArtifactSummary,
  type VerificationStatus,
} from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact, ArtifactReference } from "@/models/artifact";
import { Quest } from "@/models/gamification";
import {
  Discovery,
  StoryUnlock,
  VerificationAttempt,
} from "@/models/verification";

function parseLocationQuery(searchParams: URLSearchParams) {
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  if (latitude === null && longitude === null) return null;
  if (latitude === null || longitude === null) {
    throw ApiError.validation(
      "Provide both latitude and longitude when including distance data.",
    );
  }

  const parsed = DistanceQuery.safeParse({
    latitude,
    longitude,
  });

  if (!parsed.success) {
    throw ApiError.validation("Latitude and longitude must be valid coordinates.", {
      fields: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
          key,
          value?.[0] ?? "Invalid coordinate",
        ]),
      ),
    });
  }

  return parsed.data;
}

type ArtifactDetailDoc = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  category: ArtifactSummary["category"];
  tags: string[];
  location: { coordinates: number[] };
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  discoveryCount: number;
  coverImageUrl: string | null;
  rarity: ArtifactSummary["rarity"];
  altitudeMeters: number | null;
  story: string | null;
  status: string;
};

function toArtifactSummary(doc: ArtifactDetailDoc): ArtifactSummary {
  const [longitude, latitude] = doc.location.coordinates;
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    tags: doc.tags ?? [],
    latitude,
    longitude,
    humanReadableLocation: doc.humanReadableLocation,
    storyUnlockRadiusMeters: doc.storyUnlockRadiusMeters,
    verificationRadiusMeters: doc.verificationRadiusMeters,
    xpReward: doc.xpReward,
    requiresSnap: doc.requiresSnap,
    requiresCV: doc.requiresCV,
    warnings: doc.warnings ?? null,
    discoveryCount: doc.discoveryCount,
    coverImageUrl: doc.coverImageUrl ?? null,
    rarity: doc.rarity,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connect();
    const ctx = await getAuthContext();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    const location = parseLocationQuery(new URL(request.url).searchParams);

    const artifact = await Artifact.findById(id).lean();
    if (!artifact) {
      throw ApiError.notFound("Artifact not found.");
    }

    if (
      artifact.status !== "PUBLISHED" &&
      !(ctx?.user && ctx.user.role === "ADMIN")
    ) {
      throw ApiError.notFound("Artifact not found.");
    }

    const refs = await ArtifactReference.find({ artifactId: artifact._id }).lean();
    const referenceImageUrls = refs.map((ref) => ref.imageUrl);

    const userId = ctx?.user ? ctx.user._id : null;

    let storyUnlocked = false;
    let discovered = false;
    let discoveredAt: string | null = null;
    let questIds: string[] = [];
    let attemptSummary: {
      latestAttemptId: string | null;
      latestAttemptStatus: VerificationStatus | null;
    } = {
      latestAttemptId: null,
      latestAttemptStatus: null,
    };

    if (userId) {
      const [storyUnlockDoc, discoveryDoc, questDocs, latestAttemptDoc] =
        await Promise.all([
          StoryUnlock.exists({ userId, artifactId: artifact._id }),
          Discovery.findOne({ userId, artifactId: artifact._id }).lean(),
          Quest.find({ artifactIds: artifact._id, status: "ACTIVE" })
            .select("_id")
            .lean(),
          VerificationAttempt.findOne({ userId, artifactId: artifact._id })
            .sort({ submittedAt: -1 })
            .select("_id status")
            .lean(),
        ]);

      storyUnlocked = !!storyUnlockDoc;
      discovered = !!discoveryDoc;
      discoveredAt = discoveryDoc
        ? new Date(discoveryDoc.discoveredAt).toISOString()
        : null;
      questIds = questDocs.map((q) => String(q._id));
      if (latestAttemptDoc) {
        attemptSummary = {
          latestAttemptId: String(latestAttemptDoc._id),
          latestAttemptStatus: latestAttemptDoc.status as VerificationStatus,
        };
      }
    }

    const summary = toArtifactSummary(artifact as unknown as ArtifactDetailDoc);
    const base = {
      ...summary,
      altitudeMeters: artifact.altitudeMeters ?? null,
      referenceImageUrls,
      discovered,
      discoveredAt,
      questIds,
      attemptSummary,
    };

    let detail: ArtifactDetail;
    if (storyUnlocked) {
      detail = {
        ...base,
        storyUnlocked: true,
        story: String(artifact.story ?? ""),
      };
    } else {
      detail = {
        ...base,
        storyUnlocked: false,
      };
    }

    if (location) {
      const [artifactLongitude, artifactLatitude] = (
        artifact.location as { coordinates: number[] }
      ).coordinates;
      detail.distanceMeters = Math.round(
        distanceMeters(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: artifactLatitude, longitude: artifactLongitude },
        ),
      );
    }

    return NextResponse.json(detail);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH() {
  try {
    await connect();
    await requireAdmin();
    return NextResponse.json({ message: "Not implemented yet." }, { status: 501 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
