/**
 * docs/API Contract.md 9 — admin badge update.
 *
 * PATCH: partial update of an existing badge. ADMIN only.
 *
 * An empty patch is rejected. `condition.questId`, when present, is validated
 * inside the transaction so the condition never references a missing quest.
 *
 * Every mutation writes an `adminActions` row in the same transaction
 * (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { UpdateBadgeRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { AdminAction } from "@/models/community";
import { Badge, Quest } from "@/models/gamification";

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = "Badge not found.";

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = UpdateBadgeRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid badge update.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const update = parsed.data;

    if (Object.keys(update).length === 0) {
      throw ApiError.validation("No fields to update.", {});
    }

    const badge = await withTransaction(async (session) => {
      const current = await Badge.findById(id).session(session);
      if (!current) throw ApiError.notFound(NOT_FOUND);

      if (update.condition?.questId) {
        const questExists = await Quest.exists({
          _id: update.condition.questId,
        }).session(session);
        if (!questExists) {
          throw ApiError.validation("That quest does not exist.", {
            fields: { "condition.questId": "No such quest." },
          });
        }
      }

      const updated = await Badge.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, session },
      );

      if (!updated) throw ApiError.notFound(NOT_FOUND);

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "BADGE_UPDATED",
            targetType: "BADGE",
            targetId: current._id,
            metadata: { fields: Object.keys(update) },
          },
        ],
        { session },
      );

      return updated;
    });

    return NextResponse.json({
      id: String(badge._id),
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl ?? null,
      condition: badge.condition,
      status: badge.status,
      createdAt: badge.createdAt.toISOString(),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
