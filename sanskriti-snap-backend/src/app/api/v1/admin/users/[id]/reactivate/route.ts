import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { AdminAction } from "@/models/community";
import { User } from "@/models/user";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("User not found.");
    }

    await connect();
    const result = await withTransaction(async (session) => {
      const user = await User.findById(id).session(session);
      if (!user || user.accountStatus === "DELETED") {
        throw ApiError.notFound("User not found.");
      }
      if (user.accountStatus === "ACTIVE") {
        return { user, alreadyResolved: true };
      }

      user.accountStatus = "ACTIVE";
      await user.save({ session });
      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "USER_REACTIVATED",
            targetType: "USER",
            targetId: user._id,
            metadata: { previousStatus: "SUSPENDED" },
          },
        ],
        { session },
      );
      return { user, alreadyResolved: false };
    });

    return NextResponse.json({
      id: String(result.user._id),
      username: result.user.username,
      accountStatus: "ACTIVE",
      alreadyResolved: result.alreadyResolved,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
