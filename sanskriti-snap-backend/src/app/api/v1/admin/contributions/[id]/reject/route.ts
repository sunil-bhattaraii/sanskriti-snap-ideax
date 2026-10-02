/**
 * docs/API Contract.md 9 — reject a contribution.
 *
 * EXPERT or ADMIN: contribution review is the one admin surface an EXPERT may
 * touch (docs/API Contract.md 15).
 *
 * `reason` is required. The model has a single `review.note` field and no
 * dedicated rejection reason, so the reason is folded into the note the author
 * will read rather than dropped — a rejection the submitter cannot act on is a
 * dead end. Both the reason and the reviewer's own note are kept in the
 * `adminActions` metadata, so the audit row holds them separately even though
 * the document merges them.
 *
 * The decision and its `adminActions` row commit in one transaction, and the
 * route is idempotent by state like the verification routes: a retry of a
 * rejection returns what the first call left rather than writing a second audit
 * row.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { loadAdminContribution } from "@/lib/admin";
import { requireReviewer } from "@/lib/auth";
import {
  ContributionRejectionRequest,
  type AdminContributionResolution,
} from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction, Contribution } from "@/models/community";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const NOT_FOUND = "Contribution not found.";

/**
 * Re-reads the row after the transaction so the response is the committed
 * state, not the instance the callback happened to hold — and so the idempotent
 * early return and the fresh decision return the identical shape.
 */
async function resolve(
  id: string,
  alreadyResolved: boolean,
): Promise<AdminContributionResolution> {
  const row = await loadAdminContribution(id);
  if (!row) throw ApiError.notFound(NOT_FOUND);
  return { ...row, alreadyResolved };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireReviewer();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = ContributionRejectionRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid rejection.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { reason, note } = parsed.data;

    // One `note` field, two things to say. The reason leads because that is what
    // the submitter needs; the reviewer's aside follows.
    const storedNote = note ? `${reason}\n\n${note}` : reason;

    const result = await withTransaction(async (session) => {
      // Re-read inside the callback: the driver may run this more than once, and
      // the second run must see committed state rather than the snapshot the
      // route read before opening the transaction.
      const current = await Contribution.findById(id).session(session);
      if (!current) throw ApiError.notFound(NOT_FOUND);

      if (current.status === "REJECTED") {
        return { alreadyResolved: true };
      }

      if (current.status === "APPROVED") {
        throw new ApiError(
          "INVALID_STATE_TRANSITION",
          "This contribution has already been approved.",
        );
      }

      await Contribution.findByIdAndUpdate(
        id,
        {
          status: "REJECTED",
          review: {
            reviewedBy: ctx.user._id,
            reviewedAt: new Date(),
            note: storedNote,
          },
        },
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "CONTRIBUTION_REJECTED",
            targetType: "CONTRIBUTION",
            targetId: current._id,
            metadata: {
              reason,
              note: note ?? null,
              submittedBy: String(current.submittedBy),
            },
          },
        ],
        { session },
      );

      return { alreadyResolved: false };
    });

    return NextResponse.json(await resolve(id, result.alreadyResolved));
  } catch (err) {
    return toErrorResponse(err);
  }
}
