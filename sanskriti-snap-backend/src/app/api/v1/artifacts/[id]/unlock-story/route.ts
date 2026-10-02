import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { UnlockStoryRequest, distanceMeters } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { StoryUnlock } from "@/models/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuthContext();
    await connect();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    const body = await readJsonBody(request);
    const { location } = UnlockStoryRequest.parse(body);

    const artifact = await Artifact.findById(id).lean();
    if (!artifact || artifact.status !== "PUBLISHED") {
      throw ApiError.notFound("Artifact not found.");
    }

    const { latitude, longitude } = location;
    const [artifactLongitude, artifactLatitude] = (
      artifact.location as { coordinates: number[] }
    ).coordinates;
    const computedDistance = distanceMeters(
      { latitude, longitude },
      { latitude: artifactLatitude, longitude: artifactLongitude },
    );
    const requiredMeters = Number(artifact.storyUnlockRadiusMeters ?? 0);
    const unlocked = computedDistance <= requiredMeters;

    const existing = await StoryUnlock.findOne({
      userId: user._id,
      artifactId: artifact._id,
    }).lean();

    const newlyUnlocked = unlocked && !existing;

    if (newlyUnlocked) {
      await StoryUnlock.create({
        userId: user._id,
        artifactId: artifact._id,
        unlockedAt: new Date(),
        unlockedBy: {
          latitude,
          longitude,
          distanceMeters: Math.round(computedDistance),
          capturedAt: new Date(location.capturedAt),
        },
      });
    }

    if (!unlocked) {
      return NextResponse.json({
        artifactId: String(artifact._id),
        unlocked: false,
        newlyUnlocked: false,
        distanceMeters: Math.round(computedDistance),
        requiredMeters,
        shortfallMeters: Math.max(0, Math.ceil(computedDistance - requiredMeters)),
      });
    }

    return NextResponse.json({
      artifactId: String(artifact._id),
      unlocked: true,
      newlyUnlocked,
      distanceMeters: Math.round(computedDistance),
      requiredMeters,
      storyUnlocked: true,
      story: String(artifact.story ?? ""),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
