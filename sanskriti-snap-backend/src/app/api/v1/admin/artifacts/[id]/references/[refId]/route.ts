/**
 * docs/API Contract.md 9 — Delete an artifact reference image.
 *
 * Admin-only. Removes the reference from the artifact and writes an
 * `adminActions` audit row in the same transaction (docs/DB Schemas.md 18).
 *
 * If the deleted reference was the cover, `coverImageUrl` on the parent
 * artifact is cleared so the artifact does not point at a deleted asset.
 * Promoting a new cover is a separate admin action (PATCH /admin/artifacts/:id
 * or POST /admin/artifacts/:id/references with isCover: true).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact, ArtifactReference } from "@/models/artifact";
import { AdminAction } from "@/models/community";

type RouteContext = {
  params: Promise<{ id: string; refId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireAdmin();
    const { id, refId } = await context.params;

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(refId)) {
      throw ApiError.notFound("Reference not found.");
    }

    await connect();

    await withTransaction(async (session) => {
      const reference = await ArtifactReference.findOneAndDelete(
        {
          _id: new Types.ObjectId(refId),
          artifactId: new Types.ObjectId(id),
        },
        { session },
      );

      if (!reference) {
        throw ApiError.notFound("Reference not found for this artifact.");
      }

      // Clear the artifact's cached coverImageUrl when the deleted reference
      // was the designated cover. The artifact is left without a cover rather
      // than silently pointing at a deleted asset.
      if (reference.isCover) {
        await Artifact.findByIdAndUpdate(
          id,
          { $unset: { coverImageUrl: "" } },
          { session },
        );
      }

      await AdminAction.create(
        [
          {
            adminId: user._id,
            action: "ARTIFACT_UPDATED",
            targetType: "ARTIFACT_REFERENCE",
            targetId: reference._id,
            metadata: {
              artifactId: id,
              deletedPublicId: reference.cloudinaryPublicId,
              wasCover: reference.isCover,
            },
          },
        ],
        { session },
      );
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
