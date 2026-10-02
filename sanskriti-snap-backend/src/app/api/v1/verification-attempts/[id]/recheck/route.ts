/**
 * docs/API Contract.md 6.4 — Re-verify with fresh GPS coordinates.
 *
 * Recheck creates a new VerificationAttempt and supersedes the original;
 * it NEVER mutates the original attempt in place.
 * Owner-only; non-owners receive 404.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAuthContext } from "@/lib/auth";
import { RecheckAttemptRequest } from "@/lib/contracts";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { processVerificationAttempt } from "@/lib/verification";
import { VerificationAttempt } from "@/models/verification";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAuthContext();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Verification attempt not found.");
    }

    const previousAttempt = await VerificationAttempt.findById(id).lean();

    // 404 for non-existent or non-owned to prevent ID probing
    if (
      !previousAttempt ||
      String(previousAttempt.userId) !== String(user._id)
    ) {
      throw ApiError.notFound("Verification attempt not found.");
    }

    const { location } = RecheckAttemptRequest.parse(
      await readJsonBody(request),
    );

    const result = await processVerificationAttempt(user._id, {
      artifactId: String(previousAttempt.artifactId),
      verificationImagePublicId:
        previousAttempt.verificationImage?.publicId ?? null,
      additionalPhotos: (previousAttempt.additionalPhotos ?? []).map((p) => ({
        publicId: p.publicId,
        caption: p.caption ?? null,
      })),
      location,
      privateNote: previousAttempt.privateNote ?? null,
      supersedesAttemptId: previousAttempt._id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
