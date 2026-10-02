/**
 * docs/API Contract.md 9 — hide a community snap.
 *
 * POST: transition a snap's status to HIDDEN. ADMIN only.
 *
 * Idempotent by state: if the snap is already HIDDEN, returns the current state
 * with `alreadyResolved: true` and writes no duplicate audit row.
 *
 * REMOVED snaps are treated as not found: a snap that has already been fully
 * removed is gone and cannot be re-hidden.
 *
 * Every mutation writes an `adminActions` row in the same transaction
 * (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { HideCommunitySnapRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction, CommunitySnap } from "@/models/community";

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = "Community snap not found.";

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = HideCommunitySnapRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid hide request.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { reason } = parsed.data;

    const result = await withTransaction(async (session) => {
      const snap = await CommunitySnap.findById(id).session(session);

      if (!snap || snap.status === "REMOVED") {
        throw ApiError.notFound(NOT_FOUND);
      }

      // Idempotent by state.
      if (snap.status === "HIDDEN") {
        return { alreadyResolved: true, snapId: snap._id };
      }

      await CommunitySnap.findByIdAndUpdate(
        id,
        { status: "HIDDEN" },
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "COMMUNITY_CONTENT_HIDDEN",
            targetType: "COMMUNITY_SNAP",
            targetId: snap._id,
            metadata: {
              reason,
              previousStatus: snap.status,
              userId: String(snap.userId),
            },
          },
        ],
        { session },
      );

      return { alreadyResolved: false, snapId: snap._id };
    });

    return NextResponse.json({
      id: String(result.snapId),
      status: "HIDDEN",
      alreadyResolved: result.alreadyResolved,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
