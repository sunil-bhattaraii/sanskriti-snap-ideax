/**
 * docs/API Contract.md 9 — the contribution review queue.
 *
 * EXPERT or ADMIN. `/api/v1/admin/contributions*` is the **only** admin surface
 * an EXPERT may touch; every other route under `/api/v1/admin/` is ADMIN-only
 * (docs/API Contract.md 15, "EXPERT is scoped").
 *
 * Paginated by cursor like every other admin list, so a busy queue does not
 * shift under the reviewer between pages.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireReviewer } from "@/lib/auth";
import { ContributionStatus, PaginationQuery } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { toAdminContribution } from "@/lib/dto";
import { toErrorResponse } from "@/lib/errors";
import { Contribution } from "@/models/community";
import { User } from "@/models/user";

const ContributionQuery = PaginationQuery.extend({
  status: ContributionStatus.optional(),
});

/**
 * What the queue shows when the reviewer has not asked for a status. SUBMITTED
 * and UNDER_REVIEW are both "waiting on a decision"; APPROVED and REJECTED are
 * history and DRAFT has not been sent yet. An explicit `?status=` overrides it,
 * so history is one query away rather than a second endpoint.
 */
const DEFAULT_QUEUE_STATUSES = ["SUBMITTED", "UNDER_REVIEW"] as const;

export async function GET(request: NextRequest) {
  try {
    await requireReviewer();
    await connect();

    const url = request.nextUrl;
    const { limit, cursor, status } = ContributionQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const filter: Record<string, unknown> = {
      status: status ?? { $in: [...DEFAULT_QUEUE_STATUSES] },
    };

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const contributions = await Contribution.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = contributions.length > limit;
    const pageItems = hasMore ? contributions.slice(0, limit) : contributions;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    // One query for every author on the page rather than one per row: the queue
    // is the route a reviewer refreshes most, and an N+1 here is an N+1 on
    // every poll.
    const authorIds = [
      ...new Set(pageItems.map((row) => String(row.submittedBy))),
    ];
    const authors = await User.find({ _id: { $in: authorIds } })
      .select("username displayName")
      .lean();
    const authorMap = new Map(authors.map((user) => [String(user._id), user]));

    // flatMap, not map + filter(Boolean): the filter does not narrow the array
    // type away from null, so the response would be typed as possibly-null rows.
    const items = pageItems.flatMap((contribution) => {
      const author = authorMap.get(String(contribution.submittedBy));
      // A dangling author means the submitter's account was deleted. The
      // reviewer cannot act on the proposal, so it is dropped from the queue
      // rather than rendered half-built.
      if (!author) return [];
      return [
        toAdminContribution(
          contribution as Parameters<typeof toAdminContribution>[0],
          author as Parameters<typeof toAdminContribution>[1],
        ),
      ];
    });

    return NextResponse.json({ items, page: { nextCursor, hasMore } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
