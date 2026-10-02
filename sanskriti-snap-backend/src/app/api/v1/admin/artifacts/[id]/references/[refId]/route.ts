/**
 * docs/API Contract.md 9 — Delete an artifact reference image.
 *
 * Admin-only. Removes the reference from the artifact.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { ArtifactReference } from "@/models/artifact";

type RouteContext = {
  params: Promise<{ id: string; refId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, refId } = await context.params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(refId)) {
      throw ApiError.notFound("Reference not found.");
    }

    await connect();

    const reference = await ArtifactReference.findOneAndDelete({
      _id: new Types.ObjectId(refId),
      artifactId: new Types.ObjectId(id),
    });

    if (!reference) {
      throw ApiError.notFound("Reference not found for this artifact.");
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
