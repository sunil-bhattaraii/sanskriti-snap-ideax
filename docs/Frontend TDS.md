# Sanskriti Snap

## Technical Design Specification (TDS) — Frontend

**Version:** 2.0
**Status:** Hackathon MVP
**Platform:** Android Mobile Application
**Framework:** React Native + Expo
**Language:** TypeScript
**Routing:** Expo Router
**State Management:** Zustand
**Server State:** TanStack Query
**Maps:** MapLibre Native + OpenFreeMap tiles
**Authentication:** Clerk
**Image Storage:** Cloudinary
**Backend:** Next.js REST API
**CV:** Indirectly accessed through the Next.js backend

---

# 1. Purpose

This document defines the technical architecture and implementation design for the **Sanskriti Snap mobile frontend**.

It translates the requirements defined in the PRD into concrete frontend components, screens, state management, data flow, device capabilities, API interactions, and implementation boundaries.

The frontend is responsible for:

* Rendering the mobile user interface.
* Managing navigation.
* Managing local UI state.
* Managing cached server state.
* Accessing device location.
* Accessing the device camera.
* Capturing and preparing photographs.
* Uploading images.
* Displaying artifact information.
* Displaying verification progress.
* Displaying collections and gamification.
* Supporting community contributions.
* Handling authentication through Clerk.
* Supporting optional offline Snap capture.

The frontend **does not own authoritative business logic**.

The backend remains responsible for:

* Verification decisions.
* XP calculation.
* Collection state.
* Quest progress.
* Badge progress.
* Authorization.
* Artifact data.
* Discovery state.
* CV orchestration.

---

# 2. Technology Stack

## 2.1 Core

| Area                 | Technology                        |
| -------------------- | --------------------------------- |
| Framework            | React Native                      |
| Development platform | Expo                              |
| Language             | TypeScript                        |
| Navigation           | Expo Router                       |
| State management     | Zustand                           |
| Server state         | TanStack Query                    |
| Authentication       | Clerk                             |
| Maps                 | MapLibre Native                   |
| Map tiles / style    | OpenFreeMap (`liberty`)           |
| Map data             | OpenStreetMap (via OpenFreeMap)   |
| Walking routing      | OSRM public server (foot)         |
| Bottom sheet         | `@gorhom/bottom-sheet`            |
| Camera               | Expo Camera                       |
| Image selection      | Expo Image Picker                 |
| Image processing     | Expo Image Manipulator            |
| Location             | Expo Location                     |
| Notifications        | Expo Notifications                |
| Network state        | `@react-native-community/netinfo` |
| Offline database     | Expo SQLite                       |
| Image storage        | Cloudinary                        |
| API communication    | REST / HTTP                       |

---

# 3. Frontend Architecture

The mobile application follows a layered architecture.

```text
┌──────────────────────────────────────┐
│              UI Layer                │
│ Screens / Components / UI States     │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│         Feature / Application        │
│ Discovery / Verification / Quest etc │
└──────────────────┬───────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│ Zustand Stores │   │ TanStack Query  │
│ Local/UI State │   │ Server State    │
└───────┬────────┘   └────────┬────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │     API Layer       │
        │ REST API Client     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │     Next.js API     │
        └─────────────────────┘
```

Device capabilities operate alongside the application layer:

```text
Camera ───────────────┐
Location ──────────────┤
Notifications ────────┤
Network ──────────────┤──→ Frontend Features
Local Storage/SQLite ──┘
```

---

# 4. Architectural Principles

## 4.1 Backend Is Authoritative

The frontend must not independently determine:

* Whether a discovery is verified.
* Whether XP should be awarded.
* Whether a quest is completed.
* Whether a badge is earned.
* Whether an artifact is officially available.
* Whether a user is authorized for an operation.

The frontend displays the state returned by the backend.

---

## 4.2 Server State vs Local State

The frontend should distinguish between:

### Server State

Managed primarily through TanStack Query:

* Artifacts
* Artifact details
* Quests
* Badges
* Collection
* Leaderboard
* User profile
* Discovery records
* Verification submissions
* Community content
* User contributions

### Local/UI State

Managed through Zustand and component state:

* Selected artifact
* Map UI state
* Camera state
* Temporary form state
* UI preferences
* Current filters
* Upload progress
* Temporary verification UI state

---

# 5. Project Structure

**[suggested]**

A feature-oriented structure is recommended.

```text
app/
├── _layout.tsx
├── index.tsx
├── (auth)/
│   ├── sign-in.tsx
│   └── sign-up.tsx
│
├── (tabs)/
│   ├── _layout.tsx
│   ├── home.tsx
│   ├── explore.tsx
│   ├── quests.tsx
│   ├── collection.tsx
│   └── profile.tsx
│
├── artifacts/
│   ├── [id].tsx
│   ├── [id]/story.tsx
│   └── [id]/snap.tsx
│
├── verification/
│   └── [id].tsx
│
├── leaderboard.tsx
├── badges.tsx
├── contribution/
│   └── create.tsx
└── community/
    └── [id].tsx

src/
├── components/
├── features/
│   ├── artifacts/
│   ├── discovery/
│   ├── verification/
│   ├── quests/
│   ├── collection/
│   ├── profile/
│   ├── community/
│   └── contributions/
│
├── api/
├── hooks/
├── stores/
├── services/
├── types/
├── constants/
├── utils/
└── config/
```

The exact folder organization can be adjusted during implementation.

---

# 6. Navigation

Expo Router should be used for file-based navigation.

## 6.1 Main Navigation

The primary navigation should expose:

* Home / Explore
* Map
* Quests
* Collection
* Profile

**[suggested]** Map and Home may be combined if the final UI design benefits from making the map the primary landing experience.

---

# 7. Navigation Structure

Recommended structure:

```text
Root
│
├── Authentication
│   ├── Sign In
│   └── Sign Up
│
└── Main Application
    │
    ├── Home / Explore
    │
    ├── Map
    │   └── Artifact Details
    │       └── Story
    │           └── Snap
    │               └── Verification
    │
    ├── Quests
    │
    ├── Collection
    │
    └── Profile
        ├── Badges
        ├── Leaderboard
        ├── Contributions
        └── Public Snaps
```

---

# 8. Authentication

Clerk provides authentication.

Supported methods:

* Credentials
* Google OAuth

The frontend should use Clerk's React Native-compatible authentication flow.

The frontend should not directly implement password storage or authentication logic.

---

# 9. Authentication Flow

```text
App Launch
    │
    ▼
Check Clerk Session
    │
    ├── Authenticated ──→ Main Application
    │
    └── Not Authenticated
             │
             ▼
        Public Experience
             │
             ▼
        Sign In / Sign Up
```

**[suggested]** Artifact browsing should remain accessible before authentication where possible, while actions requiring an account should trigger authentication.

This preserves the discovery experience while avoiding unnecessary account friction.

---

# 10. API Client

The frontend should have a centralized REST API client.

**[suggested]**

Responsibilities:

* Base URL management.
* Authentication token attachment.
* Request serialization.
* Response parsing.
* Error normalization.
* Timeout handling.
* Retry configuration where appropriate.

Example conceptual structure:

```text
api/
├── client.ts
├── artifacts.ts
├── discoveries.ts
├── quests.ts
├── collection.ts
├── users.ts
├── contributions.ts
├── verification.ts
└── leaderboard.ts
```

---

# 11. TanStack Query

TanStack Query manages server state.

Recommended usage:

### Queries

* Artifact list
* Artifact detail
* Nearby artifacts
* Search results
* Collection
* Quests
* Quest details
* Badges
* Leaderboard
* Profile
* Community gallery
* Contribution status
* Verification status

### Mutations

* Submit discovery
* Submit verification Snap
* Create contribution
* Update profile
* Change Snap visibility
* Other authenticated actions

---

# 12. Query Caching

Artifacts and other relatively stable data should be cached.

**[suggested]**

Approximate behavior:

* Artifact list: moderate cache duration.
* Artifact details: moderate/long cache duration.
* Quests: moderate cache duration.
* Collection: shorter cache duration.
* Verification status: no polling. The verdict arrives in the POST response; on
  failure the client retries the same request.

Exact durations should be determined during implementation.

---

# 13. Query Invalidation

When a successful discovery is received, relevant cached queries should be invalidated/refetched.

For example:

```text
Discovery Verified
       │
       ├── invalidate collection
       ├── invalidate quests
       ├── invalidate badges
       ├── invalidate profile
       └── invalidate leaderboard
```

The backend remains authoritative for the resulting values.

---

# 14. Zustand

Zustand should manage local application state that does not need server synchronization.

Recommended stores:

```text
stores/
├── auth/
├── map/
├── camera/
├── discovery/
├── upload/
├── contribution/
└── preferences/
```

**[suggested]** Avoid duplicating TanStack Query data inside Zustand. If data originates from the server, TanStack Query should generally remain its source of truth.

---

# 15. Home / Explore Screen

The Home/Explore screen is the primary discovery entry point.

It should provide:

* Search
* Map access
* Nearby artifacts
* Featured/recommended discoveries
* Quest discovery
* User progress summary

The original product direction includes the concept:

> “Where is your next destination?”

and a nearby exploration action.

The final visual implementation should retain the discovery-oriented purpose rather than becoming a generic dashboard.

---

# 16. Map Screen

The Map is one of the core screens.

Responsibilities:

* Render map.
* Render artifact markers.
* Display user location.
* Handle marker selection.
* Open artifact details.
* Display nearby discoveries.
* Support map movement.
* Support location centering.

This is split across **two** screens, not one. See §17.3 for the comparison:

* `(tabs)/explore` — the discovery map.
* `(tabs)/navigation` — the wayfinding map.

---

# 17. Map Implementation

This section is **resolved**. The tile provider is no longer an open question.

## 17.1 Renderer and Tiles

| Concern | Value |
| --- | --- |
| Package | `@maplibre/maplibre-react-native` |
| Style URL | `https://tiles.openfreemap.org/styles/liberty` |
| Tile provider | OpenFreeMap |
| Data source | OpenStreetMap, delivered through OpenFreeMap |
| Token / API key | None. No account, no key, no client-side secret |

OpenStreetMap supplies the geographic data; OpenFreeMap hosts the tiles and serves
the MapLibre vector style JSON. The two must not be conflated — OSM's own public
tile servers are not what this app talks to.

Because there is no token, there is no quota configuration and no client-side
usage telemetry. See §17.8 for the accepted consequences.

## 17.2 Style URL Is a Single Constant

The style URL must be defined **once** in a module-level constant and imported by
every map surface.

```ts
// constants/mapStyle.ts
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
```

Current state: this constant does not exist. The URL is hardcoded in
`components/explore/MapView.tsx` as `DEFAULT_MAP_STYLE` and repeated verbatim in
`app/(tabs)/navigation.tsx`. Two copies of a network endpoint is a drift risk. A
third-party change would have to be applied in both places, and nothing would fail
loudly if one were missed.

Do **not** introduce an `EXPO_PUBLIC_MAP_STYLE_URL` environment variable for this.
The provider needs no credential, so the value is not secret and not
deployment-specific. A constant is simpler and cannot be misconfigured. Revisit
only if a deployment genuinely needs to swap tile hosts (e.g. self-hosting).

## 17.3 Two Map Surfaces

| Screen | Purpose | Camera | Markers | Overlays |
| --- | --- | --- | --- | --- |
| `(tabs)/explore` | Discovery | `Camera` at zoom 13, centred on user or a default fallback | All nearby artifacts + user | Compass, recentre FAB, nearby bottom sheet, search |
| `(tabs)/navigation` | Wayfinding | `Camera` at zoom 15, `fitBounds` to route | Destination + user | Route line, walked-progress line, instruction banner |

### Explore map

* Camera falls back to a hardcoded Kathmandu coordinate when the user location is
  unknown. This is an acceptable MVP default but should be named as such
  (`DEFAULT_CENTER`), not left as an inline array.
* The camera recentres on the selected artifact with a bottom padding, so the
  artifact is not hidden behind the bottom sheet.
* Camera control is exposed to the screen through `useImperativeHandle` with a
  `recenter` / `resetNorth` / `flyTo` handle. Screens must drive the camera through
  that handle rather than reaching for a camera ref.
* Deep links pass `lat`, `lng`, and `focus` as route params. The camera fly is
  deferred by a short timeout so it lands after the route transition and map mount.
  If the map ever fails to mount within that window, the coordinates are silently
  dropped.

### Navigation map

* The route line is a `GeoJSONSource` + `Layer` pair fed by the OSRM response.
* A second `GeoJSONSource` renders the already-walked portion of the route in a
  different colour, giving progress feedback without a separate progress bar.
* Route progress is derived by finding the nearest route vertex to the current
  position. This is a nearest-vertex heuristic and is not a true "distance
  travelled along route" calculation; it can jump backwards if the user moves away
  from the route.
* Estimated time is a hardcoded `12 min/km` walk constant, not derived from the
  OSRM `duration` field that the response already contains. Use the routing
  provider's duration.
* Arrival is declared when the OSRM remaining distance is within the artifact's
  `verification_radius_m`. This is a **client-side** arrival signal used for UX
  prompting. It is not verification, and it does not unlock discovery.

## 17.4 Markers

Markers use `ViewAnnotation` (a React view anchored to a coordinate), not symbol
layers. This allows arbitrary React content and Ionicon glyphs, at the cost of
relying on the annotation view cache.

| Artifact category | Ionicon |
| --- | --- |
| `temple` | `home-outline` |
| `statue` | `body-outline` |
| `carving` | `hammer-outline` |
| `architecture` | `business-outline` |
| `site` | `location-outline` |
| anything else | `compass-outline` |

* Default marker: 32dp circular pin, 16dp white glyph, brand-primary fill, white
  border, CSS-triangle pointer.
* Selected marker: 56dp `location` pin in brand primary, with a heavier shadow.
* The user marker is a pulsing dot, 24dp halo over a 12dp core.
* Marker visuals carry **no** state meaning. There is deliberately no
  unvisited/visited/collected/quest marker variant, because collection state is
  server-authoritative and must not be inferred client-side. If variant markers
  are added later, they must be driven by real server state.

### Annotation view cache workaround

Selection changes currently work around a MapLibre annotation cache bug by
including `isSelected` in the React `key`, forcing a full unmount/remount of the
annotation on every selection change:

```tsx
key={`${artifact.id}-${isSelected}`}
```

This is a real, necessary workaround, but it is invisible in the code — a future
cleanup that "simplifies" the key will silently break marker selection. The key
format must be preserved, and the reason should be recorded in a comment at the
definition site.

## 17.5 Marker Press and Selection

* A marker press sets the selected artifact. It does not open the detail screen
  directly.
* Selecting a marker both moves the camera and presents the nearby bottom sheet,
  which scrolls the selected card to the centre of the list.
* The selected state is therefore a **coordinated** one: camera, marker variant,
  and sheet index must all stay in sync from a single source of truth.
* The bottom sheet uses fixed snap points (collapsed / half / full). A "View All"
  affordance is rendered but has no handler and is non-functional.

## 17.6 Nearby Data Loading

Explore nearby artifacts through a server-side proximity endpoint, not a
client-side bounding box.

* Endpoint: `GET /api/v1/artifacts/nearby?latitude={lat}&longitude={lng}&radiusMeters={metres}`,
  implemented as a Next.js Route Handler.
* MongoDB backing: a `2dsphere` index on the artifact location field, queried with
  the `$geoNear` aggregation stage. `$geoNear` must be the **first** stage in the
  pipeline, and it both filters by `maxDistance` and sorts nearest-first while
  projecting a `distanceMeters` field — so distance arrives already computed.
* Default Explore radius: **5 000 m**.
* Distance arrives in metres; the client converts to kilometres for display. The
  conversion happens in one place, not per component.

### Authorization on the proximity endpoint

The endpoint must require an authenticated session and must apply its own
server-side filter. Specifically:

* Verify the session at the top of the handler. An unauthenticated request must
  return `401`, not an empty or full result set.
* Filter on `status: 'PUBLISHED'` in the aggregation pipeline, not in the client.
* **MongoDB has no row-level security.** There is no database-level authorization
  backstop, so a missed filter in a handler is an immediate data leak with no second
  line of defence. Every query touching artifacts must therefore pass through a
  server-side layer that applies the authorization filter, and no data access may
  live in a client component.
* Do not trust client-supplied parameters beyond the obvious bounds. Validate
  `lat`/`lng` ranges and cap `radiusM` at a sane maximum. The 50 km geofence
  sweep and the 5 km explore radius are server decisions, not client inputs.
* Do not return fields the map does not render. The payload needs id, name,
  category, coordinates, distance, xp, verification radius, reference images and
  tags — not story content, contributor data, or moderation fields.

### Caching

Nearby metadata is cached so Explore paints immediately on re-entry:

* Cache is keyed and versioned (`@sanskriti_explore_cache_v1`).
* Entries carry a `savedAt` timestamp and a **15 minute** TTL.
* The screen renders cache first, then refreshes in the background if stale.
* Refresh is single-flight: concurrent callers share one in-flight promise, so
  the app-start prefetch and the Explore mount cannot double-fetch.
* The root layout prefetches during initial load so map data is usually ready by
  the time Explore mounts.

This is a **metadata** cache, not a map cache. See §17.7.

## 17.7 Offline Maps

**Offline map tiles are out of scope for the MVP.** There is no tile download, no
offline region pack, and no offline map mode.

This is a deliberate scope decision, and the current state should be read as
"not started" rather than "partially working":

* `@maplibre/maplibre-react-native` does not expose a Mapbox-style offline region
  manager. Offline coverage requires custom tile caching, which is real work and
  is not present.
* The project notes and `AGENTS.md` refer to offline-map functionality and
  physical-device testing for it. Neither has an implementation to test.
* The only offline-adjacent behaviour is the metadata cache in §17.6. It makes
  marker positions and distances available without a network round trip, but the
  **basemap will not render** offline. A user who loses connectivity sees markers
  on a blank or stale canvas, which is a poor experience and should not be
  presented as offline support.

Previously viewed tiles may be served from the platform's own tile cache, but that
is an implementation detail, not a guarantee. If offline maps are later
prioritised, they need their own section covering region selection, tile budget,
cache invalidation, and the UI affordance that tells the user what is available
offline.

## 17.8 Accepted Consequences

* **OpenFreeMap is a shared public service.** Fine for a hackathon/demo. For
  production, move to a managed provider (MapTiler, Stadia Maps) or self-host.
* **No token means no quota control.** Rate limits are not configurable and
  failures surface only as a blank basemap.
* **OSRM's public endpoint is a demo service.** No SLA, no rate-limit guarantee.
  It must not be relied on at production scale. It is also called directly from
  the device, so an outage or added CORS restriction breaks navigation outright.
* **Geofencing is capped at 20 regions** by the OS. See §20.
* **Markers are unclustered.** Acceptable at MVP artifact counts.
* **Annotation cache workaround is load-bearing.** See §17.4.

---

# 18. User Location

Expo Location provides device location.

The application requires location permission before using:

* Nearby discovery.
* Proximity detection.
* GPS verification.
* User-location map display.

Permission states should be handled explicitly.

---

# 19. Location Permission States

The frontend should distinguish:

* Permission not requested
* Permission granted
* Permission denied
* Permission restricted/unavailable
* Location temporarily unavailable

The UI should provide an appropriate explanation when location is required.

---

# 20. Proximity Detection

The frontend can calculate approximate distance for UX purposes.

However, the backend remains authoritative for verification.

The frontend should never claim that a discovery is verified solely because its local distance calculation indicates that the user is inside the radius.

Conceptually:

```text
Device Location
      │
      ├── Frontend → UX / proximity indication
      │
      └── Backend → authoritative verification
```

## 20.1 Geofenced Proximity Alerts

Proximity alerts are implemented with **OS-native geofencing** via `expo-location`
+ `expo-task-manager`, not foreground polling, so alerts fire while the app is
closed.

| Concern | Value |
| --- | --- |
| Task name | `sanskriti-proximity-geofence` |
| Max concurrent regions | **20** |
| Trigger | Entry only (`notifyOnExit: false`) |
| Re-alert cooldown | **24 hours** per artifact |
| Fetch radius | **50 000 m** |
| Android channel | `proximity-alerts`, default importance |
| Registration radius | `max(user radius, artifact.verification_radius_m)` |

Implementation requirements:

* The background task is defined at **module scope** and guarded by
  `isTaskDefined`, so it survives JS reloads and is not registered twice.
* The task must re-check for a live auth session before notifying. A background
  task can run with no session, and firing a notification then would leak artifact
  identity to a logged-out user.
* Re-entrancy is guarded with an in-memory lock set, since a region entry and a
  manual refresh can race.
* The notification payload carries the artifact id. The deep-link handler must
  **validate the id shape** before using it to build a route, and must resolve to a
  real route. The tap currently opens the artifact detail screen, not the map.
* Artifact names are cached locally so the notification body can name the artifact
  without a network call in the background task.
* Both background location permission and notification permission are required.
  Notification permission must be requested only when the user enables the feature,
  not during onboarding.
* Geofences are refreshed when the user's notification preference or radius
  changes, and stopped when the feature is disabled.

Known limits, which should be surfaced rather than hidden:

* **20 regions is an OS platform cap.** Beyond 20 nearby artifacts the remainder
  are silently unmonitored. Users should be told when the cap is hit rather than
  assuming full coverage.
* OS background-execution limits mean geofence delivery is best-effort, not
  guaranteed. Android may delay or drop region events under battery optimisation.
* The fetch radius (50 km) and the geofence cap (20) interact: with a dense
  catalog, the 20 registered regions may not be the 20 nearest. They should be.

---

# 21. Artifact Marker

Each artifact marker should provide enough visual information to identify it.

Selecting a marker should open an artifact preview or details screen.

**[suggested]** Marker state may visually distinguish:

* Unvisited
* Nearby
* Collected
* Quest-related

The exact visual language should be determined during UI design.

## 21.1 Current Implementation

Markers are `ViewAnnotation` children, not symbol layers. Category-to-icon
mapping and both visual states are specified in §17.4.

The suggested state variants above are **not** implemented, and the distinction
matters: the map currently shows no unvisited/visited/collected distinction at
all. Markers are driven purely by category.

That is the correct call for correctness, not a shortcut. Collection and discovery
state are server-authoritative, and the nearby-artifacts endpoint does not
currently return per-user collection state to the Explore map payload. Adding
visually meaningful variants means first getting that state into the map payload
authoritatively; inferring it from XP totals or discovery counts client-side would
show other users' state or guess, and both are worse than showing nothing.

If state markers are added, treat it as a data-plumbing task, not a styling task.

## 21.2 Marker Press Does Not Open Details

A marker press selects the artifact. It does not navigate to the detail screen.
Selection drives the camera, the marker variant, and the bottom sheet; the user
then taps through the sheet to reach details. This indirection is a deliberate
one-tap-to-inspect pattern and should be documented in the screen design rather
than treated as a missing handler.

---

# 22. Artifact Details Screen

The artifact detail screen should display:

* Artifact name
* Description
* Images
* Category
* Distance
* Collection state
* Story state
* Quest associations
* Discovery action
* Navigation action

If the user is outside the proximity radius, the screen should communicate the approximate distance and guide the user toward the location.

---

# 23. Story Screen

When the user enters the artifact radius, the story becomes available.

The frontend should fetch/display the story from the backend.

The screen should communicate that the artifact has been unlocked.

Example conceptual state:

```text
Artifact
   │
   ▼
User enters radius
   │
   ▼
Story unlocked
   │
   ▼
Read story
   │
   ▼
Capture Snap
```

---

# 24. Camera

Expo Camera should be used for the main verification Snap.

The application should request camera permission before opening the camera.

The verification camera should distinguish itself from optional gallery image selection.

---

# 25. Verification Camera

The verification camera should:

* Open device camera.
* Display capture controls.
* Capture the primary image.
* Allow retaking.
* Preview captured image.
* Confirm submission.

The user should not be required to select the verification image from the gallery during the normal flow.

The main Snap is intended to be captured in-app.

---

# 26. Image Processing

Expo Image Manipulator may be used before upload.

Potential operations:

* Resize
* Compress
* Normalize orientation
* Reduce unnecessary file size

**[suggested]** The frontend should resize/compress verification images before upload while preserving enough visual detail for CV comparison.

The exact dimensions/quality should be established through CV testing.

---

# 27. Cloudinary Upload

The intended flow is:

```text
Camera
   │
   ▼
Image Processing
   │
   ▼
Cloudinary Upload
   │
   ▼
Cloudinary URL / Asset ID
   │
   ▼
Next.js API
```

**[suggested]** Use signed direct uploads so the large image does not need to pass through the Next.js backend.

The frontend should only receive upload credentials/configuration required for the authorized upload.

---

# 28. Verification Submission

After uploading the image, the frontend submits the discovery verification request to the backend.

Conceptually:

```text
POST /verification
{
    artifactId,
    imageUrl,
    imageAssetId,
    clientMetadata
}
```

The exact API contract belongs in the backend TDS/API specification.

The frontend should not submit a final verification result.

---

# 29. Verification Status Screen

CV verification is **synchronous** (`API Contract.md` §6.2). The client posts an
attempt and waits for one response that already carries the terminal verdict.
There is no `Pending` state to display, because the backend never persists an
attempt before its verdict exists.

Possible outcomes of a single request:

```text
Submitting
    ↓
Verified                    (GPS passed, CV passed or not required)
```

or:

```text
Submitting
    ↓
Flagged → (manual review) → Verified / Rejected
```

A technical failure does not produce a `Pending` record. It produces an error
response and writes nothing:

```text
Submitting
    ↓
503 CV_UNAVAILABLE / 504 CV_TIMEOUT
    ↓
Retry the same request with the same Idempotency-Key
```

---

# 30. Verification UI

The client may show progress for the stages the **server** walks through while
the request is in flight, but these are display-only and must not be persisted or
resumed:

```text
GPS verification       ✓
Image analysis         in progress (waiting on the CV call)
Awarding discovery     pending (waiting on the response)
```

When the response arrives with a `VERIFIED` verdict:

```text
GPS verification       ✓
Image analysis         ✓
Discovery              ✓
```

If the artifact does not require CV:

```text
GPS verification       ✓
Discovery              ✓
```

The screen holds this progress in local component state only. It is discarded on
navigation or reload, because there is no server-side job to reconnect to.

---

# 31. Background Verification — REMOVED

The previous design let the user leave the screen and return later to a
server-polled `Pending` record. That design is **removed**: it required a
persisted intermediate state, which the synchronous model deliberately avoids.

The client now waits on the in-flight request. Because the worst case is ~25 s
(`API Contract.md` §6.2a), the submit control must show a busy state for the whole
wait and offer cancellation, but it must not navigate away as if the work would
continue elsewhere.

---

# 32. Verification Polling / Updates — REMOVED

There is nothing to poll. The previous design used TanStack Query polling against
a `pending` verification record; no such record exists, so the polling mechanism
and the `verification-pending` screen that hosted it are deleted. See
`API Contract.md` §12.6. The client obtains the verdict from the POST response, and
retries the POST on failure.

If a future release reintroduces asynchronous CV, this section must be rewritten
together with `API Contract.md` §6.2 — not implemented independently of it.

---

# 33. Successful Verification

When the backend reports `VERIFIED`, the frontend should refresh:

* Collection
* XP
* Quest progress
* Badge progress
* Profile
* Leaderboard

The UI should present the successful discovery clearly.

---

# 34. Verification Failure

If the backend reports a failed verification:

The frontend should explain the failure without pretending to know details the backend did not provide.

Examples:

* Location could not be verified.
* Verification could not be completed.
* Submission requires review.

---

# 35. Flagged Verification

A flagged submission is not automatically treated as a failed discovery.

The frontend should show:

**Verification requires review**

The user can continue using the application.

The final result is determined by the admin.

---

# 36. Collection Screen

The collection screen displays artifacts discovered by the user.

It should provide:

* Artifact grid/list
* Collected status
* Discovery date
* XP
* Artifact information
* Verification Snap where appropriate

**[suggested]** The collection should visually distinguish collected artifacts from undiscovered artifacts without revealing unnecessary locked information.

---

# 37. Quest Screen

The Quest screen displays available and active quests.

Each quest should show:

* Quest name
* Description
* Progress
* Required artifacts
* Completion state
* Reward

Example:

```text
Patan Hidden Heritage

3 / 5 artifacts discovered

✓ Artifact A
✓ Artifact B
✓ Artifact C
○ Artifact D
○ Artifact E
```

---

# 38. Badge Screen

The Badge screen displays:

* Earned badges
* Locked badges
* Badge requirements
* Progress where applicable

Badge state comes from the backend.

The frontend should not independently calculate official badge ownership.

---

# 39. Leaderboard

The leaderboard displays the global all-time ranking.

At minimum:

* Rank
* User
* XP

The frontend retrieves leaderboard data from the backend.

**[suggested]** The user's own ranking should remain visible even if they are outside the currently displayed top section.

---

# 40. Profile

The profile should display:

* User information
* XP
* Level if implemented
* Collection summary
* Badge summary
* Quest progress
* Public Snaps
* Contributions
* Leaderboard position

---

# 41. Community Gallery

The community gallery displays public user content.

Possible content:

* Public verification Snaps
* Additional public photographs

The frontend must respect the visibility state returned by the backend.

Private images must never be intentionally displayed through community endpoints.

---

# 42. Snap Visibility

A user can choose whether their verification Snap is public.

The frontend should provide a clear control for:

```text
Public
Private
```

The default is:

**Private**

Changing visibility should invoke a backend mutation.

---

# 43. Contribution Screen

The contribution screen allows users to suggest new cultural places.

The form should support:

* Name
* Description
* Category
* GPS location
* Photographs
* Cultural significance
* Additional information

The frontend should validate basic form requirements before submission.

The backend performs authoritative validation and review.

---

# 44. Contribution Location

The user should be able to provide the location through device GPS.

**[suggested]** Allow the user to confirm/adjust the selected location on a map before submission.

This prevents accidental submission caused by inaccurate GPS readings.

---

# 45. Contribution Photos

Contribution photographs are different from verification Snaps.

They should be stored/managed separately.

They are not automatically treated as CV reference images.

The backend/admin workflow determines whether submitted photographs become official reference material.

---

# 46. Notifications

Expo Notifications should be used for nearby artifact notifications and relevant application events.

Potential notification categories:

* Nearby artifact
* Verification completed
* Quest completion
* Reward
* Contribution review result

**[suggested]** Notification handling should deep-link to the relevant screen when the notification is opened.

---

# 47. Network State

`@react-native-community/netinfo` should detect connectivity state.

The frontend should distinguish:

* Online
* Offline
* Reconnecting

Network state can be used to:

* Disable impossible actions.
* Queue offline Snap submissions if offline mode is implemented.
* Inform users about pending uploads.

## 47.1 Current State

NetInfo is **not** currently a dependency and connectivity is not observed
anywhere in the app.

This matters for the map specifically: the nearby-artifact cache in §17.6 is
TTL-based, not connectivity-driven. A user who goes offline and returns within the
15 minute window sees cached markers with a blank basemap, and nothing detects or
communicates that state.

When NetInfo is added, it should drive at minimum:

* An explicit offline indicator on the map, since a blank basemap with markers
  still visible reads as a rendering bug.
* Skipping background cache refresh when offline, to avoid a pointless failing
  request and a discarded result.
* A retry trigger on reconnect, rather than waiting out the TTL.

---

# 48. Offline Snap

Offline Snap functionality is a Good-to-Have feature.

If implemented:

```text
Capture Snap
     │
     ▼
Save locally
     │
     ▼
Save metadata
     │
     ▼
Network unavailable
     │
     ▼
Pending local submission
     │
     ▼
Network restored
     │
     ▼
Upload to Cloudinary
     │
     ▼
Submit verification
```

Expo SQLite should be used for durable local submission metadata.

The feature must not block the normal online verification path.

---

# 49. Local Storage

Local persistent storage may be used for:

* Offline submissions
* Lightweight preferences
* Temporary upload state
* Other device-local configuration

Server-authoritative data should not be permanently duplicated in local storage unless there is a clear offline requirement.

---

# 50. Permissions

The application may require:

* Location permission
* Camera permission
* Notification permission
* Photo/media permission where gallery access is used

Permission requests should occur contextually rather than requesting every permission immediately on first launch.

**[suggested]** Request a permission immediately before the feature requiring it, with a short explanation of why it is needed.

---

# 51. Error Handling

Frontend errors should be categorized.

### Network Error

```text
Unable to connect.
Please check your internet connection.
```

### Authentication Error

```text
Your session has expired.
Please sign in again.
```

### Permission Error

```text
Location access is required for this feature.
```

### Upload Error

```text
Photo upload failed.
```

### Backend Error

Display a generic user-safe message.

The frontend should not expose internal stack traces or service details.

---

# 52. Loading States

Every network-dependent screen should support:

* Initial loading
* Refreshing
* Empty state
* Error state
* Retry

Examples:

```text
Loading artifacts...
No artifacts found.
Unable to load artifacts.
Retry
```

---

# 53. Empty States

Important empty states include:

### Collection

> You haven't discovered any artifacts yet.

### Quests

> No quests available.

### Community Gallery

> No public discoveries yet.

### Contributions

> You haven't submitted any places.

The exact copy is a UI decision and can change.

---

# 54. Image Caching

**[suggested]** Remote artifact and community images should use image caching to reduce bandwidth and improve perceived performance.

Images should use appropriately sized transformations from Cloudinary rather than always downloading original-resolution images.

---

# 55. Map Performance

The frontend should avoid rendering unnecessary map objects.

**[suggested]**

* Only render artifacts relevant to the visible map region when practical.
* Cluster markers if artifact count becomes large.
* Avoid continuously performing expensive distance calculations for every artifact.
* Debounce map movement before requesting large data updates.

The MVP's relatively small artifact count means aggressive optimization is not initially required.

## 55.1 Current State

Measured against the guidance above:

* **No viewport filtering.** Markers are rendered for every artifact returned by
  the nearby query, regardless of what is actually on screen. Acceptable at MVP
  counts within a 5 km radius.
* **No clustering.** Correct for now; revisit if the catalog grows.
* **Distance is computed once, server-side**, by MongoDB `$geoNear` in the
  proximity endpoint. The client does not recompute per artifact per frame. The
  `utils/location.ts` haversine helper exists and is used for display formatting,
  not hot-path work.
* **Search is debounced at 250 ms**, and the search catalog is a single cached
  nationwide fetch rather than a per-keystroke query. Good.
* **Map movement does not trigger refetch.** The camera is the cheap part; the
  data fetch is TTL-gated (§17.6). This is the right trade-off and should not be
  changed to refetch-on-pan without adding viewport-based querying.

## 55.2 Navigation Screen Hot Path

The navigation screen is the more expensive surface and deserves specific
attention:

* It runs a continuous `watchPositionAsync` at high accuracy with a 5 m distance
  interval and a 2 s time interval.
* Each position update triggers a **nearest-route-vertex search** over the full
  route coordinate array, which is O(n) per update. On a long route with updates
  every 2 s this is avoidable work.
* The route fit happens once; it does not refit per update, which is correct.

Improvements, in priority order:

1. Replace the O(n) nearest-vertex scan with a spatial index, or precompute a
   simplified polyline for progress tracking while keeping the full geometry for
   rendering.
2. Throttle progress recomputation independently of position updates.
3. Use the routing provider's own `duration` instead of the hardcoded
   `12 min/km` constant (§17.3).

---

# 56. Camera Performance

The camera flow should avoid retaining unnecessarily large image files.

**[suggested]**

Pipeline:

```text
Capture
  ↓
Resize
  ↓
Compress
  ↓
Upload
  ↓
Release temporary file
```

This reduces memory pressure on mobile devices.

---

# 57. Device Location Performance

Location tracking should not run continuously unless required.

The frontend should use location updates primarily when:

* The map requires current location.
* The user is approaching an artifact.
* Verification is being performed.

**[suggested]** Use the lowest reasonable location-update frequency that still provides a good proximity experience.

---

# 58. Frontend Data Models

The frontend should define TypeScript interfaces/types corresponding to backend API contracts.

Examples:

```text
Artifact
User
Quest
Badge
CollectionItem
Discovery
VerificationAttempt
Contribution
CommunitySnap
Reward
Business
LeaderboardEntry
```

The exact database schema should not be copied directly into frontend types.

Frontend types should represent the API response contract.

---

# 59. Artifact Type

Conceptually:

```ts
type Artifact = {
  id: string
  name: string
  description: string
  story: string
  category: string
  tags: string[]

  latitude: number
  longitude: number
  altitude?: number
  verificationRadius: number

  xp: number
  requiresCv: boolean

  images: ArtifactImage[]

  questIds: string[]
}
```

This is illustrative. The exact contract belongs in the API/TRD.

---

# 60. Discovery Type

Conceptually:

```ts
type Discovery = {
  id: string
  artifactId: string
  status: VerificationStatus
  verificationSnap?: ImageReference
  createdAt: string
  verifiedAt?: string
  xpAwarded?: number
}
```

The backend remains authoritative for all values.

---

# 61. Verification Status Type

```ts
type VerificationStatus =
  | "VERIFIED"
  | "FLAGGED"
  | "REJECTED"
```

---

# 62. Frontend Feature Modules

The frontend should be organized around product capabilities.

Recommended modules:

```text
features/
├── auth
├── artifacts
├── map
├── discovery
├── verification
├── collection
├── quests
├── badges
├── leaderboard
├── profile
├── community
├── contributions
└── notifications
```

Each feature should ideally contain:

* Components
* Hooks
* API functions
* Types
* Local utilities

where appropriate.

---

# 63. Component Design

Reusable UI components should be created for recurring patterns.

Examples:

```text
ArtifactCard
ArtifactMarker
QuestCard
BadgeCard
XPDisplay
ProgressBar
VerificationStatus
SnapPreview
ImageGrid
LoadingState
ErrorState
EmptyState
PrimaryButton
```

**[suggested]** Avoid creating abstractions for components that are only used once. The hackathon does not need an enterprise-grade component monastery.

---

# 64. Form Handling

Forms should perform basic client-side validation.

Validation examples:

* Required name
* Required category
* Valid coordinates
* Valid text length
* Required contribution fields
* Valid image selection

The backend must perform final validation.

---

# 65. Security on the Frontend

The frontend must not assume that hiding a UI element provides security.

For example:

```text
Admin button hidden
```

does not mean:

```text
Admin API secured
```

Authorization must be enforced by the backend.

The frontend should only use role information to control presentation and navigation.

---

# 66. Environment Configuration

The application should use environment variables for configuration.

**[suggested]**

Examples:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
```

**Map configuration:** there is deliberately **no** `EXPO_PUBLIC_MAP_STYLE_URL`.
The tile provider needs no token, so the style URL is a plain source constant
(`constants/mapStyle.ts`), not environment configuration. See §17.2.

Secrets must not be included in client-accessible environment variables.

Cloudinary signed-upload credentials must be generated by the backend rather than embedding private signing secrets in the mobile application.

---

# 67. Build Environment

The project uses Expo.

For native functionality such as:

* MapLibre
* Camera
* Location
* Notifications
* Native configuration

the application should be built using an appropriate Expo development/native build rather than assuming Expo Go compatibility.

**[suggested]** EAS Build should be used for development and release builds where native modules require it.

## 67.1 MapLibre Native Module Is the Reason

MapLibre is a native module and is the single hardest constraint on the build
workflow. It is not a "nice to have" native capability — it is the reason the
project cannot run in Expo Go.

The MapLibre config plugin is registered in `app.json`, so the native module is
wired up automatically during a prebuild. Requirements:

* `expo start` alone is **not** sufficient to exercise the map.
* A development build is required for day-to-day map work.
* Any change to native config — including the `expo-location` background-location
  flags, which are what make geofencing work — requires a **rebuild**, not a
  reload. A JS-only reload will silently keep the old native configuration.
* Camera and location are also native, so the same build constraint applies to
  verification.

The EAS project id is already configured in `app.json`, so builds are a matter of
running the EAS command rather than project setup.

---

# 68. Testing

The frontend should have at least three testing layers.

## Unit Tests

Test:

* Utility functions
* Distance calculations
* Data transformation
* Validation
* State logic

## Component Tests

Test:

* Artifact cards
* Verification states
* Forms
* Quest progress
* Collection rendering

## End-to-End Tests

Test the critical flow:

```text
Open App
→ Find Artifact
→ Open Artifact
→ Reach Radius
→ Unlock Story
→ Capture Snap
→ Submit
→ Receive Verification
→ Collection Updated
→ XP Updated
```

---

# 69. Critical Frontend Test Cases

### Artifact discovery

* Artifact appears on map.
* Artifact opens correctly.
* Correct artifact details are displayed.

### Location

* Permission granted.
* Permission denied.
* User outside radius.
* User inside radius.

### Camera

* Permission granted.
* Permission denied.
* Capture succeeds.
* Retake succeeds.
* Upload succeeds.
* Upload fails.

### CV-enabled verification

* GPS passes.
* CV call in flight (busy state).
* CV passes.
* CV flags submission.
* Admin eventually approves.
* Admin rejects.

### CV-disabled artifact

* GPS passes.
* Discovery becomes verified without CV.

### Gamification

* Collection updates.
* XP updates.
* Quest updates.
* Badge updates.

### Authentication

* Sign in.
* Sign up.
* Google OAuth.
* Session persistence.
* Sign out.

### Offline

* Snap captured offline.
* Local pending record created.
* Network restored.
* Upload resumes.

---

# 70. Golden Path Implementation

The frontend's highest-priority implementation path is:

```text
Home
  ↓
Map
  ↓
Artifact Marker
  ↓
Artifact Details
  ↓
Navigate
  ↓
Enter Radius
  ↓
Story Unlock
  ↓
Camera
  ↓
Capture Snap
  ↓
Cloudinary Upload
  ↓
Verification Submission
  ↓
Verification Status
  ↓
Verified
  ↓
Collection
  ↓
XP / Quest / Badge
```

This path should be completed before secondary frontend features are expanded.

---

# 71. Frontend MVP Priority

## Priority 1: Core Discovery

* Expo project
* Navigation
* Map
* Artifact markers
* Artifact details
* Location
* Story unlock
* Camera

## Priority 2: Verification

* Image processing
* Cloudinary upload
* Verification submission
* Verification status
* Successful verification
* Flagged/review state

## Priority 3: Gamification

* Collection
* XP
* Quests
* Badges
* Leaderboard

## Priority 4: Account and Community

* Clerk
* Profile
* Public Snaps
* Community gallery
* Contributions

## Priority 5: Optional

* Notifications
* Offline Snap
* Advanced animations
* Advanced statistics

---

# 72. Frontend Non-Functional Requirements

The mobile frontend should:

* Remain responsive during image operations.
* Avoid blocking the UI during CV processing.
* Handle intermittent connectivity.
* Minimize unnecessary image memory usage.
* Avoid unnecessary background location usage.
* Provide clear loading/error states.
* Maintain consistent navigation.
* Protect private user content from accidental display.
* Support Android as the primary hackathon platform.

---

# 73. Frontend Technical Boundaries

The frontend **does not**:

* Calculate official XP.
* Determine official quest completion.
* Determine official badge completion.
* Decide whether CV verification passed.
* Store reference embeddings as authoritative data.
* Perform authentication itself.
* Decide whether a user is an admin.
* Approve user-submitted artifacts.
* Modify official artifact data directly.

The frontend **does**:

* Collect user input.
* Access device capabilities.
* Display server state.
* Initiate API operations.
* Upload images.
* Present verification progress.
* Provide the user interface for exploration.

---

# 74. Frontend Architecture Summary

```text
                 ┌───────────────────────┐
                 │ React Native + Expo   │
                 └───────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
       Expo Router       Zustand       TanStack Query
            │                │                │
            │                │                ▼
            │                │          REST API Client
            │                │                │
            ▼                ▼                ▼
      Feature Screens   Local UI State    Next.js API
            │
     ┌──────┼────────┬─────────┐
     │      │        │         │
     ▼      ▼        ▼         ▼
  Camera  Location  Map    Notifications
     │      │        │
     └──────┴────────┴──────────────┐
                                    ▼
                               Cloudinary
```

---

# 75. Final Frontend Architecture

The Sanskriti Snap mobile frontend is a React Native + Expo application using TypeScript, Expo Router, Zustand, and TanStack Query.

The frontend provides the complete exploration experience:

**Discover → Visit → Unlock → Snap → Verify → Collect → Progress**

Device capabilities provide the physical interaction layer:

**Camera + GPS + Notifications + Network**

Cloudinary handles user image storage, while the Next.js backend remains the authoritative application boundary.

The frontend deliberately remains a **client application rather than a second backend**. It collects information, renders state, accesses device capabilities, and communicates with the backend. Verification, gamification, authorization, and official cultural data remain server-controlled.

This separation allows the mobile application to remain relatively simple while the backend handles the complexity of Sanskriti Snap's verification and gamification systems.
