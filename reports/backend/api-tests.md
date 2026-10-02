# API Test Report — Sanskriti Snap Backend

**Date:** 2026-10-02  
**Base URL:** http://localhost:3000  
**Tested by:** Manual + automated curl suite  
**Auth:** Clerk JWT (USER role, `user_3K8nQ82yT0kuhPPeLgIuVHiA3Bs`)  
**DB:** MongoDB Atlas (connected, IP whitelisted)

---

## Summary

| Category | Total | ✅ Pass | ⚠️ Notable | ❌ Fail |
|---|---|---|---|---|
| Identity | 6 | 5 | 1 | 0 |
| Artifacts | 3 | 3 | 0 | 0 |
| Verification | 1 | 1 | 0 | 0 |
| Engagement | 5 | 5 | 0 | 0 |
| Rewards & Points | 4 | 4 | 0 | 0 |
| Auth gates | 4 | 4 | 0 | 0 |
| **Total** | **23** | **22** | **1** | **0** |

---

## Identity

| Endpoint | Method | Status | Latency | Result | Remarks |
|---|---|---|---|---|---|
| `/api/v1/me` | GET | 200 | 1225ms | ✅ | Returns full profile (id, role, XP, points, notifications). First call cold — DB connect. |
| `/api/v1/me` | PATCH | 200 | 219ms | ✅ | Partial update works; extra fields rejected 422. |
| `/api/v1/me/summary` | GET | 200 | 732ms | ✅ | Works. |
| `/api/v1/me/username` | PATCH | 200 | 541ms | ✅ | Username update accepted. |
| `/api/v1/usernames/availability` | GET | 200 | 159ms | ✅ | Requires auth (correct per contract). |
| `/api/v1/media/sign` | POST | 422 | 421ms | ⚠️ | `PROFILE_PHOTO` is not a valid purpose. Valid values: `VERIFICATION_SNAP`, `VERIFICATION_GALLERY`, `PROFILE_IMAGE`, `COMMUNITY_SNAP`, `CONTRIBUTION_PHOTO`. Fix: use `PROFILE_IMAGE`. |

---

## Artifacts

| Endpoint | Method | Status | Latency | Result | Remarks |
|---|---|---|---|---|---|
| `/api/v1/artifacts/nearby` | GET | 200 | 165ms | ✅ | Returns empty (no artifacts seeded yet). Geo query runs correctly. |
| `/api/v1/artifacts/featured` | GET | 200 | 96ms | ✅ | Public (no token needed). Empty — no published artifacts. |
| `/api/v1/artifacts/search` | GET | 200 | 156ms | ✅ | Requires auth. Empty results expected. |

---

## Verification

| Endpoint | Method | Status | Latency | Result | Remarks |
|---|---|---|---|---|---|
| `/api/v1/verification-attempts` | GET | 200 | 390ms | ✅ | Returns empty list. |

> `POST /verification-attempts` not tested — requires a published artifact + GPS coordinates + image. Needs seeded data.

---

## Engagement

| Endpoint | Method | Status | Latency | Result | Remarks |
|---|---|---|---|---|---|
| `/api/v1/collection` | GET | 200 | 356ms | ✅ | Empty collection for new user. |
| `/api/v1/discoveries` | GET | 200 | 416ms | ✅ | Empty. |
| `/api/v1/quests` | GET | 200 | 102ms | ✅ | Public (optional auth). Empty — no quests seeded. |
| `/api/v1/badges` | GET | 200 | 730ms | ✅ | Empty — no badges seeded. |
| `/api/v1/leaderboard` | GET | 200 | 155ms | ✅ | Public (optional auth). Empty. |

---

## Rewards & Points

| Endpoint | Method | Status | Latency | Result | Remarks |
|---|---|---|---|---|---|
| `/api/v1/rewards` | GET | 200 | 307ms | ✅ | Empty catalogue. Returns `pointsBalance: 0`. |
| `/api/v1/rewards/redemptions` | GET | 200 | 239ms | ✅ | Empty. |
| `/api/v1/points/ledger` | GET | 200 | 419ms | ✅ | Empty ledger for new user. |
| `/api/v1/notifications` | GET | 200 | 213ms | ✅ | Placeholder — returns empty items list as expected. |

---

## Auth Gates

| Scenario | Status | Result | Remarks |
|---|---|---|---|
| `GET /api/v1/me` — no token | 401 `UNAUTHENTICATED` | ✅ | Correctly blocked. |
| `GET /api/v1/verification-attempts` — no token | 401 `UNAUTHENTICATED` | ✅ | Correctly blocked. |
| `GET /api/v1/admin/artifacts` — USER role | 403 `FORBIDDEN` | ✅ | Role check enforced in handler. |
| `GET /api/v1/admin/users` — USER role | 403 `FORBIDDEN` | ✅ | Role check enforced in handler. |

---

## Not Tested (need seeded data or separate setup)

| Endpoint | Reason |
|---|---|
| `POST /api/v1/verification-attempts` | Needs a published artifact + real GPS + image upload |
| `GET /api/v1/artifacts/{id}` and sub-routes | No artifacts in DB |
| `GET /api/v1/discoveries/{id}/receipt` | No discoveries |
| `GET /api/v1/quests/{id}` | No quests seeded |
| `POST /api/v1/rewards/{id}/redeem` | No rewards seeded |
| All `/api/v1/admin/*` write routes | Needs ADMIN role user |

---

## Issues Found

| # | Severity | Endpoint | Issue |
|---|---|---|---|
| 1 | Low | `POST /api/v1/media/sign` | Test used wrong enum value (`PROFILE_PHOTO`). Correct value is `PROFILE_IMAGE`. Not a bug — validation working correctly. |

---

## Observations

- **Cold start latency** — first DB-hitting request takes ~1–1.2s (Atlas connect). Subsequent requests 100–750ms, typical for Atlas free tier.
- **Empty state is correct** — all list endpoints return `{ items: [], meta: { count: 0, ... } }` consistently. No nulls or crashes on empty collections.
- **Auth enforcement is solid** — 401 without token, 403 with wrong role, both on correct endpoints.
- **Error envelope is consistent** — every non-2xx response follows `{ error: { code, message, details? } }`.
- **Optional-auth endpoints** (`/featured`, `/quests`, `/leaderboard`) respond 200 without a token as intended.
