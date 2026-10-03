/**
 * docs/API Contract.md 9 — admin badge creation.
 *
 * POST: create a badge. ADMIN only.
 *
 * The badge and its `adminActions` row commit in one transaction (docs/DB
 * Schemas.md 18). `condition.questId`, when present, is validated inside the
 * transaction so a deleted quest cannot be set as the unlock condition.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { CreateBadgeRequest, PaginationQuery } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { parseQuery, readJsonBody } from "@/lib/http";
import { AdminAction } from "@/models/community";
import { Badge, Quest } from "@/models/gamification";

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
    const badges = await Badge.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = badges.length > limit;
    const items = (hasMore ? badges.slice(0, limit) : badges).map((badge) => ({
      id: String(badge._id),
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl ?? null,
      condition: {
        type: badge.condition.type,
        value: badge.condition.value ?? null,
        questId: badge.condition.questId
          ? String(badge.condition.questId)
          : null,
        category: badge.condition.category ?? null,
      },
      status: badge.status,
      createdAt: new Date(badge.createdAt).toISOString(),
    }));

    return NextResponse.json({
      items,
      page: {
        nextCursor: hasMore ? String(badges[limit - 1]._id) : null,
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
    const parsed = CreateBadgeRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid badge data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { condition, ...rest } = parsed.data;

    const badge = await withTransaction(async (session) => {
      // Validate the quest condition reference inside the transaction.
      if (condition.questId) {
        const questExists = await Quest.exists({ _id: condition.questId }).session(
          session,
        );
        if (!questExists) {
          throw ApiError.validation("That quest does not exist.", {
            fields: { "condition.questId": "No such quest." },
          });
        }
      }

      const [created] = await Badge.create(
        [{ ...rest, condition, status: "ACTIVE" }],
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "BADGE_CREATED",
            targetType: "BADGE",
            targetId: created._id,
            metadata: {
              name: created.name,
              conditionType: condition.type,
            },
          },
        ],
        { session },
      );

      return created;
    });

    return NextResponse.json(
      {
        id: String(badge._id),
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl ?? null,
        condition: badge.condition,
        status: badge.status,
        createdAt: badge.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
