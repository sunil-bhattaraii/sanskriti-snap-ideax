/**
 * docs/API Contract.md 9 — Update a single artifact.
 *
 * ADMIN only. The update and its `adminActions` audit row commit together, so a
 * change can never be recorded without leaving a trace (docs/DB Schemas.md 18).
 *
 * A name change re-derives the slug unless the caller supplied one explicitly:
 * a stale slug silently 404s every deep link the app has already shared.
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { slugify } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { UpdateArtifactRequest } from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction } from "@/models/community";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * The scalar fields copied straight through when present. Listing them keeps
 * `latitude`/`longitude` out of the spread (they become one nested `location`)
 * and stops a future field from silently riding along untyped.
 */
const COPYABLE_FIELDS = [
  "description",
  "category",
  "rarity",
  "tags",
  "humanReadableLocation",
  "story",
  "storyUnlockRadiusMeters",
  "verificationRadiusMeters",
  "xpReward",
  "requiresSnap",
  "requiresCV",
  "warnings",
  "status",
] as const;

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireAdmin();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Artifact not found.");
    }

    await connect();

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      throw ApiError.notFound("Artifact not found.");
    }

    const body = await readJsonBody(request);
    const parsed = UpdateArtifactRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid artifact update.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { latitude, longitude, ...rest } = parsed.data;
    const update: Record<string, unknown> = { updatedBy: ctx.user._id };
    const changedFields: string[] = [];

    if (rest.name !== undefined) {
      update.name = rest.name;
      changedFields.push("name");
      if (rest.slug === undefined) {
        update.slug = slugify(rest.name);
        changedFields.push("slug");
      }
    }

    if (rest.slug !== undefined) {
      update.slug = rest.slug;
      changedFields.push("slug");
    }

    const writable = rest as Record<string, unknown>;
    for (const field of COPYABLE_FIELDS) {
      if (writable[field] !== undefined) {
        update[field] = writable[field];
        changedFields.push(field);
      }
    }

    if (latitude !== undefined || longitude !== undefined) {
      // Partial coordinate updates keep the other axis from the stored point.
      update.location = {
        type: "Point",
        coordinates: [
          longitude ?? artifact.location.coordinates[0],
          latitude ?? artifact.location.coordinates[1],
        ],
      };
      changedFields.push("location");
    }

    const updated = await withTransaction(async (session) => {
      const next = await Artifact.findByIdAndUpdate(id, update, {
        new: true,
        session,
      });

      if (!next) throw ApiError.notFound("Artifact not found.");

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "ARTIFACT_UPDATED",
            targetType: "ARTIFACT",
            targetId: next._id,
            metadata: { fields: changedFields },
          },
        ],
        { session },
      );

      return next;
    });

    return NextResponse.json({
      id: String(updated._id),
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      updatedAt: new Date(updated.updatedAt).toISOString(),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
