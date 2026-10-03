/**
 * docs/API Contract.md 9 — admin quest management.
 *
 * POST: create a quest. ADMIN only: quests are content, and EXPERT is scoped to
 * contribution review (docs/API Contract.md 15).
 *
 * The quest and its `adminActions` row commit in one transaction, so the audit
 * trail cannot describe a quest that rolled back (docs/DB Schemas.md 18).
 *
 * `artifactIds` are checked to exist before the quest is written: a quest that
 * lists an artifact nobody can discover is uncompletable, and the client has no
 * way to tell that from a quest that is merely hard.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { CreateQuestRequest, PaginationQuery } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { parseQuery, readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction } from "@/models/community";
import { Quest } from "@/models/gamification";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connect();

    const { limit, cursor } = parseQuery(PaginationQuery, {
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
    });
    const filter = cursor && Types.ObjectId.isValid(cursor)
      ? { _id: { $lt: new Types.ObjectId(cursor) } }
      : {};
    const quests = await Quest.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = quests.length > limit;
    const items = (hasMore ? quests.slice(0, limit) : quests).map((quest) => ({
      id: String(quest._id),
      name: quest.name,
      description: quest.description,
      artifactIds: quest.artifactIds.map(String),
      xpReward: quest.xpReward,
      badgeId: quest.badgeId ? String(quest.badgeId) : null,
      status: quest.status,
      createdAt: new Date(quest.createdAt).toISOString(),
    }));

    return NextResponse.json({
      items,
      page: {
        nextCursor: hasMore ? String(quests[limit - 1]._id) : null,
        hasMore,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdmin();
    await connect();

    const body = await readJsonBody(request);
    const parsed = CreateQuestRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid quest data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { artifactIds, ...rest } = parsed.data;

    const quest = await withTransaction(async (session) => {
      // Inside the transaction: an artifact deleted between this check and the
      // write would otherwise be listed by a quest nobody can complete.
      const found = await Artifact.countDocuments({
        _id: { $in: artifactIds },
      }).session(session);

      if (found !== artifactIds.length) {
        throw ApiError.validation("One or more artifacts do not exist.", {
          fields: { artifactIds: "No such artifact." },
        });
      }

      const [created] = await Quest.create(
        [{ ...rest, artifactIds, status: "ACTIVE" }],
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "QUEST_CREATED",
            targetType: "QUEST",
            targetId: created._id,
            metadata: {
              name: created.name,
              artifactCount: artifactIds.length,
              xpReward: created.xpReward,
            },
          },
        ],
        { session },
      );

      return created;
    });

    return NextResponse.json(
      {
        id: String(quest._id),
        name: quest.name,
        description: quest.description,
        artifactIds: quest.artifactIds.map(String),
        xpReward: quest.xpReward,
        badgeId: quest.badgeId ? String(quest.badgeId) : null,
        status: quest.status,
        createdAt: quest.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
