# Sanskriti Snap — REST API Contract

**Version:** 1.0
**Status:** Derived from v2.0 requirements
**Backend:** Next.js (App Router) REST API
**Database:** MongoDB via Mongoose
**Auth:** Clerk
**Media:** Cloudinary
**Client:** React Native / Expo mobile app

---

# 1. Purpose and Sources of Truth

This document specifies the HTTP contract between the mobile client and the Next.js
backend for the v2.0 stack (Next.js + MongoDB + Clerk + Cloudinary).

It is **derived from**, and must not be designed independently of:

| Source | Role |
| --- | --- |
| `DB Schemas.md` | Canonical persistent-data model. Collections, fields, indexes, invariants. |
| `Backend TDS.md` | Backend architecture, error format, status codes, domain flows. |
| `Project Requirements Doc.md` | Product behaviour the API must support. |
| `Sanskriti-Snap/SanskritiSnapApp/src` | **Observed client data access.** Every endpoint below exists because the client demonstrably needs it. |

`DB Schemas.md` §35 establishes that the schema is the source of truth for
persistent state and that the API exposes DTOs rather than MongoDB documents.
Where this contract and `Backend TDS.md` disagree on naming, this document
follows `DB Schemas.md`.

**The current client runs against Supabase/PostgreSQL.** This contract is a
migration target, not a description of current behaviour. §12 lists every
behaviour that must not be carried over.

---

# 2. Conventions

## 2.1 Base and Transport

```text
Base URL:        https://api.hiddennepal.app
Version prefix:  /api/v1        (fixed for the life of v1 — see below)
Content type:    application/json; charset=utf-8
Timezone:        UTC everywhere. Timestamps are ISO 8601 with Z suffix.
Identifiers:     MongoDB ObjectId, serialised as a 24-char lowercase hex string.
```

Every path in this document is written in full, including the prefix, so a route
is always greppable: `/api/v1/artifacts/nearby`.

**The version is in the path, not a header, and it stays `/v1` for the life of
the major version.** A v2 will be served at `/api/v2` alongside v1 rather than
replacing it, so a client that has not been updated keeps working. Additive
changes — new fields, new endpoints, new enum members — ship inside v1; anything
that removes or renames a field ships as `/api/v2`.

This is a deliberate departure from `Backend TDS.md` §68, whose example paths are
unversioned. A v1 prefix added after the first client ships is a breaking change
for every installed build, and this app is distributed as an EAS APK that users
update on their own schedule, so an unversioned path cannot be corrected later
without stranding old installs.

## 2.2 Authentication

Clerk owns authentication. The client obtains a Clerk session token and sends it
on every authenticated request:

```http
Authorization: Bearer <clerk_session_token>
```

The backend verifies the token with Clerk's SDK and derives the application user
from `clerkUserId`. See §2.3.

**The client never sends a user id in a request body, query string, or path** for
resources it does not own. The backend resolves identity exclusively from the
token. This is the single most important authorization rule in this contract.

## 2.3 Identity Resolution

Clerk user ids are strings. The `users` collection uses `ObjectId` internally and
stores `clerkUserId` as the external key. Every authenticated handler performs
this resolution before touching any user-owned data:

```text
clerkUserId (from token)
      ↓
users.findOne({ clerkUserId })
      ↓
user._id  ← used for all subsequent queries
```

Clients hold and pass `clerkUserId` only for display purposes (own profile
rendering). It is never used as an authorization input.

## 2.4 Error Format

Extends `Backend TDS.md` §64 with an optional `details` field:

```json
{
  "error": {
    "code": "GPS_OUTSIDE_RADIUS",
    "message": "You are 340 m from Patan Durbar Square. Move within 150 m to verify.",
    "details": {
      "distanceMeters": 490,
      "requiredMeters": 150,
      "shortfallMeters": 340
    }
  }
}
```

Rules:

* `code` is a stable `UPPER_SNAKE_CASE` string. Clients branch on `code`, never on
  `message`.
* `message` is human-readable and may be shown directly to users. It must not
  contain stack traces, internal ids, or query details.
* `details` is optional and machine-readable. When a failure is a distance or
  validation problem, it must carry the numbers the client needs to render useful
  UI, so the client never has to recompute a server-authoritative value.
* Stack traces are never returned.

### Error Codes

| Code | Status | Meaning |
| --- | --- | --- |
| `UNAUTHENTICATED` | 401 | Missing, expired, or invalid session token. |
| `FORBIDDEN` | 403 | Authenticated but role/account status disallows the action. |
| `ACCOUNT_SUSPENDED` | 403 | `accountStatus !== "ACTIVE"`. |
| `NOT_FOUND` | 404 | Resource does not exist, or is not visible to this caller. |
| `VALIDATION_FAILED` | 422 | Body/query failed schema validation. `details.fields` per field. |
| `USERNAME_TAKEN` | 409 | Unique `users.username` collision. |
| `ALREADY_DISCOVERED` | 409 | Duplicate discovery. Not an error the user caused; return the existing discovery. |
| `ARTIFACT_UNAVAILABLE` | 409 | Artifact status is not `PUBLISHED` (e.g. `DRAFT`, `ARCHIVED`, `DISABLED`), so it cannot be newly discovered. |
| `GPS_OUTSIDE_RADIUS` | 422 | Client is outside `verificationRadiusMeters`. See `details`. |
| `IMAGE_REQUIRED` | 422 | Artifact has `requiresSnap: true` but the request omitted `verificationImagePublicId`. |
| `CV_UNAVAILABLE` | 503 | CV service could not be reached, or timed out after bounded retries. **Nothing is persisted** — the client should re-POST the same `Idempotency-Key`. Never a user rejection. See §6.2. |
| `CV_TIMEOUT` | 504 | CV did not return within the request budget. Nothing persisted. See §6.2. |
| `RATE_LIMITED` | 429 | See `details.retryAfterSeconds`. |
| `INTERNAL_ERROR` | 500 | Unexpected server fault. |

A missing `cv` match is **not** an error code. Low similarity is a domain
outcome: the attempt becomes `FLAGGED` (review) per `Backend TDS.md` §37, and the
response carries that in `status`. Likewise, `requiresSnap: false` does not make
an artifact unverifiable — it means a photo is optional for that artifact, so
`verificationImagePublicId` may be omitted (`DB Schemas.md` §5; the admin form
labels the field "Require a snap").

A `404` must be returned instead of `403` when revealing existence would leak
information. Disabled artifacts return `404` to non-admins.

## 2.5 Status Codes

Per `Backend TDS.md` §65. Additions relevant here:

| Code | Use |
| --- | --- |
| `201 Created` | Verification attempt created. Because CV is synchronous, a `201` is **always a complete automatic verdict** — the response carries the attempt's current status. |
| `503` / `504` | The CV service could not produce a verdict. Nothing is persisted, so the client re-POSTs with the same `Idempotency-Key`. |
| `409 Conflict` | State conflict: duplicate discovery, username taken, illegal state transition. |

There is no `202` and no pending state in this contract. `POST
/api/v1/verification-attempts` either returns a synchronous verdict or returns an
error and persists nothing.

**Request lifecycle vs business lifecycle.** The *request* is synchronous and
persists no intermediate state. The *business* record can still move after the
response: `FLAGGED` is terminal for automatic verification — there is no later
automatic step — but it remains open to administrative review, which can move it
to `VERIFIED` or `REJECTED` (§9). A `VERIFIED` or `REJECTED` attempt is fully
terminal.

## 2.6 Pagination

List endpoints that can grow accept cursor pagination:

```http
GET /api/v1/artifacts?limit=20&cursor=<opaque>
```

```json
{
  "items": [ ... ],
  "page": {
    "nextCursor": "eyJ2Ijoi...fQ",
    "hasMore": true
  }
}
```

`cursor` is opaque and must not be parsed by clients. Default `limit` is 20,
maximum 100. Endpoints that are inherently bounded (nearby artifacts, quest lists,
badge lists, leaderboard) use a hard server-side cap and ignore `cursor`.

## 2.7 Idempotency

Any `POST` that creates a stateful resource **must** accept an idempotency key:

```http
Idempotency-Key: <uuid v4>
```

The backend stores the key with the result for 24 hours and replays the stored
response for a repeat request. This is mandatory for verification submission,
because a mobile client on a flaky connection will retry, and `Backend TDS.md` §43
requires verification idempotency.

## 2.8 DTO Rules

`DB Schemas.md` §35 requires DTOs rather than raw MongoDB documents. Rules:

* **Never** return `_id` as `_id`; return it as `id`.
* **Never** return: `clerkUserId`, `createdBy`, `updatedBy`, `cvConfiguration`,
  `embedding`, `embeddingDimension`, any moderation field, `accountStatus` of
  other users, or internal review notes.
* **Conditional fields are mandatory**, not optional. See §3.1 and §6.3.
* Coordinates are returned as flat `latitude` / `longitude` numbers for client
  convenience. The stored GeoJSON `[longitude, latitude]` order is an internal
  detail and must never leak, because it is the opposite of the intuitive order
  and the client map library expects `[lng, lat]`.
* Enum casing differs between the old PostgreSQL schema and the v2.0 model.
  `DB Schemas.md` uses `UPPER_SNAKE_CASE` (`"TEMPLE"`, `"PUBLISHED"`). The API uses
  the same casing as the schema, with two exceptions. Artifact status is
  `DRAFT | PUBLISHED | ARCHIVED | DISABLED`, following `Backend TDS.md` §16 rather
  than `DB Schemas.md` §5 (§11.7). `rarity` is TitleCase —
  `"Common" | "Rare" | "Epic" | "Legendary"` (§11.5) — because it is a display
  label the client renders verbatim, not a discriminator the client switches on.
  Do not "fix" either one to match the surrounding casing. The client's
  `getCategoryIcon` switch must be updated accordingly — see §12.3.

---

# 3. DTO Catalogue

## 3.1 Artifact

```ts
type ArtifactSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ArtifactCategory;          // "TEMPLE" | "SITE" | "STATUE" | "CARVING"
                                        // | "ARCHITECTURE" | "MONUMENT"
                                        // | "COURTYARD" | "CULTURAL_OBJECT" | "OTHER"
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
  coverImageUrl: string | null;        // denormalised first reference image; backend-maintained
  rarity: Rarity;                      // uploader-set, stored on the artifact (§11.5)
  distanceMeters: number | null;       // present only when the request supplied a location
};

type Rarity = "Common" | "Rare" | "Epic" | "Legendary";   // TitleCase — see §2.8
```

**`ArtifactSummary` deliberately carries only `coverImageUrl`, not
`referenceImageUrls`.** Summary DTOs are returned in bulk by the map and search
endpoints; shipping the full reference-image array per marker would send tens of
images per artifact for a card that renders one. The full
`referenceImageUrls: string[]` is a detail-only field (§3.2).

Both `coverImageUrl` and `referenceImageUrls` derive from the
`artifactReferences` collection, not from a stored array on the artifact. The
backend resolves them:

```text
Artifact → ArtifactReference[] (imageUrl, embedding, model)
referenceImageUrls = references.map(r => r.imageUrl)
coverImageUrl       = the designated cover reference's imageUrl (denormalised on Artifact for list-query performance)
```

If the cover URL is denormalised onto the artifact document, it is a
backend-maintained cache of `ArtifactReference` state and must never be written by
a client.

`coverImageUrl` exists because the current client indexes into the image array in
**9 places across 7 files**, 5 of which use the `reference_images[0] ?? ""`
fallback (`progress.ts:54,222`, `discovery-success.tsx:63`, `home.tsx:43,60`,
`verification-failed.tsx:31`). The other 4 index with no guard at all
(`ArtifactCard.tsx:51`, `snap/[artifactId]/confirm.tsx:115`, `search.tsx:292`),
which throws on an artifact with an empty `reference_images`. The client should
not index into an array to render a card in any case.

## 3.2 ArtifactDetail

Returned by `GET /api/v1/artifacts/:id`. Extends `ArtifactSummary` with
**viewer-specific** state.

```ts
type ArtifactDetail = ArtifactSummary & {
  altitudeMeters: number | null;
  referenceImageUrls: string[];        // full set; detail-only (§3.1)
  storyUnlocked: boolean;
  story: string;                       // present IFF storyUnlocked === true; otherwise ABSENT
  discovered: boolean;
  discoveredAt: string | null;
  attemptSummary: {
    latestAttemptId: string | null;
    latestAttemptStatus: VerificationStatus | null;
  };
  questIds: string[];
};
```

**`story` is a conditional property, not a nullable one.** The rule is: `story`
is present **if and only if** `storyUnlocked === true`; otherwise the property
**must be absent from the JSON entirely** — not present with a `null` value. A
`string | null` declaration was wrong: it invited a serializer to emit
`"story": null` and left open the possibility of a protected story travelling in
a field some layer decides to populate.

```jsonc
// locked
{ "storyUnlocked": false, "discovered": false }

// unlocked
{ "storyUnlocked": true, "story": "The temple was built in..." }
```

`attemptSummary` deliberately has **no** `attemptsRemaining` field. Neither
`DB Schemas.md` nor `Backend TDS.md` defines a cap on verification attempts per
artifact, and `recheck` (§6.4) is currently unbounded. If product later defines
a cap, add `attemptsRemaining: number` here and enforce the cap in the recheck
handler; until then an attempt-count field would be a client-visible promise the
backend does not keep.

**`story` is the security-critical field.** It must be physically absent from the
serialised response when `storyUnlocked` is false. The current client fetches
`story` unconditionally from the artifact row (`artifacts/[id].tsx:48`), which
means under the current RLS policy the story text is world-readable. See §12.4.

## 3.3 VerificationAttempt

```ts
type VerificationAttempt = {
  id: string;
  artifactId: string;
  artifact: Pick<ArtifactSummary, "id" | "name" | "coverImageUrl"
                                   | "humanReadableLocation" | "xpReward">;
  status: "VERIFIED" | "FLAGGED" | "REJECTED";
  rejectionReason: string | null;
  submittedAt: string;
  verificationImageUrl: string | null;   // short-lived signed URL, not a permanent one
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
  supersedesAttemptId: string | null;     // set when this attempt came from a recheck
};
```

`VerificationAttempt` is the **public** DTO. It intentionally omits internal CV
configuration: the embedding `model` (`name`/`version`), `matchedReferenceIds`,
any raw per-reference scores, the automated `flagReason`, and admin `review`
notes. Admin surfaces use `AdminVerificationAttempt` (§9), which adds those fields.

This collapses five separate reads the client currently performs
(`submissions` + `discoveries` + `artifacts` + a signed-URL call + a distance RPC).

**The enums are deliberately smaller than `DB Schemas.md` §7 and §8.** Because CV
is synchronous (§6.2), an attempt row is only written once the verdict is known,
so `PENDING`, `PROCESSING`, `FAILED`, `UNAVAILABLE`, and `ERROR` are unreachable
— there is no instant at which they could be read or written. `REJECTED` is
reachable only through admin review of a `FLAGGED` attempt (§9). The single
legitimate state change is `FLAGGED → VERIFIED` or `FLAGGED → REJECTED`; nothing
else mutates an attempt.

Keeping the wider enum would imply the client can observe a pending attempt. It
cannot. `DB Schemas.md` §7, §8 and §31 must be narrowed to match, and the
`PENDING`/`PROCESSING` branches in its state diagram (§8) deleted.

## 3.4 UserProfile

```ts
type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: "USER" | "EXPERT" | "ADMIN";   // own profile only
  accountStatus: "ACTIVE" | "SUSPENDED" | "DELETED";
  lifetimeXp: number;
  pointsBalance: number;         // ledger-backed, see §11.2
  notifications: { enabled: boolean; radiusMeters: number };
  createdAt: string;
};
```

`role` and `accountStatus` are returned **only for the requesting user's own
profile**, and on leaderboard rows the caller is permitted to see. They are never
returned for arbitrary other users.

## 3.5 Quest

```ts
type QuestSummary = {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  artifactCount: number;
  discoveredCount: number;
  progressPercent: number;             // 0..100, integer
  completed: boolean;
  badge: { id: string; name: string } | null;
};

type QuestDetail = QuestSummary & {
  artifacts: Array<{
    id: string;
    name: string;
    humanReadableLocation: string;
    coverImageUrl: string | null;
    category: ArtifactCategory;
    discovered: boolean;
  }>;
};
```

`DB Schemas.md` §11 defines progress as
`discoveredArtifactIds.length / quest.artifactIds.length`. The backend computes
`progressPercent`; the client must not divide, and must not infer progress from
other collections.

## 3.6 Badge

```ts
type Badge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  unlocked: boolean;
  earnedAt: string | null;
  progress?: { current: number; required: number };  // present when condition.type !== FIRST_DISCOVERY
};
```

## 3.7 DiscoveryReceipt

```ts
type DiscoveryReceipt = {
  id: string;
  discoveredAt: string;
  xpAwarded: number;
  artifact: Pick<ArtifactSummary, "id" | "name" | "category" | "coverImageUrl">;
  verificationAttemptId: string;
  quest: { id: string; name: string; discoveredCount: number; artifactCount: number } | null;
  badge: { name: string; iconUrl: string | null } | null;
  lifetimeXp: number;                  // user's total after this award
};
```

Replaces six sequential reads on the success screen.

## 3.8 CommunitySnap

```ts
type CommunitySnap = {
  id: string;
  artifactId: string;
  author: { username: string; displayName: string; profileImageUrl: string | null } | null;
  verificationAttemptId: string | null;   // provenance; null for legacy/imported snaps
  imageUrl: string;
  caption: string | null;
  status: "PENDING" | "ACTIVE" | "HIDDEN" | "REMOVED";
  createdAt: string;
};
```

A `CommunitySnap` is the **only** way a verification photo becomes public. It
references the originating `verificationAttemptId` so provenance is never lost.
The public `author` object carries presentation fields only; the raw `userId` is
not exposed.

## 3.9 AdminVerificationAttempt

Extends the public `VerificationAttempt` with fields that are hidden from normal
clients but needed by the admin review UI.

```ts
type AdminVerificationAttempt = VerificationAttempt & {
  user: { id: string; username: string; displayName: string };
  cv: VerificationAttempt["cv"] & {
    model: { name: string; version: string } | null;
    matchedReferenceIds: string[];
  } | null;
  flagReason: string | null;              // why automatic verification flagged it
  review: {
    reviewedBy: string;
    reviewedAt: string;
    decision: "APPROVED" | "REJECTED";
    note: string | null;
  } | null;
};
```

`model`, `matchedReferenceIds`, per-reference scores, `flagReason`, and `review`
notes are **never** returned by the public `VerificationAttempt` DTO.

---

# 4. Identity and Profile Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/me` | required | Own profile. Replaces `profiles` select in `authstore`. |
| `PATCH` | `/api/v1/me` | required | Update mutable profile fields. |
| `PATCH` | `/api/v1/me/username` | required | Claim/change username. |
| `GET` | `/api/v1/usernames/availability` | required | Debounced availability probe. |
| `PATCH` | `/api/v1/me/preferences` | required | Notification toggle and radius. |
| `GET` | `/api/v1/me/summary` | required | Profile screen aggregate. |

### `GET /api/v1/me`

Returns `UserProfile`. Called on app launch and after any XP-affecting action, so
it is the client's XP source of truth.

### `PATCH /api/v1/me`

```json
{ "displayName": "Asha", "profileImagePublicId": "profile/xyz" }
```

Only `displayName` and `profileImagePublicId` are writable. Attempting
`lifetimeXp`, `role`, or `accountStatus` returns `422 VALIDATION_FAILED` — the
schema is strict, not filtered, so a client bug surfaces loudly.

`profileImagePublicId` is the Cloudinary public id returned by
`POST /api/v1/media/sign`; the CDN URL is derived server-side, so a client
cannot point its avatar at an arbitrary host.

`profileImage` has two provenances and the stored `publicId` distinguishes them.
A user who has never uploaded an avatar carries the Clerk-hosted image, captured
at provisioning and stored as `{ url, publicId: null }` — displayable, but not a
Cloudinary asset. An avatar uploaded through `media/sign` carries a real
`publicId`. The Clerk copy is kept rather than dropped because `profileImageUrl`
appears on the leaderboard (§7.6) and a client can only read its *own* Clerk
user, so other users' rows have no fallback. It can go stale if the user changes
their avatar in Clerk; that is accepted at this scale.

All three `PATCH` routes in this section respond with the updated `UserProfile`,
so the client replaces its cached profile from the mutation rather than issuing
a follow-up `GET /api/v1/me`. `PATCH /api/v1/me` with `{}` is a no-op that
returns the current profile; it is not an error.

### `PATCH /api/v1/me/username`

```json
{ "username": "asha_r" }
```

Rules: 3–30 chars, `^[a-zA-Z0-9_]+$`. The `users.username` unique index is the
final defense; a collision returns `409 USERNAME_TAKEN`. The current client
pre-checks availability and then handles error code `23505`; both are retained as
UX affordances, but the unique index is what actually guarantees correctness.

### `GET /api/v1/usernames/availability?username=asha_r`

```json
{ "username": "asha_r", "available": true }
```

`404` is not returned for "taken" — availability is a normal answer, not an error.
Excludes the caller's own current username.

The query is validated with the same rules as the claim itself (3–30 chars,
`^[a-zA-Z0-9_]+$`), so the probe cannot disagree with `PATCH /me/username` about
what is even a candidate. Matching is **case-sensitive**, because
`users.username` carries no collation and `Asha` / `asha` are therefore distinct
rows; a case-insensitive probe would answer "taken" and then let the claim
succeed. If usernames should be case-insensitive, that is an index change in
`DB Schemas.md`, not a route change.

### `GET /api/v1/me/summary`

```json
{
  "profile": { },
  "stats": {
    "discoveryCount": 12,
    "questCount": 5,
    "completedQuestCount": 2,
    "badgeCount": 8,
    "rank": 143,
    "totalUsers": 1204
  }
}
```

Replaces the `user_quest_progress` read on the profile screen. Aggregated in one
query set rather than the client issuing a separate progress fetch.

Field definitions, so the client does not have to infer them:

* `questCount` is the number of quests the caller has **progress on**, not the
  number that exist — the profile screen shows "2 of 5". `completedQuestCount`
  is the subset with `completedAt` set.
* `rank` and `totalUsers` are both computed over `accountStatus: "ACTIVE"`, so
  they are consistent with each other and with the leaderboard (§7.6). Rank is
  all-time and **competition-ranked**: users level on XP share a rank, so it is
  not an array index.

---

# 5. Artifact Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/artifacts/nearby` | required | Explore map markers. |
| `GET` | `/api/v1/artifacts/nearby/geofence-regions` | required | Proximity geofence candidates. |
| `GET` | `/api/v1/artifacts/featured` | optional | Home screen cards. |
| `GET` | `/api/v1/artifacts/search` | required | Artifact search. |
| `GET` | `/api/v1/artifacts/:id` | optional | Artifact detail with viewer state. |
| `GET` | `/api/v1/artifacts/:id/distance` | required | Distance from a supplied point. |
| `GET` | `/api/v1/artifacts/:id/navigation` | required | Navigation target data. |
| `POST` | `/api/v1/artifacts/:id/unlock-story` | required | Unlock the story at the current location. |
| `GET` | `/api/v1/artifacts/:id/snaps` | optional | Public community snaps for the artifact. |
| `POST` | `/api/v1/artifacts/:id/snaps` | required | Publish a verification photo as a community snap. |

## 5.1 `GET /api/v1/artifacts/nearby`

```http
GET /api/v1/artifacts/nearby?latitude=27.6730&longitude=85.3240&radiusMeters=5000
```

| Parameter | Required | Default | Max |
| --- | --- | --- | --- |
| `latitude` | yes | — | -90..90 |
| `longitude` | yes | — | -180..180 |
| `radiusMeters` | no | `5000` | `50000` |
| `limit` | no | `100` | `200` |

```json
{
  "items": [ { "...": "ArtifactSummary" } ],
  "meta": { "count": 23, "radiusMeters": 5000, "center": { "latitude": 27.673, "longitude": 85.324 } }
}
```

Implementation: `$geoNear` as the **first** pipeline stage, `distanceField` into
`distanceMeters`, `spherical: true`, `maxDistance: radiusMeters`, sorted nearest
first, then `$match: { status: "PUBLISHED" }`. `DRAFT` artifacts are excluded
here, which is the point of having the state: an artifact saved in the admin
dashboard without images or coordinates is not discoverable.

Two constraints that are not optional:

* `radiusMeters` is **capped server-side at 50 000**. The current client passes
  `2147483647` in two places to force "give me everything" and then filters
  client-side. That is an unbounded scan and must not survive the migration. §12.2.
* The response must exclude `story`, `createdBy`, `updatedBy`, and
  `cvConfiguration`. The map does not render them, and the story must not be
  pre-unlocked by proximity on the client.

## 5.2 `GET /api/v1/artifacts/nearby/geofence-regions`

```http
GET /api/v1/artifacts/nearby/geofence-regions?latitude=27.6730&longitude=85.3240
```

```json
{
  "regions": [
    { "artifactId": "...", "name": "...", "latitude": 27.673, "longitude": 85.324,
      "suggestedRadiusMeters": 150 }
  ],
  "meta": { "totalAvailable": 34, "returned": 20, "truncated": true, "maxRegions": 20 }
}
```

Purpose-built for the geofencing service. Differences from `/nearby`:

* Hard cap of **20**, matching the OS geofence limit.
* Returns `truncated` and `totalAvailable` so the client can tell the user that
  coverage is partial rather than silently monitoring a subset. See
  `Frontend TDS.md` §20.1.
* `suggestedRadiusMeters` is `max(user radius, artifact verification radius)`,
  computed server-side so the client cannot register a region smaller than the
  artifact's verification radius.
* Artifacts the user has already discovered may be excluded to spend the 20 slots
  on still-relevant artifacts. This is a server policy decision and is documented
  here because it changes observable behaviour.

## 5.3 `GET /api/v1/artifacts/featured`

```http
GET /api/v1/artifacts/featured?latitude=27.6730&longitude=85.3240&limit=3
```

Returns top artifacts by `discoveryCount`. When `latitude`/`longitude` are
supplied the selection is neighbourhood-weighted; when omitted it falls back to
global popularity. Auth is **optional** so the home screen renders for a
signed-out user.

The current client branches on location permission in application code and issues
two different queries. Moving the branch to the server removes the divergence.

## 5.4 `GET /api/v1/artifacts/search`

```http
GET /api/v1/artifacts/search?q=patan&category=TEMPLE&limit=8
```

```json
{
  "items": [ { "...": "ArtifactSummary" } ],
  "meta": { "count": 3, "query": "patan" }
}
```

Matches `name`, `description`, `tags`, and `humanReadableLocation`. Server-side
only, using the `name` text index plus the `tags` and `category` indexes from
`DB Schemas.md` §5. Maximum `limit` is 25.

**This endpoint replaces the client-side search catalogue.** `nepal-search.ts`
currently fetches every artifact within 500 km of Nepal's centre, caches the whole
set in `AsyncStorage`, and does substring matching on-device. That is a
500 km `$geoNear` sweep to populate a local search index, it re-fetches the entire
dataset every 30 minutes, and it leaks the whole nationwide catalogue to the
device before the user types anything. See §12.5.

Search is case-insensitive and diacritic-tolerant. If Nepal-specific
transliteration handling (e.g. `स्वयम्भर` / `swoyambhu`) is needed, add a
normalized search field at index time rather than normalising client-side.

## 5.5 `GET /api/v1/artifacts/:id`

```http
GET /api/v1/artifacts/:id?latitude=27.6730&longitude=85.3240
```

Returns `ArtifactDetail`. Optional coordinates populate `distanceMeters`.

`story` is included **if and only if** `storyUnlocked` is true; when locked, the
`story` property is **absent**, not `null`. See §3.2 and §12.4.

Anonymous callers receive `storyUnlocked: false`, `discovered: false`, and no
`story` property. Authenticated callers additionally receive their own `questIds`
and `attemptSummary`.

## 5.6 `GET /api/v1/artifacts/:id/distance`

```http
GET /api/v1/artifacts/:id/distance?latitude=27.6730&longitude=85.3240
```

```json
{
  "artifactId": "...",
  "artifactName": "Patan Durbar Square",
  "distanceMeters": 490,
  "verificationRadiusMeters": 150,
  "storyUnlockRadiusMeters": 300,
  "withinVerificationRadius": false,
  "withinStoryUnlockRadius": false,
  "shortfallMeters": 340
}
```

Replaces the `p_radius_m: 2147483647` workaround and becomes the single source for
the "move 340 m closer" copy on the failure screen. Returns both radii so the
client can distinguish "walk closer to verify" from "walk closer to unlock the
story" — two different prompts that the current UI conflates.

## 5.7 `GET /api/v1/artifacts/:id/navigation`

```http
GET /api/v1/artifacts/:id/navigation
```

```json
{
  "artifactId": "...",
  "name": "Patan Durbar Square",
  "latitude": 27.673,
  "longitude": 85.324,
  "verificationRadiusMeters": 150
}
```

Replaces the `artifact_navigation` RPC. Deliberately minimal: the client
constructs the walking route itself from OSRM. Routing is a presentation concern
and the backend should not proxy a third-party routing API.

## 5.8 `POST /api/v1/artifacts/:id/unlock-story`

Story unlock is **independent of discovery** and is earned by proximity alone
(§11.1). The verification endpoint cannot carry this responsibility: it requires
a photo and a successful GPS verdict, whereas a user may read a story by simply
walking within `storyUnlockRadiusMeters`. This endpoint is that trigger.

```json
{
  "location": {
    "latitude": 27.6730, "longitude": 85.3240,
    "accuracyMeters": 8.4, "altitudeMeters": 1402,
    "capturedAt": "2026-01-02T09:14:33.000Z"
  }
}
```

Same location rules as verification: `capturedAt` within the last 10 minutes and
not future beyond clock skew; `accuracyMeters` ≤ 100 m.

```json
{
  "artifactId": "...",
  "unlocked": true,
  "newlyUnlocked": true,
  "distanceMeters": 183,
  "requiredMeters": 300,
  "storyUnlocked": true,
  "story": "The temple was built in..."
}
```

The backend validates the timestamp and accuracy, computes distance, checks
`storyUnlockRadiusMeters`, upserts `storyUnlocks` on `(userId, artifactId)`, and
returns whether it was newly unlocked. `story` is included only when
`storyUnlocked` is true, so the client can save the follow-up `GET`. When the
user is outside the radius, respond `200` with `unlocked: false`,
`newlyUnlocked: false`, and `shortfallMeters`, rather than an error — being too
far is a normal state for this check, not a failure.

Idempotent by user and artifact: calling it again inside the radius returns
`newlyUnlocked: false` and does not rewrite the original `unlockedBy` evidence.

## 5.9 `GET /api/v1/artifacts/:id/snaps` and `POST /api/v1/artifacts/:id/snaps`

Verification photos are always private (§11.3). Publishing one creates a
**separate** `communitySnaps` document; it never edits the attempt.

### `GET /api/v1/artifacts/:id/snaps`

Optional auth. Returns `status: "ACTIVE"` snaps for the artifact, newest first,
paginated per §2.6.

```json
{
  "items": [
    { "id": "...", "imageUrl": "...", "caption": "...",
      "author": { "username": "asha_r", "displayName": "Asha", "profileImageUrl": null },
      "createdAt": "..." }
  ],
  "page": { "nextCursor": null, "hasMore": false }
}
```

### `POST /api/v1/artifacts/:id/snaps`

```json
{ "verificationAttemptId": "...", "imagePublicId": "hidden-nepal/...", "caption": null }
```

Rules:

* `verificationAttemptId` must belong to the caller and reference this artifact.
* `imagePublicId` must be a `publicId` previously signed for this user via
  `/api/v1/media/sign` with `purpose: "COMMUNITY_SNAP"`.
* The created snap has `status: "PENDING"` until moderated; only `ACTIVE` snaps
  are returned by `GET`.
* Provenance is preserved: the snap stores `verificationAttemptId`, so
  `CommunitySnap → VerificationAttempt → User/Artifact` is always reconstructable
  for moderation. See the `CommunitySnap` DTO (§3.8).

---

# 6. Verification Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/media/sign` | required | Get Cloudinary signed upload params. |
| `POST` | `/api/v1/verification-attempts` | required | Submit a discovery for verification. |
| `GET` | `/api/v1/verification-attempts/:id` | required (owner) | Fetch one attempt. History and recovery, not polling. |
| `POST` | `/api/v1/verification-attempts/:id/recheck` | required (owner) | Re-verify with fresh GPS. |
| `GET` | `/api/v1/verification-attempts` | required | Own attempt history. |

**This is the core of the contract.** The current implementation spreads
verification across four client-driven round trips, which cannot be atomic and
lets the client assert verification outcomes. The replacement is two calls: sign,
then submit.

## 6.1 `POST /api/v1/media/sign`

```json
{ "purpose": "VERIFICATION_SNAP", "contentType": "image/jpeg" }
```

```json
{
  "cloudName": "hidden-nepal",
  "apiKey": "1234567890",
  "timestamp": 1767225600,
  "signature": "a1b2c3...",
  "folder": "hidden-nepal/verification/2026/01",
  "resourceType": "image"
}
```

The client POSTs the image **directly to Cloudinary** using these params. Large
images never transit the Next.js backend. `HUGGINGFACE_API_TOKEN`-class secrets
never reach the client; only the upload signature, which is scoped to one
resource type and folder by `Backend TDS.md` §61.

`purpose` maps to a fixed folder and transformation allowlist. The client cannot
choose an arbitrary folder. Accepted values: `VERIFICATION_SNAP`,
`VERIFICATION_GALLERY`, `PROFILE_IMAGE`, `COMMUNITY_SNAP`, `CONTRIBUTION_PHOTO`.

To enforce the per-user ownership rule in §6.2 without requiring an ephemeral
database collection, `folder` includes a deterministic HMAC token derived from
the caller's user id: `<cloudName>/<purposeFolder>/<userToken>`. Downstream writes
verify the token in the `publicId` before accepting it.

`contentType` must be `image/jpeg` or `image/png`. The backend rejects anything
else rather than trusting the declared type, because the CV service assumes a
decodable image.

## 6.2 `POST /api/v1/verification-attempts`

**One call. The client sends evidence only. The backend decides everything.**

Headers: `Idempotency-Key: <uuid>` (required).

```json
{
  "artifactId": "66f1a2b3c4d5e6f7a8b9c0d1",
  "verificationImagePublicId": "hidden-nepal/verification/2026/01/abc123",
  "additionalPhotos": [
    { "publicId": "hidden-nepal/verification/2026/01/def456", "caption": null }
  ],
  "location": {
    "latitude": 27.6730,
    "longitude": 85.3240,
    "accuracyMeters": 12.4,
    "altitudeMeters": 1402,
    "capturedAt": "2026-01-02T09:14:33.000Z"
  },
  "privateNote": "optional private note"
}
```

Request rules, enforced by strict schema:

* `userId` is **absent**. Identity comes from the token.
* `gpsVerification.*`, `cvVerification.*`, `similarityScore`, `status`,
  `xpAwarded`, `discoveryId` are **absent**. Any present value is a `422`.
* `location.capturedAt` must be within the last 10 minutes and not in the future
  beyond clock skew. A stale timestamp is rejected, because a client can otherwise
  replay a position from an earlier visit.
* `accuracyMeters` must be present and ≤ 100 m. A 2 km accuracy fix is not usable
  evidence for a 150 m radius.
* At most 6 `additionalPhotos`.
* The image must be a `publicId` previously returned by `/api/v1/media/sign` for
  this user. Arbitrary public ids are rejected.

Responses.

**CV runs synchronously. There is no pending state, no queue, and no polling.**
The client waits for one response, and if the request fails it re-POSTs the same
`Idempotency-Key`. Every `201` below carries the attempt's **current status**:
`VERIFIED`, `FLAGGED`, or (for a recheck that follows a reversal) `REJECTED`.
`FLAGGED` is terminal for automatic verification but remains open to admin review
(§9); nothing in this endpoint waits for that review.

This is a deliberate override of `Backend TDS.md` §38, which recommends that "CV
verification should not unnecessarily block the client request." §38 is
superseded; §37 (low similarity vs service failure) and §87 (bounded retry) still
apply. The tradeoff is recorded in §6.2a.

The handler order matters, and it is the opposite of the queued design:

```text
 1. validate body, resolve identity and artifact        (cheap, local)
 2. GPS distance from the supplied coordinates          (cheap, local)
    → fail now: 422, nothing persisted
 3. duplicate-discovery check                           (cheap, local)
    → fail now: 409 with the existing discoveryId
 4. CV compare against reference embeddings             (SLOW, external)
    → technical failure: 503, nothing persisted
 5. transaction:                                        (fast, local)
      insert verificationAttempts  (already terminal)
      insert discovery
      insert xpTransactions
      insert pointsTransactions
      increment users.lifetimeXp, users.pointsBalance
      update userQuestProgress, complete quests
      evaluate and award badges
    → DB Schemas.md §26 steps 7–15, plus §11.2 points
 6. return the final receipt
```

Steps 2 and 3 are deliberately **before** step 4. Ordering the duplicate check
ahead of the CV call is not a micro-optimisation: a user who re-submits an
artifact they already collected would otherwise cost a full CV comparison, and
`DB Schemas.md` §88 rate-limits exactly the endpoint that triggers CV work.

The attempt row is written **inside** the transaction at step 5, not before the
CV call at step 4. That is what makes "no holding states" true: if the CV service
is down, there is no row to clean up, no `PENDING` to reconcile, and no partial
reward state. `DB Schemas.md` §26 lists "verify verification attempt" as step 1
and "perform CV" as step 5; the ordering here is deliberately different and
exists solely to avoid persisting a half-finished attempt.

### GPS passed, no CV required — `201`

```json
{
  "attemptId": "...",
  "status": "VERIFIED",
  "discoveryId": "...",
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": false, "status": "NOT_REQUIRED" },
  "xpAwarded": 250,
  "pointsAwarded": 250,
  "pointsBalance": 1450,
  "newlyUnlockedStory": true,
  "quest": { "id": "...", "discoveredCount": 2, "artifactCount": 3 },
  "badge": null
}
```

### GPS passed, CV ran and matched — `201`

```json
{
  "attemptId": "...",
  "status": "VERIFIED",
  "discoveryId": "...",
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": true, "status": "PASSED", "similarityScore": 0.87,
          "threshold": 0.72, "topK": 3 },
  "xpAwarded": 250,
  "pointsAwarded": 250,
  "pointsBalance": 1450,
  "newlyUnlockedStory": true,
  "quest": { "id": "...", "discoveredCount": 2, "artifactCount": 3 },
  "badge": { "name": "First Temple", "iconUrl": "..." }
}
```

### GPS passed, CV ran and did not match — `201`, attempt `FLAGGED`

The CV worked; the image is not a good enough match. Per `Backend TDS.md` §37
this is `FLAGGED` and goes to manual review — it is **not** a rejection, and the
user keeps their attempt.

```json
{
  "attemptId": "...",
  "status": "FLAGGED",
  "discoveryId": null,
  "gps": { "status": "PASSED", "distanceMeters": 88, "requiredMeters": 150 },
  "cv": { "required": true, "status": "FAILED", "similarityScore": 0.41,
          "threshold": 0.72, "topK": 3 },
  "xpAwarded": 0,
  "pointsAwarded": 0,
  "pointsBalance": 1200,
  "newlyUnlockedStory": true,
  "quest": null,
  "badge": null,
  "message": "Your photo needs review. This usually takes a few hours."
}
```

`newlyUnlockedStory` is `true` here even though the discovery was not awarded,
because story unlock is driven by **proximity, not verification**
(`SanskritiSnapApp/AGENTS.md`: "Story unlock requires proximity, not Snap
verification"). Conflating the two is the bug in `artifacts/[id].tsx` noted in
§11.1.

### GPS failed — `422`, nothing persisted

```json
{
  "error": {
    "code": "GPS_OUTSIDE_RADIUS",
    "message": "You are 340 m away. Move within 150 m to verify this discovery.",
    "details": { "distanceMeters": 490, "requiredMeters": 150, "shortfallMeters": 340 }
  }
}
```

No attempt row, no discovery, nothing to clean up. The user walks closer and
submits again with a **new** `Idempotency-Key`, because this is a new piece of
evidence, not a retry of the same request.

### CV service unreachable — `503`, nothing persisted

```json
{
  "error": {
    "code": "CV_UNAVAILABLE",
    "message": "Verification is temporarily unavailable. Please try again.",
    "details": { "retryable": true, "retryAfterSeconds": 30 }
  }
}
```

The client re-POSTs the **same** `Idempotency-Key` and the same body. Because
nothing was persisted, this is safe and cannot double-award. This is how
`DB Schemas.md` §37 invariant 20 is honoured without a `PENDING` state: an outage
is a transport error, not a verdict.

### Already discovered — `409`, existing discovery returned

```json
{
  "error": {
    "code": "ALREADY_DISCOVERED",
    "message": "You already collected this artifact.",
    "details": { "discoveryId": "...", "discoveredAt": "2025-11-08T..." }
  }
}
```

`ALREADY_DISCOVERED` returning `409` **with** the existing `discoveryId` lets the
client route straight to the success screen instead of showing an error. This is a
deliberate choice: duplicate discovery is not a user mistake, and
`DB Schemas.md` §37 invariant 1 is enforced by the unique index regardless. The
CV call is skipped entirely on this path — the duplicate check runs at step 3,
before step 4 (§6.2), so a duplicate submission costs no GPU time.

## 6.2a Synchronous Tradeoffs and Budget

Because the CV call is inline, its latency is user-visible and it must fit inside
the deployment's request-duration limit. Concrete budget:

| Item | Budget |
| --- | --- |
| CV attempt timeout | 8 s |
| CV retries within the request (`Backend TDS.md` §87) | 3 |
| Worst-case CV time | ~24 s |
| GPS + transaction + serialisation | < 1 s |
| **Worst-case total** | **~25 s** |

Two hard requirements follow:

1. **The deployment must allow ~30 s per request.** On a serverless host the
   function's configured `maxDuration` must be raised above this, or the backend
   must run on a long-duration host. If the platform caps requests below ~25 s,
   synchronous CV is not viable and this section must be reopened.
2. **The 8 s per-attempt timeout is mandatory**, and the CV service call must be
   bounded by it. An unbounded CV call is what turns one slow GPU into a hung
   request.

The user-visible cost: the user watches a spinner for up to ~25 s instead of
leaving and coming back. Mitigations that do not reintroduce server state:

* The client shows a determinate progress message ("Checking your photo…"), not
  a spinner, so the wait reads as intentional.
* GPS failures still return in well under a second (§6.2), so the common
  walk-too-far case is fast.
* The per-user/per-artifact rate limit (`Backend TDS.md` §88) bounds wasted GPU
  time from retries.

What this design gives up, stated plainly: no server-side retry of a transient
CV failure, no attempt history for an outage, and the CV service's availability
becomes the user's problem instead of the backend's. If the CV service is
unreliable enough for that to matter, §6.2 needs a queue after all.

## 6.3 `GET /api/v1/verification-attempts/:id`

Returns `VerificationAttempt`. Owner-only; a non-owner receives `404`.

**This is not a polling endpoint.** With synchronous CV there is never a pending
attempt to wait on, so the response carries no `terminal` and no
`pollAfterSeconds` field. Every attempt this endpoint can return is already in a
final state.

It exists for two reasons:

1. **Attempt history.** The client lists attempts via `GET
   /api/v1/verification-attempts` and opens one to see why an attempt was
   `FLAGGED` — score, threshold, and the photo.
2. **Recovery from a lost response.** If the client times out after the server
   committed, re-POSTing with the same `Idempotency-Key` replays the stored
   response and is the primary fix (§2.7). This endpoint is the fallback for when
   the client lost the key or the user navigated away before reading the result.

Because the fallback exists, the attempt must already be terminal when it is
read. There is no state in which this endpoint returns a non-final status.

`verificationImageUrl` is a short-lived signed URL, regenerated per request. The
client must not cache it beyond the screen's lifetime.

The current implementation's `verification-pending.tsx` screen, which polls every
5 seconds forever with no stop condition, has no reason to exist under this
design and should be deleted rather than migrated. See §12.6.

## 6.4 `POST /api/v1/verification-attempts/:id/recheck`

```json
{ "location": { "latitude": 27.6730, "longitude": 85.3240, "accuracyMeters": 8.1,
                "altitudeMeters": 1402, "capturedAt": "2026-01-02T09:31:00.000Z" } }
```

The user walked closer and wants to re-verify. The backend re-runs GPS from the
**fresh** position and re-runs CV synchronously against the **same** reference
embeddings, returning the same response shapes as §6.2.

**Recheck creates a new `VerificationAttempt`; it never mutates the original.**
An attempt is immutable evidence — its GPS verdict, CV score, and photo are the
record of what was submitted at that moment. Mutating it would destroy the audit
trail and make `FLAGGED → VERIFIED` indistinguishable from "the user re-submitted
and it passed this time". So:

```text
attempt #1 (FLAGGED)
      │  POST /:id/recheck
      ▼
attempt #2 (VERIFIED)   supersedesAttemptId = attempt #1
```

* The new attempt carries `supersedesAttemptId = <:id>`; its response includes
  `previousAttemptId` equal to the path `:id`.
* The original attempt keeps its status and is untouched.
* If attempt #2 is `VERIFIED`, discovery/XP/points/quest/badge effects are awarded
  through the normal transaction (the duplicate-discovery rule still applies, so
  rechecking an already-collected artifact awards nothing).

Same rules as §6.2, plus:

* No `Idempotency-Key` — new coordinates are new evidence, not a retry. Replaying
  is not a meaningful operation.
* The response is `201` with a synchronous status, or an error with nothing
  persisted.
* A CV outage returns `503 CV_UNAVAILABLE` and leaves **both** attempts as they
  were; the original is never mutated to a rejection — `DB Schemas.md` §31 and
  §37 invariant 20 are explicit that a CV outage must not become a user rejection.

Critically: this endpoint does **not** accept a verdict. The current implementation
computes `gpsVerified` on the device and writes `cv_status: "pass"` and
`cv_similarity_score: 1` directly to the submission row. That is a complete CV
bypass — pressing "Retry Verification" once grants a perfect match on any image.
See §12.1. The new contract offers no field through which a client could express
that.

## 6.5 Forbidden Fields

The verification schema must reject the request outright if any of these appear,
rather than silently stripping them. Silent stripping hides client bugs and makes
a cheating client look like it is working.

```text
userId
status
gpsVerification
cvVerification
similarityScore
xpAwarded
discoveryId
storyUnlocked
questProgress
```

---

# 7. Discovery, Collection, Quest, Badge, Leaderboard

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/discoveries` | required | Own discovery history. |
| `GET` | `/api/v1/discoveries/:id/receipt` | required (owner) | Success-screen payload. |
| `GET` | `/api/v1/collection` | required | Collected artifacts. |
| `GET` | `/api/v1/quests` | optional | Quest list with progress. |
| `GET` | `/api/v1/quests/:id` | required | Quest detail. |
| `GET` | `/api/v1/badges` | required | Badges with unlock state. |
| `GET` | `/api/v1/leaderboard` | optional | Ranked users. |

## 7.1 `GET /api/v1/discoveries`

```http
GET /api/v1/discoveries?limit=20&cursor=...
```

```json
{
  "items": [
    { "id": "...", "discoveredAt": "...", "xpAwarded": 250,
      "artifact": { "id": "...", "name": "...", "category": "TEMPLE",
                    "coverImageUrl": "...", "humanReadableLocation": "...",
                    "rarity": "Rare", "distanceMeters": 88 } }
  ],
  "page": { "nextCursor": null, "hasMore": false }
}
```

**`rarity` is a stored field on the artifact, set by the uploader** — not derived
from `discoveryCount`, from `category`, or by the client. It is returned verbatim
as authored. The client currently maps artifact category to a rarity label in
`progress.ts:getRarity` with a hardcoded switch; that switch is deleted, not
reimplemented server-side. Full decision and rationale in §11.5.

## 7.2 `GET /api/v1/discoveries/:id/receipt`

Returns `DiscoveryReceipt`. Owner-only.

Replaces six sequential reads across `discoveries`, `artifacts`,
`quest_artifacts`, `quests`, `user_quest_progress`, and `user_badges`.

Note: the current success screen shows the user's **most recent badge
unconditionally** (`user_badges` ordered by `earned_at desc limit 1`), which means
a user who had already earned a badge sees that badge celebrated again on an
unrelated later discovery. The receipt must return only badges awarded **by this
discovery**, or `null`.

## 7.3 `GET /api/v1/collection`

```json
{
  "items": [ { "id": "...", "title": "...", "humanReadableLocation": "...",
               "xp": 250, "coverImageUrl": "...", "rarity": "Rare",
               "discoveredAt": "...", "discovered": true } ],
  "meta": { "total": 12, "totalXp": 3100 }
}
```

Derived from `discoveries` joined to `artifacts` server-side, excluding artifacts
whose `status` is no longer `PUBLISHED`. The current client performs this join via a
PostgREST `!inner` embed, which has no MongoDB equivalent; the backend does it.

## 7.4 `GET /api/v1/quests` and `GET /api/v1/quests/:id`

Return `QuestSummary[]` and `QuestDetail`.

`DB Schemas.md` embeds `artifactIds` in the quest and tracks
`discoveredArtifactIds` in `userQuestProgress`, so no join table is needed. The
current client queries `quest_artifacts` twice, then `user_quest_progress`, and
even counts artifacts in JavaScript to produce `total_progress` — five reads to
render a list.

`GET /api/v1/quests` may be called unauthenticated, returning `discoveredCount: 0`
and `completed: false` for a signed-out caller, so the quest screen is browsable
before sign-in.

## 7.5 `GET /api/v1/badges`

```json
{
  "items": [ { "id": "...", "name": "...", "description": "...",
               "iconUrl": "...", "unlocked": true, "earnedAt": "2025-12-01...",
               "progress": { "current": 3, "required": 5 } } ],
  "meta": { "unlockedCount": 8, "totalCount": 14 }
}
```

`progress` lets the badge screen show partial progress on
`DISCOVERY_COUNT` / `CATEGORY_COUNT` conditions. Computing this server-side
requires evaluating `badges.condition` against the user's aggregates, which is
the same evaluation used for awarding — one implementation, no drift.

## 7.6 `GET /api/v1/leaderboard`

```http
GET /api/v1/leaderboard?limit=100
```

```json
{
  "items": [
    { "rank": 1, "userId": "...", "username": "asha_r", "displayName": "Asha",
      "profileImageUrl": null, "lifetimeXp": 18400 }
  ],
  "meta": { "totalRanked": 1204, "currentUser": { "rank": 143, "lifetimeXp": 3100 } }
}
```

Requires `users.lifetimeXp` index (`DB Schemas.md` §4). Rank via
`$setWindowFields` / `$rank` in the aggregation, not in application code.

Rules:

* Only `accountStatus: "ACTIVE"` users are ranked. The current view selects
  `account_status` into the payload, which exposes other users' account status to
  every client for no reason.
* `currentUser` is included for the authenticated caller. For anonymous callers it
  is `null`.
* `profileImageUrl` is a CDN URL. It must not be a signed URL; the leaderboard
  would otherwise need per-row signing.
* Rank is **all-time**, per the PRD. No time-window parameter is specified; do
  not add `period` without a product decision.

---

# 8. Rewards and Notifications Endpoints

Points are P0 per `SanskritiSnapApp/AGENTS.md`, so the rewards routes are
**required**, not optional. They are grouped here because nothing on the
discovery loop may depend on them. Only `notifications` is genuinely optional
per `DB Schemas.md` §36.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/rewards` | required | Active rewards with affordability. |
| `GET` | `/api/v1/rewards/redemptions` | required | Own redemption history. |
| `POST` | `/api/v1/rewards/:id/redeem` | required | Redeem a reward. |
| `GET` | `/api/v1/points/ledger` | required | Own points ledger. |
| `GET` | `/api/v1/notifications` | required | Notification list. |

```http
GET /api/v1/rewards
```

```json
{
  "items": [
    { "id": "...", "title": "...", "description": "...", "pointCost": 500,
      "imageUrl": "...", "businessName": "Kumari Kitchen",
      "affordable": true, "redeemed": false }
  ],
  "meta": { "pointsBalance": 1200, "count": 6 }
}
```

`affordable` and `pointsBalance` are server-computed. The current client derives
affordability itself and treats `reward_points` as both the balance and the XP
total (`rewards.tsx:19,27`).

`POST /api/v1/rewards/:id/redeem` takes **no amount and no balance** from the client:

```json
{ "Idempotency-Key": "<uuid>" }
```

It must be atomic: verify the reward is active, check the balance, decrement
`users.pointsBalance`, append a `SPENT` entry to `pointsTransactions`, and create
the `redemption`. The current `redeem_reward` SQL function does this inside a
database transaction; a Next.js handler doing four sequential `await`s without a
session is not equivalent, and a double-tap would double-spend. `Idempotency-Key`
is mandatory here for the same reason as verification.

**Business rule: a user may redeem a given reward at most once ever.** This is why
`redemptions` carries a `UNIQUE(userId, rewardId)` index and why `GET
/api/v1/rewards` returns `redeemed: true` for a reward the caller has already
claimed. A second attempt returns `409` (`ALREADY_DISCOVERED` is discovery-specific;
use a dedicated `REWARD_ALREADY_REDEEMED` code). If multi-redemption is later
wanted, it is a product change: drop the unique index, resolve double-spend with
`Idempotency-Key` alone, and let `redemptions` hold one row per claim.

`GET /api/v1/points/ledger` is cursor-paginated and returns
`{ items, page }` per §2.6, where each item is a `pointsTransactions` document
with `amount`, `balanceAfter`, and `type`. This is what makes the balance
auditable from the client, and it replaces the absence of any history in the
current implementation.

---

# 9. Admin Endpoints

Grouped under `/api/v1/admin`. Every route requires role `ADMIN`, except
contribution review which also admits `EXPERT` per `Backend TDS.md` §56.

### Verification review

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/v1/admin/verification?status=FLAGGED` | — |
| `POST` | `/api/v1/admin/verification/:id/approve` | `{ "note": string \| null }` |
| `POST` | `/api/v1/admin/verification/:id/reject` | `{ "reason": string, "note": string \| null }` |

`GET` returns `AdminVerificationAttempt[]` (§3.9), paginated per §2.6; the public
`VerificationAttempt` DTO would hide the `flagReason` the reviewer needs.

`approve` is the resolution path for a `FLAGGED` attempt: it sets the attempt to
`VERIFIED` and, if the artifact was not already discovered by that user, runs the
same award transaction as §6.2. It is **idempotent** — approving an already-
`VERIFIED` attempt returns the existing result and never re-awards XP. `reject`
sets the attempt to `REJECTED`, copies `reason` into `rejectionReason`, awards
nothing, and is likewise idempotent. Both write a `review` block (§3.9) and an
`adminActions` document.

### Artifact and reference management

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/v1/admin/artifacts?status=&limit=&cursor=` | — |
| `POST` | `/api/v1/admin/artifacts` | `CreateArtifactRequest` |
| `PATCH` | `/api/v1/admin/artifacts/:id` | `UpdateArtifactRequest` |
| `POST` | `/api/v1/admin/artifacts/:id/references` | `CreateReferenceRequest` |
| `POST` | `/api/v1/admin/artifacts/:id/references/embeddings` | `CreateEmbeddingRequest` |
| `DELETE` | `/api/v1/admin/artifacts/:id/references/:refId` | — |

```ts
type CreateArtifactRequest = {
  name: string;
  slug?: string;                        // derived from name when omitted
  description: string;
  category: ArtifactCategory;
  rarity?: Rarity;                      // uploader-set; defaults to "Common"
  tags?: string[];
  latitude: number;
  longitude: number;
  altitudeMeters?: number | null;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings?: string | null;
  status?: "DRAFT" | "PUBLISHED";       // defaults to DRAFT
};

type UpdateArtifactRequest =
  Partial<CreateArtifactRequest> & { status?: ArtifactStatus };  // status may also become ARCHIVED/DISABLED
```

```ts
type CreateReferenceRequest = {
  imagePublicId: string;                // previously signed via POST /api/v1/media/sign
  isCover?: boolean;                    // defaults to false
};
// server fetches the image from Cloudinary, computes the embedding, stores ArtifactReference

type CreateEmbeddingRequest = {
  embedding: number[];
  embeddingDimension: number;
  model: { name: string; version: string };
  isCover?: boolean;
};
```

Reference/embedding responses return the created `ArtifactReference` as
`{ id, imageUrl, isCover, model }` — never the raw `embedding` vector (§2.8).

### Contribution review

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/v1/admin/contributions?status=` | — |
| `POST` | `/api/v1/admin/contributions/:id/approve` | `ContributionDecisionRequest` |
| `POST` | `/api/v1/admin/contributions/:id/reject` | `{ "reason": string, "note": string \| null }` |

```ts
type ContributionDecisionRequest = {
  // Exactly one of artifactId / artifact is required on approve:
  artifactId?: string;                  // link the contribution to an existing artifact, OR
  artifact?: CreateArtifactRequest;     // create a new artifact from the contribution
  note?: string | null;
};
```

When `artifact` is supplied, `approve` creates the artifact (status `DRAFT`
unless specified), marks the contribution approved, and writes the
`adminActions` document in one transaction. When neither `artifactId` nor
`artifact` is supplied, respond `422 INVALID_CONTRIBUTION_TARGET` — a
contribution cannot be approved into nothing.

### Other admin routes

| Method | Path | Body |
| --- | --- | --- |
| `POST` | `/api/v1/admin/quests` | `{ name, description, artifactIds: string[], badgeId?: string \| null }` |
| `PATCH` | `/api/v1/admin/quests/:id` | partial of the above |
| `POST` | `/api/v1/admin/badges` | `{ name, description, iconUrl?: string \| null, condition: BadgeCondition }` |
| `PATCH` | `/api/v1/admin/badges/:id` | partial of the above |
| `GET` | `/api/v1/admin/users?q=&limit=&cursor=` | — |
| `POST` | `/api/v1/admin/users/:id/suspend` | `{ reason: string, suspendedUntil?: string \| null }` |
| `GET` | `/api/v1/admin/community?status=` | — |
| `POST` | `/api/v1/admin/community/:id/hide` | `{ reason: string }` |
| `POST` | `/api/v1/admin/xp-adjustments` | `XpAdjustmentRequest` |

```ts
type XpAdjustmentRequest = {
  userId: string;
  amount: number;                       // non-zero; negative permitted
  reason: string;                       // required, non-empty
  referenceId?: string;                 // optional link to the causing entity
};
```

`POST /api/v1/admin/xp-adjustments` is the **only** route permitted to create a
negative `xpTransactions` entry, and it requires a non-empty `reason`. It adjusts
`users.lifetimeXp` and appends the transaction in one session; it does **not**
touch `pointsBalance` (XP and points are separate, §11.2). Response:
`{ lifetimeXp, transaction: { id, amount, reason, createdAt } }`.

Every admin mutation writes an `adminActions` document in the same transaction as
the change (`DB Schemas.md` §18).

---

# 10. Traceability Matrix

Every observed client data access, and its replacement. This is the coverage
proof for the contract.

| # | Client location | Current access | New endpoint |
| --- | --- | --- | --- |
| 1 | `authstore.ts:29` | `profiles` select | `GET /api/v1/me` |
| 2 | `choose-username.tsx:78` | `profiles` availability | `GET /api/v1/usernames/availability` |
| 3 | `choose-username.tsx:140` | `profiles` update | `PATCH /api/v1/me/username` |
| 4 | `settings.tsx:26` | `profiles` update | `PATCH /api/v1/me/preferences` |
| 5 | `profile.tsx:44` | `user_quest_progress` | `GET /api/v1/me/summary` |
| 6 | `explore-data.ts:61` | `nearby_artifacts(5000)` | `GET /api/v1/artifacts/nearby` |
| 7 | `home.tsx:31` | `nearby_artifacts(5000)` | `GET /api/v1/artifacts/featured` |
| 8 | `home.tsx:48` | `artifacts` top by count | `GET /api/v1/artifacts/featured` |
| 9 | `nepal-search.ts:71` | `nearby_artifacts(500000)` | `GET /api/v1/artifacts/search` |
| 10 | `search.tsx` | client-side catalogue filter | `GET /api/v1/artifacts/search` |
| 11 | `proximity-notifications.ts:111` | `nearby_artifacts(50000)` | `GET /api/v1/artifacts/nearby/geofence-regions` |
| 12 | `navigation.tsx:158` | `artifact_navigation` | `GET /api/v1/artifacts/:id/navigation` |
| 13 | `artifacts/[id].tsx:46` | `artifacts` detail | `GET /api/v1/artifacts/:id` |
| 14 | `artifacts/[id].tsx:58` | `discoveries` | folded into `GET /api/v1/artifacts/:id` |
| 15 | `artifacts/[id].tsx:59` | `story_unlocks` | folded into `GET /api/v1/artifacts/:id` |
| 16 | `submission-review.tsx:53` | `artifacts` summary | `GET /api/v1/artifacts/:id` |
| 17 | `submission-review.tsx:123` | storage upload | `POST /api/v1/media/sign` |
| 18 | `submission-review.tsx:135` | `submissions` insert | `POST /api/v1/verification-attempts` |
| 19 | `submission-review.tsx:162` | storage gallery upload | `POST /api/v1/media/sign` |
| 20 | `submission-review.tsx:177` | `submission_photos` insert | inside `POST /api/v1/verification-attempts` |
| 21 | `submission-review.tsx:185` | `finalize_discovery` | inside `POST /api/v1/verification-attempts` |
| 22 | `submission-review.tsx:217` | `nearby_artifacts(INT_MAX)` | `GET /api/v1/artifacts/:id/distance` |
| 23 | `verification-pending.tsx:44` | `submissions` select | `GET /api/v1/verification-attempts/:id` (history only) |
| 24 | `verification-pending.tsx:53` | `discoveries` select | `discoveryId` in the attempt response |
| 25 | `verification-pending.tsx:67` | `nearby_artifacts(INT_MAX)` | `gps` block in the attempt response |
| 26 | `verification-pending.tsx:94` | `artifacts` select | `artifact` in the attempt response |
| 27 | `verification-pending.tsx:105` | `createSignedUrl` | `verificationImageUrl` in the attempt response |
| 28 | `verification-pending.tsx:147` | `nearby_artifacts(10000)` | `POST /api/v1/verification-attempts/:id/recheck` |
| 29 | `verification-pending.tsx:169` | `submissions` update, **client asserts CV pass** | **REMOVED — forbidden** |
| 30 | `verification-pending.tsx:200` | `finalize_discovery` | inside `POST .../recheck` |
| 31 | `verification-failed.tsx:27` | `artifacts` select | `GET /api/v1/artifacts/:id` |
| 32 | `discovery-success.tsx:24` | `discoveries` select | `GET /api/v1/discoveries/:id/receipt` |
| 33 | `discovery-success.tsx:31` | `artifacts` select | folded into receipt |
| 34 | `discovery-success.tsx:32` | `quest_artifacts` | folded into receipt |
| 35 | `discovery-success.tsx:37` | `quests` select | folded into receipt |
| 36 | `discovery-success.tsx:40` | `user_quest_progress` | folded into receipt |
| 37 | `discovery-success.tsx:50` | `user_badges` | folded into receipt |
| 38 | `progress.ts:61` | `discoveries` + embed | `GET /api/v1/discoveries` |
| 39 | `progress.ts:85` | `quest_artifacts` | folded into `GET /api/v1/quests` |
| 40 | `progress.ts:87` | `user_quest_progress` | folded into `GET /api/v1/quests` |
| 41 | `progress.ts:98` | `quests` select | `GET /api/v1/quests` |
| 42 | `progress.ts:174–203` | 5 parallel queries | `GET /api/v1/quests/:id` |
| 43 | `badges.ts:21,26` | `badges` + `user_badges` | `GET /api/v1/badges` |
| 44 | `leaderboard-data.ts:12` | `leaderboard` view | `GET /api/v1/leaderboard` |
| 45 | `rewards.tsx:33` | `rewards` + `businesses` | `GET /api/v1/rewards` |
| 46 | `rewards.tsx:65` | `redeem_reward` | `POST /api/v1/rewards/:id/redeem` |
| 47 | `claimed-rewards.ts:14` | `redemptions` + joins | `GET /api/v1/rewards/redemptions` |
| 48 | `supabase.auth.*` (8 sites) | Supabase Auth | Clerk session token |

**48 client access points → 54 routes across 50 paths.** The reduction comes from
collapsing client-side joins and from folding multi-step server functions into
single atomic calls. (Two routes are not replacements for an observed client
call and have no matrix row: `POST /api/v1/artifacts/:id/unlock-story` and the
`/snaps` pair — they formalise behaviour the current client does not implement
correctly. Matrix row 15 shows the current story read being folded into
`GET /api/v1/artifacts/:id`, which is the read side; the unlock write side is new.)

Counted from the sections of this document: §4 identity/profile 6 routes / 5
paths, §5 artifacts 10 / 9, §6 verification 5 / 4, §7 discovery/gamification 7 /
7, §8 rewards and notifications 5 / 5, §9 admin 21 / 20. Every path listed in a
table counts once; `GET` and `PATCH` on the same path are two routes but one path.

---

# 11. Gaps in `DB Schemas.md` That This Contract Exposes

These are not contract design choices; they are places where the frontend needs
data the schema does not define. Each needs a decision before implementation.

## 11.1 Story Unlock Model — RESOLVED

**Decision: yes, `storyUnlocks` is a collection.** `DB Schemas.md` has
`artifacts.storyUnlockRadiusMeters` but no per-user unlock record. The current
client reads a `story_unlocks` table (`artifacts/[id].tsx:59`), and the PRD makes
proximity story unlocking a core mechanic that is **independent of discovery** —
you can read a story without collecting the artifact. Without this collection the
mechanic cannot be implemented, and the API cannot answer `storyUnlocked` or
conditionally expose `story`.

```text
Collection: storyUnlocks
{
  _id: ObjectId,
  userId: ObjectId,
  artifactId: ObjectId,
  unlockedAt: Date,
  unlockedBy: { latitude, longitude, distanceMeters, capturedAt }
}
Index: (userId, artifactId) UNIQUE
Index: (userId)                      // for the unlocked-stories list
```

Written by the backend when a proximity check passes, during a session's location
update or at verification time. Never written by the client.

Two details that are easy to get wrong:

* `storyUnlocks` is **not** gated on discovery. The write happens on proximity
  alone, so a user who walks into the radius can read the story without
  submitting a snap. `SanskritiSnapApp/AGENTS.md` is explicit: "Story unlock
  requires proximity, not Snap verification." This is also why §6.2 sets
  `newlyUnlockedStory: true` on a `FLAGGED` attempt, where no discovery was
  awarded.
* It must be independent of `discoveries` in the write path too, not just the
  read path, or a flagged attempt would silently lose the unlock.

A related client bug to fix during migration: `artifacts/[id].tsx` passes
`isDiscovered` to both `ArtifactBottomBar.storyUnlocked` and `.isDiscovered`, so
story visibility is currently tied to discovery. These must become two separate
flags from two separate sources.

## 11.2 Points Balance and Ledger — RESOLVED

**Decision: Option A. Points and rewards stay in v2.0, with a real ledger.**

`users` had `lifetimeXp` and no points field, and `DB Schemas.md` listed
`redemptions` as optional while never defining its schema. The required changes:

```text
users.pointsBalance: number   // denormalised cache, never the source of truth
                             // CHECK >= 0

Collection: pointsTransactions   (append-only, never updated or deleted)
{
  _id: ObjectId,
  userId: ObjectId,
  type: "EARNED" | "SPENT" | "ADJUSTED",
  amount: number,              // always positive; `type` carries the sign
  balanceAfter: number,        // running total, so the ledger is auditable alone
  reason:
    | "DISCOVERY"
    | "QUEST_COMPLETION"
    | "BADGE_EARNED"
    | "REWARD_REDEMPTION"
    | "ADMIN_ADJUSTMENT",
  referenceId: ObjectId | null,   // discoveryId, questId, rewardId, or adminActionId
  note: string | null,
  createdBy: ObjectId | null,  // admin only
  createdAt: Date
}
Index: (userId, createdAt DESC)
Index: (userId, referenceId)

Collection: redemptions
{
  _id: ObjectId,
  userId: ObjectId,
  rewardId: ObjectId,
  businessId: ObjectId | null,
  pointsSpent: number,
  status: "CONFIRMED" | "FULFILLED" | "CANCELLED",
  code: string | null,          // redemption code shown to the user
  redeemedAt: Date,
  createdAt: Date
}
Index: (userId, redeemedAt DESC)
Index: (userId, rewardId) UNIQUE   // one redemption per user per reward
```

Three rules that make this correct rather than merely present:

1. **`pointsBalance` is a cache, not the record.** It is written in the same
   transaction as its `pointsTransactions` entry, and any balance can be
   reconstructed by summing the ledger. The current SQL cannot do this — it
   conflates the two (`migrations/005_functions.sql:172` runs
   `reward_points = reward_points + v_new_xp`) and `023_rollback_and_reward_audit.sql:55`
   *decreases* `reward_points` on a discovery rollback, with no record of why.
2. **Points are monotonic except for `SPENT`.** A ledger with a `type` makes
   "points spent" distinguishable from "points revoked" — the distinction
   `SanskritiSnapApp/AGENTS.md` depends on when it says "XP never decreases
   through reward redemption; points may."
3. **Points and XP are different currencies.** `DB Schemas.md` §26 grants
   `artifact.xpReward`; the current client shows the same number as both
   (`discovery-success.tsx:65`, `pointsEarned: discovery.xp_awarded`). The points
   earn rate is now a separate admin-configured value, not a mirror of XP.

`UserProfile.pointsBalance` is therefore `number`, not `number | null` — the
field is guaranteed to exist. Awarding and spending are both ledger writes, so
the rewards UI and the `POST /api/v1/rewards/:id/redeem` atomicity requirement in §8
have real backing.

## 11.3 Photo Visibility Is Contradictory

`DB Schemas.md` §7 puts `isPublic` on `verificationAttempts.additionalPhotos[]`,
but §32 states additional photos are "private by default" and §17 establishes
`communitySnaps` as the home for public photographs.

These conflict. A verification photo becoming public by flipping a flag would
leak the exact image submitted for verification, which is the evidence the
verification system depends on.

Resolution: `verificationAttempts.additionalPhotos` is **always private** and has
no `isPublic` field. Publishing creates a separate `communitySnaps` document. If
the client's "make public" toggle is to keep working, it needs its own endpoint
(`POST /api/v1/artifacts/:id/snaps`) rather than an edit to the attempt.

## 11.4 Naming Inconsistency With `Backend TDS.md` — RESOLVED

`Backend TDS.md` §68 originally specified `POST /api/verification` and
`GET /api/verification/:id`, while `DB Schemas.md` names the collection
`verificationAttempts`. This contract uses `/api/v1/verification-attempts` because
`DB Schemas.md` is the stated source of truth. The three edits have been applied to
`Backend TDS.md`:

* §68 — paths renamed to `/api/v1/verification-attempts`, and a note added that all
  example paths in §§66–73 are relative to `/api/v1`.
* §77 — `verificationSubmissions.*` replaced with `verificationAttempts.*`.
* §13 line 356 — `verificationSubmissions` replaced with `verificationAttempts`.

## 11.5 `rarity` Has No Source — RESOLVED

**Decision: `rarity` is a stored, uploader-defined field on the artifact
document.** Add it to `DB Schemas.md` §5:

```text
artifacts.rarity: "Common" | "Rare" | "Epic" | "Legendary"    // default "Common"
```

The uploader decides how rare an artifact is; it is authored data, not a
derivation. `discoveryCount` measures how many people have found the artifact,
which is the opposite of rarity in a small catalogue — the first few discoverers
of an obscure carving would make it *look* common, and a much-photographed temple
would inflate toward Legendary. Category is no better: `progress.ts:getRarity`
hardcodes `statue → Epic`, but Patan has both a world-famous statue and dozens of
minor ones, and only a human knows which is which.

`rarity` is therefore:

* **Set by the uploader** through `CreateArtifactRequest` / `UpdateArtifactRequest`
  (§14), same as `xpReward` — another editorial judgement that is not derivable.
* **Stored on `artifacts`**, not computed per request.
* **Surfaced verbatim** in `ArtifactSummary` (§3.1) and `CollectionItem` (§7.3).
  The client displays the string; it does not map category to a label.

It is TitleCase (`"Rare"`, not `"RARE"`), unlike every other enum in this
contract. That is recorded as an exception in §2.8.

The alternative — a server-side switch on category — was rejected because it only
moves the same hardcoded table from the client to the server. It would still be
wrong for the artifacts where the category is not the interesting fact, and it
would make rarity impossible to correct without a deploy.

**The client-side switch is deleted, not duplicated.** `progress.ts:getRarity` is
removed once the client reads the field (§12.3).

## 11.6 `CommunitySnaps` Needs an Explicit Publish Flag — RESOLVED

**Decision: use the `status` enum, not a separate `isPublished` boolean.** The
earlier draft carried both a `status` (`ACTIVE | HIDDEN | REMOVED`) and an
`isPublished: boolean`, which were two representations of one fact and could
contradict each other (an `isPublished: true, status: "REMOVED"` document has no
sensible meaning).

```text
communitySnaps.status: PENDING | ACTIVE | HIDDEN | REMOVED
```

* `PENDING` — newly uploaded, private by default. This is the default on insert
  and satisfies `DB Schemas.md` §37 invariant 15 (explicit visibility).
* `ACTIVE` — published; the only status returned by
  `GET /api/v1/artifacts/:id/snaps`.
* `HIDDEN` / `REMOVED` — not public; set by moderation.

`DB Schemas.md` must update `communitySnaps.status` to add `PENDING` (it
currently starts at `ACTIVE`). If a boolean is ever needed for indexing, derive
it — do not store both.

## 11.6a Community-Snap Provenance

A `communitySnap` that came from a verification carries `verificationAttemptId`.
This is what makes the chain
`CommunitySnap → VerificationAttempt → User/Artifact` reconstructable, so a
moderator can tell whether a public photo is one that passed verification or an
independent upload. It is nullable only to permit admin-imported content.

## 11.7 Artifact Status Vocabulary — RESOLVED

**Decision: adopt `Backend TDS.md` §16 and add `ARCHIVED`.**

```text
artifacts.status: DRAFT | PUBLISHED | ARCHIVED | DISABLED
```

The two source documents disagreed, and this was not cosmetic — it changes the
`$geoNear` filter in §5.1 and every status check in the API.

| Source | Values | Verdict |
| --- | --- | --- |
| `DB Schemas.md` §5 (line 234) | `ACTIVE`, `ARCHIVED`, `DISABLED` | superseded |
| `Backend TDS.md` §16 (line 452) | `DRAFT`, `PUBLISHED`, `DISABLED` | adopted, plus `ARCHIVED` |

`Backend TDS.md` models an **editorial** lifecycle and `DB Schemas.md` models
**availability** only, so neither was sufficient alone. `ARCHIVED` is kept from
`DB Schemas.md` because it is required by `DB Schemas.md` §34 and §37 invariant 18
(archived content must survive in history while leaving the map), and the current
PostgreSQL schema already has it (`schema.md:33` defines
`artifact_status AS ENUM ('active', 'archived', 'disabled')`).

Semantics:

| Value | Visible on map | Discoverable | In search | In collection |
| --- | --- | --- | --- | --- |
| `DRAFT` | no | no | no | no |
| `PUBLISHED` | yes | yes | yes | yes |
| `ARCHIVED` | no | no | no | yes, read-only |
| `DISABLED` | no | no | no | yes, read-only |

Why `DRAFT` was non-negotiable: `artifact-form.tsx` can save an artifact with no
reference image and no location. Under the `DB Schemas.md` vocabulary that artifact
is `ACTIVE` and therefore instantly discoverable — a broken marker on the map at
`0,0`. A draft state is the cheapest fix and it matches how admins actually work.

Consequences, applied in this document **and already propagated to
`DB Schemas.md`**:

* Every artifact `status` filter matches `PUBLISHED`, never `ACTIVE` (§2.4, §5.1,
  §7.3).
* `DB Schemas.md` §5 now declares
  `DRAFT | PUBLISHED | ARCHIVED | DISABLED`, with a status-lifecycle table, and
  §37 invariant 18 now reads "An artifact that is not `PUBLISHED` cannot be newly
  discovered."
* `DB Schemas.md` §24 now says "Find PUBLISHED artifacts", and §26 step 1 verifies
  the artifact is `PUBLISHED`.
* The admin create/update flow must expose status as a four-value control, and
  newly created artifacts default to `DRAFT`.
* The current admin code hardcodes lowercase `status: "active"`
  (`artifact-form.tsx:59`, `entity-management.tsx:50,82,192,198`,
  `admin-dashboard.tsx:56,138`). The migration must map `active` → `PUBLISHED`
  once, in the importer, not by keeping a mixed-case enum.

---

# 12. Behaviours That Must Not Carry Over

Findings from reading the current client. Each is something the new contract is
specifically shaped to prevent, listed so a reviewer can check the migration
actually fixes them.

## 12.1 The client can assert a passing CV score

`verification-pending.tsx:169–182`:

```ts
await supabase.from("submissions").update({
  gps_verified: gpsVerified,   // computed on device
  cv_status: "pass",           // asserted
  cv_similarity_score: 1,      // asserted
  verification_status: gpsVerified ? "pending" : "rejected",
}).eq("id", submissionId);
```

Pressing "Retry Verification" once writes a perfect CV match for any image. The
own-row `UPDATE` policy permits it. This defeats CV verification entirely, and
would defeat it against the new backend too if the contract exposed any write
path to attempt outcomes. `POST /api/v1/verification-attempts/:id/recheck` (§6.4)
accepts only fresh coordinates, and §6.5 makes the fields a hard `422`.

## 12.2 Unbounded radius queries

Two call sites pass `p_radius_m: 2147483647` to force a full-table scan, then
filter in JavaScript to find one artifact's distance
(`submission-review.tsx:222`, `verification-pending.tsx:70`). Replaced by
`GET /api/v1/artifacts/:id/distance` (§5.6), with a server-side radius cap on
`/nearby`.

## 12.3 Client-side presentation logic that belongs on the server

* `progress.ts:getRarity` — category to rarity switch. **Delete it.** Rarity is a
  stored, uploader-set field returned by the API (§11.5), not a computation to
  move to the server.
* `progress.ts:fetchQuests` — counts quest artifacts in JavaScript to build
  `total_progress`. → server (§7.4).
* `discovery-success.tsx:65` — `pointsEarned: discovery.xp_awarded`, awarding XP
  and points as the same number. If points become real, this is wrong. Addressed
  by §11.2.
* Category→icon mapping in `constants/MapIcons.ts` is legitimately client-side —
  it is a rendering concern keyed off an enum, and belongs in the client.

## 12.4 The story is fetched unconditionally

`artifacts/[id].tsx:48` selects `story` on every artifact detail load, and
gating happens in the render function via `isUnlocked`. This relies on the client
honouring the gate, and under the current policy the story text is readable by
any client. The new contract omits `story` from the payload entirely when locked
(§3.2, §5.5). The gate must be in the serializer, not the component.

## 12.5 The whole nationwide catalogue is cached on device

`nepal-search.ts` pulls every artifact within 500 km of Nepal's centre on demand,
caches it in `AsyncStorage` for 30 minutes, and searches it with substring
matching. Replaced by `GET /api/v1/artifacts/search` (§5.4).

## 12.6 A whole screen that exists only to poll

`verification-pending.tsx:128` runs `setInterval(..., 5000)` for the lifetime of
the screen, re-reading a submission row forever with no stop condition, on a
screen the user cannot leave productively from. It fetches the submission, the
discovery, an artifact, a signed URL, and an unbounded-radius distance query on
every tick.

Synchronous CV (§6.2) removes the reason this screen exists. The verdict is
available before the POST returns, so the user goes straight from submit to
result. **Delete `verification-pending.tsx` and its route rather than migrating
it.** The attempt-history read it performed is still needed and is preserved by
`GET /api/v1/verification-attempts` (§6.3).

## 12.7 Multi-round-trip verification

Upload → insert submission → insert photos → call finalizer. Four calls, no
atomicity, and a crash between steps leaves orphaned storage objects and a
half-created submission. Replaced by sign + one atomic submit (§6.1, §6.2).

## 12.8 N+1 client joins

`fetchQuestDetails` issues five queries; the success screen issues six. Each
assumes the database can perform a join, which MongoDB cannot do across
collections. Replaced by aggregated endpoints (§7).

## 12.9 Other users' account status is exposed

`leaderboard-data.ts:13` selects `account_status` from a view readable by all
users. Not returned by the new contract (§7.6).

---

# 13. Decision Log

## 13.1 Resolved

| # | Decision | Resolution | Where |
| --- | --- | --- | --- |
| 1 | Does story unlock get its own collection? | **Yes.** Add `storyUnlocks` with a `(userId, artifactId)` unique index. The mechanic is unimplementable without it. | §11.1 |
| 2 | Are points and rewards in v2.0? | **Yes, Option A.** `users.pointsBalance`, an append-only `pointsTransactions` ledger, and a defined `redemptions` schema. | §11.2 |
| 3 | API versioning. | **Versioned.** Fixed `/api/v1` prefix, v2 served alongside v1. | §2.1 |
| 4 | CV processing model. | **Synchronous.** No queue, no pending state, no polling. Client re-POSTs the same `Idempotency-Key` on failure. | §6.2, §6.2a |
| 9 | Artifact status vocabulary. | **`DRAFT | PUBLISHED | ARCHIVED | DISABLED`.** Adopts `Backend TDS.md` §16, keeps `ARCHIVED`. | §11.7 |
| 12 | Where does `rarity` come from? | **A stored, uploader-set field on `artifacts`.** Not derived from `discoveryCount` or `category`; the client switch is deleted. | §11.5 |

### Propagation status

Decisions 1, 2, 3, 4, and 9 are reflected in both `DB Schemas.md` and
`Backend TDS.md`:

* `DB Schemas.md` §5 now declares the four-value status enum with a lifecycle
  table; §24 and §26 filter on `PUBLISHED`; §8 is a synchronous state machine with
  `PENDING`/`PROCESSING`/`FAILED`/`UNAVAILABLE`/`ERROR` removed; §21a/§21b/§21c add
  `pointsTransactions`, `redemptions`, and `storyUnlocks`; §36/§38 promote rewards
  and points to required and add `storyUnlocks`; §37 adds invariants 21–24.
* `Backend TDS.md` §§66–73 use `/api/v1`; §68 is `verification-attempts`; §23, §77,
  and §13 line 356 say `verificationAttempt(s)`; §24 lists only the three persisted
  states; §38 and §107's CV entry are marked superseded; §86 and §87 reflect the
  synchronous retry/timeout model.

### Why 4 was chosen, and what it costs

Synchronous CV means no server-side state and no polling: the client waits for one
response and retries the same request on failure. This is the right call for this
app because the current implementation's alternative was worse than useless — it
had the client poll a submission row whose `cv_status` the client itself was
allowed to write (§12.1), so the polling screen was waiting on a value that was
never server-authoritative in the first place.

The costs are recorded in §6.2a and are real: a ~25 s worst-case request, a
deployment that must tolerate it, and the loss of server-side retry. Decision 4 is
the one to revisit first if the CV service proves unreliable.

### Why 2 is not a free choice

`SanskritiSnapApp/AGENTS.md` lists **points** as P0 — "Auth, profiles, artifacts,
map, nearby, search, story unlock, camera, GPS verification, submissions, offline
queue, sync, discovery, XP, **points**, quests, badges, leaderboard, admin
dashboard" — and states under Non-Negotiable Rules that "XP never decreases
through reward redemption; points may." `Sanskriti-Snap/docs/schema.md:75`
documents `reward_points` as "spendable balance, decreases on reward redemption",
`authstore.ts:31` selects it, and `rewards.tsx:19` and `profile.tsx:34` both read
it. `DB Schemas.md` §36 marking these optional was the doc out of step, not the
product.

A real ledger is needed because the current SQL conflates points with XP
(`migrations/005_functions.sql:172` runs `reward_points = reward_points +
v_new_xp`), and `migrations/023_rollback_and_reward_audit.sql:55` **decreases**
`reward_points` on a discovery rollback. A single integer with no ledger cannot
distinguish "points spent" from "points revoked".

## 13.2 Still Open

| # | Decision | Impact | Recommendation |
| --- | --- | --- | --- |
| 5 | Are `requiresSnap: false` artifacts verifiable? | `DB Schemas.md` permits it; no artifact currently has it. | Leave supported, untested. |
| 6 | Leaderboard scope: all-time only, or time windows? | Query shape and index. | All-time only, per PRD. |
| 7 | Confirm anonymous read access. | §5.5 and §7.4 assume `GET /api/v1/artifacts/:id` and `GET /api/v1/quests` serve signed-out callers. | Assume yes, as written. |
| 8 | Max `additionalPhotos` and image size limits. | Validation, Cloudinary config. | 6 photos, 10 MB each, 12 MP max. |
| 10 | Does the deployment tolerate a ~25 s request? | Gates decision 4. See §6.2a. | Verify against the target host's `maxDuration` before building. |
| 11 | Where does a `FLAGGED` attempt get reviewed, and for how long? | Needs a retention policy, or `FLAGGED` rows accumulate forever. | 30-day review window, then auto-`REJECTED`. |

---

# 14. Definition of Done for the Backend

- [ ] Every endpoint in §4–§9 implemented with a strict request schema.
- [ ] All paths served under `/api/v1`; no unversioned route exists.
- [ ] Forbidden fields (§6.5) rejected with `422`, not stripped.
- [ ] `story` absent from the serialised payload when locked (§12.4).
- [ ] `radiusMeters` capped server-side on all geo endpoints (§12.2).
- [ ] Artifact `status` filters match `PUBLISHED`; no `DRAFT` artifact is
      discoverable, searchable, or returnable (§11.7).
- [ ] `rarity` is stored on the artifact and returned verbatim; no route derives it
      from `category` or `discoveryCount` (§11.5).
- [ ] Verification submission is synchronous: no `PENDING` or `PROCESSING` row is
      ever persisted, and no endpoint returns `202` for verification (§6.2).
- [ ] The CV call is bounded by an 8 s per-attempt timeout with at most 3 retries,
      and the deployment's `maxDuration` exceeds the worst case (§6.2a).
- [ ] A CV outage returns `503`/`504` and persists nothing (§6.2).
- [ ] The full `DB Schemas.md` §26 sequence runs in one transaction, with the
      attempt row written inside it, not before the CV call.
- [ ] Idempotency enforced on verification submission and reward redemption, and
      the stored response is replayed on a repeated key.
- [ ] Points writes go through `pointsTransactions`; `pointsBalance` and the
      ledger never disagree (§11.2).
- [ ] `ALREADY_DISCOVERED` returns the existing `discoveryId` so the client can
      route to the success screen, and skips the CV call.
- [ ] `recheck` inserts a **new** attempt with `supersedesAttemptId`; it never
      mutates the original attempt (§6.4).
- [ ] `story` unlock is reachable through `POST /api/v1/artifacts/:id/unlock-story`
      and is independent of discovery (§5.8).
- [ ] `verificationAttempts.additionalPhotos` is always private; community snaps
      are separate `communitySnaps` documents defaulting to `status: PENDING`
      (§11.3, §11.6).
- [ ] Every admin mutation route has a defined request body and writes an
      `adminActions` document in the same transaction (§9).
- [ ] `verification-pending.tsx` and its polling loop are deleted, not migrated
      (§12.6).
- [ ] All 48 client access points in §10 migrated or deliberately retired.
- [ ] Unique indexes present for `users.username`, `users.clerkUserId`,
      `artifacts.slug`, `discoveries(userId, artifactId)`,
      `userQuestProgress(userId, questId)`, `userBadges(userId, badgeId)`,
      `storyUnlocks(userId, artifactId)`, `redemptions(userId, rewardId)`.
- [ ] `2dsphere` index on `artifacts.location`; `lifetimeXp` index for leaderboard.
- [ ] No endpoint returns `_id`, `clerkUserId`, `story` (when locked), `embedding`,
      `createdBy`, `updatedBy`, `cvConfiguration`, or other users' `accountStatus`.
- [ ] Role checks follow the authorization matrix (§15).
- [ ] Remaining open decisions (§13.2) recorded as resolved before the affected
      endpoints ship.

---

# 15. Authorization Matrix

`Auth` in the endpoint tables is a shorthand. This matrix is normative: a route
not permitted for a role returns `403 FORBIDDEN`, and an unauthenticated request
to a `required` route returns `401 UNAUTHENTICATED`.

Roles: `USER` (any authenticated user), `EXPERT`, `ADMIN`. `EXPERT` is a `USER`
plus contribution review; it has **no** other admin power. Anonymous = no valid
Clerk session.

| Endpoint group | Anonymous | USER | EXPERT | ADMIN |
| --- | --- | --- | --- | --- |
| `GET /api/v1/artifacts/:id` (§5.5) | read, `storyUnlocked:false` | read | read | read |
| `GET /api/v1/artifacts/:id/snaps` (§5.9) | read `ACTIVE` only | read `ACTIVE` | read `ACTIVE` | read all |
| `GET /api/v1/artifacts/featured` (§5.3) | read | read | read | read |
| `GET /api/v1/quests`, `/leaderboard` (optional lists) | read | read | read | read |
| Nearby / search / geofence / distance / navigation | — | read | read | read |
| `POST /api/v1/artifacts/:id/unlock-story` | — | own unlock | own unlock | own unlock |
| `POST /api/v1/artifacts/:id/snaps` | — | own upload | own upload | own upload |
| `POST /api/v1/verification-attempts` + `recheck` | — | own attempts | own attempts | own attempts |
| `GET /api/v1/verification-attempts[/:id]` | — | own only | own only | own only |
| `/api/v1/me*`, `/usernames/availability` | — | own | own | own |
| `/api/v1/discoveries*`, `/collection`, `/badges` | — | own | own | own |
| `/api/v1/rewards*`, `/points/ledger`, `/notifications` | — | own | own | own |
| `/api/v1/admin/contributions*` | — | — | review | full |
| All other `/api/v1/admin/*` | — | — | — | full |

Rules that are easy to get wrong:

* **Ownership is checked server-side, never inferred from the token alone.**
  `GET /api/v1/verification-attempts/:id` with another user's id returns `404`
  (not `403`), so the route cannot be used to probe which attempt ids exist.
* **`storyUnlocked` is per-viewer.** An anonymous or non-unlocking caller never
  receives `story`, regardless of the artifact's global state (§12.4).
* **`EXPERT` is scoped.** An `EXPERT` may approve/reject contributions but may not
  approve verification, edit artifacts, suspend users, or adjust XP.
* **`ADMIN` acting on verification is recorded.** Every admin decision writes
  `adminActions` with the acting `userId`; admin identity is never client-supplied.
