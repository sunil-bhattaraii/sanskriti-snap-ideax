import { NextResponse, type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { NearbyQuery, type ArtifactSummary } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

type ArtifactListDoc = {
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
};

function toArtifactSummary(doc: ArtifactListDoc): ArtifactSummary {
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

export async function GET(request: NextRequest) {
  try {
    await connect();
    await getAuthContext();

    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const limit = Number.parseInt(searchParams.get("limit") ?? "3", 10);

    const baseLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 3;

    if ((latitude === null) !== (longitude === null)) {
      throw ApiError.validation(
        "Provide both latitude and longitude to choose a neighbourhood.",
      );
    }

    let docs: ArtifactListDoc[];

    if (latitude && longitude) {
      const parsed = NearbyQuery.safeParse({
        latitude,
        longitude,
        radiusMeters: 50_000,
        limit: baseLimit,
      });

      if (!parsed.success) {
        throw ApiError.validation("Invalid latitude/longitude query parameters.");
      }

      const { latitude: lat, longitude: lng } = parsed.data;
      const matches = await Artifact.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distanceMeters",
            spherical: true,
            maxDistance: 50_000,
            query: { status: "PUBLISHED" },
          },
        },
        { $sort: { distanceMeters: 1, discoveryCount: -1 } },
        { $limit: baseLimit },
      ]);

      docs = matches as unknown as ArtifactListDoc[];
    } else {
      docs = (await Artifact.find({ status: "PUBLISHED" })
        .sort({ discoveryCount: -1, createdAt: -1 })
        .limit(baseLimit)
        .lean()) as ArtifactListDoc[];
    }

    return NextResponse.json({
      items: docs.map((doc) => toArtifactSummary(doc)),
      meta: {
        count: docs.length,
        limit: baseLimit,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
