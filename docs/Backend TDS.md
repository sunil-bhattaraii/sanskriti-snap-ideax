# Sanskriti Snap

## Technical Design Specification (TDS) — Backend

**Version:** 2.0
**Status:** Hackathon MVP
**Primary Backend:** Next.js
**API Style:** REST
**Runtime:** Node.js
**Language:** TypeScript
**Database:** MongoDB
**Authentication:** Clerk
**Image Storage:** Cloudinary
**CV Service:** FastAPI + PyTorch + CLIP/OpenCLIP
**CV Data Storage:** MongoDB
**Primary Client:** React Native + Expo
**Admin Client:** Next.js Web Application

---

# 1. Purpose

This document defines the technical architecture and implementation design for the Sanskriti Snap backend.

The backend is the **authoritative application layer**.

It is responsible for:

* Authentication integration
* Authorization
* User management
* Artifact management
* Location verification
* Discovery management
* Image verification orchestration
* XP
* Collections
* Quests
* Badges
* Leaderboards
* User contributions
* Community content
* Rewards and businesses
* Administrative operations
* Cloudinary integration
* Communication with the CV service

The backend is intentionally separated from the computer vision service.

The CV service performs image-related computation, while the Next.js backend owns the final application decision.

---

# 2. Backend Architecture

```text
                         ┌──────────────────────┐
                         │ React Native + Expo  │
                         └──────────┬───────────┘
                                    │
                                    │ REST
                                    ▼
                       ┌────────────────────────┐
                       │      Next.js API       │
                       │                        │
                       │ Auth / Authz            │
                       │ Business Logic         │
                       │ Verification           │
                       │ Gamification           │
                       │ Admin                  │
                       └───────┬───────┬────────┘
                               │       │
                    ┌──────────┘       └─────────────┐
                    ▼                                ▼
             ┌────────────┐                  ┌─────────────┐
             │  MongoDB   │                  │ Cloudinary  │
             └────────────┘                  └─────────────┘
                              
                               │
                               │ CV request
                               ▼
                       ┌───────────────────┐
                       │ FastAPI CV Server │
                       │                   │
                       │ PyTorch           │
                       │ CLIP/OpenCLIP     │
                       │ Embeddings        │
                       │ Similarity        │
                       └───────────────────┘
```

---

# 3. Architectural Principles

## 3.1 Next.js Is the Main Backend

All application operations should pass through the Next.js backend.

The mobile application should not directly communicate with:

* MongoDB
* FastAPI CV service
* Administrative data
* Internal backend services

Cloudinary is the intentional exception for direct image uploads where signed uploads are used.

---

# 4. Backend Responsibilities

The Next.js backend owns:

### Identity

* Clerk integration
* User synchronization
* Role/permission checks

### Discovery

* Artifact retrieval
* Artifact search
* Nearby artifacts
* Artifact details
* Story availability

### Verification

* Discovery submission
* GPS validation
* CV orchestration
* Verification state
* Manual review
* Final verification decision

### Gamification

* XP
* Collections
* Quests
* Badges
* Leaderboards

### Community

* Public Snaps
* User profiles
* User contributions

### Administration

* Artifact management
* Reference data
* Verification review
* Contribution review
* Quest management
* Badge management
* Reward/business management
* Moderation

---

# 5. API Architecture

The API follows REST conventions.

**[suggested]**

Use domain-oriented routes:

```text
/api
├── /auth
├── /users
├── /artifacts
├── /discoveries
├── /verification
├── /collection
├── /quests
├── /badges
├── /leaderboard
├── /community
├── /contributions
├── /rewards
└── /admin
```

The exact route naming can be refined during implementation.

---

# 6. Request Lifecycle

A typical authenticated request follows:

```text
Request
  │
  ▼
Next.js Route Handler
  │
  ▼
Clerk Authentication
  │
  ▼
Role / Authorization Check
  │
  ▼
Request Validation
  │
  ▼
Business Logic
  │
  ▼
MongoDB / External Service
  │
  ▼
Response
```

---

# 7. Authentication

Clerk is responsible for authentication.

Supported authentication methods:

* Credentials
* Google OAuth

The backend trusts the authenticated Clerk session/token rather than implementing its own password authentication system.

The application database stores the application's user record and links it to the Clerk user ID.

---

# 8. User Synchronization

When an authenticated user first interacts with the backend, the system should ensure that an application-level user record exists.

Conceptually:

```text
Clerk User
    │
    ▼
Authenticated API Request
    │
    ▼
Find user by clerkUserId
    │
    ├── Exists → Continue
    │
    └── Missing → Create application User
```

**[suggested]** User creation should be idempotent so repeated requests cannot create duplicate application users.

---

# 9. User Roles

The application uses three roles:

```text
USER
EXPERT
ADMIN
```

## USER

Normal application user.

## EXPERT

Can review user-submitted artifact/place information.

## ADMIN

Full administrative access.

---

# 10. Authorization

Authorization must be enforced on the backend.

The frontend may hide unavailable UI, but that is not considered security.

Example:

```text
User → /admin/artifacts
       ↓
Backend checks role
       ↓
403 Forbidden
```

An Expert should not gain administrative access merely by knowing an admin endpoint.

---

# 11. Permission Model

**[suggested]**

Use role-based permissions initially.

Conceptually:

```text
USER
├── read public artifacts
├── create discoveries
├── create contributions
└── manage own content

EXPERT
├── USER permissions
└── review contributions

ADMIN
├── USER permissions
├── EXPERT permissions
└── administrative permissions
```

This can later evolve into fine-grained permissions if required.

---

# 12. Database

MongoDB is the primary application database.

The database stores application data and CV embeddings.

No separate vector database is required for the hackathon MVP.

---

# 13. Core Collections

The backend should contain collections representing at least:

```text
users
artifacts
artifactEmbeddings
discoveries
verificationAttempts
quests
badges
collections
contributions
communitySnaps
rewards
businesses
```

**[suggested]** Some closely related collections may be embedded instead if the resulting access patterns remain simple. The exact decision belongs in schema implementation.

---

# 14. User Model

Conceptually:

```ts
User {
  _id
  clerkUserId
  email
  name
  avatarUrl

  role

  xp
  level

  createdAt
  updatedAt
}
```

The database should not store passwords.

Clerk remains the authentication authority.

---

# 15. Artifact Model

An artifact represents an independently collectible cultural location.

Conceptually:

```ts
Artifact {
  _id

  name
  description
  story

  category
  tags

  location: {
    latitude
    longitude
    altitude
    radius
  }

  xp

  requiresCv

  status

  questIds[]

  createdBy
  updatedBy

  createdAt
  updatedAt
}
```

There is intentionally no required `parentArtifactId`.

Artifacts are independent entities.

Quests provide grouping.

---

# 16. Artifact Status

**[suggested]**

Artifacts should have an explicit status. The canonical set is
`DRAFT | PUBLISHED | ARCHIVED | DISABLED` (`DB Schemas.md` §5, `API Contract.md`
§11.7); `ARCHIVED` was added to this section's original three.

```text
DRAFT
PUBLISHED
ARCHIVED
DISABLED
```

### DRAFT

Not visible to normal users. A newly created artifact starts here; it is not on
the map, not discoverable, and not searchable.

### PUBLISHED

Available for discovery. Every public query filters on `PUBLISHED`.

### ARCHIVED

Removed from the map and search but retained in users' collections read-only, so
historical discoveries do not break. Reversible.

### DISABLED

Temporarily unavailable without deleting historical data. Used for moderation.

---

# 17. Artifact Location

The core location model contains:

```text
latitude
longitude
altitude
radius
```

No additional location-name hierarchy is required for the MVP.

The coordinates are authoritative for proximity verification.

---

# 18. Artifact Radius

Each artifact stores its own verification radius.

The admin can configure it while creating/editing the artifact.

Example:

```text
Artifact:
  latitude: ...
  longitude: ...
  altitude: ...
  radius: 50m
```

The backend must use the artifact's configured radius rather than a global hard-coded radius.

---

# 19. Distance Calculation

The backend must calculate the distance between:

* User's submitted/current coordinates.
* Artifact coordinates.

**[suggested]** Use a standard geodesic/Haversine calculation for the MVP.

Conceptually:

```text
distance(userLocation, artifactLocation)
                    │
                    ▼
          distance <= radius ?
             │          │
            YES         NO
             │           │
          GPS PASS    GPS FAIL
```

The frontend may display approximate distance, but the backend performs the authoritative check.

---

# 20. Story Unlocking

The backend determines whether an artifact's story should be considered unlocked for a user.

A proximity request may provide the user's coordinates.

The backend evaluates:

```text
distance <= artifact.radius
```

If true, the artifact can be unlocked.

**[suggested]** Store story-unlock records only if future analytics/history requires them. For the MVP, story availability can be derived from discovery/proximity state where practical.

---

# 21. Discovery Model

A discovery represents a user's attempt to verify and collect an artifact.

Conceptually:

```ts
Discovery {
  _id

  userId
  artifactId

  status

  verificationAttemptId

  xpAwarded

  verifiedAt
  createdAt
  updatedAt
}
```

A discovery should have a unique relationship between user and artifact for the primary collection state.

---

# 22. Duplicate Discovery Constraint

A user should receive the base discovery reward only once per artifact.

**[suggested]**

Enforce a uniqueness rule for:

```text
userId + artifactId
```

for the successful collection record.

Separate verification attempts may still exist for the same artifact.

This allows:

```text
Attempt 1 → rejected
Attempt 2 → verified
```

without creating duplicate collection entries.

---

# 23. Verification Attempt

Verification attempts represent individual attempts. The collection is
`verificationAttempts` (`DB Schemas.md` §7).

Conceptually:

```ts
VerificationAttempt {
  _id

  userId
  artifactId
  discoveryId?

  imageUrl
  imageAssetId

  gps: {
    latitude
    longitude
    altitude?
    accuracy?
  }

  gpsStatus

  cvRequired
  cvStatus
  cvScore?

  status

  reviewedBy?
  reviewedAt?
  reviewReason?

  createdAt
  updatedAt
}
```

Exact schema details belong in implementation.

---

# 24. Verification States

Persisted states (see `API Contract.md` §6.2 and `DB Schemas.md` §8):

```text
VERIFIED
FLAGGED
REJECTED
```

`PENDING` and `FAILED` were removed when CV became synchronous. There is no
intermediate state to persist, and a technical CV failure produces no document at
all rather than a `FAILED` one.

These states represent the application-level verification lifecycle.

---

# 25. GPS Verification

The backend receives location information associated with the verification attempt.

The backend calculates whether the user is inside the artifact's configured radius.

Example:

```text
User:
lat = X
long = Y

Artifact:
lat = A
long = B
radius = R

distance(X,Y,A,B) <= R
        │
        ├── true  → GPS PASS
        └── false → GPS FAIL
```

GPS is a hard gate for artifacts where GPS verification is required.

---

# 26. GPS Failure

If GPS is required and the user is outside the configured radius:

```text
GPS FAIL
    ↓
Verification FAIL
```

The CV result must not override a failed GPS requirement.

This preserves the core anti-cheating model:

**physical presence + image verification**

where applicable.

---

# 27. CV Requirement

Each artifact contains:

```text
requiresCv: boolean
```

### `requiresCv = false`

The backend does not call the CV service.

The flow becomes:

```text
GPS
 ↓
Verified
```

### `requiresCv = true`

The flow becomes:

```text
GPS
 ↓
CV
 ↓
Final backend decision
```

---

# 28. Verification Orchestration

The Next.js backend owns the complete verification workflow.

```text
Verification Submission
        │
        ▼
Validate Request
        │
        ▼
Check Artifact
        │
        ▼
GPS Verification
        │
   ┌────┴────┐
   │         │
  FAIL      PASS
   │         │
   ▼         ▼
 FAILED   CV Required?
             │
       ┌─────┴─────┐
       │           │
      NO          YES
       │           │
       ▼           ▼
   VERIFIED     CV Service
                   │
             ┌─────┴─────┐
             │           │
           PASS       LOW SCORE
             │           │
             ▼           ▼
          VERIFIED     FLAGGED
```

---

# 29. CV Service Boundary

FastAPI is an internal specialized service.

The Next.js backend sends:

* Image URL/data
* Artifact reference information
* Reference embeddings or an artifact embedding identifier

The CV service returns:

* Similarity result
* Relevant similarity information
* Error information on failure

The CV service does not determine:

* XP
* Collection
* Quest progress
* Badge progress
* User eligibility
* Final discovery status

---

# 30. CV API

**[suggested]**

The CV service should expose a minimal internal API.

Conceptually:

```text
POST /embed
POST /compare
```

### `/embed`

Generates an embedding from an image.

### `/compare`

Compares a submitted image against reference embeddings.

The exact payload/response contract belongs in the implementation/API specification.

---

# 31. CV Embedding Generation

For a reference image:

```text
Reference Image
      │
      ▼
FastAPI
      │
      ▼
CLIP/OpenCLIP
      │
      ▼
Embedding
      │
      ▼
MongoDB
```

Embeddings are associated with their artifact.

---

# 32. Reference Embeddings

Each CV-enabled artifact has an independent embedding set.

Typical target:

```text
Artifact A
 ├── Embedding 1
 ├── Embedding 2
 ├── ...
 └── Embedding 30–50
```

Another artifact has its own independent set.

Embeddings must not be globally mixed between artifacts.

---

# 33. Reference Image Management

The admin panel supports two ingestion paths.

### Path A: Image Upload

```text
Admin
 ↓
Upload Reference Image
 ↓
Cloudinary
 ↓
Next.js
 ↓
FastAPI
 ↓
Embedding
 ↓
MongoDB
```

### Path B: Direct Embedding Upload

```text
Admin
 ↓
Upload Embedding
 ↓
Next.js
 ↓
Validate
 ↓
MongoDB
```

This allows pre-generated embeddings to be imported without permanently storing every reference photograph.

---

# 34. Reference Image Storage

Reference images may be stored in Cloudinary when the image-upload workflow is used.

The embedding itself is stored in MongoDB.

**[suggested]** Reference images should not be automatically deleted immediately after embedding generation unless the team explicitly chooses to avoid retaining them. Keeping them available is useful for admin review and dataset maintenance.

---

# 35. CV Similarity

The intended comparison strategy is top-K similarity aggregation.

For a submitted image:

```text
Submitted Image
      │
      ▼
Embedding
      │
      ▼
Compare against all artifact references
      │
      ▼
Similarity scores
      │
      ▼
Select top K
      │
      ▼
Aggregate
      │
      ▼
Final CV score
```

The exact K is determined experimentally.

---

# 36. CV Threshold

The CV threshold determines whether the image is automatically accepted.

**[suggested]**

Store the threshold as configuration rather than hard-coding it.

Potentially:

```text
Artifact / CV Configuration
    threshold: 0.xx
```

The final value will be determined through testing.

---

# 37. CV Failure vs Low Similarity

The backend should distinguish between:

### Low Similarity

CV successfully processed the image but similarity was insufficient.

Result:

```text
FLAGGED
```

### CV Service Failure

The CV service was unavailable or timed out.

Result:

```text
503 CV_UNAVAILABLE   (or 504 CV_TIMEOUT)
```

Nothing is persisted. The client re-sends the same request.

**[suggested]** Treat infrastructure failures separately from actual verification failures so that a temporary service outage does not incorrectly classify a user's photograph as invalid. Under synchronous CV this is structural: a technical failure writes no attempt document, so it cannot be confused with a `REJECTED` attempt.

---

# 38. Background CV Processing — SUPERSEDED

> **Superseded by `API Contract.md` §6.2 (synchronous CV).** The queue described
> below is not implemented. Verification runs inline in the `POST
> /api/v1/verification-attempts` request, and no `PENDING` state is persisted.
> See `DB Schemas.md` §8 for the revised state machine and §26 for transaction
> ordering. A CV outage persists nothing and returns `503`/`504`; the client
> retries with the same idempotency key. The original text is kept below only to
> explain why the queue was considered.

CV verification should not unnecessarily block the client request.

**[suggested]** — *retained for history; not adopted*

Recommended flow:

```text
POST verification
      │
      ▼
Create PENDING submission
      │
      ▼
Validate GPS
      │
      ▼
Queue/trigger CV processing
      │
      ▼
Return PENDING to client
```

The CV process updates the submission when complete.

For the hackathon, the background mechanism can remain simple.

**[suggested]** A lightweight job mechanism or controlled asynchronous execution is sufficient. A full distributed message queue is unnecessary at the expected scale.

## Why this was superseded

The queue existed to avoid making the client wait for CV. It was rejected because
it introduces a persisted `PENDING`/`PROCESSING` state that must be reconciled,
polled, and cleaned up, and because a CV outage then leaves a half-finished
submission behind. The synchronous design trades a longer request (budgeted at
~25 s in `API Contract.md` §6.2a) for having **no intermediate state at all**: an
attempt row is written only after the verdict is known, so there is nothing to
reconcile. Decision recorded in `API Contract.md` §13.1 (decision 4).

---

# 39. Verification Completion

When CV processing completes:

```text
CV result
   │
   ▼
Next.js
   │
   ├── score >= threshold → VERIFIED
   │
   └── score < threshold → FLAGGED
```

The backend then performs the appropriate gamification operations.

---

# 40. Manual Review

Flagged submissions are available in the admin panel.

Admin review should expose:

* User
* Artifact
* Submitted image
* GPS result
* CV score
* CV threshold
* Reference material
* Submission timestamp
* Previous review information

Admin can:

```text
APPROVE
REJECT
```

---

# 41. Manual Approval

When an admin approves a flagged verification:

```text
FLAGGED
   │
   ▼
ADMIN APPROVE
   │
   ▼
VERIFIED
   │
   ├── Collection
   ├── XP
   ├── Quest progress
   └── Badge progress
```

The same post-verification processing should occur as for automatic verification.

---

# 42. Manual Rejection

When an admin rejects:

```text
FLAGGED
   │
   ▼
REJECTED
```

No:

* XP
* Collection entry
* Quest progress
* Badge progress

should be awarded.

**[suggested]** The user should be allowed to submit another verification attempt for the artifact.

---

# 43. Verification Idempotency

Verification completion must be idempotent.

The system must prevent the same successful submission from awarding:

* XP twice
* Collection twice
* Quest progress twice
* Badge progress twice

**[suggested]** Use an atomic transaction or idempotent completion operation around discovery reward processing.

---

# 44. Gamification Engine

Gamification is triggered by backend events rather than being calculated independently by the mobile client.

Primary event:

```text
DISCOVERY_VERIFIED
```

This event can trigger:

```text
XP
Collection
Quest Progress
Badge Progress
Leaderboard Update
```

---

# 45. XP Awarding

When a discovery becomes verified:

```text
artifact.xp
       ↓
user.xp += artifact.xp
```

The backend should record the reward to prevent duplicate awarding.

**[suggested]** Maintain an XP transaction/history record rather than relying solely on the user's aggregate XP field.

---

# 46. Collection

After successful verification:

```text
Collection
 └── userId
 └── artifactId
 └── discoveryId
 └── discoveredAt
 └── verificationSnap
```

The collection represents the user's successful discoveries.

---

# 47. Quest Progress

A quest contains references to multiple artifacts.

Conceptually:

```text
Quest
 ├── Artifact A
 ├── Artifact B
 ├── Artifact C
 └── Artifact D
```

When an artifact is successfully discovered:

```text
DISCOVERY_VERIFIED
       │
       ▼
Find quests containing artifact
       │
       ▼
Update user's quest progress
```

---

# 48. Quest Completion

A quest becomes completed when all required artifacts have been successfully collected.

**[suggested]**

Quest completion should be idempotent.

A completed quest should not repeatedly award its completion reward.

---

# 49. Badges

Badges represent configured achievements.

The backend evaluates badge conditions when relevant user activity occurs.

Examples:

* Number of discoveries
* Quest completion
* Category-based discovery
* Special achievement

Exact badge rules should be configurable.

---

# 50. Leaderboard

The MVP uses a global all-time XP leaderboard.

The backend retrieves users ordered by accumulated XP.

**[suggested]**

If the user base becomes large, maintain leaderboard-oriented indexes or a cached ranking structure. This is unnecessary for the initial hackathon scale.

---

# 51. Rewards

Rewards may be associated with:

* XP milestones
* Quests
* Badges
* Other achievements

The backend stores reward configuration and determines eligibility.

Actual redemption functionality may initially remain a prototype.

---

# 52. Businesses

Businesses may be associated with rewards.

Conceptually:

```text
Business
 ├── name
 ├── information
 ├── rewardIds
 └── status
```

The exact business schema belongs in implementation.

---

# 53. Contributions

Users can submit new places.

A contribution should contain:

```text
name
description
category
location
photos
culturalSignificance
additionalInformation
contributorId
status
```

---

# 54. Contribution Lifecycle

**[suggested]**

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ├── APPROVED
  │      ↓
  │ OFFICIAL_ARTIFACT
  │
  └── REJECTED
```

The backend controls all transitions.

---

# 55. Contribution Review

Experts and admins can review submissions.

The reviewer can inspect:

* Submitted information
* Coordinates
* Images
* Cultural significance
* Category
* Contributor

Approval converts the submission into an official artifact.

---

# 56. Expert Permissions

Experts should have access only to the relevant contribution review functionality.

**[suggested]**

The backend should implement explicit permission checks such as:

```text
contributions:review
```

rather than giving Experts broad administrative access.

---

# 57. Community Snaps

Community Snaps are user-generated photographs associated with discoveries/artifacts.

The backend must track:

* Owner
* Artifact
* Cloudinary asset
* Visibility
* Creation time
* Moderation state where required

---

# 58. Snap Visibility

Default:

```text
PRIVATE
```

User can change to:

```text
PUBLIC
```

Only public Snaps should be returned through public community APIs.

---

# 59. Moderation

**[suggested]**

Community content should have a moderation state:

```text
VISIBLE
HIDDEN
REMOVED
```

This allows administrators to remove inappropriate content without deleting the underlying record immediately.

---

# 60. Cloudinary Integration

Cloudinary stores user-uploaded images.

Backend responsibilities include:

* Generating signed upload parameters.
* Validating asset metadata.
* Storing Cloudinary asset identifiers.
* Associating assets with application records.
* Controlling whether assets are public/private.

---

# 61. Direct Upload Flow

Recommended:

```text
Mobile
   │
   │ Request upload authorization
   ▼
Next.js
   │
   ▼
Signed Cloudinary parameters
   │
   ▼
Mobile
   │
   ▼
Cloudinary
   │
   ▼
Asset URL / ID
   │
   ▼
Next.js
```

This prevents large image files from unnecessarily passing through the Next.js server.

---

# 62. Cloudinary Asset Categories

**[suggested]**

Use separate logical folders:

```text
hidden-nepal/
├── artifacts/
│   └── reference/
├── users/
│   └── profile/
├── snaps/
│   └── verification/
├── community/
└── contributions/
```

The exact folder naming can be changed without affecting the data model.

---

# 63. API Validation

Every API request must validate:

* Authentication
* Authorization
* Input structure
* IDs
* Enum values
* Numeric ranges
* Required fields
* Ownership
* Resource existence

**[suggested]** Use a shared TypeScript validation library such as Zod across route handlers.

---

# 64. Error Response Format

**[suggested]**

Use a consistent API error format:

```json
{
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Location could not be verified."
  }
}
```

Internal stack traces should not be returned to clients.

---

# 65. HTTP Status Codes

**[suggested]**

Use standard status codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# 66. Example Artifact Endpoints

**[suggested]**

All example paths in §66–§73 are relative to the versioned API root
`/api/v1`. The canonical, complete route list is `API Contract.md` §4–§9; these
sections are illustrative only.

```text
GET    /api/v1/artifacts
GET    /api/v1/artifacts/:id
POST   /api/v1/admin/artifacts
PATCH  /api/v1/admin/artifacts/:id
DELETE /api/v1/admin/artifacts/:id
```

Deletion should generally be implemented as disabling rather than physically removing historical artifacts.

---

# 67. Example Discovery Endpoints

**[suggested]**

```text
GET  /api/v1/discoveries
POST /api/v1/discoveries
GET  /api/v1/discoveries/:id
```

A discovery endpoint should not allow clients to submit:

```text
status = VERIFIED
xp = 100
```

The backend determines those values.

---

# 68. Example Verification Endpoints

**[suggested]**

```text
POST /api/v1/verification-attempts
GET  /api/v1/verification-attempts/:id
POST /api/v1/admin/verification-attempts/:id/approve
POST /api/v1/admin/verification-attempts/:id/reject
```

The submission is synchronous (`API Contract.md` §6.2): the POST performs GPS and
CV verification inline and returns the terminal verdict. There is no job id to
poll, which is why the resource is named `verification-attempts` rather than
`verification`.

---

# 69. Example Collection Endpoints

```text
GET /api/v1/collection
GET /api/v1/collection/:artifactId
```

The collection should be derived from successful discoveries or maintained consistently with them.

---

# 70. Example Quest Endpoints

```text
GET    /api/v1/quests
GET    /api/v1/quests/:id
POST   /api/v1/admin/quests
PATCH  /api/v1/admin/quests/:id
DELETE /api/v1/admin/quests/:id
```

---

# 71. Example Contribution Endpoints

```text
POST /api/v1/contributions
GET  /api/v1/contributions
GET  /api/v1/contributions/:id

GET  /api/v1/admin/contributions
POST /api/v1/admin/contributions/:id/approve
POST /api/v1/admin/contributions/:id/reject
```

Expert access should be authorized separately.

---

# 72. Example Community Endpoints

```text
GET   /api/v1/community/snaps
GET   /api/v1/artifacts/:id/snaps
PATCH /api/v1/snaps/:id/visibility
```

Only appropriate public content should be returned by public endpoints.

---

# 73. Admin API

Admin operations should be grouped logically.

```text
/api/v1/admin/
├── artifacts
├── verification-attempts
├── contributions
├── quests
├── badges
├── rewards
├── businesses
├── community
└── users
```

Every route requires backend authorization.

---

# 74. Nearby Artifact API

The frontend may request nearby artifacts.

Conceptually:

```text
GET /api/v1/artifacts/nearby?lat=...&lng=...
```

The backend should return relevant artifacts based on location.

**[suggested]** Support an optional maximum search distance to prevent unnecessary database work.

---

# 75. Geospatial Queries

MongoDB can support geospatial querying.

**[suggested]**

Use a GeoJSON point representation for query efficiency while retaining the required latitude/longitude fields if useful for API responses.

Example conceptual structure:

```text
location:
  type: "Point"
  coordinates: [longitude, latitude]
```

A geospatial index can then support nearby-artifact queries.

The altitude and custom verification radius remain application fields.

---

# 76. Artifact Search

Search should support:

* Name
* Category
* Tags

**[suggested]** Begin with MongoDB indexes/text search appropriate to the MVP rather than introducing a separate search engine.

---

# 77. Database Indexes

Important indexes should include:

```text
users.clerkUserId
artifacts.status
artifacts.location
artifacts.category
artifacts.tags
discoveries.userId
discoveries.artifactId
verificationAttempts.userId
verificationAttempts.artifactId
verificationAttempts.status
quests.artifactIds
communitySnaps.artifactId
communitySnaps.visibility
contributions.status
```

Exact compound indexes should be determined from actual query patterns.

---

# 78. Data Consistency

Several operations affect multiple entities.

Example:

```text
Discovery Verified
       │
       ├── discovery
       ├── collection
       ├── XP
       ├── quest progress
       └── badge progress
```

These operations must avoid partial reward states.

**[suggested]** Use MongoDB transactions where the deployment configuration supports them and where multiple documents must change atomically.

---

# 79. XP Transaction Model

**[suggested]**

Use a separate XP transaction/history collection:

```text
xpTransactions
```

Example:

```text
{
  userId,
  sourceType: "DISCOVERY",
  sourceId,
  amount,
  createdAt
}
```

This provides:

* Auditability
* Duplicate prevention
* XP history
* Future reward analytics

The user's total XP can remain denormalized for fast reads.

---

# 80. Discovery Event Processing

A successful discovery should trigger a controlled backend operation:

```text
verifyDiscovery()
      │
      ▼
mark VERIFIED
      │
      ▼
awardDiscoveryXP()
      │
      ▼
updateCollection()
      │
      ▼
updateQuests()
      │
      ▼
evaluateBadges()
```

The operation should be idempotent.

---

# 81. Admin Reference Management

Admin artifact editing should support:

### Reference image upload

Upload image → generate embedding.

### Reference embedding upload

Upload embedding → validate and store.

### Reference removal

Remove an existing reference from the artifact's dataset.

### Reference inspection

**[suggested]** Display enough metadata to identify individual references without requiring the full image dataset to be permanently downloaded.

---

# 82. Embedding Validation

Direct embedding uploads must be validated.

**[suggested]**

Validation should include:

* Expected numeric structure
* Expected dimensionality
* Valid numeric values
* Artifact association
* Model/version compatibility

The embedding model version should be stored with the embedding.

---

# 83. CV Model Versioning

**[suggested]**

Each embedding should record the model/version used to generate it.

Example:

```text
model:
  provider: OpenCLIP
  model: <model-name>
  version: <version>
```

This prevents accidentally comparing embeddings generated by incompatible models.

---

# 84. CV Reference Dataset Versioning

**[suggested]**

An artifact's CV reference dataset should have a dataset/model version.

When the model changes, reference embeddings may need to be regenerated.

For the hackathon, this can remain simple, but the data model should avoid making future migration impossible.

---

# 85. CV Request Security

The FastAPI service should not be an unrestricted public API.

**[suggested]**

Next.js should authenticate requests to the CV service using a server-side secret or equivalent service-to-service mechanism.

The CV service should reject unauthenticated internal requests.

---

# 86. CV Service Timeout

The backend must handle CV service failures.

**[suggested]**

A CV request should have a bounded timeout. `API Contract.md` §6.2a budgets 8 s
per attempt with up to 3 attempts.

If the CV service does not respond:

```text
503 CV_UNAVAILABLE / 504 CV_TIMEOUT
```

and **nothing is persisted**, rather than incorrectly treating the submission as
rejected.

---

# 87. Retry Behavior

**[suggested]**

Transient CV failures may be retried a small number of times.

Do not retry indefinitely.

Example:

```text
Attempt 1
   ↓ failure
Attempt 2
   ↓ failure
Attempt 3
   ↓ failure
Return 503/504; persist nothing
```

The exact retry count should be configurable. `API Contract.md` §6.2a fixes it at
3 attempts of 8 s each.

---

# 88. Rate Limiting

The backend should rate-limit sensitive endpoints.

Important targets:

* Authentication-related operations where applicable
* Verification submission
* Image-upload authorization
* Contribution submission
* Admin APIs
* CV-triggering endpoints

**[suggested]** Verification submission should have a per-user/per-artifact rate limit to prevent abuse and unnecessary CV computation.

---

# 89. Duplicate Request Protection

Mobile networks can retry requests.

The backend should prevent accidental duplicate submissions.

**[suggested]**

Use an idempotency key for operations such as verification submission and reward processing.

---

# 90. Logging

The backend should log important operational events.

Examples:

```text
Authentication failure
Authorization failure
Artifact creation
Verification submission
GPS failure
CV request
CV response
Manual approval
Manual rejection
XP award
Contribution approval
```

Logs must not expose sensitive information unnecessarily.

---

# 91. Verification Audit Trail

Verification decisions should retain enough information to understand how they occurred.

A verification record should preserve:

* GPS result
* CV requirement
* CV score if available
* Threshold/configuration used
* Final status
* Reviewer
* Review timestamp
* Review reason where applicable

This is particularly important for manual review.

---

# 92. Privacy

The backend must respect Snap visibility.

Private images should not be returned through public APIs.

User information should be exposed only to the extent required by the feature.

**[suggested]** Public profiles should use a deliberately defined public user representation rather than returning the complete MongoDB User document.

---

# 93. Data Ownership

Users can manage their own:

* Profile information
* Public/private Snap visibility
* Contributions where supported

Administrators manage:

* Official artifacts
* Quests
* Badges
* Rewards
* Businesses
* Moderation
* Verification review

Experts manage:

* Authorized contribution reviews

---

# 94. Admin Artifact Creation Flow

```text
Admin
  │
  ▼
Create Artifact
  │
  ├── Basic information
  ├── Coordinates
  ├── Radius
  ├── XP
  ├── Quest associations
  └── Require CV
          │
          ├── No → Publish
          │
          └── Yes
                │
                ▼
          Add references
                │
          ┌─────┴─────┐
          │           │
       Images     Embeddings
          │           │
          ▼           ▼
       Generate     Validate
       embeddings
          │           │
          └─────┬─────┘
                ▼
         CV-ready Artifact
                │
                ▼
             Publish
```

---

# 95. Contribution Approval Flow

```text
User
 │
 ▼
Submit Place
 │
 ▼
SUBMITTED
 │
 ▼
Expert/Admin Review
 │
 ├── Reject → REJECTED
 │
 └── Approve
       │
       ▼
OFFICIAL ARTIFACT
```

**[suggested]** The conversion from contribution to artifact should create a new official Artifact record rather than allowing the community submission document itself to become the authoritative artifact object.

---

# 96. Admin Verification Flow

```text
Verification
     │
     ▼
GPS Pass
     │
     ▼
CV Comparison
     │
     ├── High similarity
     │       ↓
     │    VERIFIED
     │
     └── Low similarity
             ↓
          FLAGGED
             │
       ┌─────┴─────┐
       ▼           ▼
    APPROVE      REJECT
       │           │
       ▼           ▼
   VERIFIED     REJECTED
```

---

# 97. Security Boundaries

```text
Public
 │
 ├── Public artifact data
 ├── Public community content
 └── Public leaderboard
       
Authenticated
 │
 ├── Personal collection
 ├── Discoveries
 ├── Contributions
 └── Profile

Expert
 │
 └── Contribution review

Admin
 │
 └── Full management
       
Internal
 │
 └── FastAPI CV service
```

---

# 98. Deployment Architecture

**[suggested]**

The initial deployment can use:

```text
Mobile App
    │
    ▼
Next.js Backend
    │
    ├── MongoDB
    ├── Clerk
    ├── Cloudinary
    └── FastAPI CV Service
```

The exact hosting providers for MongoDB and FastAPI are deployment decisions rather than product requirements.

---

# 99. Environment Variables

The backend should keep secrets in environment configuration.

Example:

```text
MONGODB_URI
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CV_SERVICE_URL
CV_SERVICE_SECRET
```

**[suggested]** Never expose server-only credentials through `NEXT_PUBLIC_*` variables.

---

# 100. Clerk Webhooks

**[suggested]**

Clerk webhooks may be used for synchronization events such as:

* User created
* User updated
* User deleted

This can keep the MongoDB user record synchronized with Clerk.

For the hackathon, lazy user creation on authenticated requests can remain sufficient if webhook infrastructure adds unnecessary complexity.

---

# 101. API Authentication

For authenticated API requests:

```text
Mobile
  │
  ▼
Clerk Session
  │
  ▼
Authentication Token
  │
  ▼
Next.js
  │
  ▼
Clerk verification
  │
  ▼
Application User
```

The backend maps the authenticated Clerk identity to its MongoDB user.

---

# 102. API Response Design

**[suggested]**

Successful responses should use predictable structures.

Example:

```json
{
  "data": {
    "...": "..."
  }
}
```

Collection endpoints may return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Exact response structures should be standardized before frontend/backend integration.

---

# 103. Pagination

Pagination should be used for potentially large datasets:

* Community Snaps
* Leaderboard
* Contributions
* Users
* Artifacts
* Admin verification records

The initial artifact count is small, so pagination is less important there but should still be supported by the API design where practical.

---

# 104. Sorting

The API should support appropriate sorting.

Examples:

### Leaderboard

```text
XP DESC
```

### Nearby artifacts

```text
distance ASC
```

### Verification review

```text
createdAt ASC
```

so older flagged attempts can be reviewed first.

---

# 105. Caching

**[suggested]**

Potentially cache relatively stable data:

* Published artifacts
* Quest definitions
* Badge definitions

Do not aggressively cache:

* Verification status
* Personal collection
* XP
* Pending administrative reviews

unless cache invalidation is handled correctly.

---

# 106. Database Transactions

Transactions should be used when several writes must represent one logical operation.

Primary candidate:

```text
Discovery verification
    ↓
Discovery status
    ↓
Collection
    ↓
XP
    ↓
Quest progress
    ↓
Badge progress
```

The exact transaction strategy depends on MongoDB deployment configuration.

---

# 107. Scheduled/Background Tasks

The MVP does not require a large background-job infrastructure.

Potential asynchronous operations include:

* Image embedding generation (when an admin registers reference images)
* Notification generation
* Cleanup

CV processing is **not** in this list: it runs synchronously in the verification
request (`API Contract.md` §6.2).

**[suggested]** Use a lightweight mechanism appropriate to the deployment environment rather than introducing Redis + a full job queue solely for the hackathon.

---

# 108. Notification Backend

The backend determines when a notification should be sent.

The mobile application handles presentation.

Possible event:

```text
User enters nearby area
        ↓
Backend determines eligible artifact
        ↓
Notification event
        ↓
Expo notification system
```

**[suggested]** Nearby notification logic can initially remain client-assisted if real-time backend geolocation infrastructure becomes unnecessarily complex. The backend remains responsible for any persistent notification rules/preferences.

---

# 109. Testing Strategy

Backend testing should include:

## Unit Tests

* Distance calculation
* Verification rules
* XP calculation
* Quest progress
* Badge conditions
* Permission checks
* Input validation

## Integration Tests

* MongoDB operations
* Clerk authentication integration
* Cloudinary integration
* CV service communication

## API Tests

* Authentication
* Authorization
* Artifact endpoints
* Discovery endpoints
* Verification endpoints
* Admin endpoints

---

# 110. Critical Backend Tests

### GPS

* User inside radius.
* User outside radius.
* Invalid coordinates.
* Missing location.
* Artifact with custom radius.

### CV

* CV disabled.
* CV enabled.
* High similarity.
* Low similarity.
* CV timeout.
* CV service unavailable.
* Invalid embedding.
* Wrong artifact reference set.

### Verification

* Successful automatic verification.
* Flagged submission.
* Admin approval.
* Admin rejection.
* Duplicate completion.
* Retry after rejection.

### Gamification

* XP awarded once.
* Collection created once.
* Quest progresses.
* Quest completes.
* Badge awarded.
* Leaderboard reflects XP.

### Authorization

* User cannot access admin routes.
* Expert can review contributions.
* Expert cannot access unrelated admin operations.
* Admin has required permissions.

---

# 111. MVP Backend Priority

## Priority 1: Core API

* Next.js backend
* MongoDB
* Clerk
* User model
* Artifact model
* REST API
* Basic authorization

## Priority 2: Discovery

* Artifact retrieval
* Search
* Nearby artifacts
* Story unlock
* GPS verification
* Discovery records

## Priority 3: CV

* FastAPI service
* Embedding generation
* Reference embeddings
* Similarity comparison
* CV threshold
* Verification orchestration
* Flagged submissions

## Priority 4: Gamification

* Collection
* XP
* Quests
* Badges
* Leaderboard

## Priority 5: Admin

* Artifact management
* Reference management
* Verification review
* Contribution review

## Priority 6: Community

* Public Snaps
* Contributions
* Profiles
* Community gallery

## Priority 7: Optional

* Notifications
* Offline synchronization
* Advanced moderation
* Advanced analytics
* Reward redemption

---

# 112. Hackathon Scope

The expected hackathon dataset is approximately:

**20–30 artifacts**

with approximately:

**4–5 CV-enabled artifacts having complete reference datasets.**

This means the backend does not need to be optimized for massive-scale CV workloads during the hackathon.

The architecture should nevertheless preserve a clean separation between:

```text
Application Backend
        +
CV Processing Service
```

so the CV infrastructure can be expanded later.

---

# 113. Backend Golden Path

The most important backend workflow is:

```text
User
 │
 ▼
Select Artifact
 │
 ▼
Enter Radius
 │
 ▼
Unlock Story
 │
 ▼
Capture Snap
 │
 ▼
Cloudinary
 │
 ▼
Verification Submission
 │
 ▼
Next.js
 │
 ├── GPS
 │
 └── CV if required
       │
       ▼
Final Verification Decision
 │
 ├── VERIFIED
 │     ├── Collection
 │     ├── XP
 │     ├── Quest
 │     └── Badge
 │
 └── FLAGGED
       │
       ▼
     Admin
       │
       ├── Approve → VERIFIED
       └── Reject  → REJECTED
```

This is the backend implementation of the core Sanskriti Snap loop.

---

# 114. Backend Non-Functional Requirements

The backend should:

* Keep verification decisions authoritative.
* Avoid duplicate reward processing.
* Protect administrative operations.
* Handle intermittent client connectivity.
* Persist verification state.
* Handle CV service failures gracefully.
* Keep private images private.
* Validate all client-provided data.
* Avoid storing authentication credentials.
* Maintain an audit trail for important verification decisions.
* Remain simple enough to implement and debug during the hackathon.

---

# 115. Future Backend Improvements

Potential post-hackathon improvements include:

* Dedicated job queue
* Redis
* More sophisticated CV infrastructure
* Vector database
* Advanced anti-cheating
* Duplicate-image detection
* GPS spoof detection
* Advanced analytics
* Event-driven architecture
* Real-time verification updates
* Advanced moderation
* Regional leaderboards
* More complex reward systems
* Expert permission management
* Full offline synchronization

These should not be introduced into the MVP unless an actual requirement emerges.

---

# 116. Backend Technical Boundaries

The Next.js backend **does**:

* Authenticate users through Clerk.
* Authorize users.
* Store application data.
* Validate GPS.
* Orchestrate CV.
* Decide verification status.
* Award XP.
* Manage collections.
* Manage quests.
* Manage badges.
* Manage leaderboard data.
* Manage contributions.
* Manage community visibility.
* Manage administrative operations.

The Next.js backend **does not**:

* Store passwords.
* Perform the actual CLIP inference.
* Let the mobile client determine verification.
* Let the CV service determine application-level verification.
* Require a separate vector database for the MVP.

---

# 117. Unconfirmed Decisions

The following decisions are intentionally marked as suggestions and can be modified later.

### `[suggested]` Contribution lifecycle

```text
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → OFFICIAL_ARTIFACT
```

with `REJECTED` as an alternative terminal state.

### `[suggested]` Verification states

```text
VERIFIED
FLAGGED
REJECTED
```

### `[suggested]` CV aggregation

Use top-K similarity aggregation rather than averaging every reference image.

### `[suggested]` CV threshold

Make the threshold configurable and establish it experimentally.

### `[suggested]` CV service failure

Distinguish low similarity from infrastructure failure.

### `[suggested]` CV processing

Rejected. CV runs synchronously in the verification request. The client waits and
retries on failure; no background processing or persisted intermediate state
(`API Contract.md` §6.2, §13.1 decision 4).

### `[suggested]` MongoDB geospatial representation

Use a GeoJSON `Point` plus the artifact's custom verification radius.

### `[suggested]` XP transactions

Maintain an XP transaction/history collection for auditability and duplicate prevention.

### `[suggested]` Idempotency

Use idempotency protection for verification and reward operations.

### `[suggested]` MongoDB transactions

Use transactions for multi-document reward completion where supported.

### `[suggested]` Input validation

Use a schema-validation library such as Zod.

### `[suggested]` Cloudinary uploads

Use signed direct uploads from the mobile application.

### `[suggested]` Cloudinary folder organization

Separate reference, verification, community, contribution, and profile media.

### `[suggested]` CV model metadata

Store model/version information alongside embeddings.

### `[suggested]` CV service security

Protect FastAPI with server-to-server authentication.

### `[suggested]` CV retry behavior

Use a small bounded retry count for transient service failures.

### `[suggested]` Notification implementation

Keep notification generation lightweight during the hackathon instead of introducing a full event/queue architecture.

### `[suggested]` Search

Use MongoDB-native search/indexing for the initial MVP.

### `[suggested]` Caching

Cache relatively static artifacts, quests, and badges while keeping verification/personal state fresh.

---

# 118. Final Backend Architecture

The Sanskriti Snap backend is centered around a **Next.js REST API backed by MongoDB**, with Clerk providing authentication and Cloudinary providing image storage.

The most important architectural boundary is:

```text
                 Next.js
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
   MongoDB      Cloudinary    FastAPI CV
                                │
                                ▼
                           CLIP/OpenCLIP
```

Next.js remains the application's source of truth.

FastAPI is a specialized computational service.

The complete verification decision is:

**GPS + optional CV → Next.js final decision**

and successful verification triggers:

**Collection + XP + Quest + Badge + Leaderboard**

The architecture is deliberately designed around the hackathon's actual scale rather than pretending that 25 artifacts require a distributed microservice empire. The system should be simple enough to build quickly, but structured enough that the CV service, artifact dataset, gamification system, and administrative workflows can grow after the hackathon.
