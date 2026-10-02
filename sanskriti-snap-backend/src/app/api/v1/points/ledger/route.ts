import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { PointsTransaction } from "@/models/gamification";

function parseLimit(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? String(fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function encodeCursor(doc: { _id: Types.ObjectId; createdAt: Date }): string {
  return Buffer.from(
    JSON.stringify({
      id: String(doc._id),
      createdAt: doc.createdAt.toISOString(),
    }),
  ).toString("base64");
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf8"),
    ) as { id?: string; createdAt?: string };

    if (!decoded.id || !decoded.createdAt) return null;
    const createdAt = new Date(decoded.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;

    return { id: decoded.id, createdAt };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"), 20, 100);
    const cursor = searchParams.get("cursor");

    const filter: Record<string, unknown> = { userId: ctx.user._id };
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (!decoded) {
        throw ApiError.validation("Invalid pagination cursor.");
      }

      filter.$or = [
        { createdAt: { $lt: decoded.createdAt } },
        {
          createdAt: decoded.createdAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const docs = await PointsTransaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const items = docs.slice(0, limit).map((doc) => ({
      id: String(doc._id),
      type: doc.type,
      amount: doc.amount,
      balanceAfter: doc.balanceAfter,
      reason: doc.reason,
      note: doc.note ?? null,
      createdAt: doc.createdAt.toISOString(),
    }));

    const nextCursor = hasMore ? encodeCursor(docs[limit]) : null;

    return NextResponse.json({
      items,
      page: {
        nextCursor,
        hasMore,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
