/**
 * docs/API Contract.md 9 — approve a contribution.
 *
 * EXPERT or ADMIN: contribution review is the one admin surface an EXPERT may
 * touch (docs/API Contract.md 15).
 *
 * The contract allows two ways to approve, and exactly one must be present:
 *
 *  - `artifactId` links the proposal to an artifact that already exists.
 *  - `artifact` mints a new artifact from the proposal, at status DRAFT unless
 *    the body says otherwise, so nothing minted from a community submission is
 *    published without a second look.
 *
 * Neither is `422 INVALID_CONTRIBUTION_TARGET` rather than a field error: the
 * body is well-formed, it simply does not say what to approve into. That is why
 * the request schema lets both fields be absent and the check lives here.
 *
 * The decision, the artifact it points at, and the `adminActions` row commit in
 * one transaction, so a contribution can never be APPROVED into an artifact
 * that rolled back (docs/DB Schemas.md 18).
 */

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { loadAdminContribution, slugify } from "@/lib/admin";
import { requireReviewer } from "@/lib/auth";
import {
  ContributionDecisionRequest,
  type AdminContributionResolution,
} from "@/lib/contracts";
import { connect, withTransaction } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { Artifact } from "@/models/artifact";
import { AdminAction, Contribution } from "@/models/community";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const NOT_FOUND = "Contribution not found.";

/**
 * Re-reads the row after the transaction so the response is the committed
 * state, not the instance the callback happened to hold — and so the idempotent
 * early return and the fresh decision return the identical shape.
 */
async function resolve(
  id: string,
  alreadyResolved: boolean,
): Promise<AdminContributionResolution> {
  const row = await loadAdminContribution(id);
  if (!row) throw ApiError.notFound(NOT_FOUND);
  return { ...row, alreadyResolved };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ctx = await requireReviewer();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.notFound(NOT_FOUND);
    }

    await connect();

    const body = await readJsonBody(request);
    const parsed = ContributionDecisionRequest.safeParse(body);

    if (!parsed.success) {
      throw ApiError.validation("Invalid contribution decision.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(
            ([key, value]) => [key, value?.[0] ?? "Invalid value"],
          ),
        ),
      });
    }

    const { artifactId, artifact: artifactDraft, note } = parsed.data;

    // The contract's specific error, not a field error — see the header.
    if (!artifactId && !artifactDraft) {
      throw new ApiError(
        "INVALID_CONTRIBUTION_TARGET",
        "A contribution cannot be approved into nothing.",
      );
    }

    const result = await withTransaction(async (session) => {
      // Re-read inside the callback: the driver may run this more than once, and
      // the second run must see committed state rather than the snapshot the
      // route read before opening the transaction.
      const current = await Contribution.findById(id).session(session);
      if (!current) throw ApiError.notFound(NOT_FOUND);

      // Idempotent by state, like the verification routes: a retry of an
      // approval returns what the first call left and mints nothing.
      if (current.status === "APPROVED") {
        return { alreadyResolved: true };
      }

      if (current.status === "REJECTED") {
        throw new ApiError(
          "INVALID_STATE_TRANSITION",
          "This contribution has already been rejected.",
        );
      }

      let targetArtifactId: Types.ObjectId;

      if (artifactId) {
        // Linking to a missing artifact would leave the contribution pointing at
        // nothing, which is exactly the state INVALID_CONTRIBUTION_TARGET
        // exists to prevent. The check is inside the transaction so a delete
        // racing this approval cannot slip between check and write.
        const linked = await Artifact.findById(artifactId)
          .select("_id")
          .session(session)
          .lean();
        if (!linked) {
          throw ApiError.validation("That artifact does not exist.", {
            fields: { artifactId: "No such artifact." },
          });
        }
        targetArtifactId = linked._id as Types.ObjectId;
      } else {
        const draft = artifactDraft!;
        const { latitude, longitude, ...rest } = draft;

        // `story` is required on the model but optional on the request, and a
        // contribution always carries cultural significance. Falling back to it
        // is better than writing an empty story or 500ing on a schema the
        // caller could not have satisfied.
        const story = rest.story ?? current.culturalSignificance;

        const [created] = await Artifact.create(
          [
            {
              ...rest,
              story,
              slug: rest.slug ?? slugify(rest.name),
              location: { type: "Point", coordinates: [longitude, latitude] },
              createdBy: ctx.user._id,
              updatedBy: ctx.user._id,
              status: rest.status ?? "DRAFT",
              discoveryCount: 0,
            },
          ],
          { session },
        );

        targetArtifactId = created._id as Types.ObjectId;
      }

      current.status = "APPROVED";
      current.officialArtifactId = targetArtifactId;
      current.review = {
        reviewedBy: ctx.user._id,
        reviewedAt: new Date(),
        note: note ?? null,
      };
      await current.save({ session });

      await AdminAction.create(
        [
          {
            adminId: ctx.user._id,
            action: "CONTRIBUTION_APPROVED",
            targetType: "CONTRIBUTION",
            targetId: current._id,
            metadata: {
              artifactId: String(targetArtifactId),
              /** Whether this call minted the artifact or linked an existing one. */
              createdArtifact: !artifactId,
              submittedBy: String(current.submittedBy),
              note: note ?? null,
            },
          },
        ],
        { session },
      );

      return { alreadyResolved: false };
    });

    return NextResponse.json(await resolve(id, result.alreadyResolved));
  } catch (err) {
    return toErrorResponse(err);
  }
}
