/**
 * Engagement operations: collection, discoveries, quests, badges, leaderboard.
 *
 * `quests` (list) and `leaderboard` use optional auth (`getAuthContext`) — they
 * work anonymously and personalise when a token is present. The rest require a
 * signed-in user.
 */

import { PaginationQuery } from "@/lib/contracts";
import { objectIdPath, optionalAuth } from "../components";
import { op, type PathsFragment } from "../operations";
import { queryParams, type ParameterObject } from "../zod";

const TAG = "Engagement";

const limitParam: ParameterObject = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1 },
  description: "Maximum number of items to return.",
};

export const engagementPaths: PathsFragment = {
  "/api/v1/collection": {
    get: op({
      tags: [TAG],
      summary: "Get my collection",
      description:
        "The caller's discovered artifacts with total XP. Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/discoveries": {
    get: op({
      tags: [TAG],
      summary: "List my discoveries",
      description:
        "The caller's discoveries, newest first, cursor-paginated. Requires a signed-in user.",
      params: queryParams(PaginationQuery),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/discoveries/{id}/receipt": {
    get: op({
      tags: [TAG],
      summary: "Get a discovery receipt",
      description:
        "The award receipt for one of the caller's own discoveries. A non-owner gets 404. Requires a signed-in user.",
      params: [objectIdPath("id")],
      errors: ["NOT_FOUND", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/quests": {
    get: op({
      tags: [TAG],
      summary: "List quests",
      description:
        "Active quests. Optional auth: anonymous sees zero progress; a token fills in the caller's `discoveredCount` and completion.",
      security: optionalAuth,
      errors: [],
    }),
  },

  "/api/v1/quests/{id}": {
    get: op({
      tags: [TAG],
      summary: "Get quest detail",
      description:
        "One active quest with its artifact list and the caller's progress. Requires a signed-in user.",
      params: [objectIdPath("id")],
      errors: ["NOT_FOUND", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/badges": {
    get: op({
      tags: [TAG],
      summary: "List badges",
      description:
        "All badges with the caller's unlocked/locked state and progress. Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/leaderboard": {
    get: op({
      tags: [TAG],
      summary: "Get the leaderboard",
      description:
        "Top users by lifetime XP. Optional auth: a token adds the caller's own ranked row to `meta.currentUser`.",
      security: optionalAuth,
      params: [limitParam],
      errors: [],
    }),
  },
};
