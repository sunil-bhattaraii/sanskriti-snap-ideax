/**
 * Rewards, redemptions, points ledger and notifications.
 *
 * NOTE: the rewards/notifications surface (API Contract §8) is a teammate's
 * active lane — reconcile this registry with their handlers on merge.
 *
 * All operations require a signed-in user. `POST /rewards/{id}/redeem` takes no
 * body but requires an Idempotency-Key header (any non-empty string here, not a
 * UUID); the real guard against double-spend is a unique redemption index.
 */

import { objectIdPath } from "../components";
import { op, type PathsFragment } from "../operations";
import { type ParameterObject } from "../zod";

const TAG = "Rewards & Points";

const redeemIdempotencyHeader: ParameterObject = {
  name: "Idempotency-Key",
  in: "header",
  required: true,
  schema: { type: "string", minLength: 1 },
  description:
    "Required, non-empty. Re-redeeming returns 409 REWARD_ALREADY_REDEEMED rather than spending twice.",
};

const limitParam: ParameterObject = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1 },
  description: "Maximum number of entries to return.",
};

const cursorParam: ParameterObject = {
  name: "cursor",
  in: "query",
  required: false,
  schema: { type: "string" },
  description:
    "Opaque (base64) pagination cursor from the previous page's `nextCursor`.",
};

export const rewardsPaths: PathsFragment = {
  "/api/v1/rewards": {
    get: op({
      tags: [TAG],
      summary: "List rewards",
      description:
        "Available rewards with the caller's points balance and per-reward affordability. Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/rewards/{id}/redeem": {
    post: op({
      tags: [TAG],
      summary: "Redeem a reward",
      description:
        "Spends points to redeem a reward. No request body. Requires a signed-in user and an Idempotency-Key header. Insufficient points is a 422; a repeat redemption is a 409.",
      params: [objectIdPath("id"), redeemIdempotencyHeader],
      okStatus: 201,
      errors: [
        "VALIDATION_FAILED",
        "NOT_FOUND",
        "REWARD_ALREADY_REDEEMED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },

  "/api/v1/rewards/redemptions": {
    get: op({
      tags: [TAG],
      summary: "List my redemptions",
      description: "The caller's redemption history. Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/points/ledger": {
    get: op({
      tags: [TAG],
      summary: "Get my points ledger",
      description:
        "The caller's append-only points transactions with running balance, cursor-paginated. Requires a signed-in user.",
      params: [limitParam, cursorParam],
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/notifications": {
    get: op({
      tags: [TAG],
      summary: "List notifications",
      description:
        "Placeholder: returns the caller's notification settings and an empty items list (delivery is not built yet). Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },
};
