/**
 * docs/API Contract.md 9 — admin quest update.
 *
 * PATCH: partial update of an existing quest. ADMIN only.
 *
 * An empty patch is rejected rather than silently writing a no-op `adminActions`
 * row. `artifactIds`, when present, are re-validated against the artifact
 * collection inside the transaction so a deleted artifact cannot end up listed
 * on an active quest.
 *
 * Every mutation writes an `adminActions` document in the same transaction as
 * the change it records (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { UpdateQuestRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction } from "@/models/community";
import { Quest } from "@/models/gamification";

type RouteParams = { params: Promise<{ id: string }> };

const NOT_FOUND = "Quest not found.";

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = UpdateQuestRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid quest update.", {
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

    const quest = await withTransaction(async (session) => {
      const current = await Quest.findById(id).session(session);
      if (!current) throw ApiError.notFound(NOT_FOUND);

      // Validate any new artifactIds inside the transaction so a concurrent
      // delete cannot slip between check and write.
      if (update.artifactIds) {
        const found = await Artifact.countDocuments({
          _id: { $in: update.artifactIds },
        }).session(session);

        if (found !== update.artifactIds.length) {
          throw ApiError.validation("One or more artifacts do not exist.", {
            fields: { artifactIds: "No such artifact." },
          });
        }
      }

      const updated = await Quest.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, session },
      );

      if (!updated) throw ApiError.notFound(NOT_FOUND);

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "QUEST_UPDATED",
            targetType: "QUEST",
            targetId: current._id,
            metadata: { fields: Object.keys(update) },
          },
        ],
        { session },
      );

      return updated;
    });

    return NextResponse.json({
      id: String(quest._id),
      name: quest.name,
      description: quest.description,
      artifactIds: quest.artifactIds.map(String),
      xpReward: quest.xpReward,
      badgeId: quest.badgeId ? String(quest.badgeId) : null,
      status: quest.status,
      createdAt: quest.createdAt.toISOString(),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
