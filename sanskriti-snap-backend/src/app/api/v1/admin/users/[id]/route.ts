import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { UpdateUserRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { User } from "@/models/user";
import { AdminAction } from "@/models/community";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    await connect();

    const { id: userId } = await params;
    if (!Types.ObjectId.isValid(userId)) {
      throw ApiError.validation("Invalid user ID.");
    }

    const body = await readJsonBody(request);
    const parsed = UpdateUserRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid user data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const updatedUser = await withTransaction(async (session) => {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw ApiError.notFound("User not found.");
      }

      if (parsed.data.displayName) {
        user.displayName = parsed.data.displayName;
      }
      if (parsed.data.role) {
        user.role = parsed.data.role;
      }
      await user.save({ session });

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "USER_UPDATED",
            targetType: "USER",
            targetId: user._id,
            metadata: {
              username: user.username,
              displayName: user.displayName,
              role: user.role,
            },
          },
        ],
        { session },
      );

      return user;
    });

    return NextResponse.json({
      id: String(updatedUser._id),
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      role: updatedUser.role,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
