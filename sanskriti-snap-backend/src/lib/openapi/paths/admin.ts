/**
 * Admin & reviewer operations.
 *
 * Authority is enforced in every handler, never in the proxy. All routes here
 * require ADMIN EXCEPT the three contribution routes, which require EXPERT or
 * ADMIN (`requireReviewer`). EXPERT may review contributions and nothing else —
 * not verification, artifacts, users or XP. The tag split mirrors that boundary;
 * the role is also stated in each operation's prose since a bearer scheme cannot
 * express it.
 *
 * The admin list endpoints filter by a `status` query param defined inline in
 * their handlers (`PaginationQuery.extend({ status })`, not exported), so those
 * params are composed here from `PaginationQuery` plus a status enum param.
 */

import {
  AdminUserQuery,
  ApproveVerificationRequest,
  ArtifactStatus,
  CommunityQuery,
  ContributionDecisionRequest,
  ContributionRejectionRequest,
  ContributionStatus,
  CreateArtifactRequest,
  CreateBadgeRequest,
  CreateEmbeddingRequest,
  CreateQuestRequest,
  CreateReferenceRequest,
  HideCommunitySnapRequest,
  PaginationQuery,
  RejectVerificationRequest,
  SuspendUserRequest,
  UpdateArtifactRequest,
  UpdateBadgeRequest,
  UpdateQuestRequest,
  UpdateUserRequest,
  VerificationStatus,
  XpAdjustmentRequest,
} from "@/lib/contracts";
import { enumQueryParam, objectIdPath } from "../components";
import { op, type PathsFragment } from "../operations";
import { queryParams, toOpenApiSchema } from "../zod";

const ADMIN = "Admin";
const REVIEW = "Admin · Contributions";

const REQUIRES_ADMIN = "Requires ADMIN.";
const REQUIRES_REVIEWER = "Requires EXPERT or ADMIN.";

export const adminPaths: PathsFragment = {
  /* ---------------------------------------------------- artifact management */

  "/api/v1/admin/artifacts": {
    get: op({
      tags: [ADMIN],
      summary: "List artifacts (any status)",
      description: `${REQUIRES_ADMIN} Lists artifacts of any lifecycle status, cursor-paginated.`,
      params: [
        ...queryParams(PaginationQuery),
        enumQueryParam(
          "status",
          ArtifactStatus,
          "Filter by lifecycle status. Omit for all statuses.",
        ),
      ],
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
    post: op({
      tags: [ADMIN],
      summary: "Create an artifact",
      description: `${REQUIRES_ADMIN} Creates an artifact (defaults to DRAFT). A duplicate slug is rejected with 409.`,
      body: toOpenApiSchema(CreateArtifactRequest),
      okStatus: 201,
      errors: [
        "VALIDATION_FAILED",
        "INVALID_STATE_TRANSITION",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/artifacts/{id}": {
    patch: op({
      tags: [ADMIN],
      summary: "Update an artifact",
      description: `${REQUIRES_ADMIN} Partial update, including status transitions.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(UpdateArtifactRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/artifacts/{id}/references": {
    post: op({
      tags: [ADMIN],
      summary: "Add a reference image",
      description: `${REQUIRES_ADMIN} The image must have been signed with purpose VERIFICATION_GALLERY. Optionally sets it as cover.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(CreateReferenceRequest),
      okStatus: 201,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/artifacts/{id}/references/{refId}": {
    delete: op({
      tags: [ADMIN],
      summary: "Delete a reference image",
      description: `${REQUIRES_ADMIN} Removes the reference; if it was the cover, the artifact's cached cover is cleared.`,
      params: [objectIdPath("id"), objectIdPath("refId")],
      errors: [
        "NOT_FOUND",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/artifacts/{id}/references/embeddings": {
    post: op({
      tags: [ADMIN],
      summary: "Attach a reference embedding",
      description: `${REQUIRES_ADMIN} Stores a pre-computed CV embedding for an existing reference. The \`embedding\` array length must equal \`embeddingDimension\`.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(CreateEmbeddingRequest),
      okStatus: 201,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* ------------------------------------------------------------ verification */

  "/api/v1/admin/verification": {
    get: op({
      tags: [ADMIN],
      summary: "List verification attempts for review",
      description: `${REQUIRES_ADMIN} The review queue, cursor-paginated. Defaults to FLAGGED.`,
      params: [
        ...queryParams(PaginationQuery),
        enumQueryParam(
          "status",
          VerificationStatus,
          "Filter by status. Defaults to FLAGGED.",
        ),
      ],
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/verification/{id}/approve": {
    post: op({
      tags: [ADMIN],
      summary: "Approve a flagged attempt",
      description: `${REQUIRES_ADMIN} Resolves a FLAGGED attempt to VERIFIED and grants the discovery awards (idempotent by state). Only a FLAGGED attempt can be resolved; an attempt already REJECTED is 409.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(ApproveVerificationRequest),
      errors: [
        "NOT_FOUND",
        "INVALID_STATE_TRANSITION",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/verification/{id}/reject": {
    post: op({
      tags: [ADMIN],
      summary: "Reject a flagged attempt",
      description: `${REQUIRES_ADMIN} Resolves a FLAGGED attempt to REJECTED (idempotent by state). An attempt already VERIFIED is 409.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(RejectVerificationRequest),
      errors: [
        "NOT_FOUND",
        "INVALID_STATE_TRANSITION",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* ------------------------------------------------------------- quests */

  "/api/v1/admin/quests": {
    get: op({
      tags: [ADMIN],
      summary: "List quests",
      description: `${REQUIRES_ADMIN} Returns quests in reverse creation order with cursor pagination.`,
      params: queryParams(PaginationQuery),
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
    post: op({
      tags: [ADMIN],
      summary: "Create a quest",
      description: `${REQUIRES_ADMIN} Every \`artifactIds\` entry must reference an existing artifact.`,
      body: toOpenApiSchema(CreateQuestRequest),
      okStatus: 201,
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/quests/{id}": {
    patch: op({
      tags: [ADMIN],
      summary: "Update a quest",
      description: `${REQUIRES_ADMIN} Rejects an empty patch. Every \`artifactIds\` entry must reference an existing artifact.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(UpdateQuestRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* ------------------------------------------------------------- badges */

  "/api/v1/admin/badges": {
    get: op({
      tags: [ADMIN],
      summary: "List badges",
      description: `${REQUIRES_ADMIN} Returns badges in reverse creation order with cursor pagination.`,
      params: queryParams(PaginationQuery),
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
    post: op({
      tags: [ADMIN],
      summary: "Create a badge",
      description: `${REQUIRES_ADMIN} A QUEST_COMPLETION condition's \`questId\` must reference an existing quest.`,
      body: toOpenApiSchema(CreateBadgeRequest),
      okStatus: 201,
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/badges/{id}": {
    patch: op({
      tags: [ADMIN],
      summary: "Update a badge",
      description: `${REQUIRES_ADMIN} Rejects an empty patch. A QUEST_COMPLETION condition's \`questId\` must reference an existing quest.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(UpdateBadgeRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* ---------------------------------------------------------------- users */

  "/api/v1/admin/users": {
    get: op({
      tags: [ADMIN],
      summary: "List users",
      description: `${REQUIRES_ADMIN} Includes account status and role; supports a free-text \`q\`.`,
      params: queryParams(AdminUserQuery),
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/users/{id}": {
    patch: op({
      tags: [ADMIN],
      summary: "Update a user",
      description: `${REQUIRES_ADMIN} Updates user information.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(UpdateUserRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/users/{id}/suspend": {
    post: op({
      tags: [ADMIN],
      summary: "Suspend a user",
      description: `${REQUIRES_ADMIN} Idempotent by state. You cannot suspend your own account (403).`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(SuspendUserRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "FORBIDDEN",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },

  "/api/v1/admin/users/{id}/reactivate": {
    post: op({
      tags: [ADMIN],
      summary: "Reactivate a suspended user",
      description: `${REQUIRES_ADMIN} Idempotent by state. A deleted account cannot be reactivated.`,
      params: [objectIdPath("id")],
      errors: [
        "NOT_FOUND",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* -------------------------------------------------------------- xp */

  "/api/v1/admin/xp-adjustments": {
    post: op({
      tags: [ADMIN],
      summary: "Adjust a user's XP",
      description: `${REQUIRES_ADMIN} Applies a signed XP adjustment (lifetime XP is clamped at 0) and appends an XP transaction.`,
      body: toOpenApiSchema(XpAdjustmentRequest),
      okStatus: 201,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* ----------------------------------------------------- community (admin) */

  "/api/v1/admin/community": {
    get: op({
      tags: [ADMIN],
      summary: "List community snaps for moderation",
      description: `${REQUIRES_ADMIN} The moderation queue, cursor-paginated. Defaults to PENDING.`,
      params: queryParams(CommunityQuery),
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/community/{id}/hide": {
    post: op({
      tags: [ADMIN],
      summary: "Hide a community snap",
      description: `${REQUIRES_ADMIN} Sets a snap to HIDDEN (idempotent by state). A REMOVED snap is 404.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(HideCommunitySnapRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  /* -------------------------------------- contributions (EXPERT or ADMIN) */

  "/api/v1/admin/contributions": {
    get: op({
      tags: [REVIEW],
      summary: "List contributions for review",
      description: `${REQUIRES_REVIEWER} The contribution queue, cursor-paginated. Defaults to SUBMITTED and UNDER_REVIEW.`,
      params: [
        ...queryParams(PaginationQuery),
        enumQueryParam(
          "status",
          ContributionStatus,
          "Filter by review status. Defaults to SUBMITTED and UNDER_REVIEW.",
        ),
      ],
      errors: [
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/contributions/{id}/approve": {
    post: op({
      tags: [REVIEW],
      summary: "Approve a contribution",
      description: `${REQUIRES_REVIEWER} Provide at most one of \`artifactId\` (link an existing artifact) or \`artifact\` (create one inline); neither is INVALID_CONTRIBUTION_TARGET (422). Idempotent by state; an already-REJECTED contribution is 409.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(ContributionDecisionRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "INVALID_CONTRIBUTION_TARGET",
        "INVALID_STATE_TRANSITION",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },

  "/api/v1/admin/contributions/{id}/reject": {
    post: op({
      tags: [REVIEW],
      summary: "Reject a contribution",
      description: `${REQUIRES_REVIEWER} Idempotent by state; an already-APPROVED contribution is 409.`,
      params: [objectIdPath("id")],
      body: toOpenApiSchema(ContributionRejectionRequest),
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "INVALID_STATE_TRANSITION",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
        "FORBIDDEN",
      ],
    }),
  },
};
