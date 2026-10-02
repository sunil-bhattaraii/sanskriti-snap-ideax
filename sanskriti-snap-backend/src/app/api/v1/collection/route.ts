/**
 * docs/API Contract.md 7.3 — User's collected artifacts.
 *
 * Derived from discoveries joined to artifacts server-side.
 * Excludes artifacts whose status is no longer PUBLISHED.
 * Returns total count, total XP, and paginated collection.
 */

import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { Discovery } from "@/models/verification";

export async function GET(_request: Request) {
  try {
    const { user } = await requireAuthContext();
    await connect();

    // Fetch all user's discoveries
    const discoveries = await Discovery.find({ userId: user._id })
      .select("artifactId discoveredAt xpAwarded")
      .lean();

    const artifactIds = discoveries.map((d) => d.artifactId);
    const artifacts = await Artifact.find({
      _id: { $in: artifactIds },
      status: "PUBLISHED",
    })
      .select("_id name humanReadableLocation xpReward coverImageUrl rarity")
      .lean();

    const artifactMap = new Map(artifacts.map((a) => [String(a._id), a]));

    const items = discoveries
      .map((discovery) => {
        const artifact = artifactMap.get(String(discovery.artifactId));
        if (!artifact) return null;

        return {
          id: String(artifact._id),
          title: artifact.name,
          humanReadableLocation: artifact.humanReadableLocation,
          xp: discovery.xpAwarded,
          coverImageUrl: artifact.coverImageUrl ?? null,
          rarity: artifact.rarity,
          discoveredAt: new Date(discovery.discoveredAt).toISOString(),
          discovered: true as const,
        };
      })
      .filter(Boolean);

    const totalXp = discoveries.reduce((sum, d) => sum + d.xpAwarded, 0);

    return NextResponse.json({
      items,
      meta: {
        total: items.length,
        totalXp,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
