import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { distanceMeters } from "@/lib/contracts";
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
      throw ApiError.validation("Latitude and longitude are required.");
    }

    const artifact = await Artifact.findById(id).lean();
    if (!artifact) throw ApiError.notFound();

    const [artifactLongitude, artifactLatitude] = (artifact.location as { coordinates: number[] }).coordinates;
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
        : Math.max(0, Math.ceil(verificationRadiusMeters - distance)),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
