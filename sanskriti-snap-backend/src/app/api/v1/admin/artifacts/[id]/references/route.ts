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
import { getCvClient } from "@/lib/cv";
import { CvServiceUnavailableError } from "@/lib/cv-contract";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { isCvConfigured } from "@/lib/env";
import { readJsonBody } from "@/lib/http";
import { Artifact, ArtifactReference } from "@/models/artifact";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    await connect();

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      throw ApiError.notFound("Artifact not found.");
    }

    const references = await ArtifactReference.find({ artifactId: artifact._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: references.map((ref) => ({
        id: String(ref._id),
        imageUrl: ref.imageUrl,
        cloudinaryPublicId: ref.cloudinaryPublicId,
        isCover: ref.isCover,
        embeddingDimension: ref.embeddingDimension,
        cvModel: ref.cvModel,
        createdAt: new Date(ref.createdAt).toISOString(),
      })),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

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

    const { imagePublicId, isCover, generateEmbedding, model } = parsed.data;

    // Verify the image was uploaded via a token signed for this admin user.
    // Artifact reference images are signed with purpose VERIFICATION_GALLERY
    // (docs/API Contract.md §6.1 — no dedicated ARTIFACT_REFERENCE purpose exists).
    if (!assertMediaOwnership(imagePublicId, "VERIFICATION_GALLERY", user._id)) {
      throw ApiError.validation(
        "imagePublicId must be signed for this user via POST /api/v1/media/sign with purpose VERIFICATION_GALLERY.",
      );
    }

    let embedding: number[] = [];
    let embeddingDimension = 0;
    let cvModel = { name: "pending", version: "0.0" };

    if (generateEmbedding) {
      if (!isCvConfigured()) {
        throw new ApiError(
          "CV_UNAVAILABLE",
          "CV embedding generation is not configured.",
          { retryable: true, retryAfterSeconds: 30 },
        );
      }

      try {
        const response = await getCvClient().embed({
          image: imageUrl(imagePublicId),
          ...(model ? { model } : {}),
        });

        if (response.embedding.length !== response.embeddingDimension) {
          throw new ApiError(
            "CV_UNAVAILABLE",
            "The CV service returned an invalid embedding.",
          );
        }

        embedding = response.embedding;
        embeddingDimension = response.embeddingDimension;
        cvModel = response.model;
      } catch (err) {
        if (err instanceof CvServiceUnavailableError) {
          const isTimeout = err.reason === "timeout";
          throw new ApiError(
            isTimeout ? "CV_TIMEOUT" : "CV_UNAVAILABLE",
            isTimeout
              ? "CV embedding generation timed out. Please try again."
              : "CV embedding generation is temporarily unavailable.",
            {
              retryable: true,
              retryAfterSeconds: isTimeout ? 15 : 30,
            },
          );
        }
        throw err;
      }
    }

    // Do not replace the current cover until CV generation has succeeded.
    if (isCover) {
      await ArtifactReference.updateMany(
        { artifactId: artifact._id },
        { isCover: false },
      );
    }

    const reference = await ArtifactReference.create({
      artifactId: artifact._id,
      imageUrl: imageUrl(imagePublicId),
      cloudinaryPublicId: imagePublicId,
      isCover: isCover ?? false,
      embedding,
      embeddingDimension,
      cvModel,
    });

    if (reference.isCover) {
      await Artifact.findByIdAndUpdate(artifact._id, {
        coverImageUrl: reference.imageUrl,
      });
    }

    return NextResponse.json(
      {
        id: String(reference._id),
        imageUrl: reference.imageUrl,
        isCover: reference.isCover,
        embeddingDimension: reference.embeddingDimension,
        cvModel: reference.cvModel,
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}