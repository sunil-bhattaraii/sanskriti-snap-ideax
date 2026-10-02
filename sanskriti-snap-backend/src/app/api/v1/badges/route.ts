/**
 * docs/API Contract.md 7.5 — User's badges with unlock state and progress.
 *
 * Required auth. Returns all active badges with user's unlock state, earn time,
 * and partial progress for DISCOVERY_COUNT / CATEGORY_COUNT conditions.
 */

import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Badge, UserBadge } from "@/models/gamification";
import { Artifact } from "@/models/artifact";
import { Discovery } from "@/models/verification";

export async function GET() {
  try {
    const { user } = await requireAuthContext();
    await connect();

    const badges = await Badge.find({ status: "ACTIVE" })
      .select("name description iconUrl condition")
      .lean();

    // Fetch user's earned badges
    const earnedBadges = await UserBadge.find({ userId: user._id }).lean();
    const earnedBadgeIds = new Set(earnedBadges.map((b) => String(b.badgeId)));
    const earnedMap = new Map(
      earnedBadges.map((b) => [String(b.badgeId), b.earnedAt]),
    );

    // Compute progress for dynamic badges
    const userDiscoveries = await Discovery.find({ userId: user._id }).lean();
    const totalDiscoveries = userDiscoveries.length;

    // Fetch all artifact categories the user has discovered
    const discoveredArtifactIds = userDiscoveries.map((d) => d.artifactId);
    const discoveredArtifacts = await Artifact.find({
      _id: { $in: discoveredArtifactIds },
    })
      .select("category")
      .lean();

    const discoveredCategories = new Set(discoveredArtifacts.map((a) => a.category));

    const items = badges.map((badge) => {
      const unlocked = earnedBadgeIds.has(String(badge._id));
      const earnedAt = earnedMap.get(String(badge._id));

      let progress: { current: number; required: number } | undefined;

      if (!unlocked) {
        if (badge.condition.type === "DISCOVERY_COUNT") {
          progress = {
            current: totalDiscoveries,
            required: badge.condition.value ?? 0,
          };
        } else if (badge.condition.type === "CATEGORY_COUNT") {
          progress = {
            current: discoveredCategories.size,
            required: badge.condition.value ?? 0,
          };
        }
      }

      return {
        id: String(badge._id),
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl ?? null,
        unlocked,
        earnedAt: earnedAt ? new Date(earnedAt).toISOString() : null,
        ...(progress && { progress }),
      };
    });

    const unlockedCount = items.filter((b) => b.unlocked).length;
    const totalCount = items.length;

    return NextResponse.json({
      items,
      meta: { unlockedCount, totalCount },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
