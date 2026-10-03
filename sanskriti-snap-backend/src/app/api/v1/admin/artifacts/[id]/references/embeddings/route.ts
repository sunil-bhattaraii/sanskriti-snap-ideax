/**
 * docs/API Contract.md 9 — Add an embedding vector to an artifact reference.
 *
 * Admin-only. The body carries `imagePublicId` to identify the reference, then
 * the embedding vector and model info. Returns the reference without the raw
 * vector (docs/API Contract.md 2.8).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { imageUrl } from "@/lib/cloudinary";
import { CreateEmbeddingRequest } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact, ArtifactReference } from "@/models/artifact";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    await connect();

    // Resolve the artifact first
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      throw ApiError.notFound("Artifact not found.");
    }

    const body = await readJsonBody(request);
    const parsed = CreateEmbeddingRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid embedding data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { imagePublicId, embedding, embeddingDimension, model, isCover } = parsed.data;

    // Find the reference by artifact + cloudinaryPublicId, or create it
    let reference = await ArtifactReference.findOne({
      artifactId: artifact._id,
      cloudinaryPublicId: imagePublicId,
    });

    if (!reference) {
      reference = new ArtifactReference({
        artifactId: artifact._id,
        imageUrl: imagePublicId.startsWith("http")
          ? imagePublicId
          : imageUrl(imagePublicId),
        cloudinaryPublicId: imagePublicId,
        isCover: isCover ?? false,
        embedding: [],
        embeddingDimension: 0,
        cvModel: { name: "pending", version: "0.0" },
      });
    }

    // If setting as cover, clear previous covers
    if (isCover) {
      await ArtifactReference.updateMany(
        { artifactId: artifact._id },
        { isCover: false },
      );
    }

    // Update the reference with embedding data
    reference.embedding = embedding;
    reference.embeddingDimension = embeddingDimension;
    reference.cvModel = model;
    if (isCover !== undefined) {
      reference.isCover = isCover;
    }

    await reference.save();

    // Update artifact's coverImageUrl if this is the cover
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
        model: reference.cvModel,
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}