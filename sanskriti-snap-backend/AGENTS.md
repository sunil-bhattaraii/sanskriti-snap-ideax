# AGENTS.md — Sanskriti Snap Backend

Next.js REST API for Sanskriti Snap, a gamified cultural-heritage discovery app
for Patan/Lalitpur. Users discover lesser-known heritage artifacts, travel to
them, unlock their stories by proximity, photograph them, verify the visit, and
collect them for XP, quests, and badges.

## Source of truth

Docs live in `../docs/`. Read them before designing anything; do not invent a
parallel spec. Precedence when two disagree:

1. `DB Schemas.md` — canonical persistent-data model
2. `API Contract.md` — HTTP surface, DTOs, error codes, authz matrix
3. `Backend TDS.md` — architecture and flows
4. `Project Requirements Doc.md` — product behaviour

`API Contract.md` §1 records every place the first three disagree and how it was
resolved. If you find a new disagreement, fix it in the docs rather than picking
one silently in code.

Two source documents already supersede parts of themselves — read the markers:

- `Backend TDS.md` §38 (background CV queue) is **superseded** by synchronous CV.
- `Artifact.status` is `DRAFT | PUBLISHED | ARCHIVED | DISABLED`, not `ACTIVE`.

## Stack

Next.js 16 (App Router) · TypeScript · MongoDB via Mongoose 9 · Clerk 7 ·
Cloudinary · Zod 4. A separate FastAPI service handles CV.

```
npm run dev         # dev server
npm run build       # production build
npm run lint        # eslint
npx tsc --noEmit    # typecheck — no npm script exists for this
```

Tests run under **Vitest** (`npm test`); suites live in `src/lib/__tests__/` and mock Mongo/Cloudinary-coupled modules. The gates are
`tsc --noEmit`, `npm run lint`, and `npm test` — run all three before calling
work done.

**Test-driven development is the workflow.** For any new or changed behaviour
(validation boundaries, DTO mapping, pure helpers, error codes), write a
failing test first, then implement until it passes. A behaviour with no test is
not done.

## Next.js 16 — do not assume

- Middleware is now **`src/proxy.ts`**, not `middleware.ts`. It exports
  `clerkMiddleware()`.
- Read `node_modules/next/dist/docs/` before using an unfamiliar API. The
  bundled guides are the authority, not your training data.

## Non-negotiable rules

These are the invariants the whole contract exists to protect. Breaking one is
a security or correctness bug, not a style choice.

**Identity comes only from the token.** Never accept a user id in a body, query,
or path for a resource the caller does not own. Use `requireAuthContext()`.
Ownership is checked server-side; a non-owner gets `404`, not `403`, so the
route cannot be used to probe which ids exist.

**Authorization is enforced in the handler.** `src/proxy.ts` is for optimistic
checks only. Hiding UI in the mobile app is not security. `EXPERT` may review
contributions and nothing else — not verification, artifacts, users, or XP.

**The client sends evidence; the backend decides.** `status`,
`similarityScore`, `xpAwarded`, `discoveryId`, `gpsVerification.*` are
server-owned. Request schemas are `.strict()`, so these are rejected with `422`
rather than stripped — stripping would hide client bugs and make a cheating
client look like it works.

**Verification is synchronous.** One request, one verdict. Only `VERIFIED`,
`FLAGGED`, `REJECTED` are ever persisted; there is no `PENDING` and no polling
endpoint. If the CV service fails, the request returns `503`/`504` and **nothing
is written** — the client retries with the same `Idempotency-Key`. A technical
failure must never be recorded as a user rejection.

**Handler order in `POST /api/v1/verification-attempts` is load-bearing:**

```
1. validate + resolve identity + artifact   → 422 / 404
2. GPS distance                            → 422, nothing persisted
3. duplicate-discovery check                → 409 with existing discoveryId
4. CV compare                              → 503, nothing persisted
5. ONE transaction: attempt, discovery, XP, points, quests, badges
```

The duplicate check precedes the CV call so a resubmission costs no GPU time.
The attempt row is written *inside* step 5, *after* the CV verdict — that is
what makes an outage total rather than partial.

**Attempts are immutable.** `recheck` inserts a new attempt with
`supersedesAttemptId`; it never edits the one in the path. The only permitted
mutation of an existing attempt is `FLAGGED → VERIFIED | REJECTED` by an admin.

**`story` is conditionally absent, not null.** When `storyUnlocked` is false the
property must be missing from the JSON entirely. `ArtifactDetail` is a
discriminated union so the type system enforces this.

**Story unlock is proximity, not discovery.** Independent in both directions: a
`FLAGGED` attempt keeps the unlock it earned by walking there, and collecting is
never required to read. `storyUnlocks` is written by the backend only.

**GeoJSON is `[longitude, latitude]`.** The reverse of the intuitive order, and
a frequent source of silent bugs. Convert to flat `latitude`/`longitude` at the
API boundary so the stored order never reaches a client.

**`$geoNear` must be the first pipeline stage**, with `status: "PUBLISHED"`
matched after it. Radius is capped server-side at 50 km — the current client
passes `2147483647` to force a full scan, and that must not survive.

**XP and points are different currencies.** XP is never spent and never
decreases except by explicit admin adjustment. Points are spendable. Every
points change appends to `pointsTransactions` with a running `balanceAfter`;
`users.pointsBalance` is a **cache** that must always equal the ledger sum, and
is written in the same transaction. `pointsTransactions` is append-only.

**Never return raw MongoDB documents.** Map to DTOs. `_id` becomes `id`;
`clerkUserId`, `embedding`, `createdBy`, `updatedBy`, `cvConfiguration`, and other
users' `accountStatus` never appear in a response. `clerkUserId` and `embedding`
are additionally `select: false` as defence in depth.

**Transactions need a replica set.** Atlas SRV qualifies; a standalone local
`mongod` does not and will throw at the first `withTransaction()` write.

**Every write in a transaction needs the `session`.** One un-annotated
operation escapes the transaction and survives its abort — XP granted against a
discovery that rolled back. Pass `{ session }` to every op; the discovery
transaction touches seven collections and needs all seven.

**Never swallow an error inside a `withTransaction` callback.** If the callback
catches a failed write and returns normally, the driver cannot tell the
transaction was aborted, so it retries **indefinitely** — the request hangs
rather than returning 500. This also means the callback may run more than once,
so it must be idempotent and Mongo-only: no Cloudinary upload, no `fetch`, no
in-memory counter. Do external work before opening the transaction. Do not
`Promise.all` inside it; the driver documents that as undefined behaviour.

## Layout

```
src/
  lib/
    contracts.ts     enums, strict zod request schemas, DTO types, haversine
    cv-contract.ts   /embed + /compare schemas, typed client, 8s x 3 timeout
    auth.ts          requireAuthContext, requireRole, requireAdmin, requireReviewer
    db.ts            connection singleton, withTransaction
    errors.ts        ApiError, error code -> status table
    env.ts           validated once at boot
  models/            one module per collection domain
  app/api/v1/        route handlers
  proxy.ts           clerkMiddleware (Next 16 "proxy", not "middleware")
```

## Conventions

- Route handlers: `export async function GET/POST/PATCH(...)`, return
  `NextResponse.json(...)`, wrap the body in `try/catch` and pass errors to
  `toErrorResponse(err)`. Never leak a stack trace.
- Every `POST` that creates stateful state accepts `Idempotency-Key`.
- Validate every request body and query with the zod schema in `contracts.ts`
  before touching the database. Add new schemas there, not inline in the route.
- New enum members require a decision in `API Contract.md` §13 — the client
  switches on them.
- Prefer one focused module over a large file, but do not add an abstraction
  layer for something used once.
- No comments that restate the code. Comment the *why*, especially where the
  docs mandate behaviour that would otherwise look like a bug.

## Handoff artifacts

Two files are contracts with other teams. Changing them is a breaking change for
the mobile and CV lanes:

- `src/lib/contracts.ts` — the mobile lane derives its request and response
  types from here. Do not hand-write a second copy.
- `src/lib/cv-contract.ts` — the FastAPI lane implements `/embed` and
  `/compare` against these schemas. Authority split: FastAPI computes
  embeddings, per-reference similarity, and top-K aggregation; Next.js applies
  the threshold and owns the verdict.

## Current scope

Built for the MVP demo loop: identity, artifacts, proximity/story unlock,
verification, collection, XP, quests, badges, leaderboard, points and rewards,
admin artifact management and XP adjustment.

Deliberately absent — do not build unprompted:

- Reports, moderation, contributions.
- `businesses` collection — `businessName` is inlined on the reward.
- Rate limiting, caching, notification delivery, offline sync, external
  navigation handoff, semantic search, duplicate-image or anti-spoof detection.
- A job queue or Redis. The docs explicitly reject both for this scale.
- `ARCHIVED` / `DISABLED` transitions. The enum exists; only `DRAFT` and
  `PUBLISHED` are wired.

CV is integrated and synchronous: `/compare` runs inside the verification-attempt
transaction, and community snaps (GET/POST `/api/v1/artifacts/[id]/snaps`) are
live — the mobile community bar reads them. Keep the admin review routes thin
rather than deleting them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
