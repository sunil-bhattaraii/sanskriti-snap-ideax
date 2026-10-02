import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAuthContext, requireAuthContext } from "@/lib/auth";
import {
  type ArtifactDetail,
  type ArtifactSummary,
} from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact, ArtifactReference } from "@/models/artifact";
import { StoryUnlock } from "@/models/verification";

function parseLocationQuery(searchParams: URLSearchParams) {
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  if (latitude === null && longitude === null) return null;
  if (latitude === null || longitude === null) {
    throw ApiError.validation(
      "Provide both latitude and longitude when including distance data.",
    );
  }

  const parsed = {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) {
    throw ApiError.validation("Latitude and longitude must be valid numbers.");
  }

  if (parsed.latitude < -90 || parsed.latitude > 90 || parsed.longitude < -180 || parsed.longitude > 180) {
    throw ApiError.validation("Latitude and longitude are out of range.");
  }

  return parsed;
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
    const location = parseLocationQuery(new URL(request.url).searchParams);

    const artifact = await Artifact.findById(id).lean();
    if (!artifact) {
      throw ApiError.notFound();
    }

    if (artifact.status !== "PUBLISHED" && !(ctx?.user && ctx.user.role === "ADMIN")) {
      throw ApiError.notVisible();
    }

    const refs = await ArtifactReference.find({ artifactId: artifact._id }).lean();
    const referenceImageUrls = refs.map((ref) => ref.imageUrl);

    const storyUnlocked = !!(
      ctx &&
      (await StoryUnlock.exists({
        userId: new Types.ObjectId(ctx.user._id),
        artifactId: new Types.ObjectId(artifact._id),
      }))
    );

    const summary = toArtifactSummary(artifact as unknown as ArtifactDetailDoc);
    const detail: ArtifactDetail = storyUnlocked
      ? {
          ...summary,
          altitudeMeters: artifact.altitudeMeters ?? null,
          referenceImageUrls,
          storyUnlocked: true,
          discovered: false,
          discoveredAt: null,
          questIds: [],
          attemptSummary: {
            latestAttemptId: null,
            latestAttemptStatus: null,
          },
          story: String(artifact.story ?? ""),
        }
      : {
          ...summary,
          altitudeMeters: artifact.altitudeMeters ?? null,
          referenceImageUrls,
          storyUnlocked: false,
          discovered: false,
          discoveredAt: null,
          questIds: [],
          attemptSummary: {
            latestAttemptId: null,
            latestAttemptStatus: null,
          },
        };

    if (location) {
      const [longitude, latitude] = artifact.location.coordinates;
      detail.distanceMeters = Math.round(
        (Math.sqrt(
          (latitude - location.latitude) ** 2 + (longitude - location.longitude) ** 2,
        ) * 111_000) || 0,
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
    await requireAuthContext();
    return NextResponse.json({ message: "Not implemented yet." }, { status: 501 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
