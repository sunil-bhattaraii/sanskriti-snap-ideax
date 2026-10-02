/**
 * Verification operations.
 *
 * `POST /verification-attempts` is synchronous (one request, one verdict) and
 * requires an Idempotency-Key — a replay must never cost GPU time or double-award.
 * `recheck` inserts a *new* attempt (it never mutates the one in the path) and,
 * per the handlers, does not read an Idempotency-Key.
 */

import {
  CreateVerificationAttemptRequest,
  PaginationQuery,
  RecheckAttemptRequest,
} from "@/lib/contracts";
import { idempotencyKeyHeader, objectIdPath } from "../components";
import { op, type PathsFragment } from "../operations";
import { queryParams, toOpenApiSchema } from "../zod";

const TAG = "Verification";

const VERIFICATION_RESULT_EXAMPLE = {
  attemptId: "665f1a2b3c4d5e6f7a8b9c22",
  status: "VERIFIED",
  discoveryId: "665f1a2b3c4d5e6f7a8b9c33",
  gps: { status: "PASSED", distanceMeters: 18, requiredMeters: 50 },
  cv: { required: false, status: "NOT_REQUIRED" },
  xpAwarded: 100,
  pointsAwarded: 50,
  pointsBalance: 370,
  newlyUnlockedStory: true,
  quest: { id: "665f1a2b3c4d5e6f7a8b9c11", discoveredCount: 2, artifactCount: 5 },
  badge: { name: "First Steps", iconUrl: null },
  message: "Discovery verified.",
};

export const verificationPaths: PathsFragment = {
  "/api/v1/verification-attempts": {
    post: op({
      tags: [TAG],
      summary: "Submit a verification attempt",
      description:
        "Synchronous: one request yields one terminal verdict (VERIFIED / FLAGGED / REJECTED) — there is no PENDING and no polling. A GPS or CV failure persists nothing and the client retries with the same key. Idempotency-Key is required and must be a UUID v4. GeoLocation must be fresh. Requires a signed-in user.",
      params: [idempotencyKeyHeader(true)],
      body: toOpenApiSchema(CreateVerificationAttemptRequest),
      okStatus: 201,
      okExample: VERIFICATION_RESULT_EXAMPLE,
      errors: [
        "VALIDATION_FAILED",
        "IMAGE_REQUIRED",
        "GPS_OUTSIDE_RADIUS",
        "NOT_FOUND",
        "ALREADY_DISCOVERED",
        "CV_UNAVAILABLE",
        "CV_TIMEOUT",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
    get: op({
      tags: [TAG],
      summary: "List my verification attempts",
      description:
        "The caller's own attempts, newest first, cursor-paginated. Requires a signed-in user.",
      params: queryParams(PaginationQuery),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/verification-attempts/{id}": {
    get: op({
      tags: [TAG],
      summary: "Get a verification attempt",
      description:
        "One of the caller's own attempts. A non-owner gets 404 (not 403) so the route cannot be used to probe which ids exist. Requires a signed-in user.",
      params: [objectIdPath("id")],
      errors: ["NOT_FOUND", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/verification-attempts/{id}/recheck": {
    post: op({
      tags: [TAG],
      summary: "Recheck a verification attempt",
      description:
        "Inserts a NEW attempt linked via `supersedesAttemptId`; the attempt in the path is immutable. Does not read an Idempotency-Key. A non-owner gets 404. Requires a signed-in user.",
      params: [objectIdPath("id")],
      body: toOpenApiSchema(RecheckAttemptRequest),
      okStatus: 201,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "IMAGE_REQUIRED",
        "GPS_OUTSIDE_RADIUS",
        "ALREADY_DISCOVERED",
        "CV_UNAVAILABLE",
        "CV_TIMEOUT",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },
};
