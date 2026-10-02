import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuthContext();
    await connect();
    const { id } = await params;
    const artifact = await Artifact.findById(id).lean();

    if (!artifact) {
      throw ApiError.notFound();
    }

    const [longitude, latitude] = (artifact.location as { coordinates: number[] }).coordinates;

    return NextResponse.json({
      artifactId: String(artifact._id),
      name: artifact.name,
      latitude,
      longitude,
      verificationRadiusMeters: artifact.verificationRadiusMeters,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
