import { type NextRequest, NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { PointsTransaction } from "@/models/gamification";
import { Reward, Redemption } from "@/models/rewards";
import { User } from "@/models/user";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuthContext();
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw ApiError.validation("Missing required Idempotency-Key header.");
    }

    const { id } = await context.params;
    await connect();

    const reward = await Reward.findOne({ _id: id, status: "ACTIVE" }).lean();
    if (!reward) {
      throw ApiError.notFound("Reward not found.");
    }

    const existingRedemption = await Redemption.findOne({
      userId: ctx.user._id,
      rewardId: reward._id,
    }).lean();

    if (existingRedemption) {
      throw new ApiError(
        "REWARD_ALREADY_REDEEMED",
        "You have already redeemed this reward.",
      );
    }

    const user = await User.findById(ctx.user._id).lean();
    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    if (user.pointsBalance < reward.pointRequirement) {
      throw ApiError.validation("You do not have enough points to redeem this reward.", {
        pointsBalance: user.pointsBalance,
        pointCost: reward.pointRequirement,
      });
    }

    const nextBalance = user.pointsBalance - reward.pointRequirement;

    const result = await withTransaction(async (session) => {
      const updatedUser = await User.findByIdAndUpdate(
        ctx.user._id,
        { $set: { pointsBalance: nextBalance } },
        { session, new: true },
      );

      const [pointsTx] = await PointsTransaction.create(
        [
          {
            userId: ctx.user._id,
            type: "SPENT",
            amount: reward.pointRequirement,
            balanceAfter: nextBalance,
            reason: "REWARD_REDEMPTION",
            referenceId: reward._id,
            note: `Reward redemption: ${reward.title}`,
            createdBy: ctx.user._id,
          },
        ],
        { session },
      );

      const [redemption] = await Redemption.create(
        [
          {
            userId: ctx.user._id,
            rewardId: reward._id,
            rewardTitle: reward.title,
            businessName: reward.businessName,
            pointsSpent: reward.pointRequirement,
            status: "CONFIRMED",
            code: `REWARD-${reward._id.toString().slice(-8)}-${Date.now()}`,
            redeemedAt: new Date(),
          },
        ],
        { session },
      );

      return { updatedUser, pointsTx, redemption };
    });

    return NextResponse.json(
      {
        id: String(result.redemption._id),
        rewardId: String(reward._id),
        rewardTitle: reward.title,
        businessName: reward.businessName,
        pointsSpent: reward.pointRequirement,
        status: result.redemption.status,
        code: result.redemption.code ?? null,
        redeemedAt: result.redemption.redeemedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
