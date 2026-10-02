import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { DistanceQuery, GEOFENCE_MAX_REGIONS } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { Discovery } from "@/models/verification";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const parsedQuery = DistanceQuery.safeParse({
      latitude: searchParams.get("latitude"),
      longitude: searchParams.get("longitude"),
    });

    if (!parsedQuery.success) {
      throw ApiError.validation("Latitude and longitude must be valid coordinates.", {
        fields: Object.fromEntries(
          Object.entries(parsedQuery.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid coordinate"],
          ),
        ),
      });
    }

    const { latitude, longitude } = parsedQuery.data;

    const discoveries = await Discovery.find({ userId: user._id })
      .select("artifactId")
      .lean();
    const discoveredArtifactIds = discoveries.map((d) => d.artifactId);

    const queryFilter: Record<string, unknown> = {
      status: "PUBLISHED",
    };
    if (discoveredArtifactIds.length > 0) {
      queryFilter._id = { $nin: discoveredArtifactIds };
    }

    const docs = await Artifact.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: 50_000,
          query: queryFilter,
        },
      },
      { $sort: { distanceMeters: 1 } },
      { $limit: GEOFENCE_MAX_REGIONS + 1 },
    ]);

    const hasMore = docs.length > GEOFENCE_MAX_REGIONS;
    const items = docs.slice(0, GEOFENCE_MAX_REGIONS);

    const regions = items.map((doc) => {
      const [artifactLongitude, artifactLatitude] = (
        doc.location as { coordinates: number[] }
      ).coordinates;
      const suggestedRadiusMeters = Math.max(
        150,
        Number(doc.verificationRadiusMeters ?? 150),
      );

      return {
        artifactId: String(doc._id),
        name: doc.name,
        latitude: artifactLatitude,
        longitude: artifactLongitude,
        suggestedRadiusMeters,
      };
    });

    return NextResponse.json({
      regions,
      meta: {
        totalAvailable: docs.length,
        returned: regions.length,
        truncated: hasMore,
        maxRegions: GEOFENCE_MAX_REGIONS,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
