/**
 * docs/API Contract.md 9 — Reject a FLAGGED verification attempt.
 *
 * The mirror of `approve`, and deliberately duller: it awards nothing, touches
 * no ledger, and only moves `FLAGGED -> REJECTED` while copying the reviewer's
 * `reason` into `rejectionReason`. A rejection is not a punishment — the user
 * keeps any story unlock they earned by walking there (AGENTS.md).
 *
 * Idempotent by state: rejecting an already-REJECTED attempt returns the row
 * unchanged.
 *
 * ADMIN only (docs/API Contract.md 15).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { loadAdminVerificationAttempt } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import {
  RejectVerificationRequest,
  type AdminVerificationResolution,
} from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction } from "@/models/community";
import { VerificationAttempt } from "@/models/verification";

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

    const body = RejectVerificationRequest.parse(await readJsonBody(request));
    const { reason } = body;
    const note = body.note ?? null;

    const attempt = await VerificationAttempt.findById(id).lean();
    if (!attempt) {
      throw ApiError.notFound(NOT_FOUND);
    }

    if (attempt.status === "REJECTED") {
      return NextResponse.json(await resolve(id, true));
    }

    if (attempt.status === "VERIFIED") {
      throw new ApiError(
        "INVALID_STATE_TRANSITION",
        "This attempt was already approved and cannot be rejected.",
      );
    }

    await withTransaction(async (session) => {
      // Re-read inside the callback: withTransaction may run this more than once.
      const current = await VerificationAttempt.findById(id)
        .session(session)
        .lean();
      if (!current) throw ApiError.notFound(NOT_FOUND);

      // A retry of this same call finds REJECTED and does nothing, which is what
      // makes the second run of the callback safe.
      if (current.status !== "FLAGGED") return;

      await VerificationAttempt.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "REJECTED",
            rejectionReason: reason,
            review: {
              reviewedBy: ctx.user._id,
              reviewedAt: new Date(),
              decision: "REJECTED",
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
            action: "VERIFICATION_REJECTED",
            targetType: "VERIFICATION_ATTEMPT",
            targetId: current._id,
            metadata: {
              artifactId: String(current.artifactId),
              userId: String(current.userId),
              reason,
              note,
            },
          },
        ],
        { session },
      );
    });

    return NextResponse.json(await resolve(id, false));
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** Re-reads after the commit so the response matches the review queue's row. */
async function resolve(
  id: string,
  alreadyResolved: boolean,
): Promise<AdminVerificationResolution> {
  const row = await loadAdminVerificationAttempt(id);
  if (!row) throw ApiError.notFound(NOT_FOUND);
  return { ...row, alreadyResolved, award: null };
}
