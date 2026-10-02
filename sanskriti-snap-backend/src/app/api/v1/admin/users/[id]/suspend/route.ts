/**
 * docs/API Contract.md 9 — suspend a user account.
 *
 * POST: set accountStatus to SUSPENDED. ADMIN only.
 *
 * Idempotent by state: if the account is already SUSPENDED, returns the current
 * state with `alreadyResolved: true` rather than writing a duplicate audit row.
 *
 * `suspendedUntil` is not stored on the `users` document — the schema has no
 * field for it. It is preserved in the `adminActions` metadata so the intent is
 * auditable; lifting a suspension is a separate admin action.
 *
 * A DELETED account is treated as not found rather than suspended: the deletion
 * is permanent and suspending something already deleted has no effect.
 *
 * Every mutation writes an `adminActions` row in the same transaction
 * (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { SuspendUserRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction } from "@/models/community";
import { User } from "@/models/user";

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = "User not found.";

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;

    // Admins cannot suspend themselves — that would lock the only admin out.
    if (id === String(ctx.user._id)) {
      throw ApiError.forbidden();
    }

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = SuspendUserRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid suspension request.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { reason, suspendedUntil } = parsed.data;

    const result = await withTransaction(async (session) => {
      const user = await User.findById(id).session(session);

      // DELETED is treated as not found (docs/API Contract.md 2.3).
      if (!user || user.accountStatus === "DELETED") {
        throw ApiError.notFound(NOT_FOUND);
      }

      // Idempotent by state.
      if (user.accountStatus === "SUSPENDED") {
        return { alreadyResolved: true, user };
      }

      await User.findByIdAndUpdate(
        id,
        { accountStatus: "SUSPENDED" },
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "USER_SUSPENDED",
            targetType: "USER",
            targetId: user._id,
            metadata: {
              reason,
              suspendedUntil: suspendedUntil ?? null,
              previousStatus: user.accountStatus,
            },
          },
        ],
        { session },
      );

      return { alreadyResolved: false, user };
    });

    return NextResponse.json({
      id: String(result.user._id),
      username: result.user.username,
      accountStatus: "SUSPENDED",
      alreadyResolved: result.alreadyResolved,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
