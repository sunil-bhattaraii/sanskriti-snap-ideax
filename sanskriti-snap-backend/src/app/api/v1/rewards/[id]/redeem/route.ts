/**
 * docs/API Contract.md 8 — Redeem a reward for points.
 *
 * Two correctness properties this route must hold, both of which the previous
 * implementation violated:
 *
 * 1. The balance check and the decrement are ONE atomic operation. Reading
 *    `pointsBalance` and then writing `balance - cost` lets two concurrent
 *    redemptions of different rewards both pass the check against the same
 *    starting balance and overspend the account.
 * 2. A repeated request with the same Idempotency-Key replays the stored
 *    response instead of charging twice (docs/API Contract.md 2.7). The stored
 *    response is written inside the same transaction as the charge, so a replay
 *    can never reference a redemption that rolled back.
 */

import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { PointsTransaction } from "@/models/gamification";
import { Reward, Redemption } from "@/models/rewards";
import { User } from "@/models/user";
import { IdempotencyKey } from "@/models/verification";

type RedemptionBody = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  businessName: string;
  pointsSpent: number;
  status: string;
  code: string | null;
  redeemedAt: string;
};

/** True when `err` is a duplicate-key error on the idempotency-key index. */
function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

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
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Reward not found.");
    }

    await connect();

    // Fast path: an identical request already completed and was stored.
    const cached = await IdempotencyKey.findOne({
      key: idempotencyKey,
      userId: ctx.user._id,
    }).lean();
    if (cached) {
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode,
      });
    }

    const reward = await Reward.findOne({ _id: id, status: "ACTIVE" }).lean();
    if (!reward) {
      throw ApiError.notFound("Reward not found.");
    }

    // Cheap pre-check for the common case. The unique index on
    // (userId, rewardId) is the real guarantee — two concurrent requests both
    // pass this check, and the loser surfaces as a duplicate-key error.
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

    let responseBody: RedemptionBody;
    try {
      responseBody = await withTransaction(async (session) => {
        // Atomic guard: `$gte` and `$inc` are evaluated together on the server,
        // so two concurrent redemptions cannot both see the same balance. The
        // loser matches no document instead of driving the balance negative.
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: ctx.user._id,
            pointsBalance: { $gte: reward.pointRequirement },
          },
          { $inc: { pointsBalance: -reward.pointRequirement } },
          { session, new: true },
        );

        if (!updatedUser) {
          const current = await User.findById(ctx.user._id)
            .select("pointsBalance")
            .lean();
          if (!current) {
            throw ApiError.notFound("User not found.");
          }
          throw ApiError.validation(
            "You do not have enough points to redeem this reward.",
            {
              pointsBalance: current.pointsBalance,
              pointCost: reward.pointRequirement,
            },
          );
        }

        const balanceAfter = updatedUser.pointsBalance;

        await PointsTransaction.create(
          [
            {
              userId: ctx.user._id,
              type: "SPENT",
              amount: reward.pointRequirement,
              balanceAfter,
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

        const body: RedemptionBody = {
          id: String(redemption._id),
          rewardId: String(reward._id),
          rewardTitle: reward.title,
          businessName: reward.businessName,
          pointsSpent: reward.pointRequirement,
          status: redemption.status,
          code: redemption.code ?? null,
          redeemedAt: redemption.redeemedAt.toISOString(),
        };

        // Inside the transaction, deliberately: the key and the charge commit
        // or roll back together, so a replayed response always describes a
        // redemption that actually happened.
        await IdempotencyKey.create(
          [
            {
              key: idempotencyKey,
              userId: ctx.user._id,
              statusCode: 201,
              responseBody: body,
            },
          ],
          { session },
        );

        return body;
      });
    } catch (err) {
      // A concurrent request with the SAME key won the insert. Its charge is
      // committed (or committing), so replay its stored response rather than
      // charging again or reporting a spurious conflict.
      if (isDuplicateKeyError(err)) {
        const stored = await IdempotencyKey.findOne({
          key: idempotencyKey,
          userId: ctx.user._id,
        }).lean();
        if (stored) {
          return NextResponse.json(stored.responseBody, {
            status: stored.statusCode,
          });
        }
      }
      throw err;
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
