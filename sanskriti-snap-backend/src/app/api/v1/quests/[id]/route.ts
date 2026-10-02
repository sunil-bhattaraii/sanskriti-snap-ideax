/**
 * docs/API Contract.md 7.4 — Quest detail with artifacts and progress.
 *
 * Required auth. Returns quest with all artifacts marked as discovered/not discovered.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Badge, Quest, UserQuestProgress } from "@/models/gamification";
import { Artifact } from "@/models/artifact";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthContext();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Quest not found.");
    }

    await connect();

    const quest = await Quest.findById(id).lean();
    if (!quest || quest.status !== "ACTIVE") {
      throw ApiError.notFound("Quest not found.");
    }

    // Fetch user's progress for this quest
    const progress = await UserQuestProgress.findOne({
      userId: user._id,
      questId: quest._id,
    }).lean();

    const discoveredArtifactIds = new Set(
      (progress?.discoveredArtifactIds ?? []).map(String),
    );
    const discoveredCount = discoveredArtifactIds.size;
    const artifactCount = quest.artifactIds.length;
    const progressPercent =
      artifactCount > 0 ? Math.round((discoveredCount / artifactCount) * 100) : 0;
    const completed =
      progress?.completedAt !== null && progress?.completedAt !== undefined;

    // Fetch artifact details
    const artifacts = await Artifact.find({ _id: { $in: quest.artifactIds } })
      .select("name humanReadableLocation coverImageUrl category")
      .lean();

    const artifactMap = new Map(artifacts.map((a) => [String(a._id), a]));

    const artifactList = quest.artifactIds.map((aid) => {
      const artifact = artifactMap.get(String(aid));
      return {
        id: String(aid),
        name: artifact?.name ?? "Unknown",
        humanReadableLocation: artifact?.humanReadableLocation ?? "",
        coverImageUrl: artifact?.coverImageUrl ?? null,
        category: artifact?.category ?? "OTHER",
        discovered: discoveredArtifactIds.has(String(aid)),
      };
    });

    // Fetch badge info if attached
    let badgeInfo: { id: string; name: string } | null = null;
    if (quest.badgeId) {
      const badge = await Badge.findById(quest.badgeId).select("name").lean();
      badgeInfo = badge ? { id: String(badge._id), name: badge.name } : null;
    }

    return NextResponse.json({
      id: String(quest._id),
      name: quest.name,
      description: quest.description,
      xpReward: quest.xpReward,
      artifactCount,
      discoveredCount,
      progressPercent,
      completed,
      badge: badgeInfo,
      artifacts: artifactList,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}