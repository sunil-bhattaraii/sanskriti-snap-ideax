/**
 * docs/API Contract.md 7.4 — Quest list with progress.
 *
 * Optional auth: unauthenticated callers see discoveredCount: 0, completed: false.
 * Returns active quests with user's progress computed server-side.
 */

import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Quest, UserQuestProgress } from "@/models/gamification";
import { Discovery } from "@/models/verification";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    await connect();

    const quests = await Quest.find({ status: "ACTIVE" })
      .select("name description xpReward artifactIds badgeId")
      .lean();

    const progressMap: Map<string, { discoveredCount: number; completed: boolean }> =
      new Map();

    if (ctx?.user) {
      const [progressDocs, discoveryDocs] = await Promise.all([
        UserQuestProgress.find({ userId: ctx.user._id }).lean(),
        Discovery.find({ userId: ctx.user._id }).select("artifactId").lean(),
      ]);
      const discoveredArtifactIds = new Set(discoveryDocs.map((d) => String(d.artifactId)));

      progressDocs.forEach((p) => {
        progressMap.set(String(p.questId), {
          discoveredCount: p.discoveredArtifactIds.filter((id) =>
            discoveredArtifactIds.has(String(id)),
          ).length,
          completed: !!p.completedAt,
        });
      });

      quests.forEach((quest) => {
        if (progressMap.has(String(quest._id))) return;
        const discoveredCount = quest.artifactIds.filter((id) =>
          discoveredArtifactIds.has(String(id)),
        ).length;
        progressMap.set(String(quest._id), {
          discoveredCount,
          completed: quest.artifactIds.length > 0 && discoveredCount === quest.artifactIds.length,
        });
      });
    }

    const items = quests.map((quest) => {
      const progress = progressMap.get(String(quest._id));
      const discoveredCount = progress?.discoveredCount ?? 0;
      const artifactCount = quest.artifactIds.length;
      const progressPercent =
        artifactCount > 0
          ? Math.round((discoveredCount / artifactCount) * 100)
          : 0;
      const completed = progress?.completed ?? false;

      return {
        id: String(quest._id),
        name: quest.name,
        description: quest.description,
        xpReward: quest.xpReward,
        artifactCount,
        discoveredCount,
        progressPercent,
        completed,
        badge: quest.badgeId
          ? { id: String(quest.badgeId), name: "" } // badge name loaded in detail
          : null,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    return toErrorResponse(err);
  }
}