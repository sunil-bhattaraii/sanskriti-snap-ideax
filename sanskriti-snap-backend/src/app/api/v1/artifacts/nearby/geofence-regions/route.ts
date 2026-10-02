import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

export async function GET(request: NextRequest) {
  try {
    await requireAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const latitude = Number(searchParams.get("latitude"));
    const longitude = Number(searchParams.get("longitude"));

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Latitude and longitude must be valid coordinates.",
          },
        },
        { status: 422 },
      );
    }

    const docs = await Artifact.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distanceMeters",
          spherical: true,
          maxDistance: 50_000,
          query: { status: "PUBLISHED" },
        },
      },
      { $sort: { distanceMeters: 1 } },
      { $limit: 20 },
    ]);

    const regions = docs.map((doc) => {
      const [artifactLongitude, artifactLatitude] = (doc.location as { coordinates: number[] }).coordinates;
      const suggestedRadiusMeters = Math.max(
        1_000,
        Number(doc.verificationRadiusMeters ?? 0),
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
        totalAvailable: regions.length,
        returned: regions.length,
        truncated: regions.length >= 20,
        maxRegions: 20,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
