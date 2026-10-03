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
import { Discovery } from "@/models/verification";

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
    const [progress, discoveryDocs] = await Promise.all([
      UserQuestProgress.findOne({ userId: user._id, questId: quest._id }).lean(),
      Discovery.find({ userId: user._id }).select("artifactId").lean(),
    ]);

    const discoveredArtifactIds = new Set(discoveryDocs.map((d) => String(d.artifactId)));
    (progress?.discoveredArtifactIds ?? []).forEach((id) => discoveredArtifactIds.add(String(id)));
    const questArtifactIds = new Set(quest.artifactIds.map(String));
    const questDiscoveredCount = [...discoveredArtifactIds].filter((id) => questArtifactIds.has(id)).length;
    const artifactCount = quest.artifactIds.length;
    const progressPercent =
      artifactCount > 0 ? Math.round((questDiscoveredCount / artifactCount) * 100) : 0;
    const completed =
      Boolean(progress?.completedAt) || (artifactCount > 0 && questDiscoveredCount === artifactCount);

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
      discoveredCount: questDiscoveredCount,
      progressPercent,
      completed,
      badge: badgeInfo,
      artifacts: artifactList,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}