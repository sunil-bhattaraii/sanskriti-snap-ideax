# Sanskriti Snap — MongoDB Database Schema Specification

**Version:** 1.0
**Status:** Hackathon MVP
**Database:** MongoDB
**ODM:** Mongoose
**Authentication:** Clerk
**Image Storage:** Cloudinary
**Primary Backend:** Next.js REST API

---

# 1. Database Design Principles

The database follows these principles:

1. MongoDB is the authoritative application database.
2. Clerk is the authoritative authentication provider.
3. The database stores the application's user record and Clerk user ID, but never passwords.
4. Official artifact data is controlled by authorized administrators/experts.
5. Community contributions are separate from official artifact data.
6. Verification attempts are separate from successful discoveries.
7. Verification results are server-authoritative.
8. XP and collection state cannot be directly modified by clients.
9. A user can successfully discover an artifact only once.
10. Artifact coordinates are stored as GeoJSON `Point` values.
11. MongoDB `2dsphere` indexes are used for geographic queries.
12. Timestamps are stored as BSON `Date` values.
13. Soft-disable/archive states are preferred over deleting operational records.
14. CV reference embeddings are associated with a specific artifact and CV model version.
15. All sensitive state transitions occur through backend business logic, never through client-controlled fields.

---

# 2. Entity Overview

The MVP contains the following primary collections:

| Collection             | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `users`                | Application user records                           |
| `artifacts`            | Official collectible cultural discoveries          |
| `artifactReferences`   | CV reference images and embeddings                 |
| `verificationAttempts` | Individual discovery verification attempts         |
| `discoveries`          | Successfully verified artifact discoveries         |
| `quests`               | Groups of artifacts forming exploration objectives |
| `userQuestProgress`    | User progress through quests                       |
| `badges`               | Achievement definitions                            |
| `userBadges`           | Badges earned by users                             |
| `xpTransactions`       | Immutable XP ledger                                |
| `contributions`        | User-submitted cultural place/artifact proposals   |
| `reports`              | Community moderation reports                       |
| `communitySnaps`       | Public user photographs                            |
| `adminActions`         | Administrative audit log                           |

Optional/non-core collections:

* `notifications`
* `businesses`
* `rewards`
* `redemptions`

These should not block the MVP.

---

# 3. Common Conventions

## 3.1 Primary Keys

MongoDB's `_id` is the primary identifier.

Mongoose should use `ObjectId` for application-owned entity IDs unless a specific external identifier is required.

Clerk user IDs remain strings.

Example:

```ts
_id: ObjectId
clerkUserId: string
```

---

# 4. User

## Collection

`users`

## Purpose

Represents the application's user record associated with a Clerk identity.

Clerk owns authentication and identity.

The Sanskriti Snap database owns application-specific profile, role, gamification, and preference information.

## Schema

```ts
{
  _id: ObjectId,

  clerkUserId: string,

  username: string,
  displayName: string,

  profileImage: {
    url: string,              // always displayable; never a signed URL
    publicId: string | null   // null when the asset is not ours to manage
  } | null,

  role: "USER" | "EXPERT" | "ADMIN",

  accountStatus: "ACTIVE" | "SUSPENDED" | "DELETED",

  lifetimeXp: number,

  pointsBalance: number,

  notifications: {
    enabled: boolean,
    radiusMeters: number
  },

  createdAt: Date,
  updatedAt: Date
}
```

## Constraints

* `clerkUserId` is required and unique.
* `username` is unique.
* `lifetimeXp >= 0`.
* `pointsBalance >= 0`.
* `notifications.radiusMeters > 0`.
* `lifetimeXp` is server-managed.
* `pointsBalance` is server-managed and is a **cache**, not the record. It must
  always equal the sum of the user's `pointsTransactions`. See §21a.
* `role` is server/admin-managed.
* `accountStatus` is server/admin-managed.

## Indexes

```text
clerkUserId: UNIQUE
username: UNIQUE
lifetimeXp: DESC
```

The `lifetimeXp` index supports leaderboard queries.

---

# 5. Artifact

## Collection

`artifacts`

## Purpose

The fundamental collectible entity in Sanskriti Snap.

An artifact may represent:

* Heritage site
* Temple
* Statue
* Carving
* Monument
* Building
* Courtyard
* Cultural object
* Other culturally significant physical location

Artifacts do not have parent/child relationships.

## Schema

```ts
{
  _id: ObjectId,

  name: string,

  slug: string,

  description: string,

  story: string,

  category:
    "TEMPLE" |
    "SITE" |
    "STATUE" |
    "CARVING" |
    "ARCHITECTURE" |
    "MONUMENT" |
    "COURTYARD" |
    "CULTURAL_OBJECT" |
    "OTHER",

  tags: string[],

  rarity:
    "Common" |
    "Rare" |
    "Epic" |
    "Legendary",

  location: {
    type: "Point",
    coordinates: [number, number]
  },

  humanReadableLocation: string,

  altitudeMeters: number | null,

  storyUnlockRadiusMeters: number,

  verificationRadiusMeters: number,

  xpReward: number,

  requiresSnap: boolean,

  requiresCV: boolean,

  cvConfiguration: {
    threshold: number,
    topK: number
  } | null,

  referenceImageUrls: string[],

  warnings: string | null,

  status:
    "DRAFT" |
    "PUBLISHED" |
    "ARCHIVED" |
    "DISABLED",

  discoveryCount: number,

  createdBy: ObjectId,

  updatedBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

## Location

MongoDB GeoJSON uses:

```text
[longitude, latitude]
```

not:

```text
[latitude, longitude]
```

Example:

```json
{
  "type": "Point",
  "coordinates": [85.3240, 27.6730]
}
```

## Constraints

* `storyUnlockRadiusMeters > 0`
* `verificationRadiusMeters > 0`
* `xpReward >= 0`
* `discoveryCount >= 0`
* `rarity` is `Common | Rare | Epic | Legendary`; defaults to `Common`. It is
  uploader-authored, not derived from `discoveryCount` or `category`
  (`API Contract.md` §11.5). TitleCase is deliberate — it is a display label.
* `cvConfiguration.threshold` must be between `0` and `1`.
* `cvConfiguration.topK >= 1`.
* `requiresCV = false` may have `cvConfiguration = null`.
* Artifact location is authoritative for GPS verification.

## Status Lifecycle

```text
DRAFT ──────► PUBLISHED ──────► ARCHIVED
                 │                  │
                 └──────────────────┘
                    (ARCHIVED is reversible)
                 
                 ▼
              DISABLED  (terminal; moderation action, not editorial)
```

| Status | On map | Discoverable | Searchable | In collection |
| --- | --- | --- | --- | --- |
| `DRAFT` | no | no | no | no |
| `PUBLISHED` | yes | yes | yes | yes |
| `ARCHIVED` | no | no | no | yes, read-only |
| `DISABLED` | no | no | no | yes, read-only |

Every discoverability query filters on `status: "PUBLISHED"`. A `DRAFT` artifact is
invisible even to its own author through the public API.

`DRAFT` exists because an admin can save an artifact before it has a location or a
reference image. Without it, a half-built artifact is immediately live on the map
at an undefined position. The superseded vocabulary was
`ACTIVE | ARCHIVED | DISABLED`, which had no way to express "not ready yet".

Migration note: the previous PostgreSQL enum is
`artifact_status AS ENUM ('active', 'archived', 'disabled')`. Map
`active` → `PUBLISHED` once, in the importer. Do not keep a mixed-case enum.

## Indexes

```text
location: 2dsphere

status: 1

category: 1

tags: 1

slug: UNIQUE

name: text
```

A geospatial index is mandatory for nearby-artifact queries.

---

# 6. Artifact Reference

## Collection

`artifactReferences`

## Purpose

Stores the reference dataset used by the CV service.

Each artifact can have multiple reference images.

## Schema

```ts
{
  _id: ObjectId,

  artifactId: ObjectId,

  imageUrl: string,

  cloudinaryPublicId: string | null,

  embedding: number[],

  embeddingDimension: number,

  cvModel: {
    name: string,
    version: string
  },

  createdAt: Date,
  updatedAt: Date
}
```

## Example

```json
{
  "artifactId": "...",
  "imageUrl": "https://...",
  "embedding": [0.012, -0.044, "..."],
  "embeddingDimension": 512,
  "cvModel": {
    "name": "openai/clip-vit-base-patch32",
    "version": "1"
  }
}
```

## Constraints

* `artifactId` must reference an existing artifact.
* `embeddingDimension` must match the embedding length.
* Embeddings belonging to the same comparison set must use compatible models.
* Embeddings are written only by authorized backend/admin processes.
* Clients must never write embeddings.

## Indexes

```text
artifactId: 1
```

This index is important because CV verification retrieves references for a specific artifact.

---

# 7. Verification Attempt

## Collection

`verificationAttempts`

## Purpose

Represents one attempt by a user to verify discovery of an artifact.

A user may have multiple attempts for the same artifact.

Example:

```text
Attempt 1 → REJECTED
Attempt 2 → FLAGGED
Attempt 3 → VERIFIED
```

A verification attempt does not itself represent collection ownership.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  artifactId: ObjectId,

  verificationImage: {
    url: string,
    publicId: string
  } | null,

  additionalPhotos: [
    {
      url: string,
      publicId: string,
      caption: string | null
    }
  ],

  locationEvidence: {
    latitude: number,
    longitude: number,
    accuracyMeters: number | null,
    altitudeMeters: number | null,
    capturedAt: Date
  },

  gpsVerification: {
    status:
      "PASSED" |
      "FAILED",

    distanceMeters: number | null,

    verifiedAt: Date | null
  },

  cvVerification: {
    status:
      "NOT_REQUIRED" |
      "PASSED" |
      "FAILED",

    similarityScore: number | null,

    threshold: number | null,

    topK: number | null,

    matchedReferenceIds: ObjectId[],

    model: {
      name: string,
      version: string
    } | null,

    processedAt: Date | null
  },

  status:
    "VERIFIED" |
    "FLAGGED" |
    "REJECTED",

  rejectionReason: string | null,

  review: {
    reviewedBy: ObjectId,
    reviewedAt: Date,
    decision: "APPROVED" | "REJECTED",
    note: string | null
  } | null,

  // Set when this attempt was created by POST /verification-attempts/:id/recheck.
  // The referenced attempt is never modified.
  supersedesAttemptId: ObjectId | null,

  // Set when this attempt produced a discovery (i.e. it was VERIFIED).
  discoveryId: ObjectId | null,

  capturedAt: Date,

  submittedAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

`additionalPhotos` has no visibility flag. These photos are the evidence the
verification system depends on and are **always private**; a photo becomes public
only by creating a separate `communitySnaps` document (§17), which is the only
public-photo path and preserves provenance via `verificationAttemptId`.

`supersedesAttemptId` is what makes recheck non-destructive. Recheck inserts a new
attempt and leaves the original untouched, so a `FLAGGED` attempt that was later
passed on retry remains distinguishable from one that an admin approved.

## Critical Security Rule

The client may submit:

```text
latitude
longitude
accuracy
altitude
capturedAt
verification image
```

The client may NOT submit authoritative:

```text
gpsVerification.status
cvVerification.status
similarityScore
status
review
```

These are backend-owned fields.

The backend must recompute GPS distance itself.

---

# 8. Verification State Machine

CV verification runs **synchronously** inside the request. There is no queue and
no background worker, so there is no `PENDING` and no `PROCESSING` state to
persist. An attempt document is only written once the verdict is known, inside the
same transaction that awards the discovery.

## Persisted states

```text
                     ┌──────────────────────────┐
                     │  (nothing is written)    │
                     │  GPS failed  → no attempt│
                     │  CV outage   → no attempt│
                     └──────────────────────────┘
                                  |
                                  v
        GPS passed
              |
      +-------+-------+
      |               |
   CV not required   CV passed
      |               |
      |               +----> VERIFIED
      +-------------------> VERIFIED   (discovery + XP + points + quest + badge)
      |
   CV failed (low similarity)
      |
      +----> FLAGGED  (no discovery; awaiting manual review)
                  |
            +-----+------+
            |            |
       APPROVE        REJECT
            |            |
            v            v
        VERIFIED     REJECTED
```

## Removed states

`PENDING`, `PROCESSING`, `FAILED`, `UNAVAILABLE`, and `ERROR` are **not**
persisted. Each was reachable only through asynchronous processing:

| Removed | Why it no longer exists |
| --- | --- |
| `PENDING` | An attempt row is written only after a verdict exists. |
| `PROCESSING` | There is no gap between write and verdict to observe. |
| `FAILED` | A CV outage persists nothing at all, so there is no row to mark. |
| `cvVerification.UNAVAILABLE` / `ERROR` | Same — the request returns 503/504 and stores nothing. |

A failed technical operation must not automatically be treated as a user
rejection. Under this model that is structural: a technical failure produces **no
document**, so it cannot be a rejection. The client retries by re-sending the
same request, which is why verification submission must be idempotent (§43 of
`Backend TDS.md`).

A `FLAGGED` attempt is the only non-terminal user-visible state, and it is
terminal from the user's perspective — they are told it is in review. It changes
only via an admin decision.

## Recheck does not mutate an attempt

```text
Attempt 1 (FLAGGED)  ──POST /verification-attempts/:id/recheck──>  Attempt 2 (VERIFIED)
                                                          supersedesAttemptId = Attempt 1
```

`POST /verification-attempts/:id/recheck` **inserts a new attempt** and never
edits the one in the path. An attempt is immutable evidence: its GPS verdict, CV
score, and photo record what was submitted at that moment, and mutating them would
destroy the audit trail. It would also make "an admin approved this" and "the user
re-submitted and passed this time" indistinguishable in the record.

Attempt 1 keeps its status. Attempt 2 carries `supersedesAttemptId = Attempt 1`.
If Attempt 2 is `VERIFIED`, the award transaction runs as normal, subject to the
duplicate-discovery constraint.

## Handling a technical failure without a pending state

```text
CV service unreachable / timeout
        ↓
503 CV_UNAVAILABLE, or 504 CV_TIMEOUT
        ↓
No verificationAttempts row
No discoveries row
No xpTransactions row
No pointsTransactions row
        ↓
Client re-sends the same request with the same idempotency key
```

Because nothing was written, the retry cannot double-award. This is the mechanism
that satisfies invariant 20 (§37) without a pending state.

---

# 9. Discovery

## Collection

`discoveries`

## Purpose

Represents the successful collection of an artifact by a user.

A discovery is created only after successful verification.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  artifactId: ObjectId,

  verificationAttemptId: ObjectId,

  discoveredAt: Date,

  xpAwarded: number,

  createdAt: Date
}
```

## Critical Constraint

A user can discover an artifact only once.

Unique compound index:

```text
(userId, artifactId): UNIQUE
```

This is the primary duplicate-discovery defense.

## Rules

* Clients cannot directly create discoveries.
* Discoveries are created by backend verification logic.
* `xpAwarded` is a snapshot of the artifact's XP value at discovery time.
* Re-visiting an already discovered artifact does not award base XP.

---

# 10. Quest

## Collection

`quests`

## Purpose

Groups artifacts into an exploration objective.

## Schema

```ts
{
  _id: ObjectId,

  name: string,

  description: string,

  artifactIds: ObjectId[],

  xpReward: number,

  badgeId: ObjectId | null,

  status:
    "ACTIVE" |
    "ARCHIVED",

  createdAt: Date,
  updatedAt: Date
}
```

## Constraints

* `artifactIds` must contain valid artifact IDs.
* Duplicate artifact IDs are not allowed within a quest.
* `xpReward >= 0`.
* `badgeId`, when present, must reference a valid badge.

---

# 11. User Quest Progress

## Collection

`userQuestProgress`

## Purpose

Stores a user's progress through an individual quest.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  questId: ObjectId,

  discoveredArtifactIds: ObjectId[],

  completedAt: Date | null,

  createdAt: Date,
  updatedAt: Date
}
```

## Constraints

Unique compound index:

```text
(userId, questId): UNIQUE
```

The same artifact must not appear twice in `discoveredArtifactIds`.

## Progress

Quest progress is calculated as:

```text
discoveredArtifactIds.length / quest.artifactIds.length
```

An artifact is added only after successful discovery.

---

# 12. Badge

## Collection

`badges`

## Purpose

Defines an achievement that users can earn.

## Schema

```ts
{
  _id: ObjectId,

  name: string,

  description: string,

  iconUrl: string | null,

  condition: {
    type:
      "FIRST_DISCOVERY" |
      "DISCOVERY_COUNT" |
      "QUEST_COMPLETION" |
      "CATEGORY_COUNT",

    value: number | null,

    questId: ObjectId | null,

    category: string | null
  },

  status:
    "ACTIVE" |
    "DISABLED",

  createdAt: Date,
  updatedAt: Date
}
```

## Examples

First discovery:

```json
{
  "type": "FIRST_DISCOVERY"
}
```

Ten discoveries:

```json
{
  "type": "DISCOVERY_COUNT",
  "value": 10
}
```

Five temples:

```json
{
  "type": "CATEGORY_COUNT",
  "category": "TEMPLE",
  "value": 5
}
```

Quest completion:

```json
{
  "type": "QUEST_COMPLETION",
  "questId": "..."
}
```

---

# 13. User Badge

## Collection

`userBadges`

## Purpose

Records badges earned by users.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  badgeId: ObjectId,

  earnedAt: Date
}
```

## Index

```text
(userId, badgeId): UNIQUE
```

A badge can only be earned once.

---

# 14. XP Transaction

## Collection

`xpTransactions`

## Purpose

Immutable ledger of XP changes.

The user's `lifetimeXp` is a cached aggregate.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  amount: number,

  type:
    "DISCOVERY" |
    "QUEST_COMPLETION" |
    "BADGE" |
    "ADMIN_ADJUSTMENT" |
    "ROLLBACK",

  referenceType:
    "DISCOVERY" |
    "QUEST" |
    "BADGE" |
    "ADMIN" |
    "VERIFICATION",

  referenceId: ObjectId | null,

  createdAt: Date
}
```

## Rules

* Transactions are append-only.
* Clients cannot create transactions.
* Negative transactions are permitted only for rollback/admin correction.
* `User.lifetimeXp` must never become negative.

## Indexes

```text
userId: 1
createdAt: -1
```

---

# 15. Contribution

## Collection

`contributions`

## Purpose

Represents a user-submitted proposal for a new cultural artifact/place.

Community submissions are not authoritative artifact data.

## Schema

```ts
{
  _id: ObjectId,

  submittedBy: ObjectId,

  name: string,

  description: string,

  category: string,

  tags: string[],

  location: {
    type: "Point",
    coordinates: [number, number]
  },

  humanReadableLocation: string | null,

  culturalSignificance: string,

  photos: [
    {
      url: string,
      publicId: string
    }
  ],

  status:
    "DRAFT" |
    "SUBMITTED" |
    "UNDER_REVIEW" |
    "APPROVED" |
    "REJECTED",

  review: {
    reviewedBy: ObjectId,
    reviewedAt: Date,
    note: string | null
  } | null,

  officialArtifactId: ObjectId | null,

  createdAt: Date,
  updatedAt: Date
}
```

## Lifecycle

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ├──→ REJECTED
  └──→ APPROVED
          ↓
     officialArtifactId
```

An approved contribution may result in creation of an official Artifact.

---

# 16. Report

## Collection

`reports`

## Purpose

Allows users to report inappropriate or problematic community content.

## Schema

```ts
{
  _id: ObjectId,

  reporterId: ObjectId,

  targetType:
    "COMMUNITY_SNAP" |
    "VERIFICATION_ATTEMPT" |
    "CONTRIBUTION" |
    "ARTIFACT",

  targetId: ObjectId,

  reason:
    "FAKE" |
    "IRRELEVANT" |
    "OFFENSIVE" |
    "PRIVACY" |
    "OTHER",

  description: string | null,

  status:
    "OPEN" |
    "DISMISSED" |
    "HIDDEN" |
    "REMOVED",

  reviewedBy: ObjectId | null,

  reviewedAt: Date | null,

  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

```text
status: 1
targetType: 1
targetId: 1
reporterId: 1
```

---

# 17. Community Snap

## Collection

`communitySnaps`

## Purpose

Stores public user photographs associated with artifacts/discoveries.

Verification images remain controlled by the verification system and are private by default.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  artifactId: ObjectId | null,

  verificationAttemptId: ObjectId | null,

  media: {
    url: string,
    publicId: string
  },

  caption: string | null,

  status:
    "PENDING" |
    "ACTIVE" |
    "HIDDEN" |
    "REMOVED",

  createdAt: Date,
  updatedAt: Date
}
```

`status` is the **only** visibility control. There is no separate `isPublished`
boolean, because two representations of one fact can contradict each other.

* `PENDING` — the default on insert. A newly uploaded Snap is private until
  moderated, which is what invariant 15 requires.
* `ACTIVE` — published. The only status returned by a public read.
* `HIDDEN` / `REMOVED` — not public; set by moderation.

`verificationAttemptId` preserves provenance: a public photo can always be traced
back to the verification attempt that produced it, so moderation can tell whether
an image passed verification. It is nullable only for admin-imported content.

A community Snap must never become authoritative evidence merely because it is public.

---

# 18. Admin Action

## Collection

`adminActions`

## Purpose

Audit log of administrative operations.

## Schema

```ts
{
  _id: ObjectId,

  adminId: ObjectId,

  action:
    "ARTIFACT_CREATED" |
    "ARTIFACT_UPDATED" |
    "ARTIFACT_ARCHIVED" |
    "ARTIFACT_DISABLED" |

    "VERIFICATION_APPROVED" |
    "VERIFICATION_REJECTED" |

    "CONTRIBUTION_APPROVED" |
    "CONTRIBUTION_REJECTED" |

    "QUEST_CREATED" |
    "QUEST_UPDATED" |
    "QUEST_ARCHIVED" |

    "BADGE_CREATED" |
    "BADGE_UPDATED" |

    "COMMUNITY_CONTENT_HIDDEN" |
    "COMMUNITY_CONTENT_REMOVED" |

    "USER_SUSPENDED" |
    "USER_REACTIVATED" |

    "ADMIN_ADJUSTMENT",

  targetType: string,

  targetId: ObjectId,

  metadata: Record<string, unknown> | null,

  createdAt: Date
}
```

## Index

```text
(targetType, targetId)
adminId
createdAt
```

---

# 19. Optional Notification

## Collection

`notifications`

This collection is optional for the MVP.

If nearby notifications are implemented:

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  type:
    "NEARBY_ARTIFACT" |
    "VERIFICATION_UPDATE" |
    "QUEST_COMPLETED" |
    "BADGE_EARNED" |
    "SYSTEM",

  artifactId: ObjectId | null,

  title: string,

  body: string,

  readAt: Date | null,

  createdAt: Date
}
```

Recommended index:

```text
(userId, createdAt): DESC
```

---

# 20. Optional Business

## Collection

`businesses`

```ts
{
  _id: ObjectId,

  name: string,

  description: string | null,

  location: {
    type: "Point",
    coordinates: [number, number]
  } | null,

  contactInfo: string | null,

  status:
    "ACTIVE" |
    "DISABLED",

  createdAt: Date,
  updatedAt: Date
}
```

---

# 21. Optional Reward

## Collection

`rewards`

```ts
{
  _id: ObjectId,

  businessId: ObjectId,

  description: string,

  terms: string | null,

  pointRequirement: number,

  category:
    "FOOD_AND_DRINK" |
    "EXPERIENCE" |
    "CULTURE" |
    "OTHER",

  imageUrl: string | null,

  status:
    "ACTIVE" |
    "DISABLED",

  createdAt: Date,
  updatedAt: Date
}
```

Rewards should remain outside the critical MVP discovery flow but are now
**required** collections, because the points balance they spend is P0.

---

# 21a. Points Transaction

## Collection

`pointsTransactions`

## Purpose

Append-only ledger of every change to a user's spendable points balance. This is
the source of truth; `users.pointsBalance` is a cached total that must always
equal the sum of this ledger.

Points are a different currency from XP. XP is never spent and never decreases
(except via an explicit admin adjustment). Points are spent on rewards and may
decrease. Conflating the two was a defect in the previous implementation, where
`reward_points` was incremented by the same value as `lifetimeXp`.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  type:
    "EARNED" |
    "SPENT" |
    "ADJUSTED",

  amount: number,          // always positive; `type` carries the direction

  balanceAfter: number,    // running total after this entry, >= 0

  reason:
    "DISCOVERY" |
    "QUEST_COMPLETION" |
    "BADGE_EARNED" |
    "REWARD_REDEMPTION" |
    "ADMIN_ADJUSTMENT",

  referenceId: ObjectId | null,   // discoveryId, questId, rewardId, adminActionId

  note: string | null,

  createdBy: ObjectId | null,     // set only for ADMIN_ADJUSTMENT

  createdAt: Date
}
```

## Constraints

* Entries are **append-only**. Never update or delete a `pointsTransactions`
  document.
* `amount > 0`. The sign is conveyed by `type`, so `SPENT` entries also store a
  positive number and the direction is derivable from `type`.
* `balanceAfter >= 0`. A redemption that would take the balance below zero must
  fail before any entry is written.
* `balanceAfter` must equal the previous entry's `balanceAfter` plus or minus
  `amount`, by `type`. This makes the ledger independently auditable.
* `createdBy` is required when `reason = "ADMIN_ADJUSTMENT"` and null otherwise.
* `referenceId` is required for `DISCOVERY`, `QUEST_COMPLETION`,
  `REWARD_REDEMPTION`, and `ADMIN_ADJUSTMENT`.

## Indexes

```text
userId: 1, createdAt: -1

userId: 1, referenceId: 1
```

The second index enforces that a single discovery or redemption cannot be
credited twice.

---

# 21b. Redemption

## Collection

`redemptions`

## Purpose

A confirmed exchange of points for a reward. Games the rewards UI's history.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  rewardId: ObjectId,

  businessId: ObjectId | null,

  pointsSpent: number,

  status:
    "CONFIRMED" |
    "FULFILLED" |
    "CANCELLED",

  code: string | null,      // redemption code shown to the user

  redeemedAt: Date,

  createdAt: Date
}
```

## Constraints

* `pointsSpent > 0` and must equal the referenced `rewards.pointRequirement` at
  the time of redemption.
* A `CANCELLED` redemption must be paired with a compensating `ADJUSTED`
  `pointsTransactions` entry. Points are never silently restored.
* `code` is generated server-side and is the only thing the user presents at the
  business.

## Indexes

```text
userId: 1, redeemedAt: -1

userId: 1, rewardId: UNIQUE
```

The unique index enforces one redemption per user per reward.

---

# 21c. Story Unlock

## Collection

`storyUnlocks`

## Purpose

Records that a user came within `artifacts.storyUnlockRadiusMeters` of an artifact
and may now read its story. This is **independent of discovery**: reading a story
does not require collecting the artifact, and collecting is not required to read.

## Schema

```ts
{
  _id: ObjectId,

  userId: ObjectId,

  artifactId: ObjectId,

  unlockedAt: Date,

  unlockedBy: {
    latitude: number,
    longitude: number,
    distanceMeters: number,
    capturedAt: Date
  }
}
```

## Constraints

* Written only by the backend, when a proximity check passes. Never written by
  the client.
* The unlock is independent of `discoveries`. A user whose verification attempt is
  `FLAGGED` still keeps the story unlock they earned by proximity.
* Once unlocked, remains unlocked. Proximity is required to create the record,
  not to keep it.

## Indexes

```text
userId: 1, artifactId: 1: UNIQUE

userId: 1
```

---

# 22. Relationship Summary

```text
User
 │
 ├─────────────── VerificationAttempt
 │                         │
 │                         └──────── Artifact
 │
 ├─────────────── Discovery
 │                         │
 │                         └──────── Artifact
 │
 ├─────────────── UserQuestProgress ───── Quest
 │                                         │
 │                                         └── Artifact[]
 │
 ├─────────────── UserBadge ───────────── Badge
 │
  ├─────────────── XPTransaction
  │
  ├─────────────── PointsTransaction ─── (balance cache on User)
  │
  ├─────────────── Redemption ────────── Reward
  │
  ├─────────────── StoryUnlock
  │
  ├─────────────── Contribution
  │
  ├─────────────── CommunitySnap
  │
  └─────────────── Report


Artifact
 │
 ├── ArtifactReference[]
 │
 ├── VerificationAttempt[]
 │
 ├── Discovery[]
 │
 ├── StoryUnlock[]
 │
 ├── Quest membership
 │
 └── CommunitySnap[]


Admin
 │
 └── AdminAction[]
```

---

# 23. Critical Unique Constraints

The following indexes are mandatory.

### User

```text
users.clerkUserId UNIQUE
users.username UNIQUE
```

### Artifact

```text
artifacts.slug UNIQUE
```

### Discovery

```text
discoveries.userId + discoveries.artifactId UNIQUE
```

### User Quest Progress

```text
userQuestProgress.userId + userQuestProgress.questId UNIQUE
```

### User Badge

```text
userBadges.userId + userBadges.badgeId UNIQUE
```

These constraints provide important server-side protection against duplicate state.

---

# 24. Geospatial Queries

Artifact locations use:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

with:

```text
2dsphere index
```

Nearby search should use MongoDB's `$geoNear` or `$near`.

Example conceptual query:

```text
Find PUBLISHED artifacts
within N meters
ordered by distance.
```

`DRAFT` artifacts are excluded by this filter, which is the reason the `DRAFT`
state exists (§5 Status Lifecycle).

The backend must never rely solely on the client's calculated distance.

---

# 25. Server-Authoritative Verification

The following fields must never be trusted from the mobile client:

```text
gpsVerification.status
gpsVerification.distanceMeters

cvVerification.status
cvVerification.similarityScore

verificationAttempt.status

discovery creation

xpAwarded

quest progress

badge awards

user.lifetimeXp
```

The client provides evidence.

The backend determines the result.

The intended architecture is:

```text
Mobile
  │
  │ location + image
  ▼
Next.js
  │
  ├── GPS calculation
  │
  ├── CV request
  │
  ├── threshold evaluation
  │
  ├── verification state
  │
  ├── discovery creation
  │
  ├── XP
  │
  ├── quest progress
  │
  └── badge evaluation
```

---

# 26. Discovery Transaction

A successful verification must perform the following operations as one logical server-side operation:

```text
 1. Verify artifact is PUBLISHED
 2. Recalculate GPS distance
 3. Verify GPS radius
 4. Ensure user has not already discovered artifact
 5. Perform CV verification if required
 6. Create VerificationAttempt (already in its final state)
 7. Create Discovery
 8. Create XPTransaction
 9. Create PointsTransaction
10. Increment User.lifetimeXp
11. Increment User.pointsBalance
12. Update affected Quest progress
13. Complete quests where applicable
14. Award quest XP where applicable
15. Evaluate badges
16. Create UserBadge records where applicable
```

MongoDB transactions should be used where the deployment supports them.

## Ordering constraints

The order above is not arbitrary, and it differs from the sequence this section
previously listed. Two rules govern it:

1. **The duplicate-discovery check (step 4) precedes the CV call (step 5).** A user
   re-submitting an artifact they already collected must not cost a CV
   comparison. This is the same endpoint the rate limit in §88 of
   `Backend TDS.md` protects.
2. **The attempt document is created at step 6, after the CV call, not before
   it.** This section previously began with "verify verification attempt" and
   created the row before doing any work. With synchronous CV that ordering would
   persist a `PENDING` row, and a CV outage would then leave a half-finished
   attempt that something else has to reconcile or clean up.

Creating the attempt last is what makes a CV outage total rather than partial: a
technical failure aborts before step 6, so no `verificationAttempts`,
`discoveries`, `xpTransactions`, or `pointsTransactions` document is written. The
client retries the same request. Invariant 20 (§37) is satisfied structurally
rather than by state-transition bookkeeping.

## Failure outcomes

| Failure at | Result | Documents written |
| --- | --- | --- |
| step 1–2 (validation, artifact state) | `404` / `409` | none |
| step 3 (GPS radius) | `422 GPS_OUTSIDE_RADIUS` | none |
| step 4 (duplicate) | `409 ALREADY_DISCOVERED` | none |
| step 5 (CV unreachable/timeout) | `503` / `504` | none |
| step 5 (CV ran, low similarity) | `201`, attempt `FLAGGED` | attempt only |
| step 6+ (database error) | `500`, transaction rolled back | none |

---

# 27. Duplicate Discovery Protection

The application must have multiple layers of protection:

```text
Application check
        +
Unique MongoDB index
        +
Atomic/transactional discovery creation
```

The unique index is the final database-level defense.

The system must never rely solely on:

```text
if (!alreadyDiscovered) {
   createDiscovery()
}
```

because concurrent requests can pass the check simultaneously.

---

# 28. XP Integrity

XP is server-controlled.

The following operations may award XP:

```text
DISCOVERY
QUEST_COMPLETION
BADGE
ADMIN_ADJUSTMENT
```

Every award must create an `XPTransaction`.

The user's cached:

```text
users.lifetimeXp
```

must correspond to the accumulated XP ledger.

Clients cannot modify either value.

---

# 29. CV Reference Dataset

Each artifact may have:

```text
0..N reference images
```

Only CV-enabled artifacts require a reference dataset.

Recommended target:

```text
30–50 reference images
```

per CV-enabled artifact for the hackathon demonstration.

Reference embeddings must contain:

```text
artifactId
embedding
embeddingDimension
model.name
model.version
```

The CV service must retrieve references belonging specifically to the requested artifact.

It must never compare the user's image against references belonging to unrelated artifacts.

---

# 30. CV Similarity

The intended aggregation strategy is:

```text
submitted image
      ↓
embedding
      ↓
compare against artifact's references
      ↓
similarity scores
      ↓
select top K
      ↓
aggregate top K
      ↓
compare against threshold
```

The exact value of `K` is configurable.

The threshold is configurable per artifact.

The backend, not the mobile client, makes the final decision.

---

# 31. CV Failure Handling

CV infrastructure failure is not equivalent to a failed discovery.

Examples:

```text
CV timeout
CV service unavailable
invalid embedding
model error
network failure
```

should result in a technical failure that persists **nothing** (see §8). The request
returns `503 CV_UNAVAILABLE` or `504 CV_TIMEOUT`, no attempt document is written, and
the client retries the same request. They should not automatically become:

```text
REJECTED
```

A user should not lose a legitimate discovery because the GPU server decided to have a nervous breakdown.

---

# 32. Privacy Rules

### Verification Images

Private by default.

### Additional Photos

Private by default.

### Community Snaps

Public only when explicitly published.

### Profile Images

Public according to profile settings.

### CV Embeddings

Not publicly exposed.

Raw reference embeddings should never be returned through normal user APIs.

---

# 33. Role Permissions

## USER

Can:

* Read published artifacts
* Search artifacts
* View unlocked stories
* Submit verification attempts
* View own discoveries
* View own XP
* View quests
* View badges
* Submit contributions
* Publish community Snaps
* Report content

Cannot:

* Modify artifacts
* Modify XP
* Create discoveries directly
* Modify verification results
* Review contributions
* Manage users

## EXPERT

Can additionally:

* Review artifact contributions
* Approve/reject contributions within assigned permissions

Should not automatically receive:

* User management
* System configuration
* XP manipulation
* Reward administration

## ADMIN

Can:

* Manage artifacts
* Manage reference datasets
* Review verification attempts
* Review contributions
* Manage quests
* Manage badges
* Moderate community content
* Manage users
* Perform authorized XP adjustments
* Manage system configuration

---

# 34. Soft Deletion / Status Policy

Operational entities should generally not be physically deleted.

Examples:

```text
Artifact → ARCHIVED / DISABLED
Quest → ARCHIVED
Badge → DISABLED
CommunitySnap → HIDDEN / REMOVED
User → DELETED
```

A `CommunitySnap` also moves `PENDING → ACTIVE` when moderation publishes it. That
is a visibility transition, not a soft deletion, and it is the only automatic
transition in this list — nothing publishes a snap without a moderation action.

Historical records such as:

```text
Discovery
XPTransaction
VerificationAttempt
AdminAction
```

should normally remain available for audit purposes.

---

# 35. API Boundary

The database schema is the source of truth for persistent state.

However, API responses should not expose MongoDB documents directly.

The backend should expose DTOs.

For example:

```text
MongoDB Artifact
        ↓
Backend DTO
        ↓
Mobile Artifact
```

This prevents internal fields such as:

```text
createdBy
cvConfiguration internals
internal moderation fields
```

from accidentally becoming public API data.

---

# 36. MVP Collections vs Optional Collections

## Required

```text
users
artifacts
artifactReferences
verificationAttempts
discoveries
storyUnlocks
quests
userQuestProgress
badges
userBadges
xpTransactions
pointsTransactions
rewards
redemptions
contributions
reports
communitySnaps
adminActions
```

`storyUnlocks` is required because proximity story unlock is a P0 mechanic that is
independent of discovery.

`rewards`, `redemptions`, and `pointsTransactions` moved from optional to required:
points are P0 per `SanskritiSnapApp/AGENTS.md`, and a spendable balance without a
ledger cannot distinguish "spent" from "revoked" (§21a).

## Optional

```text
notifications
businesses
```

The optional collections should not block the core discovery loop.

---

# 37. Core Domain Invariants

The following invariants must always hold:

1. A user cannot discover the same artifact twice.
2. GPS verification is calculated by the backend.
3. CV verification is calculated by the backend/CV service.
4. CV cannot override failed GPS verification.
5. Clients cannot directly create discoveries.
6. Clients cannot directly award XP.
7. Clients cannot directly complete quests.
8. Clients cannot directly award badges.
9. XP transactions are append-only.
10. Artifact reference embeddings belong to exactly one artifact.
11. CV model compatibility must be known for embeddings.
12. Official artifact data cannot be modified by ordinary users.
13. Community submissions do not automatically become official artifacts.
14. Verification images are private by default.
15. Public community media requires explicit visibility. A `communitySnaps` document
    is inserted as `PENDING` and is not public until a moderation action sets it to
    `ACTIVE`. There is no `isPublished` boolean and no visibility flag on
    `verificationAttempts.additionalPhotos`; the `status` enum is the only control.
16. Administrative actions are auditable.
17. Suspended users cannot perform protected application actions.
18. An artifact that is not `PUBLISHED` cannot be newly discovered.
19. Archived quests do not accept new progress.
20. Technical CV failures must not automatically count as user rejection.
21. A story unlock is earned by proximity and is independent of discovery.
22. Points transactions are append-only.
23. `users.pointsBalance` always equals the sum of that user's `pointsTransactions`.
24. A verification attempt is never persisted in a non-final state.
25. A verification attempt is immutable once written. Recheck inserts a new attempt
    with `supersedesAttemptId`; the only permitted mutation of an existing attempt
    is `FLAGGED → VERIFIED` or `FLAGGED → REJECTED` by an administrator.

---

# 38. Recommended MongoDB Collection List

Final MVP collection structure:

```text
users
artifacts
artifactReferences
verificationAttempts
discoveries
storyUnlocks

quests
userQuestProgress
badges
userBadges
xpTransactions
pointsTransactions

rewards
redemptions

contributions
communitySnaps
reports

adminActions
```

This schema intentionally does not reproduce every table from the previous Supabase implementation.

It preserves the useful domain architecture while removing:

* Supabase Auth-specific structures
* PostgreSQL-specific join tables where unnecessary
* redundant verification state
* client-trusted verification fields
* unfinished notification infrastructure
* unused legacy fields

Unlike the previous version of this list, `rewards`, `redemptions`, and
`pointsTransactions` are **not** removed. Points are P0, and the previous
`reward_points` integer could not represent the ledger the product requires
(§21a).

The database should support the complete MVP loop:

```text
DISCOVER
   ↓
VISIT
   ↓
UNLOCK
   ↓
SNAP
   ↓
VERIFY
   ↓
DISCOVERY
   ↓
XP
   ↓
QUEST
   ↓
BADGE
   ↓
COLLECTION
```

This schema is the canonical persistent-data model for the Sanskriti Snap MVP. API contracts, Mongoose schemas, validation rules, and frontend TypeScript types should be derived from this specification rather than independently designed.
