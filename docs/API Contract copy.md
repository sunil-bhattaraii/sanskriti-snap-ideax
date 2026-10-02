# Sanskriti Snap — REST API Contract (condensed)

**Backend:** Next.js (App Router) REST · **DB:** MongoDB via Mongoose · **Auth:** Clerk · **Media:** Cloudinary · **Client:** React Native / Expo

This is a condensed, self-contained version of `API Contract.md`. It keeps the
stack, conventions, DTOs, every route, the synchronous-verification rules, the
data-model constraints, and the open decisions. It drops the migration narrative,
the traceability matrix, the decision-log rationale, and the anti-pattern appendix.

Current client runs on Supabase/PostgreSQL; this is the migration target.

---

## 1. Conventions

```text
Base URL:        to be decided
Version prefix:  /api/v1   (fixed for the life of v1)
Content type:    application/json; charset=utf-8
Timezone:        UTC. ISO 8601 timestamps with Z.
Identifiers:     24-char lowercase hex ObjectId strings.
```

Every path is written in full including the prefix. A v2 would be served at
`/api/v2` alongside v1; additive changes (fields, endpoints, enum members) ship
inside v1.

### Authentication

Clerk owns auth. Client sends `Authorization: Bearer <clerk_session_token>`.
Server verifies with Clerk and resolves the app user:

```text
clerkUserId (from token) → users.findOne({ clerkUserId }) → user._id
```

**The client never sends a user id** in a body, query, or path for resources it
does not own. Identity comes only from the token.

### Error format

```json
{
  "error": {
    "code": "GPS_OUTSIDE_RADIUS",
    "message": "You are 340 m from Patan Durbar Square. Move within 150 m to verify.",
    "details": { "distanceMeters": 490, "requiredMeters": 150, "shortfallMeters": 340 }
  }
}
```

`code` is stable `UPPER_SNAKE_CASE`; clients branch on it, never on `message`.
`details` is optional and machine-readable. Never return stack traces.

| Code | Status | Meaning |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Missing/expired/invalid token. |
| `FORBIDDEN` | 403 | Role or account status disallows the action. |
| `ACCOUNT_SUSPENDED` | 403 | `accountStatus !== "ACTIVE"`. |
| `NOT_FOUND` | 404 | Missing, or not visible to this caller. |
| `VALIDATION_FAILED` | 422 | Schema validation failed (`details.fields`). |
| `USERNAME_TAKEN` | 409 | Unique username collision. |
| `ALREADY_DISCOVERED` | 409 | Duplicate discovery; returns existing `discoveryId`. |
| `ARTIFACT_UNAVAILABLE` | 409 | Artifact status is not `PUBLISHED`. |
| `GPS_OUTSIDE_RADIUS` | 422 | Outside `verificationRadiusMeters`. |
| `IMAGE_REQUIRED` | 422 | `requiresSnap: true` but no image supplied. |
| `REWARD_ALREADY_REDEEMED` | 409 | Reward already claimed by this user. |
| `CV_UNAVAILABLE` | 503 | CV unreachable/timeout. Nothing persisted. |
| `CV_TIMEOUT` | 504 | CV exceeded request budget. Nothing persisted. |
| `RATE_LIMITED` | 429 | See `details.retryAfterSeconds`. |
| `INTERNAL_ERROR` | 500 | Unexpected fault. |

A low CV similarity is **not** an error code — it is a domain outcome (`FLAGGED`).
Return `404` instead of `403` where existence would leak information.

### Status codes

- `201 Created` — verification attempt created. Since CV is synchronous, a `201`
  always carries a complete automatic verdict.
- No `202`, no queue, no `PENDING`/`PROCESSING`.
- `503`/`504` — CV outage; nothing persisted; client re-POSTs same `Idempotency-Key`.

**Request vs business lifecycle.** The request is synchronous. The record can
still move afterward: `FLAGGED` is terminal for *automatic* verification but open
to admin review (`VERIFIED`/`REJECTED`). `VERIFIED`/`REJECTED` are fully terminal.

### Pagination

```json
{ "items": [ ... ], "page": { "nextCursor": "eyJ2Ijoi...fQ", "hasMore": true } }
```

`cursor` opaque; default `limit` 20, max 100. Bounded endpoints (nearby, quests,
badges, leaderboard) use a server cap and ignore `cursor`.

### Idempotency

Every `POST` that creates stateful resources accepts `Idempotency-Key: <uuid v4>`.
Server stores key+response for 24 h and replays on repeat. Mandatory for
verification submission and reward redemption.

### DTO rules

- Never return `_id` as `_id`; return as `id`.
- Never return `clerkUserId`, `createdBy`, `updatedBy`, `cvConfiguration`,
  `embedding`, `embeddingDimension`, moderation fields, other users'
  `accountStatus`, or internal review notes.
- **Conditional fields are mandatory**: a field conditional on state must be
  physically absent when not applicable — not present-but-null.
- Coordinates returned flat as `latitude`/`longitude` (stored GeoJSON
  `[lng, lat]` order is internal and must never leak).
- Enums are `UPPER_SNAKE_CASE`, matching the schema. Artifact status is
  `DRAFT | PUBLISHED | ARCHIVED | DISABLED`.

---

## 2. DTO Catalogue

### ArtifactSummary

```ts
type ArtifactSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ArtifactCategory;   // TEMPLE|SITE|STATUE|CARVING|ARCHITECTURE|MONUMENT|COURTYARD|CULTURAL_OBJECT|OTHER
  tags: string[];
  latitude: number;
  longitude: number;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  discoveryCount: number;
  coverImageUrl: string | null; // denormalised first reference image; backend-maintained
  distanceMeters: number | null;// present only when the request supplied a location
};
```

Summary carries only `coverImageUrl`, not the full array: summaries are returned
in bulk by map/search. Both `coverImageUrl` and the detail's `referenceImageUrls`
derive from `artifactReferences`; a denormalised cover is a backend-maintained
cache and is never client-writable.

### ArtifactDetail

Extends `ArtifactSummary`, returned by `GET /api/v1/artifacts/:id`:

```ts
type ArtifactDetail = ArtifactSummary & {
  altitudeMeters: number | null;
  referenceImageUrls: string[];   // full set; detail-only
  storyUnlocked: boolean;
  story: string;                  // present IFF storyUnlocked === true; else ABSENT
  discovered: boolean;
  discoveredAt: string | null;
  attemptSummary: {
    latestAttemptId: string | null;
    latestAttemptStatus: VerificationStatus | null;
  };
  questIds: string[];
};
```

```jsonc
// locked
{ "storyUnlocked": false, "discovered": false }
// unlocked
{ "storyUnlocked": true, "story": "The temple was built in..." }
```

`story` is a **conditional property**: present iff `storyUnlocked === true`,
otherwise absent entirely (not `null`). There is no `attemptsRemaining` field —
no attempt cap is defined.

### VerificationAttempt (public)

```ts
type VerificationAttempt = {
  id: string;
  artifactId: string;
  artifact: Pick<ArtifactSummary, "id" | "name" | "coverImageUrl"
                                   | "humanReadableLocation" | "xpReward">;
  status: "VERIFIED" | "FLAGGED" | "REJECTED";
  rejectionReason: string | null;
  submittedAt: string;
  verificationImageUrl: string | null;   // short-lived signed URL
  gps: {
    status: "PASSED" | "FAILED";
    distanceMeters: number | null;
    requiredMeters: number;
    capturedAt: string;
  };
  cv: {
    required: boolean;
    status: "NOT_REQUIRED" | "PASSED" | "FAILED";
    similarityScore: number | null;
    threshold: number | null;
    topK: number | null;
    processedAt: string | null;
  } | null;
  discoveryId: string | null;
  supersedesAttemptId: string | null;    // set when this attempt came from a recheck
};
```

The enum is deliberately smaller than the schema: with synchronous CV an attempt
row is written only once the verdict is known, so `PENDING`/`PROCESSING`/`FAILED`/
`UNAVAILABLE`/`ERROR` are unreachable. The only mutation is `FLAGGED → VERIFIED`
or `FLAGGED → REJECTED`. Internal CV config (model, matched references, raw
scores), `flagReason`, and review notes are **excluded**; see `AdminVerificationAttempt`.

### AdminVerificationAttempt

```ts
type AdminVerificationAttempt = VerificationAttempt & {
  user: { id: string; username: string; displayName: string };
  cv: VerificationAttempt["cv"] & {
    model: { name: string; version: string } | null;
    matchedReferenceIds: string[];
  } | null;
  flagReason: string | null;
  review: {
    reviewedBy: string; reviewedAt: string;
    decision: "APPROVED" | "REJECTED"; note: string | null;
  } | null;
};
```

### UserProfile

```ts
type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: "USER" | "EXPERT" | "ADMIN";          // own profile only
  accountStatus: "ACTIVE" | "SUSPENDED" | "DELETED";
  lifetimeXp: number;
  pointsBalance: number;                       // ledger-backed
  notifications: { enabled: boolean; radiusMeters: number };
  createdAt: string;
};
```

`role` and `accountStatus` are returned only for the caller's own profile (and
leaderboard rows the caller may see).

### Quest

```ts
type QuestSummary = {
  id: string; name: string; description: string;
  xpReward: number; artifactCount: number; discoveredCount: number;
  progressPercent: number; completed: boolean;
  badge: { id: string; name: string } | null;
};
type QuestDetail = QuestSummary & {
  artifacts: Array<{ id: string; name: string; humanReadableLocation: string;
                     coverImageUrl: string | null; category: ArtifactCategory;
                     discovered: boolean }>;
};
```

Progress is `discoveredArtifactIds.length / artifactIds.length`, computed server-side.

### Badge

```ts
type Badge = {
  id: string; name: string; description: string; iconUrl: string | null;
  unlocked: boolean; earnedAt: string | null;
  progress?: { current: number; required: number }; // when condition != FIRST_DISCOVERY
};
```

### DiscoveryReceipt

```ts
type DiscoveryReceipt = {
  id: string; discoveredAt: string; xpAwarded: number;
  artifact: Pick<ArtifactSummary, "id" | "name" | "category" | "coverImageUrl">;
  verificationAttemptId: string;
  quest: { id: string; name: string; discoveredCount: number; artifactCount: number } | null;
  badge: { name: string; iconUrl: string | null } | null;  // only badges awarded by THIS discovery
  lifetimeXp: number;
};
```

### CommunitySnap

```ts
type CommunitySnap = {
  id: string;
  artifactId: string;
  author: { username: string; displayName: string; profileImageUrl: string | null } | null;
  verificationAttemptId: string | null;   // provenance; null for legacy/imported
  imageUrl: string;
  caption: string | null;
  status: "PENDING" | "ACTIVE" | "HIDDEN" | "REMOVED";
  createdAt: string;
};
```

A `CommunitySnap` is the **only** way a verification photo becomes public. It
references the originating attempt so provenance is never lost.

---

## 3. Endpoint Index

| Group | Routes |
| --- | --- |
| Identity/profile | `GET /me`, `PATCH /me`, `PATCH /me/username`, `GET /usernames/availability`, `PATCH /me/preferences`, `GET /me/summary` |
| Artifacts | `GET /artifacts/nearby`, `GET /artifacts/nearby/geofence-regions`, `GET /artifacts/featured`, `GET /artifacts/search`, `GET /artifacts/:id`, `GET /artifacts/:id/distance`, `GET /artifacts/:id/navigation`, `POST /artifacts/:id/unlock-story`, `GET /artifacts/:id/snaps`, `POST /artifacts/:id/snaps` |
| Verification | `POST /media/sign`, `POST /verification-attempts`, `GET /verification-attempts/:id`, `POST /verification-attempts/:id/recheck`, `GET /verification-attempts` |
| Discovery/gamification | `GET /discoveries`, `GET /discoveries/:id/receipt`, `GET /collection`, `GET /quests`, `GET /quests/:id`, `GET /badges`, `GET /leaderboard` |
| Rewards/notifications | `GET /rewards`, `GET /rewards/redemptions`, `POST /rewards/:id/redeem`, `GET /points/ledger`, `GET /notifications` |
| Admin | 21 routes under `/admin` (see §9) |

All prefixed with `/api/v1`. Totals: **54 routes across 50 paths**.

---

## 4. Identity and Profile

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/v1/me` | required |
| `PATCH` | `/api/v1/me` | required |
| `PATCH` | `/api/v1/me/username` | required |
| `GET` | `/api/v1/usernames/availability?username=` | required |
| `PATCH` | `/api/v1/me/preferences` | required |
| `GET` | `/api/v1/me/summary` | required |

- `GET /me` returns `UserProfile`; the client's XP source of truth.
- `PATCH /me`: only `displayName`, `profileImagePublicId` writable. Attempting
  `lifetimeXp`/`role`/`accountStatus` → `422`.
- `PATCH /me/username`: `{ "username": "asha_r" }`, 3–30 chars `^[a-zA-Z0-9_]+$`,
  collision → `409 USERNAME_TAKEN`.
- `GET /usernames/availability` → `{ username, available }` (taken is a normal
  answer, not an error); excludes own current username.
- `PATCH /me/preferences`: `{ "notifications": { "enabled": true, "radiusMeters": 5000 } }`.
- `GET /me/summary`: profile-screen aggregate (user, counts, XP, badges, quests).

---

## 5. Artifacts

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/artifacts/nearby` | required | Map markers |
| `GET` | `/api/v1/artifacts/nearby/geofence-regions` | required | Geofence candidates |
| `GET` | `/api/v1/artifacts/featured` | optional | Home cards |
| `GET` | `/api/v1/artifacts/search` | required | Search |
| `GET` | `/api/v1/artifacts/:id` | optional | Detail + viewer state |
| `GET` | `/api/v1/artifacts/:id/distance` | required | Distance from point |
| `GET` | `/api/v1/artifacts/:id/navigation` | required | Navigation target |
| `POST` | `/api/v1/artifacts/:id/unlock-story` | required | Unlock story at location |
| `GET` | `/api/v1/artifacts/:id/snaps` | optional | Public community snaps |
| `POST` | `/api/v1/artifacts/:id/snaps` | required | Publish a verification photo |

### `/nearby`

`?latitude=&longitude=&radiusMeters=5000&limit=100`. Defaults: radius 5000, limit
100 (max 200). `radiusMeters` is **capped server-side at 50000**.

```json
{ "items": [ { "...": "ArtifactSummary" } ],
  "meta": { "count": 23, "radiusMeters": 5000,
            "center": { "latitude": 27.673, "longitude": 85.324 } } }
```

Implementation: `$geoNear` first stage (`distanceField: distanceMeters`,
`spherical: true`, nearest first), then `$match: { status: "PUBLISHED" }`. `DRAFT`
artifacts are not discoverable. Response excludes `story` and internal fields.

### `/nearby/geofence-regions`

Hard cap **20** (OS geofence limit). Returns `totalAvailable`, `returned`,
`truncated`, `maxRegions`, and per-region `suggestedRadiusMeters =
max(userRadius, verificationRadius)`. Already-discovered artifacts may be excluded
to spend slots on still-relevant artifacts.

### `/featured`

`?latitude=&longitude=&limit=3`. Top by `discoveryCount`; neighbourhood-weighted
when coordinates are supplied. Optional auth so the home screen renders signed-out.

### `/search`

`?q=&category=&limit=8` (max 25). Matches `name`, `description`, `tags`,
`humanReadableLocation`; case-insensitive, diacritic-tolerant. Server-side only —
replaces the client caching the whole catalogue.

### `/:id`

Returns `ArtifactDetail`. Optional coordinates populate `distanceMeters`. `story`
included iff `storyUnlocked` is true. Anonymous callers get `storyUnlocked: false`,
`discovered: false`, and no `story` property.

### `/:id/distance`

`?latitude=&longitude=` →

```json
{ "artifactId": "...", "artifactName": "Patan Durbar Square",
  "distanceMeters": 490, "verificationRadiusMeters": 150,
  "storyUnlockRadiusMeters": 300, "withinVerificationRadius": false,
  "withinStoryUnlockRadius": false, "shortfallMeters": 340 }
```

Single source for "move 340 m closer" copy; returns both radii so the client can
distinguish verify-proximity from story-proximity.

### `/:id/navigation`

`{ artifactId, name, latitude, longitude, verificationRadiusMeters }`. Client
builds the OSRM walking route itself; backend does not proxy routing.

### `POST /:id/unlock-story`

Story unlock is **independent of discovery** and earned by proximity alone.

```json
{ "location": { "latitude": 27.6730, "longitude": 85.3240, "accuracyMeters": 8.4,
                "altitudeMeters": 1402, "capturedAt": "2026-01-02T09:14:33.000Z" } }
```

`capturedAt` within last 10 min, not future beyond clock skew; `accuracyMeters`
≤ 100 m.

```json
{ "artifactId": "...", "unlocked": true, "newlyUnlocked": true,
  "distanceMeters": 183, "requiredMeters": 300,
  "storyUnlocked": true, "story": "The temple was built in..." }
```

Server upserts `storyUnlocks` on `(userId, artifactId)`. Outside the radius:
`200` with `unlocked: false`, `newlyUnlocked: false`, `shortfallMeters` (being too
far is normal, not an error). Idempotent; a repeat inside radius returns
`newlyUnlocked: false` and does not rewrite the original evidence. `story` present
only when `storyUnlocked` is true.

### `GET /:id/snaps` and `POST /:id/snaps`

Verification photos are always private. Publishing creates a **separate**
`communitySnaps` document; it never edits the attempt.

`GET` (optional auth) returns `status: "ACTIVE"` snaps newest-first, paginated:

```json
{ "items": [ { "id": "...", "imageUrl": "...", "caption": "...",
    "author": { "username": "asha_r", "displayName": "Asha", "profileImageUrl": null },
    "createdAt": "..." } ],
  "page": { "nextCursor": null, "hasMore": false } }
```

`POST` body:

```json
{ "verificationAttemptId": "...", "imagePublicId": "hidden-nepal/...", "caption": null }
```

- Attempt must belong to the caller and reference this artifact.
- `imagePublicId` must have been signed for this user via `/media/sign` with
  `purpose: "COMMUNITY_SNAP"`.
- New snap is `status: "PENDING"` until moderated; only `ACTIVE` is returned.
- Provenance (`verificationAttemptId`) is preserved for moderation.

---

## 6. Verification

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/api/v1/media/sign` | required |
| `POST` | `/api/v1/verification-attempts` | required |
| `GET` | `/api/v1/verification-attempts/:id` | required (owner) |
| `POST` | `/api/v1/verification-attempts/:id/recheck` | required (owner) |
| `GET` | `/api/v1/verification-attempts` | required |

### `POST /media/sign`

```json
{ "purpose": "VERIFICATION_SNAP", "contentType": "image/jpeg" }
```

→ `{ cloudName, apiKey, timestamp, signature, folder, resourceType }`. Client
uploads directly to Cloudinary; large images never transit the backend. `purpose`
maps to a fixed folder/transformation allowlist: `VERIFICATION_SNAP`,
`VERIFICATION_GALLERY`, `PROFILE_IMAGE`, `COMMUNITY_SNAP`, `CONTRIBUTION_PHOTO`.
`contentType` must be `image/jpeg` or `image/png`.

### `POST /verification-attempts`

Header: `Idempotency-Key: <uuid>` (required). One call; client sends evidence only.

```json
{
  "artifactId": "66f1a2b3c4d5e6f7a8b9c0d1",
  "verificationImagePublicId": "hidden-nepal/verification/2026/01/abc123",
  "additionalPhotos": [ { "publicId": ".../def456", "caption": null } ],
  "location": { "latitude": 27.6730, "longitude": 85.3240, "accuracyMeters": 12.4,
                "altitudeMeters": 1402, "capturedAt": "2026-01-02T09:14:33.000Z" },
  "privateNote": "optional"
}
```

Rules (strict schema): `userId`, `gpsVerification.*`, `cvVerification.*`,
`similarityScore`, `status`, `xpAwarded`, `discoveryId`, `storyUnlocked`,
`questProgress` must be **absent** (any present → `422`). `capturedAt` within last
10 min, not future. `accuracyMeters` present and ≤ 100 m. Max 6 `additionalPhotos`.
Image must be a `publicId` signed for this user.

**CV runs synchronously. No pending state, no queue, no polling.** The client
waits for one response; on failure re-POSTs the same `Idempotency-Key`. Every
`201` carries the current status; `FLAGGED` is terminal for auto-verification but
open to admin review.

Handler order (deliberately opposite of a queued design):

```text
1. validate body, resolve identity + artifact   (cheap)
2. GPS distance                                 (cheap) → 422, nothing persisted
3. duplicate-discovery check                    (cheap) → 409 with existing discoveryId
4. CV compare vs reference embeddings           (SLOW, external) → 503, nothing persisted
5. transaction: insert attempt (already terminal), discovery, xpTransactions,
   pointsTransactions; increment lifetimeXp + pointsBalance; update quests; award badges
6. return receipt
```

The attempt row is written **inside** step 5, after CV — so a CV outage persists
nothing and there is no half-finished attempt.

Responses (`201`):

```jsonc
// GPS passed, no CV required
{ "attemptId": "...", "status": "VERIFIED", "discoveryId": "...",
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": false, "status": "NOT_REQUIRED" },
  "xpAwarded": 250, "pointsAwarded": 250, "pointsBalance": 1450,
  "newlyUnlockedStory": true,
  "quest": { "id": "...", "discoveredCount": 2, "artifactCount": 3 }, "badge": null }

// GPS passed, CV matched
{ "attemptId": "...", "status": "VERIFIED", "discoveryId": "...",
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": true, "status": "PASSED", "similarityScore": 0.87,
          "threshold": 0.72, "topK": 3 },
  "xpAwarded": 250, "pointsAwarded": 250, "pointsBalance": 1450,
  "newlyUnlockedStory": true,
  "quest": { "id": "...", "discoveredCount": 2, "artifactCount": 3 },
  "badge": { "name": "First Temple", "iconUrl": "..." } }

// GPS passed, CV did not match → FLAGGED, not a rejection
{ "attemptId": "...", "status": "FLAGGED", "discoveryId": null,
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": true, "status": "FAILED", "similarityScore": 0.41,
          "threshold": 0.72, "topK": 3 },
  "xpAwarded": 0, "pointsAwarded": 0, "pointsBalance": 1200,
  "newlyUnlockedStory": true, "quest": null, "badge": null,
  "message": "Your photo needs review. This usually takes a few hours." }
```

`newlyUnlockedStory` is `true` even when discovery is not awarded, because story
unlock is driven by proximity, not verification.

Failures:

```jsonc
// GPS failed → 422
{ "error": { "code": "GPS_OUTSIDE_RADIUS", "message": "...",
  "details": { "distanceMeters": 490, "requiredMeters": 150, "shortfallMeters": 340 } } }

// CV unreachable → 503; re-POST same Idempotency-Key
{ "error": { "code": "CV_UNAVAILABLE", "message": "...",
  "details": { "retryable": true, "retryAfterSeconds": 30 } } }

// Already discovered → 409 with existing discoveryId; CV skipped
{ "error": { "code": "ALREADY_DISCOVERED", "message": "...",
  "details": { "discoveryId": "...", "discoveredAt": "..." } } }
```

`ALREADY_DISCOVERED` returns the existing `discoveryId` so the client routes
straight to the success screen. The duplicate check runs before CV, so a duplicate
costs no GPU time.

**Synchronous budget:** 8 s CV timeout × 3 retries ≈ 24 s, + < 1 s local ≈ **~25 s
worst case**. The deployment must allow ~30 s (`maxDuration`) or synchronous CV is
not viable. The 8 s per-attempt timeout is mandatory.

### `GET /verification-attempts/:id`

Returns `VerificationAttempt`. Owner-only; non-owner gets `404`. **Not a polling
endpoint** — no `terminal`, no `pollAfterSeconds`; every returned attempt is
already terminal. Exists for attempt history and recovery from a lost response.
`verificationImageUrl` is short-lived; do not cache beyond the screen.

### `POST /verification-attempts/:id/recheck`

```json
{ "location": { "latitude": 27.6730, "longitude": 85.3240, "accuracyMeters": 8.1,
                "altitudeMeters": 1402, "capturedAt": "2026-01-02T09:31:00.000Z" } }
```

Re-runs GPS from the fresh position and CV synchronously against the same
references. **Creates a new attempt; never mutates the original.**

```text
attempt #1 (FLAGGED) --POST /:id/recheck--> attempt #2 (VERIFIED)
                                            supersedesAttemptId = attempt #1
```

- New attempt carries `supersedesAttemptId`; response includes `previousAttemptId`.
- Original attempt keeps its status.
- If #2 is `VERIFIED`, normal award transaction runs (duplicate rule still applies).
- No `Idempotency-Key` (new coordinates are new evidence, not a retry).
- CV outage → `503`, both attempts untouched; never mutated to rejection.
- Does **not** accept a verdict. No field exists for a client to assert one.

### Forbidden fields (hard `422`, not stripped)

```text
userId, status, gpsVerification, cvVerification, similarityScore,
xpAwarded, discoveryId, storyUnlocked, questProgress
```

---

## 7. Discovery, Collection, Quest, Badge, Leaderboard

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/v1/discoveries` | required |
| `GET` | `/api/v1/discoveries/:id/receipt` | required (owner) |
| `GET` | `/api/v1/collection` | required |
| `GET` | `/api/v1/quests` | optional |
| `GET` | `/api/v1/quests/:id` | required |
| `GET` | `/api/v1/badges` | required |
| `GET` | `/api/v1/leaderboard` | optional |

### `GET /discoveries`

```json
{ "items": [ { "id": "...", "discoveredAt": "...", "xpAwarded": 250,
    "artifact": { "id": "...", "name": "...", "category": "TEMPLE",
      "coverImageUrl": "...", "humanReadableLocation": "...",
      "rarity": "Rare", "distanceMeters": 88 } } ],
  "page": { "nextCursor": null, "hasMore": false } }
```

`rarity` is a **server-derived** DTO field (not a client switch).

### `GET /discoveries/:id/receipt`

Returns `DiscoveryReceipt`. Owner-only. Returns only badges awarded **by this
discovery**, or `null` (never the most recent badge unconditionally).

### `GET /collection`

```json
{ "items": [ { "id": "...", "title": "...", "humanReadableLocation": "...",
  "xp": 250, "coverImageUrl": "...", "rarity": "Rare",
  "discoveredAt": "...", "discovered": true } ],
  "meta": { "total": 12, "totalXp": 3100 } }
```

Server-side join of `discoveries` → `artifacts`, excluding non-`PUBLISHED`.

### `/quests` and `/quests/:id`

Return `QuestSummary[]` / `QuestDetail`. Progress computed server-side from
`discoveredArtifactIds` / `artifactIds`. `GET /quests` may be called
unauthenticated (`discoveredCount: 0`, `completed: false`).

### `/badges`

```json
{ "items": [ { "id": "...", "name": "...", "description": "...", "iconUrl": "...",
  "unlocked": true, "earnedAt": "...", "progress": { "current": 3, "required": 5 } } ],
  "meta": { "unlockedCount": 8, "totalCount": 14 } }
```

`progress` requires evaluating `badges.condition` against user aggregates — the
same evaluation used for awarding.

### `/leaderboard`

`?limit=100`. Returns ranked `accountStatus: "ACTIVE"` users, `$rank` computed in
aggregation, plus `{ currentUser: { rank, lifetimeXp } | null }`. `profileImageUrl`
is a CDN URL (never signed). Rank is **all-time** only.

---

## 8. Rewards and Notifications

Points are P0. Routes are required; only notifications is genuinely optional.

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/api/v1/rewards` | required |
| `GET` | `/api/v1/rewards/redemptions` | required |
| `POST` | `/api/v1/rewards/:id/redeem` | required |
| `GET` | `/api/v1/points/ledger` | required |
| `GET` | `/api/v1/notifications` | required |

### `GET /rewards`

```json
{ "items": [ { "id": "...", "title": "...", "description": "...", "pointCost": 500,
  "imageUrl": "...", "businessName": "Kumari Kitchen",
  "affordable": true, "redeemed": false } ],
  "meta": { "pointsBalance": 1200, "count": 6 } }
```

`affordable` and `pointsBalance` are server-computed.

### `POST /rewards/:id/redeem`

Takes no amount and no balance from the client. Header `Idempotency-Key` mandatory.
Atomic: verify active → check balance → decrement `pointsBalance` → append `SPENT`
to `pointsTransactions` → create `redemption`. A double-tap cannot double-spend.

**Business rule: a user may redeem a given reward at most once ever** (hence
`UNIQUE(userId, rewardId)` and `redeemed: true` in the list). A second attempt →
`409 REWARD_ALREADY_REDEEMED`. Multi-redemption would be a product change (drop
the unique index, rely on `Idempotency-Key`).

### `GET /points/ledger`

Cursor-paginated `{ items, page }`; each item is a `pointsTransactions` document
with `amount`, `balanceAfter`, `type`. Makes the balance auditable.

---

## 9. Admin Endpoints

Under `/api/v1/admin`. Every route requires `ADMIN`, except contribution review
which also admits `EXPERT`. Returns `AdminVerificationAttempt` where an attempt is
returned.

### Verification review

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/admin/verification?status=FLAGGED` | — |
| `POST` | `/admin/verification/:id/approve` | `{ "note": string \| null }` |
| `POST` | `/admin/verification/:id/reject` | `{ "reason": string, "note": string \| null }` |

`approve` resolves `FLAGGED` → `VERIFIED` and, if not already discovered, runs the
§6.2 award transaction. Both actions are idempotent, write a `review` block and an
`adminActions` document.

### Artifact and reference management

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/admin/artifacts?status=&limit=&cursor=` | — |
| `POST` | `/admin/artifacts` | `CreateArtifactRequest` |
| `PATCH` | `/admin/artifacts/:id` | `UpdateArtifactRequest` |
| `POST` | `/admin/artifacts/:id/references` | `CreateReferenceRequest` |
| `POST` | `/admin/artifacts/:id/references/embeddings` | `CreateEmbeddingRequest` |
| `DELETE` | `/admin/artifacts/:id/references/:refId` | — |

```ts
type CreateArtifactRequest = {
  name: string; slug?: string; description: string;
  category: ArtifactCategory; tags?: string[];
  latitude: number; longitude: number; altitudeMeters?: number | null;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number; verificationRadiusMeters: number;
  xpReward: number; requiresSnap: boolean; requiresCV: boolean;
  warnings?: string | null;
  status?: "DRAFT" | "PUBLISHED";          // defaults to DRAFT
};
type UpdateArtifactRequest =
  Partial<CreateArtifactRequest> & { status?: ArtifactStatus };

type CreateReferenceRequest = { imagePublicId: string; isCover?: boolean };
// server fetches image from Cloudinary, computes embedding, stores ArtifactReference

type CreateEmbeddingRequest = {
  embedding: number[]; embeddingDimension: number;
  model: { name: string; version: string }; isCover?: boolean;
};
```

Reference responses return `{ id, imageUrl, isCover, model }` — never the raw
`embedding`.

### Contribution review

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/admin/contributions?status=` | — |
| `POST` | `/admin/contributions/:id/approve` | `ContributionDecisionRequest` |
| `POST` | `/admin/contributions/:id/reject` | `{ "reason": string, "note": string \| null }` |

```ts
type ContributionDecisionRequest = {
  artifactId?: string;              // link to existing artifact, OR
  artifact?: CreateArtifactRequest; // create a new artifact
  note?: string | null;
};
```

Exactly one of `artifactId`/`artifact` required on approve; otherwise `422
INVALID_CONTRIBUTION_TARGET`. Creating an artifact runs in one transaction with the
approval and the `adminActions` document.

### Other admin routes

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/admin/quests` | `{ name, description, artifactIds: string[], badgeId?: string \| null }` |
| `PATCH` | `/admin/quests/:id` | partial |
| `POST` | `/admin/badges` | `{ name, description, iconUrl?, condition: BadgeCondition }` |
| `PATCH` | `/admin/badges/:id` | partial |
| `GET` | `/admin/users?q=&limit=&cursor=` | — |
| `POST` | `/admin/users/:id/suspend` | `{ reason: string, suspendedUntil?: string \| null }` |
| `GET` | `/admin/community?status=` | — |
| `POST` | `/admin/community/:id/hide` | `{ reason: string }` |
| `POST` | `/admin/xp-adjustments` | `XpAdjustmentRequest` |

```ts
type XpAdjustmentRequest = {
  userId: string;
  amount: number;       // non-zero; negative permitted
  reason: string;       // required, non-empty
  referenceId?: string;
};
```

`xp-adjustments` is the **only** route permitted to create a negative
`xpTransactions` entry. It adjusts `lifetimeXp` and appends the transaction in one
session; it does **not** touch `pointsBalance`. Response:
`{ lifetimeXp, transaction: { id, amount, reason, createdAt } }`.

Every admin mutation writes an `adminActions` document in the same transaction.

---

## 10. Authorization Matrix

`Auth` in tables is shorthand; this matrix is normative. Disallowed role → `403`;
unauthenticated on a required route → `401`.

Roles: `USER` (any authenticated user), `EXPERT` (USER + contribution review),
`ADMIN`. Anonymous = no valid Clerk session.

| Endpoint group | Anonymous | USER | EXPERT | ADMIN |
| --- | --- | --- | --- | --- |
| `GET /artifacts/:id` | read, `storyUnlocked:false` | read | read | read |
| `GET /artifacts/:id/snaps` | read `ACTIVE` | read `ACTIVE` | read `ACTIVE` | read all |
| `GET /artifacts/featured` | read | read | read | read |
| `GET /quests`, `/leaderboard` | read | read | read | read |
| Nearby/search/geofence/distance/navigation | — | read | read | read |
| `POST /artifacts/:id/unlock-story` | — | own | own | own |
| `POST /artifacts/:id/snaps` | — | own | own | own |
| `POST /verification-attempts` + `recheck` | — | own | own | own |
| `GET /verification-attempts[/:id]` | — | own only | own only | own only |
| `/me*`, `/usernames/availability` | — | own | own | own |
| `/discoveries*`, `/collection`, `/badges` | — | own | own | own |
| `/rewards*`, `/points/ledger`, `/notifications` | — | own | own | own |
| `/admin/contributions*` | — | — | review | full |
| All other `/admin/*` | — | — | — | full |

- Ownership is checked server-side. `GET /verification-attempts/:id` with another
  user's id returns `404`, not `403` (no id probing).
- `storyUnlocked` is per-viewer; anonymous/non-unlocking callers never get `story`.
- `EXPERT` may only review contributions — not verification, artifacts, users, XP.
- Admin decisions record the acting admin in `adminActions`; never client-supplied.

---

## 11. Data-Model Rules the API Depends On

| Rule | Detail |
| --- | --- |
| Story unlock | `storyUnlocks` collection, `UNIQUE(userId, artifactId)`; written on proximity alone, independent of discovery. |
| Artifact status | `DRAFT\|PUBLISHED\|ARCHIVED\|DISABLED`; every discoverable/searchable/returnable filter matches `PUBLISHED`. |
| Verification status | Only `VERIFIED\|FLAGGED\|REJECTED` are ever persisted; no pending rows. |
| Attempt immutability | Attempts are never edited except `FLAGGED → VERIFIED|REJECTED` by admin. Recheck inserts a new attempt with `supersedesAttemptId`. |
| Points vs XP | `users.pointsBalance` (cache, ≥ 0) backed by append-only `pointsTransactions` (`EARNED|SPENT|ADJUSTED`, positive `amount`, `balanceAfter`, `reason`, `referenceId`). XP and points are separate; redemption never lowers XP. |
| Redemption | `redemptions` (`CONFIRMED|FULFILLED|CANCELLED`) with `UNIQUE(userId, rewardId)` → one redemption per reward ever. |
| Community snaps | Separate `communitySnaps` docs, default `status: "PENDING"`, referencing `verificationAttemptId`. Verification `additionalPhotos` are always private. |
| Photo + moderation | No public photo without an explicit `ACTIVE` status. |
| Geo | `2dsphere` on `artifacts.location`; radius always capped server-side. |
| Identity | `users.username`, `users.clerkUserId`, `artifacts.slug` unique; `lifetimeXp` indexed for leaderboard. |

---

## 12. Open Decisions

| # | Decision | Recommendation |
| --- | --- | --- |
| 5 | Are `requiresSnap: false` artifacts verifiable? | Leave supported, untested. |
| 6 | Leaderboard scope: all-time or time windows? | All-time only, per PRD. |
| 7 | Confirm anonymous read access. | Assume yes for `GET /artifacts/:id` and `GET /quests`. |
| 8 | Max `additionalPhotos` and image size. | 6 photos, 10 MB each, 12 MP max. |
| 10 | Does the deployment tolerate a ~25 s request? | Verify `maxDuration` before building — gates synchronous CV. |
| 11 | `FLAGGED` review window/retention. | 30-day window, then auto-`REJECTED`. |

---

## 13. Behaviours That Must Not Carry Over

1. **Client asserting a CV score.** Current code writes `cv_status: "pass"`,
   `cv_similarity_score: 1` from the device. The contract exposes no such field.
2. **Unbounded radius.** No `2147483647`; all radii capped server-side.
3. **Client-side presentation logic.** Rarity, quest-progress counting, and
   points-equals-XP must move server-side.
4. **Story fetched unconditionally.** `story` is gated in the serializer, absent
   when locked.
5. **Nationwide catalogue cached on device.** Replaced by server-side search.
6. **The polling screen.** `verification-pending.tsx` must be deleted, not migrated.
7. **Multi-round-trip verification.** Replaced by sign + one atomic submit.
8. **N+1 client joins.** Replaced by aggregated endpoints.
9. **Other users' `accountStatus` exposed** on the leaderboard. Not returned.
