import { NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Reward, Redemption } from "@/models/rewards";

export async function GET() {
  try {
    const ctx = await requireAuthContext();
    await connect();

    const [rewards, redeemedRewards] = await Promise.all([
      Reward.find({ status: "ACTIVE" })
        .sort({ pointRequirement: 1, createdAt: -1 })
        .lean(),
      Redemption.find({ userId: ctx.user._id }, { rewardId: 1 })
        .lean(),
    ]);

    const redeemed = new Set(
      redeemedRewards.map((entry) => String(entry.rewardId)),
    );

    const items = rewards.map((reward) => ({
      id: String(reward._id),
      title: reward.title,
      description: reward.description,
      pointCost: reward.pointRequirement,
      imageUrl: reward.imageUrl ?? null,
      businessName: reward.businessName,
      category: reward.category,
      affordable: ctx.user.pointsBalance >= reward.pointRequirement,
      redeemed: redeemed.has(String(reward._id)),
    }));

    return NextResponse.json({
      items,
      meta: {
        pointsBalance: ctx.user.pointsBalance,
        count: items.length,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
