/**
 * docs/API Contract.md 6.3 — Fetch one verification attempt.
 *
 * Owner-only; non-owners get 404 to prevent ID probing.
 * This is not a polling endpoint — the attempt is always in a final state.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAuthContext } from "@/lib/auth";
import { toVerificationAttempt } from "@/lib/dto";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { VerificationAttempt } from "@/models/verification";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthContext();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Verification attempt not found.");
    }

    const attempt = await VerificationAttempt.findById(id).lean();

    // 404 on non-existent or non-owned to prevent ID probing
    if (!attempt || String(attempt.userId) !== String(user._id)) {
      throw ApiError.notFound("Verification attempt not found.");
    }

    const artifact = await Artifact.findById(attempt.artifactId).lean();

    return NextResponse.json(
      toVerificationAttempt(
        attempt,
        artifact ?? {
          _id: attempt.artifactId,
          name: "Unknown Artifact",
          humanReadableLocation: "",
          xpReward: 0,
        },
      ),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
