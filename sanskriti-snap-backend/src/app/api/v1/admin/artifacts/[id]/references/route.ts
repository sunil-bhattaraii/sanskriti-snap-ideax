/**
 * docs/API Contract.md 9 — Add reference image to an artifact.
 *
 * Admin-only. The image must have been previously signed via POST /api/v1/media/sign.
 * Creates an ArtifactReference and optionally sets it as cover.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { CreateReferenceRequest } from "@/lib/contracts";
import { assertMediaOwnership, imageUrl } from "@/lib/cloudinary";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact, ArtifactReference } from "@/models/artifact";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireAdmin();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    await connect();

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      throw ApiError.notFound("Artifact not found.");
    }

    const body = await readJsonBody(request);
    const parsed = CreateReferenceRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid reference data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { imagePublicId, isCover } = parsed.data;

    // Verify the image was signed for this user
    if (!assertMediaOwnership(imagePublicId, "VERIFICATION_GALLERY", user._id)) {
      throw ApiError.validation(
        "imagePublicId must be signed for VERIFICATION_GALLERY for this user.",
      );
    }

    // If setting as cover, clear previous cover
    if (isCover) {
      await ArtifactReference.updateMany(
        { artifactId: artifact._id },
        { isCover: false },
      );
    }

    // The contract says the server fetches the image and computes the embedding.
    // For now we create the reference without an embedding; the admin uploads
    // pre-computed vectors via the embeddings endpoint.
    // TODO: call CV service /embed here when it supports synchronous calls
    const reference = await ArtifactReference.create({
      artifactId: artifact._id,
      imageUrl: imageUrl(imagePublicId),
      cloudinaryPublicId: imagePublicId,
      isCover: isCover ?? false,
      embedding: [],
      embeddingDimension: 0,
      cvModel: { name: "pending", version: "0.0" },
    });

    return NextResponse.json(
      {
        id: String(reference._id),
        imageUrl: reference.imageUrl,
        isCover: reference.isCover,
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}