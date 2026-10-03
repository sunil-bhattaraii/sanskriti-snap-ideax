# Sanskriti Snap — Computer Vision Service PRD

**Version:** 1.0
**Status:** Proposed · awaiting implementation
**Owner:** Backend / CV lanes
**Related:** `docs/API Contract.md` §6.2 / §9 / §11.7, `docs/DB Schemas.md` §6 / §8 / §29–§31, `docs/Backend TDS.md` §29 / §33 / §35–§37 / §81–§87, `sanskriti-snap-backend/src/lib/cv-contract.ts`, `sanskriti-snap-backend/src/lib/cv.ts`

---

## 0. TL;DR

A separate, internal **FastAPI CV service** provides image embeddings and similarity scoring for the Sanskriti Snap verification loop. Its job is *narrow and computational*: turn an image into a vector, and tell you how closely a submitted snap matches an artifact's reference vectors. **It never decides** whether a discovery is valid, valid → XP, quests, badges, or eligibility — the Next.js backend owns those verdicts.

The service is **not implemented yet**. `cv-service/` on disk is an empty directory (a Python venv was created but contains no code). This PRD specifies **exactly what the service must do, what it must expose, and what the surrounding backend routes must do around it**, so the CV lane and the backend lane can build in parallel against a fixed contract.

---

## 1. Purpose and Success Criteria

### 1.1 Why this service

Sanskriti Snap requires users to be *physically present* at a heritage artifact and to photograph it. GPS verifies presence; CV verifies that the photo actually depicts the artifact rather than a stock image or a photo of someone else's submission. Because image feature extraction (CLIP / OpenCLIP) is GPU-bound, it is a distinct service from the Next.js API.

### 1.2 Scope boundary

| In scope for the CV service | Out of scope (belongs in Next.js) |
| --- | --- |
| Loading one artifact's reference vectors | Threshold comparison → VERIFIED / FLAGGED |
| Feature extraction (`/embed`) | Discovery, XP, quests, badges |
| Similarity search with top-K aggregation (`/compare`) | User eligibility, account status |
| Model / dimension validation | Verification state machine (VERIFIED / FLAGGED / REJECTED) |
| Rejected similarity, dimension / model errors | Gamification, leaderboard |

**Authority split, restated for clarity (docs/Backend TDS.md §35–36):**
FastAPI computes **embeddings, per-reference similarity, and top-K aggregation**. Next.js computes **threshold comparison, the verification verdict, and all awards**.

### 1.3 Success criteria

1. `POST /embed` returns a vector of the dimension the configured model emits, tagged with the model name/version.
2. `POST /compare` returns a `similarityScore` that is the **mean of the top-K** reference scores, never a flat average over all references and never the single maximum.
3. The service refuses, with a typed error code, anything it cannot safely answer: no references, dimension mismatch, unknown model, invalid image.
4. Every request carries a verifiable `Authorization: Bearer <CV_SERVICE_SECRET>` header; unauthenticated calls return 401.
5. End-to-end: a FLAGGED attempt persists with `similarityScore` and `matchedReferenceIds`; a CV outage persists **nothing**.

---

## 2. System Overview

```
                      ┌────────────────────┐
                      │  React Native /    │
                      │  Expo mobile app   │
                      └──────────┬─────────┘
                                 │
                                 │ signed upload → Cloudinary
                                 ▼
                      ┌────────────────────┐
                      │   Next.js API      │
                      │  (verifies,        │
                      │   decides verdict) │
                      └──────────┬─────────┘
                                 │
                   ┌─────────────┴───────────────┐
                   │                             │
                   │ POST /embed                 │ POST /compare
                   │ POST /references/embeddings │
                   ▼                             ▼
        ┌──────────────────────┐   ┌───────────────────────────┐
        │  FastAPI CV service  │◄──┤  MongoDB (reference       │
        │                      │    │   embeddings live here)   │
        │  PyTorch             │    └───────────────────────────┘
        │  OpenCLIP / CLIP     │
        └──────────────────────┘
```

**Deployment notes**

- The service is **internal only**. It is never addressed from the mobile app or from any client. Only Next.js calls it.
- It is reached via `CV_SERVICE_URL` (e.g. `http://127.0.0.1:8000` in dev; a private/internal endpoint in production), authenticated with `CV_SERVICE_SECRET`.
- Both `CV_SERVICE_URL` and `CV_SERVICE_SECRET` are **server-only** (`sanskriti-snap-backend/src/lib/env.ts`). Neither is a `NEXT_PUBLIC_` variable; the secret must never reach the browser.
- The service runs on its own host. From Next.js it is treated as **flaky**: every call has a 10 s per-attempt timeout, up to 3 retries with linear backoff (`sanskriti-snap-backend/src/lib/cv-contract.ts:CV_ATTEMPT_TIMEOUT_MS`, `CV_MAX_ATTEMPTS`), and a failure aborts the request with `503`/`504` and persists **nothing**.

---

## 3. Data Model

The CV service reads reference data from MongoDB. It is a consumer of the `artifactReferences` collection, not its owner. The backend owns schema, migration, and access.

### 3.1 Reference dataset (`artifactReferences`)

Per `docs/DB Schemas.md` §6 and `sanskriti-snap-backend/src/models/artifact.ts`. **This is the document shape the CV service queries and matches against:**

```ts
{
  _id: ObjectId,                 // matchedReferenceIds references this
  artifactId: ObjectId,          // scoped to this artifact — never cross-artifact
  imageUrl: string,              // Cloudinary CDN URL (for admin review)
  cloudinaryPublicId: string | null,
  embedding: number[],           // the vector; select:false on reads
  embeddingDimension: number,    // 0 = not-yet-embedded marker
  cvModel: {                     // model stamp — vectors from incompatible
    name: string,                // models must never be compared
    version: string
  },
  isCover: boolean,              // denormalised first reference
  createdAt: Date,
  updatedAt: Date
}
```

**Index (on MongoDB, owned by the backend):**

```text
artifactId: 1                          -- hot path for /compare
artifactId: 1, isCover: 1
```

### 3.2 Not-yet-embedded marker

A reference row is written as soon as its image is registered; the vector comes later via a separate call. Until then `embeddingDimension` is **0** and the array is empty. The CV service must **skip dimension 0 vectors** in comparison rather than score them — otherwise an incomplete artifact silently scores a good match. An artifact with **zero loadable references is a configuration error**: `POST /compare` must reject with `NO_REFERENCES` rather than returning a meaningless score.

### 3.3 Artifact CV configuration (`artifacts.cvConfiguration`)

```ts
{
  threshold: number,   // 0..1 — the verdict boundary (default 0.72 if null)
  topK: number         // >= 1 — aggregation width (default 3 if null)
}
```

The threshold is **per-artifact** and the backend may override it at call time (`sanskriti-snap-backend/src/lib/verification.ts:163–164`). `topK` is the aggregation width, not a cap on how many references are scanned — the service scans the full reference set and keeps the top K.

### 3.4 Model versioning

Every embedding is stamped with `cvModel.name` and `cvModel.version`. The CV service must **reject a comparison whose submitted image was embedded with a different model** than the references, or a mix of models within one artifact. Cross-model vectors live in a different semantic space; comparing them is a silent correctness bug (`docs/Backend TDS.md` §83).

---

## 4. Required API Contract (FastAPI surface)

The contract is defined authoritatively in `sanskriti-snap-backend/src/lib/cv-contract.ts`. Both endpoints are `POST /...` and require **JSON `application/json`**; every request carries `Authorization: Bearer <CV_SERVICE_SECRET>`.

### 4.1 Service auth

```http
POST /embed
Authorization: Bearer <CV_SERVICE_SECRET>
Content-Type: application/json
```

- The secret is validated first; on missing/invalid auth the service returns **401 UNAUTHORIZED** with a generic message — never leak whether the secret is right or wrong in a way that leaks service configuration.
- The service endpoint must **never be public**. If it is accidentally reachable from an untrusted network, the auth failure alone is the control; there is no per-route admin boundary.

### 4.2 `POST /embed` — generate an embedding

Computes an embedding for **one image**. Used by the **admin reference pipeline** (Path A: image upload), never by the live verification path — the verification path reuses already-stored vectors.

**Request**

```ts
{
  image: string,                    // HTTP(S) URL or Cloudinary public id
  model?: { name: string, version: string }   // optional: defaults to configured base model
}
```

**Response**

```ts
{
  embedding: number[],              // the vector
  embeddingDimension: number,       // positive int, equals embedding.length
  model: { name: string, version: string }   // the model that produced it
}
```

**Rules**

- Response `embeddingDimension` equals `embedding.length`; the caller uses it as the source of truth for the dimension, not a trusted claim.
- If `model` is supplied and differs from the configured base model, the service should accept the override but stamp the returned model name/version so downstream records know which model generated the vector.
- **Error codes** (`sanskriti-snap-backend/src/lib/cv-contract.ts`):

| code | status | when |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | payload missing `image`, wrong JSON shape |
| `INVALID_IMAGE` | 400 | image URL unreachable / not decodable as an image |
| `UNSUPPORTED_MODEL` | 400 | `model.name` is not a known model in the service |
| `INTERNAL_ERROR` | 500 | inference failed, OOM, model load error |

**Failure semantics** — a non-2xx from `/embed` is a **technical failure, not a user rejection**. It aborts the admin reference-ingestion flow; the image remains in Cloudinary and can be re-embedded.

**Where the vectors go** — the Next.js backend stores the embedding on the `artifactReference` document; the CV service does not persist anything. This keeps the service stateless and horizontally scalable.

### 4.3 `POST /compare` — similarity against an artifact's references

The core verification call. Compares a submitted snap against **exactly one artifact's** reference set and returns a top-K-aggregated similarity score.

**Request**

```ts
{
  /** The submitted verification snap — image URL or Cloudinary public id. */
  image: string,

  /** Exactly ONE of the following identifies the reference set. Mixing them
   * is rejected: a partially-supplied set is a silent correctness bug,
   * because the service would compare against a subset. */
  artifactId: string.regex(/^[a-f0-9]{24}$/i),   // prefer this — keeps ~50 × 512-dim
                                                    // vectors off the hot path
  | references: Array<{
      referenceId: string,     // artifactReference._id
      embedding: number[],
      embeddingDimension: number
    }>,                        // used by tests / offline tooling that already
                                // holds vectors in memory

  topK?: number = 3,           // min 1; final score = mean of top-K scores
  model?: { name: string, version: string }   // optional model stamp
}
```

**Response**

```ts
{
  /** Mean similarity across the top-K matches. In [-1, 1]. NOT the single
   * maximum and NOT an average over all references — reference images span
   * angles, lighting, and viewpoints, so a flat average understates a good
   * match (docs/DB Schemas.md 30). */
  similarityScore: number,

  topK: number,
  matchedReferenceIds: string[],     // the K reference ids that made the score
  referenceCount: number,            // how many references were in the set
  model: { name: string, version: string },

  /** Per-reference breakdown. Persisted by the backend for admin review;
   * the service may omit it on the public response path. */
  perReference?: Array<{ referenceId: string, score: number }>
}
```

**Rules**

1. **Reference scope is hard.** The service compares only against the references belonging to the requested `artifactId`. Comparing against any other artifact's references is impossible by design (single-key lookup).
2. **Dimension & model consistency.** If the submitted image's dimension or model does not match the reference set's, return `DIMENSION_MISMATCH` or `UNSUPPORTED_MODEL` — **not** a low score. A dimension-0 reference in the set is skipped.
3. **`referenceCount`** lets the backend distinguish "compared against an empty set" (should be `NO_REFERENCES`, handled before the call) from "compared against a set but the submission matched none of them".
4. **Empty `perReference` is a valid success.** The service returns `similarityScore` even when the top-K is all near-zero; that is a domain outcome (FLAGGED), not an error.
5. **Error codes:**

| code | status | when |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | missing `image`; neither nor both of `artifactId`/`references` |
| `INVALID_IMAGE` | 400 | submitted image not decodable |
| `NO_REFERENCES` | 404 | artifact has zero loadable (non-dimension-0) references |
| `DIMENSION_MISMATCH` | 400 | image dimension ≠ reference set dimension |
| `UNSUPPORTED_MODEL` | 400 | image model stamp ≠ reference model stamp |
| `INTERNAL_ERROR` | 500 | inference / search failed |

**Failure semantics** — identical to `/embed`: any non-2xx is a **technical failure**. It is translated upstream into `503 CV_UNAVAILABLE` (unreachable) or `504 CV_TIMEOUT` (abort) and persists **nothing** (`sanskriti-snap-backend/src/lib/cv-contract.ts:138–143`). A low similarity score is a **successful comparison** and is a domain outcome (FLAGGED), not an error.

### 4.4 Health check (recommended, non-contract)

```http
GET /health
```

Returns `200` when the model is loaded and a quick embedding probe succeeded. Used by load balancers / the backend's preflight. Not versioned and not authenticated in the same way — the backend calls it over a trusted network, and the backend's own retry budget (3 attempts) is the real guard against a zombie endpoint.

---

## 5. Inference and Aggregation Details

### 5.1 Model

- Base model: **OpenCLIP (or CLIP)**, e.g. `openai/clip-vit-base-patch32`, emitting **512-dimensional** vectors.
- The configured model is loaded once at startup; the service is **readiness-checked** at boot (probe embedding) and fails open (refuses compare calls) if it cannot load. A service that loaded the model partially must not answer compare requests.

### 5.2 Feature extraction

- Input: decode image → resize to the model's fixed input size → normalize with the model's standard statistics → tensor → forward → **L2-normalize the embedding** (cosine similarity on normalized vectors equals dot product).
- Reject non-image content and images that fail to decode early, with `INVALID_IMAGE`.

### 5.3 Similarity computation

- Cosine similarity between the submitted vector and each reference vector in the artifact's set. All values in the range **[-1, 1]** (CLIP embeddings are normalized).
- **Top-K aggregation:** sort references descending by score, take the top K, return their **arithmetic mean** as `similarityScore`. K is per-artifact config, default 3, min 1.
- `matchedReferenceIds` is the ordered list of those K ids.

**Why top-K mean and not other aggregations**

- **Not the single maximum** — one reference might match by coincidence (e.g. a shared foreground object); a single max overstates the match.
- **Not a flat average over all references** — an artifact's 30–50 references span angles, lighting, and viewpoints; a background of bad matches drags a good photo's score down.
- **Top-K mean** rewards consistency across the strongest matches while being robust to outliers. It is the default agreed in `docs/Backend TDS.md` §35; the PRD treats it as the default the product teams can re-tune, not an immutable law.

### 5.4 Threshold decision (performed by Next.js, not the service)

```text
similarityScore >= artifact.cvConfiguration.threshold   → VERIFIED
similarityScore <   artifact.cvConfiguration.threshold  → FLAGGED
```

Default threshold **0.72**, default `topK` **3** (`sanskriti-snap-backend/src/lib/verification.ts`), both overridable per-artifact via `cvConfiguration`. The threshold is established experimentally and may change without a contract change — it is an application config, not an API field.

### 5.5 Performance budget (observed by the caller)

| Item | Budget |
| --- | --- |
| Per-attempt timeout | 10 s (`CV_ATTEMPT_TIMEOUT_MS`) |
| Retries per request | 3 (`CV_MAX_ATTEMPTS`), linear backoff `min(1000·n, 2000) ms` |
| Worst-case CV wall time | ~30 s |
| GPS + DB + transaction | < 1 s |
| **Worst-case total** | **~31 s** |

The **deployment must tolerate ~30 s per request** (serverless `maxDuration` must exceed this, or the API must run on a long-duration host). An unbounded CV call turns one slow GPU into a hung request; the 8 s per-attempt timeout is mandatory, not a suggestion. If the platform caps requests below ~25 s, synchronous CV is not viable and this PRD must be reopened (`docs/API Contract.md` §6.2a).

**Note for the CV lane:** the per-call latency budget is roughly 8 s. A 512-dim CLIP embed + a handful of dot products against 30–50 reference vectors should run in well under a second on a modest GPU. If CPU-only, an embed can take several seconds; size the instance accordingly. Batched reference comparison on GPU is strongly recommended for the /compare hot path.

---

## 6. Next.js Integration — Required Routes and Behaviour

These are the backend routes that must exist around the service. Some already exist as stubs; the table shows the **required contract**, which supersedes the current stub behaviour.

### 6.1 Admin reference ingestion

Two paths exist; both are **admin-only** (`requireAdmin`).

| Route | Status | Required behaviour |
| --- | --- | --- |
| `POST /api/v1/admin/artifacts/{id}/references` | exists | Image must be signed via `POST /api/v1/media/sign` with purpose `VERIFICATION_GALLERY`. When `generateEmbedding: true`, the existing authenticated Next.js handler calls `POST /embed` directly server-to-server and stores the returned vector and stamped model on `ArtifactReference`; no additional proxy endpoint or browser-to-CV call is used. `model` is optional and omitted to use the CV service default. When false or omitted, it creates a pending reference (`embedding: [], embeddingDimension: 0, cvModel {name:"pending", version:"0.0"}`). Never writable by a client. Optionally sets `isCover` and clears the previous cover. |
| `POST /api/v1/admin/artifacts/{id}/references/embeddings` | exists | Attaches a **pre-computed** vector to an existing reference (Path B, for bulk imports / offline tooling). Body: `imagePublicId`, `embedding`, `embeddingDimension`, `model {name, version}`, optional `isCover`. **Validates `embedding.length === embeddingDimension`** (contract does not trust a claimed dimension). Updates the reference document in place. Clears prior covers if `isCover`. |
| `DELETE /api/v1/admin/artifacts/{id}/references/{refId}` | exists | Removes the reference; if it was the cover, clears `artifact.coverImageUrl` so the artifact does not point at a deleted asset. Writes `adminActions`. Atomic with the cover-clear in a transaction. |

**Ingestion flow (Path A, image upload):**
```
Admin → upload ref image via /media/sign (purpose VERIFICATION_GALLERY)
      → POST /admin/artifacts/{id}/references { imagePublicId, isCover, generateEmbedding: true, model? }
      → server calls /embed directly and stores vector
      → artifact is now CV-ready → can be published
```
**Ingestion flow (Path B, embedding only):**
```
Admin/tool → POST /admin/artifacts/{id}/references/embeddings
           { imagePublicId, embedding, embeddingDimension, model }
```

### 6.2 Verification submission — `POST /api/v1/verification-attempts`

The synchronous flow, per `docs/API Contract.md` §6.2 / `sanskriti-snap-backend/src/lib/verification.ts`:

```
1. validate body + resolve identity + resolve artifact      → 422 / 404
2. GPS distance from supplied coordinates                     → 422, nothing persisted
3. duplicate-discovery check  (userId, artifactId)            → 409 with existing discoveryId
4. CV compare against artifact's references                   → 503, nothing persisted
5. ONE transaction:
     - insert verificationAttempt (terminal status only)
     - insert discovery
     - insert xpTransactions, pointsTransactions
     - update users.lifetimeXp / pointsBalance
     - update userQuestProgress / complete quests
     - evaluate and award badges
   → 201 with full receipt
```

Steps 2 and 3 are deliberately **before** the CV call so a re-submission of an already-collected artifact costs no GPU time. The attempt row is inserted **inside** the transaction at step 5, after the CV verdict — that is what makes a CV outage total rather than partial. **There is no `PENDING` state.**

**The CV call inside the handler** (`src/lib/verification.ts`):

- Call only when `artifact.requiresCV === true`. If false: GPS pass → VERIFIED, no service call.
- Load references for the artifact **excluded dimension 0** (`embeddingDimension: 0` not-yet-embedded marker).
- Call `cvClient.compare({ artifactId, image, topK })` with a per-attempt timeout; retry up to 3 times with linear backoff; on failure throw `CvServiceUnavailableError`, which maps to `503 CV_UNAVAILABLE` or `504 CV_TIMEOUT` — persist nothing.
- On success: if `similarityScore >= threshold` → VERIFIED, else → FLAGGED. Store `cvVerification`:
  ```ts
  {
    status: "NOT_REQUIRED" | "PASSED" | "FAILED",
    similarityScore: number | null,
    threshold: number | null,
    topK: number | null,
    matchedReferenceIds: ObjectId[],
    model: { name: string, version: string } | null,
    processedAt: Date | null
  }
  ```
- Admin-only `AdminVerificationAttempt` adds `flagReason` and admin-only `review` — the public DTO hides per-reference scores, `flagReason`, and model internals.

### 6.3 Re-verify — `POST /api/v1/verification-attempts/{id}/recheck`

Runs GPS + CV again against the **same** reference set and **creates a new attempt** (`supersedesAttemptId = :id`); the original is never mutated. Same `201` shape. No `Idempotency-Key` (new coordinates = new evidence, not a retry). A CV outage leaves **both** attempts as they were — never downgrades the original to REJECTED.

### 6.4 Admin review — `POST /api/v1/admin/verification/{id}/approve` / `reject`

- `approve` on a `FLAGGED` attempt sets status → VERIFIED and, if the user had not already collected the artifact, runs the same award transaction as §6.2. **Idempotent** — approving an already-VERIFIED attempt returns the existing result, never re-awards.
- `reject` sets status → REJECTED, writes `rejectionReason`, awards nothing, also idempotent.
- Both write a `review` block and an `adminActions` document in the same transaction.

### 6.5 `GET /api/v1/admin/verification?status=FLAGGED`

Paginated list for reviewers, returning `AdminVerificationAttempt` with `flagReason`, `matchedReferenceIds`, and per-reference detail — fields the public DTO omits. Sorted `createdAt ASC` so the oldest flagged attempts are reviewed first.

### 6.6 `GET /api/v1/verification-attempts/:id`

Owner-only. History and recovery, **not polling** — every returned attempt is already terminal. Includes a short-lived signed `verificationImageUrl`.

---

## 7. End-to-End Flows

### 7.1 Admin publishes a CV-enabled artifact

```
1. Admin creates artifact { requiresCV: true, cvConfiguration: { threshold, topK } }, status DRAFT.
2. Admin signs N reference images via POST /api/v1/media/sign (VERIFICATION_GALLERY).
3. Admin POSTs each via POST /admin/artifacts/{id}/references (server calls /embed).
   → or bulk-import vectors via POST /admin/artifacts/{id}/references/embeddings.
4. Admin designates the cover image.
5. Admin publishes → status PUBLISHED. Now discoverable and verifiable.
```

**Reference count target: 30–50 reference images per CV-enabled artifact** for the hackathon demo (`docs/DB Schemas.md` §29). At ~512 dims each, that is roughly 15–25 KB of vectors per artifact — trivial to store, the compare scan is still small.

### 7.2 User verifies a CV-enabled artifact

```
1. User signs a snap via POST /api/v1/media/sign (VERIFICATION_SNAP), uploads directly to Cloudinary.
2. User POSTs /api/v1/verification-attempts { artifactId, verificationImagePublicId, location }.
3. Backend: GPS → duplicate check → (synchronous) POST /compare → verdict.
4a. If GPS pass + similarity >= threshold → VERIFIED + collection + XP + quests + badges → 201.
4b. If GPS pass + similarity < threshold → FLAGGED, no awards → 201 (user can retry / recheck).
4c. If GPS fail → 422 GPS_OUTSIDE_RADIUS, nothing persisted.
4d. If CV service unreachable → 503 CV_UNAVAILABLE, nothing persisted; user retries with the
    same Idempotency-Key.
```

### 7.3 Admin reviews a FLAGGED attempt

```
1. Admin GETs /api/v1/admin/verification?status=FLAGGED.
2. Reviews submitted image + GPS + score + threshold + matched references.
3. POST approve (→ VERIFIED, award transaction) or reject (→ REJECTED).
4. User can resubmit a rejected attempt; a successful retry collects the artifact.
```

---

## 8. Security Considerations

1. **Service-to-service auth.** `Authorization: Bearer <CV_SERVICE_SECRET>` on every call; the secret lives only in server env (`CV_SERVICE_SECRET`, never `NEXT_PUBLIC_`). The service rejects unauthenticated requests.
2. **Never expose raw vectors to clients.** `embedding` is `select: false` on the reference schema; admin response DTOs (`{ id, imageUrl, isCover, model }`) never include the vector; per-reference scores are hidden from the public attempt DTO.
3. **No client-visible model internals.** `flagReason`, `matchedReferenceIds`, raw per-reference scores, and model metadata are admin-only.
4. **Reference scoping is structural.** The service queries references by `artifactId` only; it cannot compare across artifacts.
5. **No client-controlled verdicts.** The contract forbids the client from sending `status`, `similarityScore`, `cvVerification`, or `gpsVerification` (422 if present, `docs/API Contract.md` §6.5) — the old client bug where "Retry Verification" wrote `cv_similarity_score: 1` is impossible under this contract.
6. **CV failures are technical, never user failures.** A timeout or outage returns 503/504 and persists nothing; it never becomes REJECTED.

---

## 9. Testing Requirements

### 9.1 Unit tests (service side)

- Embedding of a known image produces stable, reproducible vectors for the same model.
- Cosine similarity: identical images → ~1.0; unrelated images → clearly separated.
- Top-K mean: a set of 10 references where the correct answer is verified by recomputing the mean of the top K in a test harness (reference vectors stored in the test DB).
- Model stamping: embeddings from model A never compare against references from model B (dimension or explicit model-field mismatch).

### 9.2 Integration tests (service ↔ backend)

- `POST /embed` round-trip: backend receives `{ embedding, embeddingDimension, model }` and stores it.
- `POST /compare` with `artifactId`: backend compares, scores above threshold → VERIFIED.
- `POST /compare` below threshold → FLAGGED, no awards.
- **CV unavailable** (service down, 500, timeout): `503 CV_UNAVAILABLE`, no attempt row, no discovery, no XP.
- **Wrong artifact reference set**: comparing an image against another artifact's references must be impossible — scope test.
- **Empty reference set**: `NO_REFERENCES` / backend `404`, not a spurious score.
- **Dimension mismatch**: rejected, not a low score.

### 9.3 Contract tests (shared schema)

Both lanes should validate against `sanskriti-snap-backend/src/lib/cv-contract.ts` — the FastAPI server deserializes exactly the Zod schemas (`EmbedRequest`, `EmbedResponse`, `CompareRequest`, `CompareResponse`, `CvServiceError`), so the schemas are the living contract and both implementations must pass the same validator.

### 9.4 Critical backend test cases (docs/Backend TDS.md §110)

| Area | Cases |
| --- | --- |
| CV | CV disabled; CV enabled; high similarity; low similarity; CV timeout; CV service unavailable; invalid embedding; wrong artifact reference set; dimension mismatch; model mismatch |
| Verification | successful auto-verify; flagged submission; admin approval; admin rejection; duplicate completion; retry after rejection; recheck creates new attempt |
| Gamification | XP awarded once; collection created once; quest progresses; quest completes; badge awarded |
| Authorization | user cannot access admin CV routes; admin only |

---

## 10. Missing Work — What This PRD Defines as Required

### 10.1 CV service (`cv-service/`) — **must be implemented**

- FastAPI app (`main.py`): `POST /embed`, `POST /compare`, optional `GET /health`.
- Model loading (OpenCLIP/CLIP) at startup; readiness probe.
- Service-to-service Bearer auth middleware.
- Typed error responses matching `CvServiceErrorCode`.
- Top-K mean aggregation over an artifact's references.
- Config: `CV_SERVICE_SECRET`, configured model name/version, optional per-request model override.
- Deployment target: documented host (`CV_SERVICE_URL`) reachable from the Next.js backend (internal network / localhost in dev).

### 10.2 Next.js backend — **existing routes need completion**

- `POST /admin/artifacts/{id}/references`: replace the placeholder `embedding: [], embeddingDimension: 0` row with a real synchronous `cvClient.embed` call (currently a `TODO` in the handler).
- `src/lib/verification.ts`: wire `getCvClient().compare(...)` with the existing `threshold`/`topK` defaults, dimension filtering of `embeddingDimension: 0`, and the `CvServiceUnavailableError` → `503/504` path. (Currently GPS-only; CV call is the remaining integration.)
- `src/lib/cv.ts` already instantiates the typed client from `CV_SERVICE_URL` / `CV_SERVICE_SECRET` — once the service is reachable, no code change is needed there.
- The generated OpenAPI paths (`src/lib/openapi/paths/admin.ts`, `.../verification.ts`) already declare the reference and CV fields — the generated `openapi.json` should be regenerated after any schema change.

### 10.3 Docs

- This PRD (`docs/CV Service PRD.md`) — new.
- `sanskriti-snap-backend/README.md` — add CV service section: how to run the FastAPI server, how to seed reference embeddings, how to point the backend at it.
- `CLAUDE.md` / AGENTS.md — add a line that the CV service lane owns `cv-service/` and the contract is `cv-contract.ts`.

---

## 11. Open Questions

| # | Question | Impact | Recommendation |
| --- | --- | --- | --- |
| 1 | Which exact model (OpenCLIP variant, CLIP variant) and dimension? | Embedding size, comparison speed, matching quality. | Default to OpenCLIP `vit-base-patch32` (512-dim) for the hackathon; make it config-driven (`CV_SERVICE_MODEL`). |
| 2 | Will threshold/topK stay per-artifact or move to global config? | `cvConfiguration` on the artifact already exists; per-artifact is fine. | Keep per-artifact via `cvConfiguration`; defaults 0.72 / 3. |
| 3 | Should /embed accept a Cloudinary **public id** or only a signed URL? | Convenience for the admin flow (public ids are what the client has). | Accept both; resolve a public id to a CDN URL server-side. |
| 4 | Batch vs single embed calls during bulk ingestion of 30–50 refs? | Throughput. | Batched embed endpoint is a nice-to-have for the hackathon; sequential is acceptable at this scale. |
| 5 | Where does the service live at hackathon demo time? | `CV_SERVICE_URL` must point at something. | Run it locally next to the API (`http://127.0.0.1:8000` per `.env.example`) with a mock/stub implementation if GPU is unavailable. |
| 6 | Retention / auto-rejection of stale FLAGGED attempts (`API Contract.md` §13.2 #11)? | Prevents forever-accumulating FLAGGED rows. | 30-day window, then auto-`REJECTED` — a backend change, separate from the service. |

---

## 12. Acceptance Criteria (Definition of Done)

- [ ] `cv-service/` contains a runnable FastAPI app with `POST /embed`, `POST /compare`, and typed error codes matching `cv-contract.ts`.
- [ ] Every service call requires `Authorization: Bearer <CV_SERVICE_SECRET>`; unauthenticated requests return 401.
- [ ] `/embed` returns a vector whose length equals `embeddingDimension`, stamped with the generating model.
- [ ] `/compare` returns the **mean of the top-K** scores with `matchedReferenceIds`; it skips `embeddingDimension: 0` rows and returns `NO_REFERENCES` for an empty set.
- [ ] Model/dimension mismatches return typed errors, never low scores.
- [ ] End-to-end: `POST /api/v1/admin/artifacts/{id}/references` embeds a real vector via `/embed`; an artifact with references verifies to VERIFIED on a good match and FLAGGED on a bad match.
- [ ] End-to-end: a CV outage returns `503 CV_UNAVAILABLE` / `504 CV_TIMEOUT` and persists **nothing**.
- [ ] Reference vectors never appear in any client-facing response (admin DTOs return `imageUrl`/`model` only).
- [ ] `src/lib/verification.ts` calls the client with the `threshold`/`topK` defaults and propagates `CvServiceUnavailableError` correctly.
- [ ] Unit + integration tests cover: embed round-trip, compare above/below threshold, unavailable service, wrong reference set, dimension/model mismatch.
- [ ] README updated with CV service run/seed instructions.
