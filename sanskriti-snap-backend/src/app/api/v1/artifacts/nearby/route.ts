import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import {
  NearbyQuery,
  type ArtifactSummary,
  distanceMeters,
} from "@/lib/contracts";
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
  distanceMeters?: number;
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
    ...(typeof doc.distanceMeters === "number"
      ? { distanceMeters: doc.distanceMeters }
      : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const parsed = NearbyQuery.safeParse({
      latitude: searchParams.get("latitude"),
      longitude: searchParams.get("longitude"),
      radiusMeters: searchParams.get("radiusMeters") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      throw ApiError.validation("Invalid nearby query parameters.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { latitude, longitude, radiusMeters, limit } = parsed.data;
    const docs = await Artifact.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: radiusMeters,
          query: { status: "PUBLISHED" },
        },
      },
      { $sort: { distanceMeters: 1, discoveryCount: -1 } },
      { $limit: limit },
    ]);

    const items = docs.map((doc) => {
      const [artifactLongitude, artifactLatitude] = (doc.location as { coordinates: number[] }).coordinates;
      const computedDistance = distanceMeters(
        { latitude, longitude },
        { latitude: artifactLatitude, longitude: artifactLongitude },
      );

      return toArtifactSummary({
        ...(doc as unknown as ArtifactListDoc),
        distanceMeters: computedDistance,
      });
    });

    return NextResponse.json({
      items,
      meta: {
        count: items.length,
        radiusMeters,
        center: { latitude, longitude },
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
