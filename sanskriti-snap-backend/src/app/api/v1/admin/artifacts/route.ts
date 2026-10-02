/**
 * docs/API Contract.md 9 — Admin artifact management.
 *
 * GET:  list artifacts for the admin table (any status, cursor-paginated).
 * POST: create a new artifact, defaulting to DRAFT.
 *
 * Both require ADMIN. The single-artifact routes live under `[id]/`.
 *
 * Every mutation writes an `adminActions` document in the same transaction as
 * the change it records, so the audit trail cannot disagree with the data
 * (docs/API Contract.md 9, docs/DB Schemas.md 18).
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { slugify } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import {
  ArtifactStatus,
  CreateArtifactRequest,
  PaginationQuery,
} from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction } from "@/models/community";

const StatusQuery = PaginationQuery.extend({
  status: ArtifactStatus.optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connect();

    const url = request.nextUrl;
    const { limit, cursor, status } = StatusQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const artifacts = await Artifact.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = artifacts.length > limit;
    const pageItems = hasMore ? artifacts.slice(0, limit) : artifacts;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    const items = pageItems.map((artifact) => ({
      id: String(artifact._id),
      name: artifact.name,
      slug: artifact.slug,
      status: artifact.status,
      category: artifact.category,
      humanReadableLocation: artifact.humanReadableLocation,
      // GeoJSON is [longitude, latitude] — reversed at the API boundary so the
      // stored order never reaches a client (AGENTS.md).
      latitude: artifact.location.coordinates[1],
      longitude: artifact.location.coordinates[0],
      createdAt: new Date(artifact.createdAt).toISOString(),
      discoveryCount: artifact.discoveryCount,
    }));

    return NextResponse.json({
      items,
      page: { nextCursor, hasMore },
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
    const parsed = CreateArtifactRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid artifact data.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { latitude, longitude, ...rest } = parsed.data;
    const slug = rest.slug ?? slugify(rest.name);

    const artifact = await withTransaction(async (session) => {
      const [created] = await Artifact.create(
        [
          {
            ...rest,
            slug,
            location: { type: "Point", coordinates: [longitude, latitude] },
            createdBy: ctx.user._id,
            updatedBy: ctx.user._id,
            status: rest.status ?? "DRAFT",
            discoveryCount: 0,
          },
        ],
        { session },
      );

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "ARTIFACT_CREATED",
            targetType: "ARTIFACT",
            targetId: created._id,
            metadata: {
              name: created.name,
              slug: created.slug,
              status: created.status,
            },
          },
        ],
        { session },
      );

      return created;
    });

    return NextResponse.json(
      {
        id: String(artifact._id),
        name: artifact.name,
        slug: artifact.slug,
        status: artifact.status,
        createdAt: artifact.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
