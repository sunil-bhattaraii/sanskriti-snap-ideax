/**
 * docs/API Contract.md 9 — List verification attempts for admin review.
 *
 * GET ?status=FLAGGED returns AdminVerificationAttempt[] for the review queue.
 * Requires ADMIN role. EXPERT is not admitted here — verification review is
 * full admin-only per docs/API Contract.md 15.
 */

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import {
  PaginationQuery,
  VerificationStatus,
} from "@/lib/contracts";
import { toAdminVerificationAttempt } from "@/lib/dto";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { User } from "@/models/user";
import { VerificationAttempt } from "@/models/verification";

const AdminVerificationQuery = PaginationQuery.extend({
  status: VerificationStatus.optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connect();

    const url = request.nextUrl;
    const parsed = AdminVerificationQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const { limit, cursor, status } = parsed;

    const filter: Record<string, unknown> = {};

    // Default to FLAGGED if not specified
    if (status) {
      filter.status = status;
    } else {
      filter.status = "FLAGGED";
    }

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    // flagReason is select:false, must ask for it explicitly
    const attempts = await VerificationAttempt.find(filter)
      .select("+flagReason +review")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = attempts.length > limit;
    const pageItems = hasMore ? attempts.slice(0, limit) : attempts;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    // Batch-load artifacts and users
    const artifactIds = pageItems.map((a) => a.artifactId);
    const userIds = pageItems.map((a) => a.userId);

    const [artifacts, users] = await Promise.all([
      Artifact.find({ _id: { $in: artifactIds } })
        .select("name coverImageUrl humanReadableLocation xpReward verificationRadiusMeters")
        .lean(),
      User.find({ _id: { $in: userIds } })
        .select("username displayName")
        .lean(),
    ]);

    const artifactMap = new Map(
      artifacts.map((a) => [
        String(a._id),
        {
          _id: a._id,
          name: a.name,
          coverImageUrl: a.coverImageUrl,
          humanReadableLocation: a.humanReadableLocation,
          xpReward: a.xpReward,
          verificationRadiusMeters: a.verificationRadiusMeters,
        },
      ]),
    );

    const userMap = new Map(
      users.map((u) => [
        String(u._id),
        { _id: u._id, username: u.username, displayName: u.displayName },
      ]),
    );

    // flatMap, not map + filter(Boolean): the filter does not narrow the array
    // type away from null, so the response would be typed as possibly-null rows.
    const items = pageItems.flatMap((attempt) => {
      const artifact = artifactMap.get(String(attempt.artifactId));
      const user = userMap.get(String(attempt.userId));

      // A dangling reference means the artifact or author was deleted out from
      // under the attempt. The reviewer cannot act on it, so it is dropped from
      // the queue rather than rendered half-built.
      if (!artifact || !user) return [];

      return [
        toAdminVerificationAttempt(
          attempt as Parameters<typeof toAdminVerificationAttempt>[0],
          artifact as Parameters<typeof toAdminVerificationAttempt>[1],
          user as Parameters<typeof toAdminVerificationAttempt>[2],
        ),
      ];
    });

    return NextResponse.json({
      items,
      page: { nextCursor, hasMore },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}