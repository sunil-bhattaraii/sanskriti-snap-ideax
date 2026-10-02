import { type NextRequest, NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  NearbyQuery,
  type ArtifactSummary,
  distanceMeters,
} from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

function parseLimit(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

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

function toArtifactSummary(
  doc: ArtifactListDoc,
  distance?: number | null,
): ArtifactSummary {
  const [longitude, latitude] = doc.location.coordinates;
  const summary: ArtifactSummary = {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    category: doc.category as ArtifactSummary["category"],
    tags: doc.tags ?? [],
    latitude,
    longitude,
    humanReadableLocation: doc.humanReadableLocation,
    storyUnlockRadiusMeters: doc.storyUnlockRadiusMeters,
    verificationRadiusMeters: doc.verificationRadiusMeters,
    xpReward: doc.xpReward,
    requiresSnap: doc.requiresSnap,
    requiresCV: doc.requiresCV,
    warnings: doc.warnings,
    discoveryCount: doc.discoveryCount,
    coverImageUrl: doc.coverImageUrl,
    rarity: doc.rarity as ArtifactSummary["rarity"],
  };

  if (typeof distance === "number") {
    summary.distanceMeters = distance;
  }

  return summary;
}

export async function GET(request: NextRequest) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const hasLatitude = searchParams.has("latitude");
    const hasLongitude = searchParams.has("longitude");
    if (hasLatitude !== hasLongitude) {
      throw ApiError.validation(
        "Provide both latitude and longitude when filtering by location.",
      );
    }

    const limit = parseLimit(searchParams.get("limit"), 20, 100);

    if (hasLatitude && hasLongitude) {
      const parsedQuery = NearbyQuery.safeParse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
        radiusMeters: searchParams.get("radiusMeters") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
      });

      if (!parsedQuery.success) {
        throw ApiError.validation("Invalid nearby query parameters.", {
          fields: Object.fromEntries(
            Object.entries(parsedQuery.error.flatten().fieldErrors).map(
              ([key, value]) => [key, value?.[0] ?? "Invalid value"],
            ),
          ),
        });
      }

      const { latitude, longitude, radiusMeters } = parsedQuery.data;
      const nearbyArtifacts = await Artifact.aggregate([
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

      const items = nearbyArtifacts.map((artifact) => {
        const [artifactLongitude, artifactLatitude] = artifact.location.coordinates;
        const distance = distanceMeters(
          { latitude, longitude },
          { latitude: artifactLatitude, longitude: artifactLongitude },
        );

        return toArtifactSummary(artifact, distance);
      });

      return NextResponse.json({
        items,
        meta: {
          count: items.length,
          radiusMeters,
          center: { latitude, longitude },
        },
      });
    }

    const docs = await Artifact.find({ status: "PUBLISHED" })
      .sort({ discoveryCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((doc) => toArtifactSummary(doc as unknown as ArtifactListDoc));

    return NextResponse.json({
      items,
      meta: {
        count: items.length,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST() {
  try {
    await connect();
    await getAuthContext();
    return NextResponse.json({ message: "Not implemented yet." }, { status: 501 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
