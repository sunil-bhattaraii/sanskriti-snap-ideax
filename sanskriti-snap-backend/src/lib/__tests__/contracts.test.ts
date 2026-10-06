import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ArtifactCategory,
  ArtifactStatus,
  CreateArtifactRequest,
  CreateReferenceRequest,
  CreateVerificationAttemptRequest,
  distanceMeters,
  GeoLocation,
  MediaPurpose,
  MediaSignRequest,
  NearbyQuery,
  NEARBY_MAX_RADIUS_METERS,
  Rarity,
  Role,
  SearchQuery,
  UsernameRequest,
  VerificationStatus,
} from "../contracts";

/** A fresh, valid position captured right now. */
function freshLocation(overrides: Partial<z.infer<typeof GeoLocation>> = {}) {
  return {
    latitude: 27.671,
    longitude: 85.325,
    accuracyMeters: 12,
    capturedAt: new Date().toISOString(),
    ...overrides,
  };
}

const VALID_ARTIFACT_ID = "65b7c9d4e4b0a1b2c3d4e5f6";

describe("enums", () => {
  it("has exactly nine artifact categories", () => {
    expect(ArtifactCategory.options).toHaveLength(9);
  });

  it("rejects an ACTIVE artifact status — the enum was superseded", () => {
    expect(ArtifactStatus.safeParse("ACTIVE").success).toBe(false);
    for (const s of ["DRAFT", "PUBLISHED", "ARCHIVED", "DISABLED"]) {
      expect(ArtifactStatus.safeParse(s).success).toBe(true);
    }
  });

  it("keeps Rarity in TitleCase because the client renders it verbatim", () => {
    expect(Rarity.options).toEqual(["Common", "Rare", "Epic", "Legendary"]);
    expect(Rarity.safeParse("rare").success).toBe(false);
  });

  it("persists only three verification statuses — no PENDING", () => {
    expect(VerificationStatus.options).toEqual(["VERIFIED", "FLAGGED", "REJECTED"]);
    expect(VerificationStatus.safeParse("PENDING").success).toBe(false);
  });

  it("uses PROFILE_IMAGE, not PROFILE_PHOTO", () => {
    expect(MediaPurpose.safeParse("PROFILE_IMAGE").success).toBe(true);
    expect(MediaPurpose.safeParse("PROFILE_PHOTO").success).toBe(false);
  });

  it("does not accept a client-invented or intermediate verification verdict", () => {
    for (const bad of ["PENDING", "PASS", "PASSED", "", "REVIEW"]) {
      expect(VerificationStatus.safeParse(bad).success).toBe(false);
    }
  });

  it("keeps EXPERT in the role enum (authorization is enforced elsewhere)", () => {
    expect(Role.options).toEqual(["USER", "EXPERT", "ADMIN"]);
  });
});

describe("GeoLocation", () => {
  it("accepts a fresh, accurate fix", () => {
    expect(GeoLocation.safeParse(freshLocation()).success).toBe(true);
  });

  it("rejects a fix with worse than 100 m accuracy", () => {
    const r = GeoLocation.safeParse(freshLocation({ accuracyMeters: 101 }));
    expect(r.success).toBe(false);
  });

  it("rejects a zero or negative accuracy", () => {
    expect(GeoLocation.safeParse(freshLocation({ accuracyMeters: 0 })).success).toBe(false);
    expect(GeoLocation.safeParse(freshLocation({ accuracyMeters: -5 })).success).toBe(false);
  });

  it("rejects a fix older than 10 minutes (replayed position)", () => {
    const stale = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    const r = GeoLocation.safeParse(freshLocation({ capturedAt: stale }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toContain("too old");
    }
  });

  it("accepts a fix exactly inside the 10 minute window", () => {
    const at = new Date(Date.now() - 9 * 60 * 1000).toISOString();
    expect(GeoLocation.safeParse(freshLocation({ capturedAt: at })).success).toBe(true);
  });

  it("rejects a timestamp more than 60s in the future", () => {
    const future = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const r = GeoLocation.safeParse(freshLocation({ capturedAt: future }));
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain("future");
  });

  it("rejects out-of-range coordinates", () => {
    expect(GeoLocation.safeParse(freshLocation({ latitude: 91 })).success).toBe(false);
    expect(GeoLocation.safeParse(freshLocation({ longitude: 181 })).success).toBe(false);
  });

  it("is strict — an unknown key is rejected rather than dropped", () => {
    const r = GeoLocation.safeParse({ ...freshLocation(), spoofed: true });
    expect(r.success).toBe(false);
  });

  it("requires capturedAt", () => {
    const withoutCapture = { ...freshLocation() } as Record<string, unknown>;
    delete withoutCapture.capturedAt;
    expect(GeoLocation.safeParse(withoutCapture).success).toBe(false);
  });
});

describe("CreateVerificationAttemptRequest (client sends evidence only)", () => {
  const base = {
    artifactId: VALID_ARTIFACT_ID,
    location: freshLocation(),
  };

  it("accepts a bare evidence body", () => {
    expect(CreateVerificationAttemptRequest.safeParse(base).success).toBe(true);
  });

  it.each([
    "status",
    "similarityScore",
    "xpAwarded",
    "discoveryId",
    "userId",
    "pointsAwarded",
    "newlyUnlockedStory",
  ])("rejects server-owned field %s with 422 rather than stripping it", (field) => {
    const r = CreateVerificationAttemptRequest.safeParse({
      ...base,
      [field]: field === "status" ? "VERIFIED" : 1,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.code === "unrecognized_keys")).toBe(true);
    }
  });

  it("rejects a nested spoof on gpsVerification", () => {
    const r = CreateVerificationAttemptRequest.safeParse({
      ...base,
      gpsVerification: { status: "PASSED", distanceMeters: 0 },
    });
    expect(r.success).toBe(false);
  });

  it("requires an artifact id shaped like an ObjectId", () => {
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, artifactId: "abc" }).success,
    ).toBe(false);
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, artifactId: "" }).success,
    ).toBe(false);
  });

  it("accepts an upper-case hex ObjectId", () => {
    expect(
      CreateVerificationAttemptRequest.safeParse({
        ...base,
        artifactId: "65B7C9D4E4B0A1B2C3D4E5F6",
      }).success,
    ).toBe(true);
  });

  it("caps additionalPhotos at six", () => {
    const mk = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ publicId: `p${i}` }));
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, additionalPhotos: mk(6) })
        .success,
    ).toBe(true);
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, additionalPhotos: mk(7) })
        .success,
    ).toBe(false);
  });

  it("rejects an additional photo object with an unknown key", () => {
    const r = CreateVerificationAttemptRequest.safeParse({
      ...base,
      additionalPhotos: [{ publicId: "p1", status: "VERIFIED" }],
    });
    expect(r.success).toBe(false);
  });

  it("caps privateNote at 500 characters", () => {
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, privateNote: "x".repeat(500) })
        .success,
    ).toBe(true);
    expect(
      CreateVerificationAttemptRequest.safeParse({ ...base, privateNote: "x".repeat(501) })
        .success,
    ).toBe(false);
  });
});

describe("MediaSignRequest", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (contentType) => {
    expect(
      MediaSignRequest.safeParse({ purpose: "VERIFICATION_SNAP", contentType }).success,
    ).toBe(true);
  });

  it("rejects content types outside the allowlist", () => {
    for (const contentType of ["image/gif", "image/svg+xml", "application/pdf", "text/html"]) {
      expect(
        MediaSignRequest.safeParse({ purpose: "VERIFICATION_SNAP", contentType }).success,
      ).toBe(false);
    }
  });

  it("rejects an unknown purpose", () => {
    expect(
      MediaSignRequest.safeParse({ purpose: "PROFILE_PHOTO", contentType: "image/jpeg" })
        .success,
    ).toBe(false);
  });

  it("is strict — the client cannot choose a folder or path", () => {
    const r = MediaSignRequest.safeParse({
      purpose: "PROFILE_IMAGE",
      contentType: "image/jpeg",
      folder: "admin/secrets",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].code).toBe("unrecognized_keys");
  });
});

describe("UsernameRequest", () => {
  it("accepts letters, numbers and underscores only", () => {
    expect(UsernameRequest.safeParse({ username: "ram_bharat123" }).success).toBe(true);
  });

  it("rejects spaces, hyphens and unicode", () => {
    for (const username of ["a b", "a-b", "râm", "@handle", "a.b"]) {
      expect(UsernameRequest.safeParse({ username }).success).toBe(false);
    }
  });

  it("enforces the 3..30 length window", () => {
    expect(UsernameRequest.safeParse({ username: "ab" }).success).toBe(false);
    expect(UsernameRequest.safeParse({ username: "abc" }).success).toBe(true);
    expect(UsernameRequest.safeParse({ username: "x".repeat(30) }).success).toBe(true);
    expect(UsernameRequest.safeParse({ username: "x".repeat(31) }).success).toBe(false);
  });

  it("is strict against unknown keys", () => {
    expect(UsernameRequest.safeParse({ username: "abc", userId: "x" }).success).toBe(false);
  });
});

describe("CreateArtifactRequest", () => {
  const base = {
    name: "Golden Temple",
    description: "A temple",
    category: "TEMPLE",
    latitude: 27.67,
    longitude: 85.32,
    humanReadableLocation: "Patan",
    storyUnlockRadiusMeters: 150,
    verificationRadiusMeters: 150,
    xpReward: 100,
    requiresSnap: true,
    requiresCV: false,
  };

  it("accepts a minimal valid artifact", () => {
    expect(CreateArtifactRequest.safeParse(base).success).toBe(true);
  });

  it("defaults nothing that the uploader must decide", () => {
    const r = CreateArtifactRequest.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rarity).toBeUndefined();
  });

  it("caps both radii at 5000 m and requires them to be integers", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, storyUnlockRadiusMeters: 5001 }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, storyUnlockRadiusMeters: 10.5 }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, storyUnlockRadiusMeters: 0 }).success).toBe(false);
  });

  it("caps xpReward at 100000 and forbids negatives", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, xpReward: 100_001 }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, xpReward: -1 }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, xpReward: 0 }).success).toBe(true);
  });

  it("accepts only DRAFT or PUBLISHED on create — ARCHIVED/DISABLED are not wired", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, status: "DRAFT" }).success).toBe(true);
    expect(CreateArtifactRequest.safeParse({ ...base, status: "PUBLISHED" }).success).toBe(true);
    expect(CreateArtifactRequest.safeParse({ ...base, status: "ARCHIVED" }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, status: "DISABLED" }).success).toBe(false);
  });

  it("enforces the lowercase-digits-hyphens slug rule", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, slug: "golden-temple" }).success).toBe(true);
    expect(CreateArtifactRequest.safeParse({ ...base, slug: "Golden Temple" }).success).toBe(false);
  });

  it("rejects an empty name and an over-long description", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, description: "x".repeat(2001) }).success).toBe(false);
  });

  it("caps tags at 20 entries of <=40 chars each", () => {
    expect(
      CreateArtifactRequest.safeParse({ ...base, tags: Array.from({ length: 21 }, () => "t") }).success,
    ).toBe(false);
    expect(CreateArtifactRequest.safeParse({ ...base, tags: ["x".repeat(41)] }).success).toBe(false);
  });

  it("is strict against unknown keys", () => {
    expect(CreateArtifactRequest.safeParse({ ...base, discoveryCount: 99 }).success).toBe(false);
  });
});

describe("CreateReferenceRequest", () => {
  it("accepts a bare public id", () => {
    expect(CreateReferenceRequest.safeParse({ imagePublicId: "ref/1" }).success).toBe(true);
  });

  it("refuses a model unless generateEmbedding is true", () => {
    const model = { name: "openai/clip-vit-base-patch32", version: "1" };
    expect(CreateReferenceRequest.safeParse({ imagePublicId: "r", model }).success).toBe(false);
    expect(
      CreateReferenceRequest.safeParse({ imagePublicId: "r", model, generateEmbedding: true })
        .success,
    ).toBe(true);
    expect(
      CreateReferenceRequest.safeParse({ imagePublicId: "r", model, generateEmbedding: false })
        .success,
    ).toBe(false);
  });
});

describe("NearbyQuery (server-side radius cap)", () => {
  it("defaults radius to 5000 and limit to 100", () => {
    const r = NearbyQuery.safeParse({ latitude: "27.6", longitude: "85.3" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.radiusMeters).toBe(5000);
      expect(r.data.limit).toBe(100);
    }
  });

  it("clamps the client's 2147483647 full-scan trick to a 422", () => {
    const r = NearbyQuery.safeParse({
      latitude: "27.6",
      longitude: "85.3",
      radiusMeters: "2147483647",
    });
    expect(r.success).toBe(false);
  });

  it("accepts exactly the 50 km cap and rejects one metre more", () => {
    expect(
      NearbyQuery.safeParse({ latitude: "1", longitude: "1", radiusMeters: String(NEARBY_MAX_RADIUS_METERS) })
        .success,
    ).toBe(true);
    expect(
      NearbyQuery.safeParse({
        latitude: "1",
        longitude: "1",
        radiusMeters: String(NEARBY_MAX_RADIUS_METERS + 1),
      }).success,
    ).toBe(false);
  });

  it("is strict — no extra query keys", () => {
    expect(NearbyQuery.safeParse({ latitude: "1", longitude: "1", fields: "*" }).success).toBe(false);
  });
});

describe("SearchQuery", () => {
  it("caps limit at the contract's SEARCH_MAX_LIMIT of 25", () => {
    expect(SearchQuery.safeParse({ q: "temple", limit: "25" }).success).toBe(true);
    expect(SearchQuery.safeParse({ q: "temple", limit: "26" }).success).toBe(false);
  });

  it("requires a non-empty search term", () => {
    expect(SearchQuery.safeParse({ q: "" }).success).toBe(false);
    expect(SearchQuery.safeParse({ q: "x".repeat(121) }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(SearchQuery.safeParse({ q: "a", category: "STATUE" }).success).toBe(true);
    expect(SearchQuery.safeParse({ q: "a", category: "PALACE" }).success).toBe(false);
  });
});

describe("distanceMeters (haversine)", () => {
  it("returns 0 for identical points", () => {
    const p = { latitude: 27.671017, longitude: 85.325 };
    expect(distanceMeters(p, p)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { latitude: 27.671, longitude: 85.325 };
    const b = { latitude: 27.680, longitude: 85.340 };
    expect(distanceMeters(a, b)).toBeCloseTo(distanceMeters(b, a), 6);
  });

  it("matches a known one-degree-of-latitude distance (~111.2 km)", () => {
    const d = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it("puts Patan Durbar Square within 2 km of Krishna Mandir", () => {
    const durbar = { latitude: 27.6726, longitude: 85.3253 };
    const krishna = { latitude: 27.6767, longitude: 85.3256 };
    const d = distanceMeters(durbar, krishna);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(2_000);
  });

  it("handles antipodal points without NaN", () => {
    const d = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(20_000_000);
  });

  it("handles crossing the antimeridian", () => {
    const d = distanceMeters({ latitude: 0, longitude: 179.9 }, { latitude: 0, longitude: -179.9 });
    expect(d).toBeLessThan(30_000);
  });

  it("scales monotonically with latitude separation", () => {
    const near = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0.01, longitude: 0 });
    const far = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0.02, longitude: 0 });
    expect(far).toBeCloseTo(near * 2, 4);
  });
});
