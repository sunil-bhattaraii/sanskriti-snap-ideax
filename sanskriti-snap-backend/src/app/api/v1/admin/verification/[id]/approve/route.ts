/**
 * docs/API Contract.md 9 — Approve a FLAGGED verification attempt.
 *
 * This is the resolution path for the only mutation an existing attempt is ever
 * allowed to take: `FLAGGED -> VERIFIED` (AGENTS.md). It reuses the same award
 * transaction as the synchronous pipeline so an admin approval and an automatic
 * pass produce byte-identical ledgers.
 *
 * Idempotent by state, not by header: approving an attempt that is already
 * VERIFIED returns the row unchanged and never re-awards. There is no
 * `Idempotency-Key` requirement because the transition itself carries the
 * semantics a retry needs.
 *
 * ADMIN only. EXPERT may review contributions and nothing else, so it is not
 * admitted here (docs/API Contract.md 15).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { loadAdminVerificationAttempt } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import {
  ApproveVerificationRequest,
  type AdminVerificationResolution,
} from "@/lib/contracts";
import { grantDiscoveryAwards } from "@/lib/awards";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction } from "@/models/community";
import { Discovery, VerificationAttempt } from "@/models/verification";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const NOT_FOUND = "Verification attempt not found.";

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await requireAdmin();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = ApproveVerificationRequest.parse(await readJsonBody(request));
    const note = body.note ?? null;

    const attempt = await VerificationAttempt.findById(id).lean();
    if (!attempt) {
      throw ApiError.notFound(NOT_FOUND);
    }

    // Already resolved the way this call wants. Return the committed state and
    // say so, rather than replaying an award.
    if (attempt.status === "VERIFIED") {
      return NextResponse.json(await resolve(id, true, null));
    }

    if (attempt.status === "REJECTED") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "This attempt was already rejected and cannot be approved.",
      );
    }

    const award = await withTransaction(async (session) => {
      // Re-read inside the callback: withTransaction may run this more than once
      // after a transient error, and the second run must see committed state.
      const current = await VerificationAttempt.findById(id)
        .session(session)
        .lean();
      if (!current) throw ApiError.notFound(NOT_FOUND);
      if (current.status !== "FLAGGED") {
        throw new ApiError(
          "INVALID_STATE_TRANSITION",
          "This attempt is no longer awaiting review.",
        );
      }

      const artifact = await Artifact.findById(current.artifactId).session(
        session,
      );
      if (!artifact) throw ApiError.notFound("Artifact not found.");

      // The award itself is guarded by the same duplicate-discovery rule as the
      // live pipeline. A FLAGGED attempt that arrived after the user had already
      // collected the artifact is resolved without paying out twice.
      const alreadyCollected = await Discovery.findOne({
        userId: current.userId,
        artifactId: current.artifactId,
      })
        .session(session)
        .lean();

      let granted: AdminVerificationResolution["award"] = null;

      if (!alreadyCollected) {
        const receipt = await grantDiscoveryAwards(session, {
          userId: current.userId,
          artifact: {
            _id: artifact._id,
            xpReward: artifact.xpReward,
            category: artifact.category,
          },
          attemptId: current._id,
          discoveredAt: current.capturedAt,
        });

        granted = {
          xpAwarded: receipt.xpAwarded,
          pointsAwarded: receipt.pointsAwarded,
          pointsBalance: receipt.pointsBalance,
          quest: receipt.quest,
          badge: receipt.badge,
        };
      }

      // flagReason is deliberately left intact: it is the historical record of
      // why this was flagged, and the review block below records the resolution.
      await VerificationAttempt.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "VERIFIED",
            rejectionReason: null,
            review: {
              reviewedBy: ctx.user._id,
              reviewedAt: new Date(),
              decision: "APPROVED",
              note,
            },
          },
        },
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "VERIFICATION_APPROVED",
            targetType: "VERIFICATION_ATTEMPT",
            targetId: current._id,
            metadata: {
              artifactId: String(current.artifactId),
              userId: String(current.userId),
              awarded: granted !== null,
              note,
            },
          },
        ],
        { session },
      );

      return granted;
    });

    return NextResponse.json(await resolve(id, false, award));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * Re-reads the attempt after the commit so the caller gets the same admin row
 * the list route would show. The transaction already proved the artifact and
 * author exist, so a null here means a concurrent delete, which is a 404.
 */
async function resolve(
  id: string,
  alreadyResolved: boolean,
  award: AdminVerificationResolution["award"],
): Promise<AdminVerificationResolution> {
  const row = await loadAdminVerificationAttempt(id);
  if (!row) throw ApiError.notFound(NOT_FOUND);
  return { ...row, alreadyResolved, award };
}
