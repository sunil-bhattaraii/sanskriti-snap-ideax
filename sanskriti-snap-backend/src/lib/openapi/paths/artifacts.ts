/**
 * Artifact discovery, detail, proximity and community-snap operations.
 *
 * Mix of optional-auth reads (`getAuthContext` — anonymous allowed, richer when
 * authenticated) and required-auth reads/writes. `PATCH /artifacts/{id}` is a
 * stub that returns 501; the real update lives at `PATCH /admin/artifacts/{id}`.
 */

import {
  CreateCommunitySnapRequest,
  DistanceQuery,
  NearbyQuery,
  SearchQuery,
  UnlockStoryRequest,
} from "@/lib/contracts";
import { objectIdPath, optionalAuth } from "../components";
import { op, type PathsFragment } from "../operations";
import { queryParams, toOpenApiSchema, type ParameterObject } from "../zod";

const TAG = "Artifacts";

const latitudeParam = (required: boolean): ParameterObject => ({
  name: "latitude",
  in: "query",
  required,
  schema: { type: "number", minimum: -90, maximum: 90 },
  description: "WGS84 latitude of the caller.",
});

const longitudeParam = (required: boolean): ParameterObject => ({
  name: "longitude",
  in: "query",
  required,
  schema: { type: "number", minimum: -180, maximum: 180 },
  description: "WGS84 longitude of the caller.",
});

const limitParam: ParameterObject = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1 },
  description: "Maximum number of items to return.",
};

const cursorParam: ParameterObject = {
  name: "cursor",
  in: "query",
  required: false,
  schema: { type: "string" },
  description: "Opaque pagination cursor from the previous page's `nextCursor`.",
};

const ARTIFACT_SUMMARY_EXAMPLE = {
  id: "665f1a2b3c4d5e6f7a8b9c0d",
  name: "Krishna Mandir",
  slug: "krishna-mandir",
  description: "A 17th-century stone shikhara temple on Patan Durbar Square.",
  category: "TEMPLE",
  tags: ["newari", "stone", "malla"],
  latitude: 27.6726,
  longitude: 85.3253,
  humanReadableLocation: "Patan Durbar Square, Lalitpur",
  storyUnlockRadiusMeters: 100,
  verificationRadiusMeters: 50,
  xpReward: 100,
  requiresSnap: true,
  requiresCV: false,
  warnings: null,
  discoveryCount: 231,
  coverImageUrl:
    "https://res.cloudinary.com/demo/image/upload/v1/artifacts/krishna_mandir.jpg",
  rarity: "Rare",
  distanceMeters: 340,
};

const NEARBY_EXAMPLE = {
  items: [ARTIFACT_SUMMARY_EXAMPLE],
  meta: {
    count: 1,
    radiusMeters: 5000,
    center: { latitude: 27.6726, longitude: 85.3253 },
  },
};

const ARTIFACT_DETAIL_EXAMPLE = {
  ...ARTIFACT_SUMMARY_EXAMPLE,
  altitudeMeters: 1310,
  referenceImageUrls: [
    "https://res.cloudinary.com/demo/image/upload/v1/artifacts/krishna_mandir_1.jpg",
  ],
  storyUnlocked: true,
  story:
    "Commissioned by King Siddhi Narsingh Malla in 1637, the temple's 21 gilded pinnacles...",
  discovered: true,
  discoveredAt: "2026-02-01T10:15:00.000Z",
  questIds: ["665f1a2b3c4d5e6f7a8b9c11"],
  attemptSummary: {
    latestAttemptId: "665f1a2b3c4d5e6f7a8b9c22",
    latestAttemptStatus: "VERIFIED",
  },
};

export const artifactsPaths: PathsFragment = {
  "/api/v1/artifacts/nearby": {
    get: op({
      tags: [TAG],
      summary: "List nearby artifacts",
      description:
        "Published artifacts within the given radius, nearest first. Requires a signed-in user. Radius is capped server-side at 50 km.",
      params: queryParams(NearbyQuery),
      okExample: NEARBY_EXAMPLE,
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/artifacts/nearby/geofence-regions": {
    get: op({
      tags: [TAG],
      summary: "List geofence regions",
      description:
        "Compact set of circular regions for client-side geofencing around the caller. Requires a signed-in user.",
      params: queryParams(DistanceQuery),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/artifacts/featured": {
    get: op({
      tags: [TAG],
      summary: "List featured artifacts",
      description:
        "Editorially featured artifacts. Optional auth: anonymous is allowed; supplying a location adds `distanceMeters` to each item.",
      security: optionalAuth,
      params: [
        latitudeParam(false),
        longitudeParam(false),
        limitParam,
      ],
      errors: ["VALIDATION_FAILED"],
    }),
  },

  "/api/v1/artifacts/search": {
    get: op({
      tags: [TAG],
      summary: "Search artifacts",
      description:
        "Text search over published artifacts, optionally filtered by category. Requires a signed-in user.",
      params: queryParams(SearchQuery),
      errors: ["VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/artifacts/{id}": {
    get: op({
      tags: [TAG],
      summary: "Get artifact detail",
      description:
        "Full artifact detail. Optional auth: anonymous sees public data; an admin token additionally reveals non-PUBLISHED artifacts. Supplying a location adds distance fields. `story` is present only when `storyUnlocked` is true.",
      security: optionalAuth,
      params: [objectIdPath("id"), latitudeParam(false), longitudeParam(false)],
      okExample: ARTIFACT_DETAIL_EXAMPLE,
      errors: ["NOT_FOUND", "VALIDATION_FAILED"],
    }),
    patch: op({
      tags: [TAG],
      summary: "Update artifact (not implemented)",
      description:
        "Stub that always returns 501. Requires ADMIN (the check runs first, so auth errors are still possible). Use PATCH /api/v1/admin/artifacts/{id} for the real update.",
      params: [objectIdPath("id")],
      okStatus: 501,
      okDescription: "Not implemented. Use PATCH /api/v1/admin/artifacts/{id}.",
      errors: ["UNAUTHENTICATED", "ACCOUNT_SUSPENDED", "FORBIDDEN"],
    }),
  },

  "/api/v1/artifacts/{id}/distance": {
    get: op({
      tags: [TAG],
      summary: "Distance to an artifact",
      description:
        "Distance from the caller to the artifact, with verification/story-unlock radius checks and the shortfall. Requires a signed-in user and a location.",
      params: [objectIdPath("id"), ...queryParams(DistanceQuery)],
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },

  "/api/v1/artifacts/{id}/navigation": {
    get: op({
      tags: [TAG],
      summary: "Navigation target for an artifact",
      description:
        "Coordinates and verification radius a client needs to route the user to the artifact. Requires a signed-in user.",
      params: [objectIdPath("id")],
      errors: ["NOT_FOUND", "UNAUTHENTICATED", "ACCOUNT_SUSPENDED"],
    }),
  },

  "/api/v1/artifacts/{id}/snaps": {
    get: op({
      tags: [TAG],
      summary: "List community snaps",
      description:
        "Public feed of ACTIVE community snaps for an artifact. Optional auth: anonymous is allowed.",
      security: optionalAuth,
      params: [objectIdPath("id"), limitParam, cursorParam],
      errors: ["NOT_FOUND"],
    }),
    post: op({
      tags: [TAG],
      summary: "Publish a community snap",
      description:
        "Publishes a prior verification photo as a community snap. The image must have been signed with purpose COMMUNITY_SNAP. Requires a signed-in user.",
      params: [objectIdPath("id")],
      body: toOpenApiSchema(CreateCommunitySnapRequest),
      okStatus: 201,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },

  "/api/v1/artifacts/{id}/unlock-story": {
    post: op({
      tags: [TAG],
      summary: "Unlock an artifact's story",
      description:
        "Unlocks the story by proximity (independent of discovery). Requires a signed-in user. GeoLocation must be fresh — a stale or future `capturedAt` is rejected with 422.",
      params: [objectIdPath("id")],
      body: toOpenApiSchema(UnlockStoryRequest),
      okStatus: 200,
      errors: [
        "NOT_FOUND",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "ACCOUNT_SUSPENDED",
      ],
    }),
  },
};
