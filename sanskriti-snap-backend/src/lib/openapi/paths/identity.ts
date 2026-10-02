/**
 * Identity & profile operations.
 *
 * All require a signed-in user (`requireAuthContext`), so they inherit the global
 * `bearerAuth`; the role note ("Requires a signed-in user") lives in prose since
 * a bearer scheme cannot express it.
 */

import {
  MediaSignRequest,
  PatchPreferencesRequest,
  PatchProfileRequest,
  UsernameRequest,
} from "@/lib/contracts";
import { op, type PathsFragment } from "../operations";
import { toOpenApiSchema, type ParameterObject } from "../zod";

const TAG = "Identity";

const usernameQueryParam: ParameterObject = {
  name: "username",
  in: "query",
  required: true,
  schema: { type: "string" },
  description: "Candidate username to check.",
};

const PROFILE_SUMMARY_EXAMPLE = {
  profile: {
    id: "665f1a2b3c4d5e6f7a8b9c0d",
    username: "newa_explorer",
    displayName: "Newa Explorer",
    profileImageUrl: null,
    role: "USER",
    accountStatus: "ACTIVE",
    lifetimeXp: 1240,
    pointsBalance: 320,
    notifications: { enabled: true, radiusMeters: 500 },
    createdAt: "2026-01-12T09:30:00.000Z",
  },
  stats: {
    discoveryCount: 14,
    questCount: 3,
    completedQuestCount: 1,
    badgeCount: 5,
    rank: 42,
    totalUsers: 1580,
  },
};

export const identityPaths: PathsFragment = {
  "/api/v1/me": {
    get: op({
      tags: [TAG],
      summary: "Get my profile",
      description: "Returns the caller's own profile. Requires a signed-in user.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
    patch: op({
      tags: [TAG],
      summary: "Update my profile",
      description:
        "Updates display name and/or profile image on the caller's own profile. Requires a signed-in user.",
      body: toOpenApiSchema(PatchProfileRequest),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/me/summary": {
    get: op({
      tags: [TAG],
      summary: "Get my profile summary",
      description:
        "Profile plus aggregate stats (discoveries, quests, badges, competition-ranked XP rank). Requires a signed-in user.",
      okExample: PROFILE_SUMMARY_EXAMPLE,
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/me/preferences": {
    patch: op({
      tags: [TAG],
      summary: "Update notification preferences",
      description:
        "Requires a signed-in user. At least one field must be provided — an empty patch is rejected with 422.",
      body: toOpenApiSchema(PatchPreferencesRequest),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/me/username": {
    patch: op({
      tags: [TAG],
      summary: "Change my username",
      description:
        "Requires a signed-in user. Returns 409 USERNAME_TAKEN when the name is already in use (enforced by a unique index).",
      body: toOpenApiSchema(UsernameRequest),
      errors: [
        "VALIDATION_FAILED",
        "USERNAME_TAKEN",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },

  "/api/v1/usernames/availability": {
    get: op({
      tags: [TAG],
      summary: "Check username availability",
      description:
        "Requires a signed-in user. `available: false` is a normal 200 answer, never a 404.",
      params: [usernameQueryParam],
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/media/sign": {
    post: op({
      tags: [TAG],
      summary: "Sign a Cloudinary upload",
      description:
        "Returns short-lived, purpose-scoped upload credentials. Stateless — nothing is persisted, so no Idempotency-Key is needed. Requires a signed-in user.",
      body: toOpenApiSchema(MediaSignRequest),
      okStatus: 200,
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },
};
