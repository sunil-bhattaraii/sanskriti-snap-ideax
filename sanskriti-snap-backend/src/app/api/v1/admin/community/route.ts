/**
 * docs/API Contract.md 9 — community snap moderation queue.
 *
 * GET: cursor-paginated list of community snaps. ADMIN only.
 *
 * When no `status` filter is supplied, defaults to PENDING — the most
 * common moderator workflow is reviewing snaps awaiting a decision. An explicit
 * `?status=ACTIVE` returns the visible feed, useful for spot-checking.
 *
 * Each row carries the snap's author and the artifact it is linked to (when
 * present), so the moderator can judge context without a second request.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { CommunityQuery } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { CommunitySnap } from "@/models/community";
import { User } from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connect();

    const url = request.nextUrl;
    const { limit, cursor, status } = CommunityQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const filter: Record<string, unknown> = {
      status: status ?? "PENDING",
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const snaps = await CommunitySnap.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = snaps.length > limit;
    const pageItems = hasMore ? snaps.slice(0, limit) : snaps;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    // Batch-load authors and artifacts rather than N+1 per row.
    const authorIds = [...new Set(pageItems.map((s) => String(s.userId)))];
    const artifactIds = [
      ...new Set(
        pageItems.flatMap((s) => (s.artifactId ? [String(s.artifactId)] : [])),
      ),
    ];

    const [authors, artifacts] = await Promise.all([
      User.find({ _id: { $in: authorIds } })
        .select("username displayName")
        .lean(),
      Artifact.find({ _id: { $in: artifactIds } })
        .select("name humanReadableLocation coverImageUrl")
        .lean(),
    ]);

    const authorMap = new Map(authors.map((u) => [String(u._id), u]));
    const artifactMap = new Map(artifacts.map((a) => [String(a._id), a]));

    const items = pageItems.flatMap((snap) => {
      const author = authorMap.get(String(snap.userId));
      // Drop snaps whose author has been deleted — the moderator cannot
      // attribute the content and has no user to notify.
      if (!author) return [];

      const artifact = snap.artifactId
        ? (artifactMap.get(String(snap.artifactId)) ?? null)
        : null;

      return [
        {
          id: String(snap._id),
          status: snap.status,
          imageUrl: snap.media.url,
          caption: snap.caption ?? null,
          author: {
            id: String(author._id),
            username: author.username,
            displayName: author.displayName,
          },
          artifact: artifact
            ? {
                id: String(artifact._id),
                name: artifact.name,
                humanReadableLocation: artifact.humanReadableLocation,
                coverImageUrl: artifact.coverImageUrl ?? null,
              }
            : null,
          createdAt: new Date(snap.createdAt).toISOString(),
        },
      ];
    });

    return NextResponse.json({ items, page: { nextCursor, hasMore } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
