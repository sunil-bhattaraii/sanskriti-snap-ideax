import { NextResponse, type NextRequest } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { UnlockStoryRequest, distanceMeters } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { StoryUnlock } from "@/models/verification";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuthContext();
    await connect();
    const { id } = await params;

    const body = await request.json();
    const parsed = UnlockStoryRequest.safeParse(body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid story unlock payload.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const artifact = await Artifact.findById(id).lean();
    if (!artifact) {
      throw ApiError.notFound();
    }

    const { latitude, longitude } = parsed.data.location;
    const [artifactLongitude, artifactLatitude] = (artifact.location as { coordinates: number[] }).coordinates;
    const computedDistance = distanceMeters(
      { latitude, longitude },
      { latitude: artifactLatitude, longitude: artifactLongitude },
    );
    const requiredMeters = Number(artifact.storyUnlockRadiusMeters ?? 0);
    const unlocked = computedDistance <= requiredMeters;

    const existing = await StoryUnlock.findOne({
      userId: ctx.user._id,
      artifactId: artifact._id,
    }).lean();

    const newlyUnlocked = unlocked && !existing;

    if (unlocked) {
      await StoryUnlock.findOneAndUpdate(
        { userId: ctx.user._id, artifactId: artifact._id },
        {
          userId: ctx.user._id,
          artifactId: artifact._id,
          unlockedAt: new Date(),
          unlockedBy: {
            latitude,
            longitude,
            distanceMeters: computedDistance,
            capturedAt: new Date(parsed.data.location.capturedAt),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    if (!unlocked) {
      return NextResponse.json({
        artifactId: String(artifact._id),
        unlocked: false,
        newlyUnlocked: false,
        distanceMeters: Math.round(computedDistance),
        requiredMeters,
        shortfallMeters: Math.max(0, Math.ceil(requiredMeters - computedDistance)),
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
