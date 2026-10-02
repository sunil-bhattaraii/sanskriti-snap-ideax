/**
 * docs/API Contract.md 6.2 — Submit verification attempt.
 * docs/API Contract.md 6 — List own verification attempts.
 */

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireAuthContext } from "@/lib/auth";
import {
  CreateVerificationAttemptRequest,
  PaginationQuery,
} from "@/lib/contracts";
import { toVerificationAttempt } from "@/lib/dto";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { processVerificationAttempt } from "@/lib/verification";
import { Artifact } from "@/models/artifact";
import {
  IdempotencyKey,
  VerificationAttempt,
} from "@/models/verification";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const { user } = await requireAuthContext();

    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      throw ApiError.validation("Idempotency-Key header is required.");
    }
    if (!UUID_RE.test(idempotencyKey)) {
      throw ApiError.validation(
        "Idempotency-Key header must be a valid UUID v4.",
      );
    }

    // Check cached idempotent response (docs/API Contract.md 2.7)
    const cached = await IdempotencyKey.findOne({
      key: idempotencyKey,
      userId: user._id,
    }).lean();

    if (cached) {
      return NextResponse.json(cached.responseBody, {
        status: cached.statusCode,
      });
    }

    const body = CreateVerificationAttemptRequest.parse(
      await readJsonBody(request),
    );

    const result = await processVerificationAttempt(user._id, body);

    // Cache successful response for replay on client network retries
    await IdempotencyKey.create({
      key: idempotencyKey,
      userId: user._id,
      statusCode: 201,
      responseBody: result,
    }).catch((err) => {
      // Ignore duplicate key if concurrent request already saved it
      console.warn("[idempotency] failed to cache key:", err);
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthContext();

    const url = request.nextUrl;
    const { limit, cursor } = PaginationQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    const filter: Record<string, unknown> = { userId: user._id };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const attempts = await VerificationAttempt.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = attempts.length > limit;
    const pageItems = hasMore ? attempts.slice(0, limit) : attempts;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    const artifactIds = pageItems.map((a) => a.artifactId);
    const artifacts = await Artifact.find({ _id: { $in: artifactIds } }).lean();
    const artifactMap = new Map(artifacts.map((a) => [String(a._id), a]));

    const items = pageItems.map((a) =>
      toVerificationAttempt(
        a,
        artifactMap.get(String(a.artifactId)) ?? {
          _id: a.artifactId,
          name: "Unknown Artifact",
          humanReadableLocation: "",
          xpReward: 0,
        },
      ),
    );

    return NextResponse.json({
      items,
      page: { nextCursor, hasMore },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
