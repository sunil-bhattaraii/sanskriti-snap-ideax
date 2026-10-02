import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { DistanceQuery, distanceMeters } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuthContext();
    await connect();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

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

    const artifact = await Artifact.findById(id).lean();
    if (!artifact || artifact.status !== "PUBLISHED") {
      throw ApiError.notFound("Artifact not found.");
    }

    const [artifactLongitude, artifactLatitude] = (
      artifact.location as { coordinates: number[] }
    ).coordinates;
    const distance = distanceMeters(
      { latitude, longitude },
      { latitude: artifactLatitude, longitude: artifactLongitude },
    );

    const verificationRadiusMeters = Number(artifact.verificationRadiusMeters ?? 0);
    const storyUnlockRadiusMeters = Number(artifact.storyUnlockRadiusMeters ?? 0);
    const withinVerificationRadius = distance <= verificationRadiusMeters;
    const withinStoryUnlockRadius = distance <= storyUnlockRadiusMeters;

    return NextResponse.json({
      artifactId: String(artifact._id),
      artifactName: artifact.name,
      distanceMeters: Math.round(distance),
      verificationRadiusMeters,
      storyUnlockRadiusMeters,
      withinVerificationRadius,
      withinStoryUnlockRadius,
      shortfallMeters: withinVerificationRadius
        ? 0
        : Math.max(0, Math.ceil(distance - verificationRadiusMeters)),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
