/**
 * docs/API Contract.md 9 — admin XP adjustment.
 *
 * POST: apply a signed XP delta to a user and append the ledger entry. ADMIN only.
 *
 * This is the **only** route permitted to create a negative `xpTransactions`
 * entry (docs/API Contract.md 9). `amount` must be non-zero; the sign carries
 * the direction. The route does **not** touch `pointsBalance` — XP and points
 * are separate currencies and must not be conflated (docs/DB Schemas.md 21a,
 * AGENTS.md §XP and points are different currencies).
 *
 * `lifetimeXp` cannot go below 0: a correction that would push it negative is
 * clamped. This protects the `min: 0` constraint on the model without 500ing on
 * a legitimate negative adjustment against a low-XP account.
 *
 * The ledger append and the user-document update commit in one transaction so the
 * cache (`lifetimeXp`) cannot disagree with the ledger (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { XpAdjustmentRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction } from "@/models/community";
import { XpTransaction } from "@/models/gamification";
import { User } from "@/models/user";

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    await connect();

    const body = await readJsonBody(request);
    const parsed = XpAdjustmentRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid XP adjustment.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { userId, amount, reason, referenceId } = parsed.data;

    const result = await withTransaction(async (session) => {
      const user = await User.findById(userId).session(session);

      if (!user || user.accountStatus === "DELETED") {
        throw ApiError.notFound("User not found.");
      }

      // Clamp: lifetimeXp may not go below 0.
      const newXp = Math.max(0, user.lifetimeXp + amount);
      const appliedAmount = newXp - user.lifetimeXp; // 0 when already at floor

      await User.findByIdAndUpdate(
        userId,
        { lifetimeXp: newXp },
        { session },
      );

      const [txn] = await XpTransaction.create(
        [
          {
            userId: user._id,
            amount: appliedAmount,
            type: "ADMIN_ADJUSTMENT",
            referenceType: "ADMIN",
            referenceId: referenceId ?? null,
            reason,
            createdBy: ctx.user._id,
          },
        ],
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "ADMIN_ADJUSTMENT",
            targetType: "USER",
            targetId: user._id,
            metadata: {
              requestedAmount: amount,
              appliedAmount,
              reason,
              referenceId: referenceId ?? null,
              lifetimeXpBefore: user.lifetimeXp,
              lifetimeXpAfter: newXp,
            },
          },
        ],
        { session },
      );

      return { newXp, txn };
    });

    return NextResponse.json(
      {
        lifetimeXp: result.newXp,
        transaction: {
          id: String(result.txn._id),
          amount: result.txn.amount,
          reason: result.txn.reason,
          createdAt: result.txn.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
