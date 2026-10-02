import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { getAuthContext, requireAuthContext } from "@/lib/auth";
import { assertMediaOwnership, imageUrl } from "@/lib/cloudinary";
import { CreateCommunitySnapRequest } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { CommunitySnap } from "@/models/community";
import { User } from "@/models/user";
import { VerificationAttempt } from "@/models/verification";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connect();
    await getAuthContext();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20,
      100,
    );
    const cursor = searchParams.get("cursor");

    const query: Record<string, unknown> = {
      artifactId: new Types.ObjectId(id),
      status: "ACTIVE",
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const snaps = await CommunitySnap.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = snaps.length > limit;
    const items = snaps.slice(0, limit);

    // Batch-fetch authors to avoid N+1 queries
    const userIds = [
      ...new Set(items.map((snap) => snap.userId).filter(Boolean)),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select("username displayName profileImage")
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const mappedItems = items.map((snap) => {
      const author = snap.userId ? userMap.get(String(snap.userId)) : null;
      return {
        id: String(snap._id),
        imageUrl: snap.media?.url ?? "",
        caption: snap.caption ?? null,
        author: author
          ? {
              username: author.username,
              displayName: author.displayName,
              profileImageUrl: author.profileImage?.url ?? null,
            }
          : null,
        createdAt: new Date(snap.createdAt).toISOString(),
      };
    });

    return NextResponse.json({
      items: mappedItems,
      page: {
        nextCursor: hasMore ? String(items[items.length - 1]?._id ?? "") : null,
        hasMore,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireAuthContext();
    await connect();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    const artifact = await Artifact.findById(id).lean();
    if (!artifact || artifact.status !== "PUBLISHED") {
      throw ApiError.notFound("Artifact not found.");
    }

    const body = await readJsonBody(request);
    const parsed = CreateCommunitySnapRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid snap payload.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { verificationAttemptId, imagePublicId, caption } = parsed.data;

    if (!assertMediaOwnership(imagePublicId, "COMMUNITY_SNAP", user._id)) {
      throw ApiError.validation(
        "imagePublicId must be signed for COMMUNITY_SNAP for this user.",
      );
    }

    const attempt = await VerificationAttempt.findOne({
      _id: new Types.ObjectId(verificationAttemptId),
      userId: user._id,
      artifactId: artifact._id,
    }).lean();

    if (!attempt) {
      throw ApiError.notFound("Verification attempt not found for this artifact.");
    }

    const snap = await CommunitySnap.create({
      userId: user._id,
      artifactId: artifact._id,
      verificationAttemptId: attempt._id,
      media: {
        url: imageUrl(imagePublicId),
        publicId: imagePublicId,
      },
      caption,
      status: "PENDING",
    });

    return NextResponse.json(
      {
        id: String(snap._id),
        artifactId: String(snap.artifactId),
        status: snap.status,
        createdAt: snap.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
