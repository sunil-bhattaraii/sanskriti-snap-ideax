import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { User } from "@/models/user";

export async function GET() {
  try {
    const ctx = await requireAuthContext();
    await connect();

    const user = await User.findById(ctx.user._id).lean();

    return NextResponse.json({
      items: [],
      meta: {
        enabled: Boolean(user?.notifications?.enabled),
        radiusMeters: user?.notifications?.radiusMeters ?? 1000,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
