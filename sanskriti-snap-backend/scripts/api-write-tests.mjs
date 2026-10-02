/**
 * Single-pass API smoke test: admin write routes (seeding) + seeded reads.
 *
 * One run, one fresh Clerk JWT — the session token expires ~60s after issuance,
 * so every request must happen inside a single pass. Run it immediately after
 * grabbing a token from /dev/token.
 *
 *   node scripts/api-write-tests.mjs <clerk-jwt>
 *
 * Read-only against the DB except for what the admin routes themselves write.
 */

import crypto from "node:crypto";

process.loadEnvFile(".env");

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const TOKEN = process.argv[2] ?? process.env.TOKEN;
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const SECRET = process.env.CLOUDINARY_API_SECRET;

if (!TOKEN) {
  console.error("Usage: node scripts/api-write-tests.mjs <clerk-jwt>");
  process.exit(1);
}
if (!CLOUD || !SECRET) {
  console.error("Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_SECRET in .env");
  process.exit(1);
}

const RUN = Date.now().toString(36);
const results = [];

/* ------------------------------------------------------------------ http */

async function call(method, path, { body, headers = {}, auth = true } = {}) {
  const h = { ...headers };
  if (auth) h.Authorization = `Bearer ${TOKEN}`;
  if (body !== undefined) h["Content-Type"] = "application/json";

  const t0 = performance.now();
  let status = 0;
  let json = null;
  let text = "";
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    status = res.status;
    text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
  } catch (err) {
    status = -1;
    text = String(err?.message ?? err);
  }
  const ms = Math.round(performance.now() - t0);
  return { status, ms, json, text };
}

/**
 * Record one test. `expect` is the status code we consider correct; a numeric
 * array means any of them passes. `remark` explains a failure or a nuance.
 */
function record(group, name, method, path, r, expect, remark = "") {
  const exp = Array.isArray(expect) ? expect : [expect];
  const ok = exp.includes(r.status);
  results.push({
    group,
    name,
    method,
    path,
    status: r.status,
    ms: r.ms,
    ok,
    expect: exp.join("/"),
    remark:
      remark ||
      (ok
        ? ""
        : `expected ${exp.join("/")}, got ${r.status}${
            r.json?.error?.code ? ` (${r.json.error.code})` : ""
          }`),
    code: r.json?.error?.code ?? null,
  });
  const mark = ok ? "PASS" : "FAIL";
  console.log(
    `${mark}  ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)}ms  ${method.padEnd(6)} ${path}`,
  );
}

async function test(group, name, method, path, opts, expect, remark) {
  const r = await call(method, path, opts);
  record(group, name, method, path, r, expect, remark);
  return r;
}

const hex24 = () => crypto.randomBytes(12).toString("hex");
const isoNow = () => new Date().toISOString();

function mediaToken(userId) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(userId))
    .digest("hex")
    .slice(0, 16);
}

/** Forged but prefix-valid publicId — assertMediaOwnership only checks a prefix. */
function publicId(userId, folder, tag) {
  return `${CLOUD}/${folder}/${mediaToken(userId)}/${tag}-${RUN}`;
}

function loc(lat, lng) {
  return {
    latitude: lat,
    longitude: lng,
    accuracyMeters: 8,
    capturedAt: isoNow(),
  };
}

/* ------------------------------------------------------------------ main */

console.log(`\n=== Sanskriti Snap API smoke test — run ${RUN} ===\n`);

/* --- 0. identity ---------------------------------------------------------- */

const me = await test("Identity", "Current user", "GET", "/api/v1/me", {}, 200);
const ADMIN_ID = me.json?.id ?? me.json?.user?.id;
if (!ADMIN_ID) {
  console.error("\nCould not read admin id from /me — aborting. Token valid?");
  console.error(me.text?.slice(0, 400));
  process.exit(1);
}
console.log(`\n  admin id = ${ADMIN_ID}  role = ${me.json?.role}\n`);

await test("Auth gates", "No token", "GET", "/api/v1/me", { auth: false }, 401);

/* --- 1. admin writes: seed ------------------------------------------------ */

const LAT = 27.6727;
const LNG = 85.3194;

const temple = await test(
  "Admin · artifacts",
  "Create temple (PUBLISHED)",
  "POST",
  "/api/v1/admin/artifacts",
  {
    body: {
      name: `Test Temple ${RUN}`,
      slug: `test-temple-${RUN}`,
      description: "Seeded by the API smoke-test suite.",
      category: "TEMPLE",
      rarity: "Rare",
      tags: ["test", "temple"],
      latitude: LAT,
      longitude: LNG,
      humanReadableLocation: "Patan, Lalitpur",
      story: "A seeded story for the test artifact.",
      storyUnlockRadiusMeters: 50,
      verificationRadiusMeters: 50,
      xpReward: 100,
      requiresSnap: false,
      requiresCV: false,
      status: "PUBLISHED",
    },
  },
  201,
);
const TEMPLE_ID = temple.json?.id;

const site = await test(
  "Admin · artifacts",
  "Create site (PUBLISHED)",
  "POST",
  "/api/v1/admin/artifacts",
  {
    body: {
      name: `Test Site ${RUN}`,
      slug: `test-site-${RUN}`,
      description: "Second seeded artifact for quest coverage.",
      category: "SITE",
      latitude: LAT + 0.0016,
      longitude: LNG + 0.0055,
      humanReadableLocation: "Patan Durbar Square",
      storyUnlockRadiusMeters: 100,
      verificationRadiusMeters: 100,
      xpReward: 150,
      requiresSnap: false,
      requiresCV: false,
      status: "PUBLISHED",
    },
  },
  201,
);
const SITE_ID = site.json?.id;

await test(
  "Admin · artifacts",
  "Create — extra field rejected (.strict)",
  "POST",
  "/api/v1/admin/artifacts",
  {
    body: {
      name: "Bad",
      slug: `bad-${RUN}`,
      description: "x",
      category: "TEMPLE",
      latitude: LAT,
      longitude: LNG,
      humanReadableLocation: "x",
      storyUnlockRadiusMeters: 50,
      verificationRadiusMeters: 50,
      xpReward: 1,
      requiresSnap: false,
      requiresCV: false,
      discoveryCount: 99,
    },
  },
  422,
  "server-owned discoveryCount must be rejected, not stripped",
);

if (TEMPLE_ID) {
  await test(
    "Admin · artifacts",
    "Patch artifact",
    "PATCH",
    `/api/v1/admin/artifacts/${TEMPLE_ID}`,
    { body: { xpReward: 120, warnings: "Seeded warning." } },
    200,
  );
}

/* references + embeddings (forged but prefix-valid publicIds) */

const refPid = publicId(ADMIN_ID, "snaps/verification", "ref");
let refId = null;
if (TEMPLE_ID) {
  const ref = await test(
    "Admin · references",
    "Add reference image",
    "POST",
    `/api/v1/admin/artifacts/${TEMPLE_ID}/references`,
    { body: { imagePublicId: refPid, isCover: true } },
    201,
  );
  refId = ref.json?.id;

  await test(
    "Admin · references",
    "Add reference — foreign publicId rejected",
    "POST",
    `/api/v1/admin/artifacts/${TEMPLE_ID}/references`,
    { body: { imagePublicId: `${CLOUD}/snaps/verification/deadbeefdeadbeef/evil-${RUN}` } },
    422,
    "assertMediaOwnership must reject a token not derived from this user",
  );

  await test(
    "Admin · references",
    "Attach embedding",
    "POST",
    `/api/v1/admin/artifacts/${TEMPLE_ID}/references/embeddings`,
    {
      body: {
        imagePublicId: refPid,
        embedding: [0.11, 0.22, 0.33, 0.44],
        embeddingDimension: 4,
        model: { name: "smoke-test", version: "1.0" },
        isCover: true,
      },
    },
    201,
  );

  await test(
    "Admin · references",
    "Attach embedding — dim mismatch rejected",
    "POST",
    `/api/v1/admin/artifacts/${TEMPLE_ID}/references/embeddings`,
    {
      body: {
        imagePublicId: refPid,
        embedding: [0.1, 0.2],
        embeddingDimension: 4,
        model: { name: "smoke-test", version: "1.0" },
      },
    },
    422,
    "embedding.length must equal embeddingDimension",
  );

  await test(
    "Admin · references",
    "Attach embedding — unknown reference 404",
    "POST",
    `/api/v1/admin/artifacts/${TEMPLE_ID}/references/embeddings`,
    {
      body: {
        imagePublicId: publicId(ADMIN_ID, "snaps/verification", "nope"),
        embedding: [0.1, 0.2, 0.3, 0.4],
        embeddingDimension: 4,
        model: { name: "smoke-test", version: "1.0" },
      },
    },
    404,
    "embedding needs an existing reference row first",
  );
}

/* quests */

let questId = null;
if (TEMPLE_ID && SITE_ID) {
  const q = await test(
    "Admin · quests",
    "Create quest",
    "POST",
    "/api/v1/admin/quests",
    {
      body: {
        name: `Test Quest ${RUN}`,
        description: "Visit both seeded artifacts.",
        artifactIds: [TEMPLE_ID, SITE_ID],
        xpReward: 200,
      },
    },
    201,
  );
  questId = q.json?.id;

  await test(
    "Admin · quests",
    "Create quest — unknown artifact rejected",
    "POST",
    "/api/v1/admin/quests",
    {
      body: {
        name: `Bad Quest ${RUN}`,
        description: "x",
        artifactIds: [hex24()],
        xpReward: 1,
      },
    },
    422,
    "artifactIds must resolve to real artifacts",
  );

  if (questId) {
    await test(
      "Admin · quests",
      "Patch quest",
      "PATCH",
      `/api/v1/admin/quests/${questId}`,
      { body: { xpReward: 250 } },
      200,
    );
    await test(
      "Admin · quests",
      "Patch quest — empty patch rejected",
      "PATCH",
      `/api/v1/admin/quests/${questId}`,
      { body: {} },
      422,
      "an empty patch must not write a no-op adminActions row",
    );
  }
}

/* badges */

let badgeId = null;
{
  const b = await test(
    "Admin · badges",
    "Create badge",
    "POST",
    "/api/v1/admin/badges",
    {
      body: {
        name: `First Steps ${RUN}`,
        description: "Earned on your first discovery.",
        condition: { type: "FIRST_DISCOVERY" },
      },
    },
    201,
  );
  badgeId = b.json?.id;

  if (badgeId) {
    await test(
      "Admin · badges",
      "Patch badge",
      "PATCH",
      `/api/v1/admin/badges/${badgeId}`,
      { body: { description: "Updated by the smoke test." } },
      200,
    );
    await test(
      "Admin · badges",
      "Patch badge — empty patch rejected",
      "PATCH",
      `/api/v1/admin/badges/${badgeId}`,
      { body: {} },
      422,
    );
  }

  await test(
    "Admin · badges",
    "Create badge — dangling questId rejected",
    "POST",
    "/api/v1/admin/badges",
    {
      body: {
        name: `Dangling ${RUN}`,
        description: "x",
        condition: { type: "QUEST_COMPLETION", questId: hex24() },
      },
    },
    422,
    "condition.questId must resolve when present",
  );
}

/* xp adjustment */

await test(
  "Admin · xp",
  "Adjust own XP (+5)",
  "POST",
  "/api/v1/admin/xp-adjustments",
  { body: { userId: ADMIN_ID, amount: 5, reason: "Smoke test adjustment." } },
  201,
);

await test(
  "Admin · xp",
  "Adjust XP — zero amount rejected",
  "POST",
  "/api/v1/admin/xp-adjustments",
  { body: { userId: ADMIN_ID, amount: 0, reason: "x" } },
  422,
);

/* admin guardrails on ids that do not exist / are self */

await test(
  "Admin · users",
  "Suspend self — 403",
  "POST",
  `/api/v1/admin/users/${ADMIN_ID}/suspend`,
  { body: { reason: "should not work" } },
  403,
  "an admin must not be able to suspend themselves",
);

await test(
  "Admin · users",
  "Suspend unknown user — 404",
  "POST",
  `/api/v1/admin/users/${hex24()}/suspend`,
  { body: { reason: "nobody" } },
  404,
);

await test(
  "Admin · community",
  "Hide unknown snap — 404",
  "POST",
  `/api/v1/admin/community/${hex24()}/hide`,
  { body: { reason: "nobody" } },
  404,
);

await test(
  "Admin · community",
  "Hide snap — missing reason rejected",
  "POST",
  `/api/v1/admin/community/${hex24()}/hide`,
  { body: {} },
  422,
);

await test(
  "Admin · verification",
  "Approve unknown attempt — 404",
  "POST",
  `/api/v1/admin/verification/${hex24()}/approve`,
  { body: {} },
  404,
);

await test(
  "Admin · verification",
  "Reject unknown attempt — 404",
  "POST",
  `/api/v1/admin/verification/${hex24()}/reject`,
  { body: { reason: "nobody" } },
  404,
);

await test(
  "Admin · verification",
  "Reject — missing reason rejected",
  "POST",
  `/api/v1/admin/verification/${hex24()}/reject`,
  { body: {} },
  422,
);

await test(
  "Admin · contributions",
  "Approve — no target rejected",
  "POST",
  `/api/v1/admin/contributions/${hex24()}/approve`,
  { body: {} },
  422,
  "needs exactly one of artifactId / artifact",
);

await test(
  "Admin · contributions",
  "Reject unknown — 404",
  "POST",
  `/api/v1/admin/contributions/${hex24()}/reject`,
  { body: { reason: "nobody" } },
  404,
);

/* admin lists */

await test("Admin · lists", "List users", "GET", "/api/v1/admin/users", {}, 200);
await test("Admin · lists", "List artifacts", "GET", "/api/v1/admin/artifacts", {}, 200);
await test("Admin · lists", "List verification queue", "GET", "/api/v1/admin/verification", {}, 200);
await test("Admin · lists", "List community queue", "GET", "/api/v1/admin/community", {}, 200);
await test("Admin · lists", "List contributions", "GET", "/api/v1/admin/contributions", {}, 200);

/* --- 2. seeded reads ------------------------------------------------------ */

if (TEMPLE_ID) {
  await test("Artifacts", "Detail", "GET", `/api/v1/artifacts/${TEMPLE_ID}`, {}, 200);
  await test(
    "Artifacts",
    "Detail with coords (+distanceMeters)",
    "GET",
    `/api/v1/artifacts/${TEMPLE_ID}?latitude=${LAT}&longitude=${LNG}`,
    {},
    200,
  );
  await test(
    "Artifacts",
    "Distance",
    "GET",
    `/api/v1/artifacts/${TEMPLE_ID}/distance?latitude=${LAT}&longitude=${LNG}`,
    {},
    200,
  );
  await test(
    "Artifacts",
    "Navigation",
    "GET",
    `/api/v1/artifacts/${TEMPLE_ID}/navigation`,
    {},
    200,
  );
  await test("Artifacts", "Snaps", "GET", `/api/v1/artifacts/${TEMPLE_ID}/snaps`, {}, 200);

  await test(
    "Artifacts",
    "Unlock story (in radius)",
    "POST",
    `/api/v1/artifacts/${TEMPLE_ID}/unlock-story`,
    { body: { location: loc(LAT, LNG) } },
    200,
  );

  await test(
    "Artifacts",
    "Unlock story — stale timestamp rejected",
    "POST",
    `/api/v1/artifacts/${TEMPLE_ID}/unlock-story`,
    {
      body: {
        location: {
          ...loc(LAT, LNG),
          capturedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      },
    },
    422,
    "GeoLocation freshness window",
  );

  await test("Artifacts", "Detail — unknown id 404", "GET", `/api/v1/artifacts/${hex24()}`, {}, 404);
}

await test(
  "Artifacts",
  "Nearby",
  "GET",
  `/api/v1/artifacts/nearby?latitude=${LAT}&longitude=${LNG}&radiusMeters=5000`,
  {},
  200,
);

await test(
  "Artifacts",
  "Nearby — radius over cap rejected",
  "GET",
  `/api/v1/artifacts/nearby?latitude=${LAT}&longitude=${LNG}&radiusMeters=2147483647`,
  {},
  422,
  "the old client's full-scan radius must not survive",
);

await test(
  "Artifacts",
  "Geofence regions",
  "GET",
  `/api/v1/artifacts/nearby/geofence-regions?latitude=${LAT}&longitude=${LNG}`,
  {},
  200,
);

await test("Artifacts", "Featured", "GET", "/api/v1/artifacts/featured", { auth: false }, 200);

await test(
  "Artifacts",
  "",
  "GET",
  "/api/v1/artifacts/search?q=test",
  {},
  200,
);

/* quests + badges (seeded) */

await test("Engagement", "Quest list", "GET", "/api/v1/quests", { auth: false }, 200);
if (questId) {
  await test("Engagement", "Quest detail", "GET", `/api/v1/quests/${questId}`, {}, 200);
}
await test("Engagement", "Badge list", "GET", "/api/v1/badges", {}, 200);
await test("Engagement", "Leaderboard", "GET", "/api/v1/leaderboard", { auth: false }, 200);

/* verification attempt — the one write that produces a discovery */

let discoveryId = null;
if (TEMPLE_ID) {
  const attempt = await test(
    "Verification",
    "Submit attempt (GPS-only, in radius)",
    "POST",
    "/api/v1/verification-attempts",
    {
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: { artifactId: TEMPLE_ID, location: loc(LAT, LNG), privateNote: "smoke test" },
    },
    [201, 409],
    "409 ALREADY_DISCOVERED if this artifact was already collected by this user",
  );
  discoveryId = attempt.json?.discoveryId ?? null;

  await test(
    "Verification",
    "Submit — missing Idempotency-Key rejected",
    "POST",
    "/api/v1/verification-attempts",
    { body: { artifactId: TEMPLE_ID, location: loc(LAT, LNG) } },
    422,
    "the header is required on this route",
  );

  await test(
    "Verification",
    "Submit — outside radius rejected",
    "POST",
    "/api/v1/verification-attempts",
    {
      headers: { "Idempotency-Key": crypto.randomUUID() },
      body: { artifactId: TEMPLE_ID, location: loc(LAT + 1, LNG + 1) },
    },
    422,
    "GPS_OUTSIDE_RADIUS, nothing persisted",
  );
}

await test("Verification", "Attempt list", "GET", "/api/v1/verification-attempts", {}, 200);

if (discoveryId) {
  await test(
    "Verification",
    "Attempt list — idempotent replay returns same discovery",
    "GET",
    "/api/v1/verification-attempts",
    {},
    200,
  );
}

/* discoveries + receipt */

await test("Engagement", "Discovery list", "GET", "/api/v1/discoveries", {}, 200);
if (discoveryId) {
  await test(
    "Engagement",
    "Discovery receipt",
    "GET",
    `/api/v1/discoveries/${discoveryId}/receipt`,
    {},
    200,
  );
}
await test(
  "Engagement",
  "Discovery receipt — unknown id 404",
  "GET",
  `/api/v1/discoveries/${hex24()}/receipt`,
  {},
  404,
);
await test("Engagement", "Collection", "GET", "/api/v1/collection", {}, 200);

/* me + rewards + points */

await test("Identity", "Summary", "GET", "/api/v1/me/summary", {}, 200);
await test(
  "Identity",
  "Patch preferences",
  "PATCH",
  "/api/v1/me/preferences",
  { body: { radiusMeters: 1500 } },
  200,
);
await test(
  "Identity",
  "Preferences — empty patch rejected",
  "PATCH",
  "/api/v1/me/preferences",
  { body: {} },
  422,
);

await test(
  "Identity",
  "Username availability",
  "GET",
  `/api/v1/usernames/availability?username=testuser123`,
  {},
  200,
);

await test("Rewards", "Catalogue", "GET", "/api/v1/rewards", {}, 200);
await test("Rewards", "Redemptions", "GET", "/api/v1/rewards/redemptions", {}, 200);
await test(
  "Rewards",
  "Redeem unknown reward — 404",
  "POST",
  `/api/v1/rewards/${hex24()}/redeem`,
  {},
  404,
  "no rewards exist yet; §8 is a teammate's lane",
);
await test("Rewards", "Points ledger", "GET", "/api/v1/points/ledger", {}, 200);
await test("Rewards", "Notifications", "GET", "/api/v1/notifications", {}, 200);

/* --- 3. role gates -------------------------------------------------------- */

await test(
  "Auth gates",
  "Admin route without token",
  "GET",
  "/api/v1/admin/artifacts",
  { auth: false },
  401,
);

/* ------------------------------------------------------------------ report */

const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;

console.log(`\n=== ${pass}/${results.length} passed, ${fail} failed ===\n`);

const byGroup = new Map();
for (const r of results) {
  if (!byGroup.has(r.group)) byGroup.set(r.group, []);
  byGroup.get(r.group).push(r);
}

let md =
  "| Group | Endpoint | Method | Status | Latency | Result | Remarks |\n" +
  "|---|---|---|---|---|---|---|\n";
for (const [group, rows] of byGroup) {
  for (const r of rows) {
    const mark = r.ok ? "✅" : "❌";
    md += `| ${group} | \`${r.path}\` | ${r.method} | ${r.status} | ${r.ms}ms | ${mark} | ${r.remark || "—"} |\n`;
  }
}

console.log(md);

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.log("\n--- failures ---");
  for (const f of failed) {
    console.log(`${f.method} ${f.path} → ${f.status} (expected ${f.expect})`);
  }
}
