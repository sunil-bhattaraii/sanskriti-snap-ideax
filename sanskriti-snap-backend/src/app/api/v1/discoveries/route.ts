/**
 * docs/API Contract.md 7.1 — Own discovery history.
 *
 * Cursor-paginated list of discoveries in reverse chronological order.
 * Each row includes the discovered artifact snapshot with distance if available.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { PaginationQuery } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { Discovery } from "@/models/verification";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthContext();
    await connect();

    const url = request.nextUrl;
    const { limit, cursor } = PaginationQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    const filter: Record<string, unknown> = { userId: user._id };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const discoveries = await Discovery.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = discoveries.length > limit;
    const pageItems = hasMore ? discoveries.slice(0, limit) : discoveries;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    const artifactIds = pageItems.map((d) => d.artifactId);
    const artifacts = await Artifact.find({ _id: { $in: artifactIds } }).lean();
    const artifactMap = new Map(artifacts.map((a) => [String(a._id), a]));

    const items = pageItems.map((discovery) => {
      const artifact = artifactMap.get(String(discovery.artifactId));
      return {
        id: String(discovery._id),
        discoveredAt: new Date(discovery.discoveredAt).toISOString(),
        xpAwarded: discovery.xpAwarded,
        artifact: artifact
          ? {
              id: String(artifact._id),
              name: artifact.name,
              category: artifact.category,
              coverImageUrl: artifact.coverImageUrl ?? null,
              humanReadableLocation: artifact.humanReadableLocation,
              rarity: artifact.rarity,
            }
          : null,
      };
    });

    return NextResponse.json({
      items,
      page: { nextCursor, hasMore },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
