# Sanskriti Snap

## Product Requirements Document (PRD)

**Version:** 2.0
**Status:** Hackathon MVP
**Product Type:** Gamified Cultural Discovery & Heritage Exploration App
**Primary Platform:** Mobile application
**Admin Platform:** Web application
**Primary Geography:** Patan/Lalitpur and selected Kathmandu Valley locations
**Backend:** Next.js REST API
**Database:** MongoDB
**Authentication:** Clerk
**Image Storage:** Cloudinary
**CV Service:** FastAPI + PyTorch + CLIP/OpenCLIP-based image embeddings
**Map Tiles:** MapLibre Native renderer + OpenFreeMap `liberty` style (resolved — see §35)

---

# 1. Product Overview

## 1.1 Product Name

**Sanskriti Snap**

Sanskriti Snap is a gamified cultural discovery application designed to encourage users to physically explore lesser-known cultural and heritage places, learn about them, photograph them, verify their visit, and collect them as discoveries.

The product is based on the existing concept of discovering overlooked cultural heritage through physical exploration rather than functioning as a conventional tourism directory. The original product loop is:

**Discover → Visit → Unlock → Snap → Verify → Collect → Learn → Progress**

---

# 2. Product Vision

## 2.1 Vision

**Make discovering Nepal's overlooked cultural heritage engaging, interactive, and rewarding.**

Sanskriti Snap should encourage users to look beyond the most famous tourist destinations and discover smaller, less-visible cultural places and artifacts.

The application combines:

* Curated cultural discoveries
* Interactive maps
* Physical exploration
* GPS-based location verification
* Optional computer-vision-assisted verification
* Cultural stories and information
* Collections
* XP
* Quests
* Badges
* Leaderboards
* Community contributions
* Future rewards and local-business participation

The application is not intended to become a general tourism booking platform, social network, or generic travel guide.

---

# 3. Problem Statement

Many visitors discover only the most prominent heritage locations while smaller cultural places, artifacts, courtyards, carvings, temples, monuments, and other culturally significant locations receive considerably less attention.

Existing tourism discovery experiences often provide information about destinations but do not strongly encourage users to physically seek out lesser-known cultural locations.

Sanskriti Snap addresses this by turning cultural discovery into an exploration game.

Users should have a reason to:

1. Discover an unfamiliar cultural place.
2. Travel to it.
3. Learn its story.
4. Photograph it.
5. Verify that they actually visited.
6. Add it to their personal collection.
7. Earn progress through XP, quests, and badges.

---

# 4. Product Goals

## 4.1 Primary Goals

The MVP must:

* Help users discover lesser-known cultural locations.
* Show artifact locations on an interactive map.
* Allow users to explore nearby discoveries.
* Provide information and stories about artifacts.
* Unlock artifact stories based on physical proximity.
* Allow users to submit a verification photograph.
* Verify the user's physical presence using GPS.
* Optionally verify the photograph using computer vision.
* Allow users to collect successfully verified artifacts.
* Award XP and progress through quests and badges.
* Provide a global leaderboard.
* Allow administrators to manage artifacts, quests, users, verification submissions, and community content.
* Support user-submitted artifact/place suggestions.
* Provide a foundation for future rewards and business participation.

## 4.2 Secondary Goals

* Encourage exploration beyond major tourist attractions.
* Preserve and expose cultural information in an accessible format.
* Encourage community participation.
* Create a scalable foundation for additional heritage locations across Nepal.

## 4.3 Non-Goals for the MVP

The MVP will not prioritize:

* Hotel booking
* Transportation booking
* Travel-package booking
* Full social-network functionality
* Advanced anti-cheating systems
* Sophisticated duplicate-image detection
* Fully automated cultural-content validation
* Large-scale AI-generated cultural content
* Complex offline functionality

---

# 5. Target Users

## 5.1 Primary Users

### Independent Explorers

Users who independently explore cultural and heritage locations.

This includes:

* Foreign tourists
* Domestic tourists
* Students
* Local residents
* Solo travelers
* Groups of friends

The primary behavioral characteristic is curiosity and willingness to physically explore locations.

## 5.2 Administrators

Administrators manage the application's operational and content systems.

Administrators can:

* Create and modify artifacts.
* Configure artifact verification requirements.
* Manage quests.
* Manage users.
* Review verification submissions.
* Review flagged CV submissions.
* Review user-submitted places.
* Manage rewards/business information.
* Manage community content.
* Manage reference images and/or embeddings.

## 5.3 Experts

Experts are trusted users who assist with validating user-submitted cultural places.

An Expert is not required to have a completely separate application.

Instead, the Expert role provides access to the relevant artifact-submission review functionality.

### Expert responsibilities

Experts may review:

* Whether the submitted place exists.
* Whether the provided location appears correct.
* Whether the submitted category is appropriate.
* Whether the cultural significance appears valid.
* Whether the description/story is appropriate.
* Submitted photographs and supporting information.

**[suggested]** Experts should not be given access to system-level settings, user management, reward configuration, or other administrative functionality unless explicitly granted by an administrator.

---

# 6. Core Product Loop

The primary product loop is:

**Discover → Visit → Unlock → Snap → Verify → Collect → Learn → Progress**

### 6.1 Discover

The user discovers an artifact through:

* Map
* Nearby artifacts
* Search
* Quests
* Notifications
* Community discovery
* Exploration

### 6.2 Visit

The user travels toward the physical location using the application's map or external navigation.

### 6.3 Unlock

When the user enters the configured proximity radius of an artifact, its story/information becomes unlocked.

A user does not necessarily need to photograph the artifact to read its story.

### 6.4 Snap

The user captures a main verification photograph using the in-app camera.

### 6.5 Verify

The system verifies:

1. GPS/location requirements.
2. Image similarity when CV is required.

### 6.6 Collect

Once verification succeeds, the artifact becomes part of the user's collection.

### 6.7 Learn

The user can access the artifact's cultural information and story.

### 6.8 Progress

Successful discoveries contribute to:

* XP
* Quest progress
* Badge progress
* Collection
* Leaderboard position

---

# 7. Artifact Model

An **Artifact** is the fundamental collectible entity within Sanskriti Snap.

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

The artifact model is intentionally independent.

Unlike the previous hierarchical model, artifacts do not require parent-child relationships.

## 7.1 Artifact Grouping

Artifacts can be grouped through **Quests**.

For example:

**Quest: Explore Patan's Hidden Heritage**

* Artifact A
* Artifact B
* Artifact C
* Artifact D

This avoids introducing unnecessary hierarchical relationships into the core artifact model.

---

# 8. Artifact Information

Each artifact should contain, at minimum:

* Unique identifier
* Name
* Description
* Story/information
* Category
* Tags
* Latitude
* Longitude
* Altitude
* Verification radius
* XP reward
* Quest associations
* Badge associations where applicable
* CV requirement
* CV reference embeddings where applicable
* Status
* Community/public content configuration
* Creation/update information

Exact database schemas belong in the TRD.

---

# 9. Artifact Location and Proximity

The artifact location is represented by:

* Latitude
* Longitude
* Altitude
* Verification radius

The coordinates are authoritative for proximity-based verification.

The administrator configures the verification radius while creating or editing an artifact.

### Radius examples

**[suggested]**

* Large heritage complex: 100–200 m
* Individual site/building: 50–100 m
* Small artifact/detail: 20–50 m

These are starting values only. Administrators must be able to override the radius for individual artifacts.

---

# 10. Artifact CV Requirement

Each artifact has a configurable:

**Require CV: Yes / No**

## 10.1 CV Required

When enabled:

**GPS verification → Image verification → Final verification**

The user's image must satisfy the configured CV similarity requirements.

## 10.2 CV Not Required

When disabled:

**GPS verification → Final verification**

The artifact can be verified using the GPS requirement without image comparison.

This allows locations where:

* Photography is prohibited.
* Photography is difficult.
* Photography is unsafe.
* Suitable reference images are unavailable.
* Photographing the location is otherwise inappropriate.

---

# 11. Story Unlocking

Artifact stories are unlocked when the user enters the artifact's configured proximity radius.

The user does not need to successfully complete a Snap verification to read an already-unlocked story.

Once unlocked, the story remains available to the user.

The story should contain:

* Short description
* Cultural/historical information
* Relevant context
* Optional photographs
* Optional additional information

The exact content structure may evolve as the product expands.

---

# 12. Discovery Verification

## 12.1 Verification Principle

A successful discovery means that the system has sufficient evidence that:

1. The user was physically present at the artifact.
2. The user's submitted photograph represents the artifact when CV verification is required.

The final verification decision belongs to the Next.js backend.

The CV service does not independently determine whether a discovery is valid.

---

# 13. GPS Verification

GPS is the primary physical-presence verification mechanism.

The user's current coordinates are compared with the artifact's configured coordinates.

If the user is outside the configured verification radius, GPS verification fails.

When GPS verification is required, failure of GPS verification prevents automatic discovery verification regardless of CV similarity.

---

# 14. Image Verification

For CV-enabled artifacts, the main verification Snap is compared against reference embeddings associated with that artifact.

Each artifact has an independent reference embedding set.

A typical artifact may have:

**~30–50 reference images**

These reference images should represent different:

* Angles
* Lighting conditions
* Viewpoints
* Visible portions of the artifact

The reference dataset is created by the project team.

---

# 15. CV Service

The CV service is a separate FastAPI service.

### Responsibilities

The CV service is responsible for:

* Receiving an image or image URL.
* Generating an image embedding.
* Comparing a submitted image embedding against the reference embeddings for an artifact.
* Returning similarity results.

### Technology

**[suggested]**

* FastAPI
* Python
* PyTorch
* OpenCLIP / compatible CLIP model

The exact model will be finalized after experimentation.

The PRD intentionally does not hard-code a specific model.

---

# 16. CV Similarity

Each artifact's reference embeddings are evaluated independently.

The system should not calculate a simple average across every reference image because reference images may represent substantially different angles and visual conditions.

The intended aggregation strategy is:

**Top-K similarity aggregation**

The submitted image is compared with all reference embeddings for the artifact, and the strongest relevant matches are used to calculate the final similarity score.

**[suggested]** Use the average similarity of the top K reference matches rather than simply taking the single maximum match. The value of K should be determined experimentally.

The final threshold is configurable and will be determined through testing.

---

# 17. CV Threshold

The CV threshold determines whether the image is sufficiently similar to the artifact's reference dataset.

The threshold is not permanently defined in the PRD.

It will be established through experimentation using real photographs from the target artifacts.

**[suggested]** Store the threshold as configurable artifact/service configuration rather than hard-coding it into application logic.

---

# 18. Reference Dataset Management

Administrators should be able to configure an artifact's reference dataset.

Two methods should be supported:

### Method A: Reference Images

Administrator uploads reference photographs.

The system:

1. Stores the images.
2. Sends them to the CV service.
3. Generates embeddings.
4. Stores the resulting embeddings in MongoDB.

### Method B: Direct Embedding Upload

Administrator uploads already-generated embeddings.

This allows the team to prepare embeddings externally and avoids storing reference images when they are no longer required by the application.

The system should support adding and removing reference embeddings.

---

# 19. Main Verification Snap

The main verification Snap is captured using the application's camera.

It is different from optional additional photographs.

The verification Snap:

* Is sent through the verification pipeline.
* Is stored in Cloudinary.
* Is associated with the discovery/verification record.
* May be displayed publicly if the user chooses to make it public.

The main verification Snap is retained according to the application's storage policy.

---

# 20. Additional Photos

Users may optionally submit additional photographs.

These may include:

* Selfies
* Group photographs
* Additional views
* Personal photographs

Additional photographs are not required for verification.

They are not sent to the CV service.

They may be used for:

* Community galleries
* User profiles
* Artifact galleries
* Personal memories

---

# 21. Public Snap Visibility

Verification Snaps are private by default.

Users can choose to make a Snap public.

Public Snaps may appear:

* On the artifact page
* In community galleries
* On the user's profile

**[suggested]** Users should be able to change the public/private state after submission, subject to moderation rules.

---

# 22. Verification States

The system uses explicit verification states. CV runs **synchronously** in the
verification request, so only terminal states are ever persisted (`API Contract.md`
§6.2):

* `VERIFIED`
* `FLAGGED`
* `REJECTED`

### VERIFIED

Required verification checks have passed.

### FLAGGED

Automated verification produced an uncertain or failed CV result requiring human review. The attempt is created with this status and no discovery is awarded until an administrator decides.

### REJECTED

An administrator/expert reviewed the submission and determined that it should not count as a discovery.

`PENDING` and `FAILED` are intentionally absent. An attempt document is written
only once its verdict is known, and a technical CV failure persists nothing at all
and returns `503`/`504`, so neither state can occur.

---

# 23. Verification Flow

## CV-enabled artifact

All steps below occur within a single synchronous request; nothing is persisted
until the verdict is known (`API Contract.md` §6.2, `DB Schemas.md` §26).

1. User enters artifact radius.
2. User opens artifact.
3. Story unlocks (proximity alone).
4. User captures verification Snap.
5. Snap is uploaded to Cloudinary.
6. Next.js validates the request and evaluates GPS.
7. If GPS fails, the request returns `422` and persists nothing.
8. If the user has already discovered the artifact, the request returns `409` and persists nothing.
9. Next.js requests CV comparison.
10. FastAPI generates/uses the image embedding.
11. FastAPI compares it against that artifact's reference embeddings.
12. FastAPI returns similarity information.
13. If the CV service is unreachable or times out, the request returns `503`/`504` and persists nothing; the client retries.
14. Next.js applies the configured verification rules.
15. If similarity passes, it opens a transaction that creates the attempt, the discovery, XP/points entries, and quest/badge effects.
16. If similarity does not pass, it creates the attempt with status `FLAGGED` and awards no discovery; an administrator reviews it.

## CV-disabled artifact

1. User enters artifact radius.
2. User captures the verification Snap where appropriate.
3. GPS is evaluated.
4. If GPS succeeds, the discovery is verified.
5. Collection and gamification effects are applied.

---

# 24. Verification UX

While the synchronous request is in flight the user should see a clear, transient
state such as:

**Verifying…**

The interface may show the stages the server is walking through:

* GPS: Passed
* Image analysis: in progress
* Final verification: waiting on the response

This state is display-only and held in local component state. Because there is no
persisted background job (`API Contract.md` §6.2), the user cannot leave and return
to poll it; the submit control must indicate a busy state for the full wait. If the
request fails with `503`/`504`, the app retries the same request with the same
idempotency key.

---

# 25. Automatic Verification

When all required checks pass, verification should be completed immediately.

A successful automatic verification should:

* Mark the discovery as verified.
* Add the artifact to the user's collection.
* Award XP.
* Update relevant quest progress.
* Update relevant badge progress.
* Update leaderboard-related statistics.

---

# 26. Manual Verification

When CV similarity is below the automatic threshold, the submission should be flagged for review.

The administrator should be able to inspect:

* Artifact
* User
* GPS result
* CV similarity score
* Configured threshold
* Submitted verification image
* Relevant reference images/embeddings
* Submission timestamp

The administrator can then:

* Approve
* Reject

If approved, the discovery proceeds exactly like an automatically verified discovery.

If rejected:

* No XP is awarded.
* Artifact is not added to the collection.
* No quest progress is awarded.
* No badge progress is awarded.

**[suggested]** A rejected submission should allow the user to submit another verification Snap for the same artifact unless the artifact has been disabled or the administrator has explicitly blocked further attempts.

---

# 27. Duplicate Discovery

A user should not repeatedly receive the same discovery reward.

**[suggested]**

Once a user has successfully collected an artifact:

* The artifact remains in their collection.
* Revisiting it does not award additional base XP.
* The system may still record subsequent visits separately if future features require visit history.

This follows the previous PRD's rule that successful repeat discoveries do not award XP again.

---

# 28. Collection

Each user has a personal collection of discovered artifacts.

A collection entry should provide:

* Artifact name
* Discovery status
* Discovery date
* Verification Snap where permitted
* XP earned
* Related quest progress where applicable

The collection represents the user's personal record of discovered heritage.

---

# 29. XP System

Users earn XP through successful discoveries and other defined activities.

Primary MVP XP source:

**Successful artifact discovery**

Additional XP sources may include:

* Quest completion
* Special challenges
* Community contributions
* Other future activities

Exact XP values are configurable through the admin system.

---

# 30. Quests

Quests group multiple artifacts into an exploration objective.

Example:

**Patan Hidden Heritage Quest**

* Artifact A
* Artifact B
* Artifact C
* Artifact D

A quest tracks which artifacts the user has successfully discovered.

Quest completion can award:

* XP
* Badge
* Other configured reward

---

# 31. Badges

Badges represent achievements earned through defined conditions.

Possible conditions include:

* Discovering a number of artifacts.
* Completing a quest.
* Discovering artifacts from a category.
* Completing special exploration objectives.

Badge definitions should be configurable.

---

# 32. Leaderboard

The MVP includes a global all-time leaderboard.

The leaderboard should rank users according to accumulated XP.

**[suggested]** The MVP should use XP as the single leaderboard metric to avoid introducing multiple competing ranking systems.

---

# 33. Levels

User levels may exist as a secondary gamification mechanic.

**[suggested]** Levels should not be a blocking MVP requirement if implementing them adds complexity beyond the XP/quest/badge system.

---

# 34. Rewards and Businesses

Rewards remain part of the product's broader gamification system.

The system can associate rewards with:

* XP milestones
* Quest completion
* Badges
* Other achievements

Local businesses may eventually participate by providing rewards or offers.

The admin panel should provide a foundation for managing reward/business information.

The exact redemption mechanism may initially remain a prototype.

---

# 35. Map

The mobile application provides an interactive map showing available artifacts.

## 35.1 Resolved Map Stack

The map stack is now **decided**, not provisional:

| Concern | Decision |
| --- | --- |
| Map renderer | MapLibre Native (`@maplibre/maplibre-react-native`) |
| Tile / style provider | **OpenFreeMap** |
| Style URL | `https://tiles.openfreemap.org/styles/liberty` |
| API key or token | **None.** No account, no token, no client-side secret |
| Underlying geographic data | OpenStreetMap (delivered through OpenFreeMap) |
| Walking directions | **OSRM** public demo server, foot profile |
| Build requirement | Native / EAS build. Expo Go is **not** supported |

OpenStreetMap is the *data source*, not the tile host. The two are now explicitly
separated:

```text
OpenStreetMap     →  geographic data
OpenFreeMap       →  tile hosting + MapLibre vector style JSON
MapLibre Native   →  on-device rendering
```

This closes the previously open "tile provider" decision recorded in §73. The tile
provider is no longer an unconfirmed item.

## 35.2 Map Capabilities

The map should support:

* Artifact markers, one per artifact in range
* Current user location
* Selecting an artifact
* Opening artifact details
* Nearby artifact discovery
* Navigation toward an artifact

## 35.3 Two Map Surfaces

The MVP has two distinct map screens:

1. **Explore map** — discovery. Artifact markers, user location, nearby list, search.
2. **Navigation map** — wayfinding. A single destination, a walking route line,
   live route progress, and arrival detection.

## 35.4 Marker Categories

Artifact categories map to fixed marker icons so markers stay visually consistent
and recognisable without reading text:

| Category | Marker |
| --- | --- |
| `temple` | Home |
| `statue` | Person / body |
| `carving` | Hammer |
| `architecture` | Building |
| `site` | Map pin |
| `other` / unrecognised | Compass |

The currently selected artifact renders as a larger location pin.

Marker visuals carry **no** verification meaning. A marker must never be used to
imply that an artifact was collected, verified, or unlocked, because that is
server-authoritative state.

## 35.5 Proximity Alerts and Geofencing

Nearby notifications are implemented with **OS-native geofencing**, not foreground
polling, so they work while the app is closed.

* Geofences are registered per nearby artifact, up to a hard cap of **20**
  concurrent regions.
* Alerts fire on **entry** only, never on exit.
* The same artifact cannot re-alert for **24 hours**.
* The registered radius is the greater of the user's configured alert radius and
  the artifact's own verification radius.
* Background location permission and notification permission are both required.
  Notification permission is requested only once the feature is switched on.
* Tapping an alert opens the artifact detail screen.
* Alerts stop as soon as the user disables them in settings.
* An alert never implies discovery, collection, or verification.

## 35.6 Offline Map Position

**Offline map tiles are explicitly out of scope for the MVP.** There is no offline
tile download, offline region pack, or offline map mode.

What *is* cached is map **metadata**, so the Explore screen paints immediately on
re-entry rather than showing a spinner:

* The nearby artifact list and the user's last known position.
* Time-to-live based, not connectivity based.
* Refreshed in the background on app start, and re-read on every Explore mount.

Tiles already fetched may be served from the platform's normal MapLibre tile cache,
but the product makes **no guarantee** about offline map availability and does not
advertise offline maps to users.

## 35.7 Accepted Trade-offs

* **OpenFreeMap is a shared public service.** Acceptable for a hackathon/demo. A
  production deployment should move to a managed provider (MapTiler, Stadia Maps)
  or self-hosted tiles.
* **No token means no quota control.** Rate limits are not configurable and no
  client-side usage telemetry is available.
* **The OSRM public endpoint is a demo service.** It carries no SLA and no
  rate-limit guarantee, and must not be relied upon at production scale.
* **20 geofences is an OS platform limit**, not a product choice. Beyond 20 nearby
  artifacts the remainder are silently unmonitored, and this should be surfaced to
  users rather than hidden.
* **Markers are unclustered.** This is acceptable at MVP artifact counts and
  should be revisited if the catalog grows substantially.

---

# 36. Nearby Discovery

The application should provide a way to discover artifacts around the user's current location.

Users should be able to:

* See nearby artifacts.
* Select an artifact.
* View distance/proximity information.
* Navigate toward it.
* Receive nearby discovery notifications.

## 36.1 Resolved Behaviour

* Nearby artifacts are resolved by a **server-side geographic proximity query**
  (MongoDB `2dsphere` / `$geoNear`), not by a client-side bounding box or a flat
  lat/lng comparison.
* The default Explore radius is **5 km**.
* Results are always ordered **nearest first**.
* Distance is computed server-side and displayed to the user in the user's chosen
  units.
* Artifact coordinates are always server-authoritative. The client must never
  invent, override, or optimistically patch them.
* Proximity is a **UX signal only**. Entering the radius never marks an artifact
  as discovered, collected, or verified — only the server can do that, and story
  unlocking is a separate, radius-driven step (§35.5, §38).
* Geofenced nearby notifications are specified in §35.5.

---

# 37. Search

Users should be able to search the artifact database.

Search should support:

* Artifact name
* Relevant categories
* Tags

**[suggested]** Initial search should remain simple text/category filtering rather than introducing sophisticated semantic search.

---

# 38. External Navigation

The application should allow users to navigate to an artifact using an external navigation application.

The application should provide a navigation action from artifact details.

---

# 39. Notifications

Nearby discovery notifications are retained as a product feature.

The system may notify users when relevant artifacts are nearby.

**[suggested]** Notification frequency should be controlled to avoid repeatedly notifying users about the same artifact.

*Resolved:* notification frequency is controlled by a 24-hour per-artifact
cooldown, enforced client-side and backed by the geofencing rules in §35.5.

---

# 40. User Contributions

Users may suggest new cultural places/artifacts.

A contribution should contain information such as:

* Name
* Description
* GPS location
* Category
* Photographs
* Cultural significance
* Additional supporting information

The submitted information is reviewed before becoming an official artifact.

---

# 41. Contribution Workflow

**[suggested]**

Recommended lifecycle:

`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → OFFICIAL_ARTIFACT`

Rejected submissions may follow:

`UNDER_REVIEW → REJECTED`

The contributor should be able to see the status of their submission.

Approved contributors should receive attribution.

**[suggested]** Attribution should initially be informational rather than directly awarding XP, until the contribution/reward rules are finalized.

---

# 42. Contribution Review

Experts and administrators can review submitted places.

The review should allow them to inspect:

* Submitted information
* Location
* Photographs
* Category
* Cultural significance
* Contributor information

An approved submission becomes an official artifact after the required review.

---

# 43. Community Content

Community content includes:

* Public verification Snaps
* Additional public photographs
* User contributions
* User profiles
* Artifact galleries

Community content should remain separate from the authoritative artifact data.

---

# 44. Data Authority

The system should distinguish between:

### Official Artifact Data

Controlled by administrators/authorized experts.

### Community Content

Created by users.

### Verification Data

Generated from actual discovery attempts.

### CV Reference Data

Controlled by the team/admin and used for image comparison.

This separation prevents user-generated content from automatically becoming authoritative cultural information.

---

# 45. Authentication

Authentication is provided by **Clerk**.

Supported authentication methods:

* Credential-based authentication
* Google OAuth

Clerk manages authentication and identity.

The application database stores the application's user record and associates it with the corresponding Clerk user identifier.

The application should not maintain a second password system.

---

# 46. Authorization

The main roles are:

* User
* Expert
* Admin

Authorization determines access to application functionality.

### User

Can:

* Explore artifacts
* View stories
* Submit discoveries
* Manage their profile
* Manage their public/private Snap settings
* Submit artifact suggestions

### Expert

Can perform authorized artifact-submission review functions.

### Admin

Has full administrative functionality.

---

# 47. Admin Panel

The admin panel is a Next.js web application.

The admin panel should provide access to:

## Artifact Management

* Create artifact
* Edit artifact
* Disable artifact
* Configure GPS radius
* Configure CV requirement
* Manage artifact information
* Manage reference embeddings/images

## Verification Management

* View flagged submissions
* Inspect GPS results
* Inspect CV results
* Approve
* Reject

## Contribution Management

* View submitted places
* Review submissions
* Approve/reject submissions
* Convert approved submissions into official artifacts

## Quest Management

* Create quests
* Add/remove artifacts
* Configure quest rewards

## Badge Management

* Create badges
* Configure requirements

## Reward/Business Management

* Manage businesses
* Manage reward information
* Configure reward associations

## Community Management

* Review public content
* Moderate user-submitted content

## User Management

* View users
* Manage appropriate administrative permissions

---

# 48. Artifact Creation

The artifact creation panel should allow administrators to configure:

### Basic Information

* Name
* Description
* Story
* Category
* Tags

### Location

* Latitude
* Longitude
* Altitude
* Verification radius

### Verification

* Require CV: Yes/No
* CV threshold **[suggested]**
* Reference images/embeddings

### Gamification

* XP
* Quest associations
* Badge-related configuration where applicable

---

# 49. Image Storage

Cloudinary is the primary image storage system.

Logical categories should be separated.

**[suggested]**

* `artifacts/reference`
* `users/profile`
* `snaps/verification`
* `community`
* `contributions`

The exact Cloudinary folder structure belongs in the TRD.

---

# 50. Mobile Image Upload

**[suggested]** The mobile application should upload images directly to Cloudinary using signed upload parameters where practical.

The application backend should then receive the resulting Cloudinary asset information rather than proxying large image files through the Next.js server.

This reduces unnecessary backend bandwidth and processing.

---

# 51. Backend Architecture

The primary backend is a custom Next.js backend.

Architecture:

**React Native / Expo App**
↓
**Next.js REST API**
↓
**MongoDB**

For CV-enabled verification:

**Next.js REST API**
↓
**FastAPI CV Service**
↓
**CLIP/OpenCLIP Model**

The mobile application should not directly depend on the CV service.

---

# 52. Backend Responsibilities

Next.js owns:

* Authentication integration
* Authorization
* Artifact data
* User data
* Discovery records
* GPS verification
* CV verification orchestration
* Verification state
* XP
* Collection
* Quests
* Badges
* Leaderboard
* Contributions
* Community content
* Admin operations
* Cloudinary integration
* CV service communication

FastAPI owns:

* Image embedding
* Embedding comparison
* Similarity calculation

The CV service does not own application business logic.

---

# 53. REST API

The application uses REST APIs.

**[suggested]** API endpoints should be organized by domain rather than by database collection, for example:

* `/artifacts`
* `/discoveries`
* `/quests`
* `/collection`
* `/users`
* `/submissions`
* `/admin`
* `/verification`

Exact endpoint definitions belong in a future API specification/TRD.

---

# 54. Database

MongoDB is the primary application database.

The database should contain entities representing at least:

* Users
* Artifacts
* Artifact reference embeddings
* Discoveries
* Quests
* Badges
* User collections
* Verification submissions
* User contributions
* Community Snaps
* Rewards
* Businesses

Exact schemas, indexes, references, and validation rules belong in the TRD.

---

# 55. Artifact Reference Embeddings

Embeddings are stored in MongoDB.

Reference embeddings are associated with individual artifacts.

There is no requirement for a separate vector database for the hackathon MVP.

The expected scale is relatively small because only a limited number of artifacts will have full CV reference datasets during the hackathon.

---

# 56. Hackathon Dataset

The application may contain approximately:

**20–30 artifacts**

However, only approximately:

**4–5 artifacts**

are expected to have complete reference-image datasets for CV demonstration.

The remaining artifacts can operate without CV where appropriate.

This allows the team to demonstrate the complete CV pipeline without requiring a large image-collection effort during the hackathon.

---

# 57. Offline Support

Offline Snap functionality is a **Good to Have** feature.

If implemented, the application should:

1. Save the captured Snap locally.
2. Save relevant metadata.
3. Detect network availability.
4. Upload the pending submission when connectivity returns.
5. Continue the normal verification process.

Offline support must not block the core MVP.

---

# 58. Privacy

User photographs and personal information should have appropriate privacy controls.

Verification Snaps are private by default.

A user explicitly choosing public visibility allows the relevant image to appear in community-facing locations.

Authentication credentials should be handled by Clerk rather than stored directly by the application.

---

# 59. Security

The application should:

* Authenticate protected operations.
* Authorize administrative operations.
* Validate uploaded data.
* Validate artifact identifiers.
* Validate GPS information.
* Protect admin endpoints.
* Protect CV service communication.
* Avoid exposing private Cloudinary assets unnecessarily.
* Restrict modification of official artifact information to authorized roles.

**[suggested]** The FastAPI CV service should not be publicly exposed as an unrestricted endpoint. Requests should originate through the Next.js backend and use service authentication.

---

# 60. Anti-Cheating

The MVP's primary anti-cheating mechanism is:

**GPS verification + CV image verification**

The system should not attempt to implement sophisticated anti-spoofing during the hackathon.

Potential future systems include:

* GPS spoof detection
* Device integrity checks
* Duplicate image detection
* Submission pattern analysis
* Temporal checks
* More sophisticated computer vision
* Location consistency checks

These are post-hackathon enhancements.

---

# 61. Performance Requirements

The application should remain usable over typical mobile networks.

The backend processes image verification synchronously within the verification
request (`API Contract.md` §6.2), so the client waits for one response rather than
polling. The worst case is budgeted at roughly 25 seconds and is recorded in
`API Contract.md` §6.2a.

**[suggested]** If this wait proves unacceptable in practice, revisit the decision
as a whole — do not add polling on top of it.

---

# 62. Reliability

The application should handle:

* Poor network connectivity
* Image upload failures
* CV service timeouts
* GPS unavailable states
* Invalid submissions
* Duplicate requests
* Backend errors

A temporary CV failure must not cost the user their submission. Because the
synchronous model persists nothing until a verdict exists, the client simply
re-sends the same idempotent request (same `Idempotency-Key`) after a `503`/`504`.

---

# 63. Error Handling

Users should receive meaningful states rather than generic errors.

Examples:

### GPS unavailable

> Location could not be verified.

### Outside radius

> You are not close enough to this artifact.

### Verification processing

> Your discovery is being verified.

### CV review required

> Your photo needs additional verification.

### Successful verification

> Discovery verified.

### Rejected

> This discovery could not be verified.

Exact UI wording can be refined during implementation.

---

# 64. Core User Flow

The primary hackathon flow remains:

1. Open application.
2. Explore map.
3. Find/select artifact.
4. View artifact details.
5. Navigate toward artifact.
6. Enter artifact proximity radius.
7. Story unlocks.
8. Capture verification Snap.
9. GPS verification occurs.
10. CV verification occurs if required.
11. Discovery is verified.
12. Artifact is added to collection.
13. XP is awarded.
14. Quest progress updates.
15. Badge progress updates where applicable.

This represents the primary golden path for the MVP.

---

# 65. First-Time User Experience

The initial experience should be simple and discovery-focused.

The home screen should prioritize:

* Map/exploration
* Search
* Nearby discoveries
* Simple entry into the artifact discovery experience

The original design direction included a search prompt similar to:

**“Where is your next destination?”**

and a nearby exploration action.

The application should support multiple exploration scenarios:

* Exploring the user's current area
* Planning around a destination
* Discovering nearby artifacts
* Exploring without a specific destination

---

# 66. Main Screens

The MVP should contain, at minimum:

### Mobile

* Landing/Home
* Map
* Search
* Artifact Details
* Artifact Story
* Camera/Snap
* Verification Status
* Collection
* Quests
* Badges
* Leaderboard
* Profile
* Community Gallery
* Contribution Submission

### Admin

* Dashboard
* Artifact Management
* Artifact Creation/Edit
* Reference Image/Embedding Management
* Verification Review
* Contribution Review
* Quest Management
* Badge Management
* Reward/Business Management
* Community Moderation
* User Management

---

# 67. MVP Requirements

## Must Have

### Discovery

* Interactive map (MapLibre Native + OpenFreeMap)
* Artifact markers
* Artifact details
* Nearby artifact discovery
* Search
* In-app walking directions with route line and arrival detection

*Note:* handoff to an external navigation app is **not** implemented in the MVP.
The app provides its own in-app walking navigation via OSRM. External navigation
remains a future enhancement.

### Story

* Proximity detection
* Story unlocking
* Story display

### Verification

* In-app camera
* Main verification Snap
* GPS verification
* Configurable artifact radius
* Optional CV per artifact
* CV service integration
* Reference embeddings
* Synchronous verification (no background job)
* Admin review for flagged submissions

### Collection

* User collection
* Successful discovery records

### Gamification

* XP
* Quests
* Badges
* Global all-time leaderboard

### Authentication

* Clerk
* Credentials
* Google OAuth

### Administration

* Artifact management
* Artifact verification configuration
* Reference dataset management
* Verification review
* User-submitted place review
* Quest management
* Badge management
* Reward/business management

### Community

* Public Snap option
* Community gallery
* User profiles
* Artifact contributions

---

# 68. Good to Have

The following features should be implemented if time permits but must not block the MVP:

* Offline Snap capture and synchronization
* Nearby notifications
* More advanced profile statistics
* More elaborate animations
* Reward redemption prototype
* Business verification
* Additional community functionality
* Artifact contribution improvements
* Advanced moderation
* Handoff to an external navigation app

---

# 69. Future Features

Potential post-hackathon features include:

* Larger Nepal-wide artifact database
* Advanced anti-cheating
* Sophisticated CV models
* Better duplicate detection
* Advanced community contribution systems
* Expert networks
* Verified cultural organizations
* More reward partnerships
* Advanced offline support
* More detailed user statistics
* Regional leaderboards
* Seasonal quests
* Time-limited events
* Expanded business partnerships
* Social exploration features

---

# 70. Success Criteria

The MVP is successful when a user can:

1. Open Sanskriti Snap.
2. Discover an unfamiliar cultural artifact.
3. Travel to the location.
4. Enter the configured proximity radius.
5. Unlock the artifact's story.
6. Capture a verification Snap.
7. Have their location verified.
8. Have their image verified when CV is required.
9. Receive a successful discovery.
10. Add the artifact to their collection.
11. Earn XP.
12. Progress a quest.
13. Potentially earn a badge.
14. See the discovery reflected in their profile/leaderboard.

This preserves the original definition of the core product experience: finding an overlooked artifact, physically approaching it, learning its story, photographing it, verifying the visit, collecting it, and progressing through the game system.

---

# 71. Product Principles

## 71.1 Exploration First

The application should encourage physical discovery rather than merely providing information.

## 71.2 Cultural Context Matters

Artifacts should not be reduced to map pins. Each official artifact should provide meaningful cultural context.

## 71.3 Verification Should Be Practical

Verification should provide reasonable confidence without making the exploration experience frustrating.

## 71.4 Gamification Should Support Discovery

XP, quests, badges, collections, and rewards exist to encourage exploration rather than distract from the cultural experience.

## 71.5 Official Data and Community Data Are Different

Community contributions should enrich the platform without automatically becoming authoritative cultural information.

## 71.6 Keep the MVP Focused

The hackathon should demonstrate the complete core loop rather than attempting to build every future feature.

---

# 72. Technical Boundaries Relevant to the PRD

The following are implementation decisions that have been established sufficiently to guide product requirements but should be specified more precisely in the TRD:

* React Native + Expo mobile application
* Next.js backend
* REST API
* MongoDB
* Clerk authentication
* Cloudinary image storage
* FastAPI CV service
* PyTorch
* CLIP/OpenCLIP-based embeddings
* MapLibre Native (`@maplibre/maplibre-react-native`)
* OpenFreeMap tile hosting, `liberty` style
* OSRM public server for walking directions
* MongoDB-stored artifact embeddings

The exact implementation details, database schemas, API contracts, indexes, authentication integration, CV model, similarity calculation, deployment, environment configuration, and infrastructure belong in the TRD.

---

# 73. Unconfirmed Decisions

The following items remain intentionally open.

### `[suggested]` CV aggregation

Use top-K reference similarities rather than the single maximum or average across all references.

### `[suggested]` CV threshold

Make the threshold configurable and establish its value experimentally using real artifact photographs.

### `[suggested]` Top-K value

Determine K experimentally after collecting sample verification images.

### `[suggested]` Verification states

Use:

`VERIFIED / FLAGGED / REJECTED`

with manual review producing:

`FLAGGED → VERIFIED / REJECTED`

### `[suggested]` Re-submission

Allow users to submit another verification Snap after a rejection.

### `[suggested]` Duplicate discovery

Allow only the first successful discovery to award base XP and collection credit.

### `[suggested]` Expert permissions

Keep Experts restricted to user-submitted artifact/place review unless an Admin explicitly grants additional permissions.

### `[suggested]` Contribution lifecycle

Use:

`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → OFFICIAL_ARTIFACT`

with a `REJECTED` state.

### `[suggested]` Contributor attribution

Keep attribution to approved contributors but do not make contribution XP mandatory for the initial MVP.

### `[suggested]` Cloudinary structure

Separate reference, verification, community, contribution, and profile media into logical storage categories.

### `[suggested]` Mobile image upload

Prefer signed direct mobile-to-Cloudinary uploads to avoid unnecessarily routing large images through Next.js.

### `[suggested]` Notification frequency

Prevent repeated nearby notifications for the same artifact.

*Resolved:* implemented as a 24-hour per-artifact cooldown. See §35.5.

### `[suggested]` Search

Start with simple name/category/tag search rather than semantic search.

### `[suggested]` CV service security

Restrict FastAPI access to authenticated backend-to-service communication rather than exposing unrestricted public CV endpoints.

### `[suggested]` Tile provider

**Resolved — no longer open.** The MapLibre tile provider is **OpenFreeMap**,
serving the `liberty` style with no API token. See §35.1 and §35.7. This item is
retained here only as a record of the decision; it should not be treated as a
pending question.

---

# 74. Final MVP Definition

Sanskriti Snap is a mobile gamified cultural discovery application in which users discover lesser-known heritage artifacts, physically travel to them, unlock their stories through proximity, capture verification photographs, verify their presence through GPS and optionally computer vision, collect successfully discovered artifacts, and progress through XP, quests, badges, and leaderboards.

The system consists of:

**React Native/Expo Mobile App**
→ **Next.js REST Backend**
→ **MongoDB**

with:

**Next.js → FastAPI CV Service**

for optional artifact-specific image verification.

The MVP prioritizes the complete discovery loop over feature breadth:

**Discover → Visit → Unlock → Snap → Verify → Collect → Learn → Progress**

Its purpose is to make Nepal's overlooked cultural heritage something users actively seek out rather than something they merely read about.
