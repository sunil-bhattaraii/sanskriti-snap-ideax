/**
 * Admin-only read helpers.
 *
 * The review routes need the same three-way join (attempt + artifact + author)
 * whether they are listing the queue or returning the row they just resolved,
 * and the one subtlety — `flagReason` is `select: false` on the model — is easy
 * to forget in a second call site. It lives here instead.
 */

import { toAdminContribution, toAdminVerificationAttempt } from "./dto";
import type { AdminContribution, AdminVerificationAttempt } from "./contracts";
import { Artifact } from "@/models/artifact";
import { Contribution } from "@/models/community";
import { User } from "@/models/user";
import { VerificationAttempt } from "@/models/verification";

/**
 * Derives the URL slug the client would otherwise have to invent.
 *
 * Shared rather than duplicated: a name change re-derives the slug in the
 * artifact update route, artifact creation does it from scratch, and approving
 * a contribution mints an artifact from a proposal. Three copies of this would
 * eventually disagree, and a slug that disagrees with the name silently 404s
 * every deep link the app has already shared.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Loads one attempt with everything the admin DTO exposes, or null when the
 * attempt, its artifact, or its author has gone missing. A dangling reference is
 * a 404 rather than a half-built row: the reviewer cannot act on it anyway.
 */
export async function loadAdminVerificationAttempt(
  attemptId: string,
): Promise<AdminVerificationAttempt | null> {
  const attempt = await VerificationAttempt.findById(attemptId)
    .select("+flagReason")
    .lean();

  if (!attempt) return null;

  const [artifact, user] = await Promise.all([
    Artifact.findById(attempt.artifactId)
      .select(
        "name coverImageUrl humanReadableLocation xpReward verificationRadiusMeters",
      )
      .lean(),
    User.findById(attempt.userId).select("username displayName").lean(),
  ]);

  if (!artifact || !user) return null;

  return toAdminVerificationAttempt(
    attempt as Parameters<typeof toAdminVerificationAttempt>[0],
    artifact as Parameters<typeof toAdminVerificationAttempt>[1],
    user as Parameters<typeof toAdminVerificationAttempt>[2],
  );
}

/**
 * Loads one contribution with everything the reviewer DTO exposes, or null when
 * the contribution or its author has gone missing. A dangling author is a 404
 * rather than a half-built row — the same rule as the verification loader, for
 * the same reason: the reviewer cannot act on it anyway.
 */
export async function loadAdminContribution(
  contributionId: string,
): Promise<AdminContribution | null> {
  const contribution = await Contribution.findById(contributionId).lean();
  if (!contribution) return null;

  const user = await User.findById(contribution.submittedBy)
    .select("username displayName")
    .lean();
  if (!user) return null;

  return toAdminContribution(
    contribution as Parameters<typeof toAdminContribution>[0],
    user as Parameters<typeof toAdminContribution>[1],
  );
}
