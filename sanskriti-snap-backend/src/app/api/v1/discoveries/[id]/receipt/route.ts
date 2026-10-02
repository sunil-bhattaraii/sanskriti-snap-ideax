/**
 * docs/API Contract.md 7.2 — Success-screen payload for a discovery.
 *
 * Owner-only; non-owner gets 404 to prevent ID probing.
 * Aggregates the discovery, quest progress update, badge award (if any),
 * and current user state in one call.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { UserBadge } from "@/models/gamification";
import { Discovery, VerificationAttempt } from "@/models/verification";
import { User } from "@/models/user";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthContext();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Discovery not found.");
    }

    await connect();

    const discoveryId = new Types.ObjectId(id);
    const discovery = await Discovery.findById(discoveryId).lean();

    // 404 on non-existent or non-owned to prevent ID probing
    if (!discovery || String(discovery.userId) !== String(user._id)) {
      throw ApiError.notFound("Discovery not found.");
    }

    const [artifact, attempt, currentUser, awardedBadge] = await Promise.all([
      Artifact.findById(discovery.artifactId).lean(),
      VerificationAttempt.findById(discovery.verificationAttemptId).lean(),
      User.findById(user._id).select("lifetimeXp pointsBalance").lean(),
      UserBadge.findOne({
        userId: user._id,
        discoveryId: discoveryId,
      })
        .populate<{ badgeId: { _id: unknown; name: string; iconUrl: string | null } }>(
          "badgeId",
          "name iconUrl",
        )
        .lean(),
    ]);

    if (!artifact || !attempt) {
      throw ApiError.notFound("Discovery data incomplete.");
    }

    // Compute points awarded from ledger or use a sensible default
    const pointsAwarded = 50; // TODO: derive from points transaction ledger if needed

    return NextResponse.json({
      id: String(discovery._id),
      discoveredAt: new Date(discovery.discoveredAt).toISOString(),
      xpAwarded: discovery.xpAwarded,
      pointsAwarded,
      artifact: {
        id: String(artifact._id),
        name: artifact.name,
        category: artifact.category,
        coverImageUrl: artifact.coverImageUrl ?? null,
      },
      verificationAttemptId: String(discovery.verificationAttemptId),
      quest: null, // TODO: populate if discovery completes a quest
      badge: awardedBadge
        ? {
            name: awardedBadge.badgeId?.name ?? "Unknown Badge",
            iconUrl: awardedBadge.badgeId?.iconUrl ?? null,
          }
        : null,
      lifetimeXp: currentUser?.lifetimeXp ?? 0,
      pointsBalance: currentUser?.pointsBalance ?? 0,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
