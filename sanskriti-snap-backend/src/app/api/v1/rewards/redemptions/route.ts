import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Redemption } from "@/models/rewards";

export async function GET() {
  try {
    const ctx = await requireAuthContext();
    await connect();

    const docs = await Redemption.find({ userId: ctx.user._id })
      .sort({ redeemedAt: -1, createdAt: -1 })
      .lean();

    const items = docs.map((doc) => ({
      id: String(doc._id),
      rewardId: String(doc.rewardId),
      rewardTitle: doc.rewardTitle,
      businessName: doc.businessName,
      pointsSpent: doc.pointsSpent,
      status: doc.status,
      code: doc.code ?? null,
      redeemedAt: doc.redeemedAt.toISOString(),
    }));

    return NextResponse.json({ items });
  } catch (err) {
    return toErrorResponse(err);
  }
}
