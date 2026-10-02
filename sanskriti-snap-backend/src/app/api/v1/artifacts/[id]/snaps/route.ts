import { NextResponse, type NextRequest } from "next/server";

import { getAuthContext, requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { CommunitySnap } from "@/models/community";
import { Artifact } from "@/models/artifact";
import { VerificationAttempt } from "@/models/verification";
import { User } from "@/models/user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connect();
    await getAuthContext();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20,
      100,
    );
    const cursor = searchParams.get("cursor");

    const query: Record<string, unknown> = {
      artifactId: id,
      status: "ACTIVE",
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const snaps = await CommunitySnap.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = snaps.length > limit;
    const items = snaps.slice(0, limit);

    return NextResponse.json({
      items: await Promise.all(
        items.map(async (snap) => {
          const author = snap.userId
            ? await User.findById(snap.userId).select("username displayName profileImage").lean()
            : null;

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
            createdAt: snap.createdAt,
          };
        }),
      ),
      page: {
        nextCursor: hasMore ? String(items[items.length - 1]?._id ?? null) : null,
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
    const ctx = await requireAuthContext();
    await connect();

    const { id } = await params;
    const artifact = await Artifact.findById(id).lean();
    if (!artifact) throw ApiError.notFound();

    const body = await request.json();
    const verificationAttemptId = body?.verificationAttemptId;
    const imagePublicId = body?.imagePublicId;
    const caption = body?.caption ?? null;

    if (!verificationAttemptId || typeof verificationAttemptId !== "string") {
      throw ApiError.validation("verificationAttemptId is required.");
    }
    if (typeof imagePublicId !== "string" || !imagePublicId.trim()) {
      throw ApiError.validation("imagePublicId is required.");
    }

    const attempt = await VerificationAttempt.findOne({
      _id: verificationAttemptId,
      userId: ctx.user._id,
      artifactId: id,
    }).lean();

    if (!attempt) {
      throw ApiError.notFound();
    }

    const snap = await CommunitySnap.create({
      userId: ctx.user._id,
      artifactId: artifact._id,
      verificationAttemptId: attempt._id,
      media: {
        url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME ?? "hidden-nepal"}/image/upload/${imagePublicId}`,
        publicId: imagePublicId,
      },
      caption,
      status: "PENDING",
    });

    return NextResponse.json({
      id: String(snap._id),
      artifactId: String(snap.artifactId),
      status: snap.status,
      createdAt: snap.createdAt,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
