import { describe, expect, it } from "vitest";

import {
  toAdminContribution,
  toAdminVerificationAttempt,
  toUserProfile,
  toVerificationAttempt,
  type AdminVerificationAttemptSource,
  type ArtifactSummaryPickSource,
  type VerificationAttemptSource,
} from "../dto";

const USER_ID = "65b7c9d4e4b0a1b2c3d4e5f0";
const ARTIFACT_ID = "65b7c9d4e4b0a1b2c3d4e5f1";
const ATTEMPT_ID = "65b7c9d4e4b0a1b2c3d4e5f2";

const artifact: ArtifactSummaryPickSource = {
  _id: ARTIFACT_ID,
  name: "Golden Temple",
  coverImageUrl: "https://cdn/x.jpg",
  humanReadableLocation: "Patan",
  xpReward: 100,
  verificationRadiusMeters: 150,
};

function attempt(overrides: Partial<VerificationAttemptSource> = {}): VerificationAttemptSource {
  return {
    _id: ATTEMPT_ID,
    artifactId: ARTIFACT_ID,
    status: "VERIFIED",
    submittedAt: new Date("2026-01-01T00:00:00.000Z"),
    verificationImage: { publicId: "snaps/verification/abc/img1" },
    locationEvidence: {
      latitude: 27.67,
      longitude: 85.32,
      capturedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    gpsVerification: { status: "PASSED", distanceMeters: 12 },
    cvVerification: {
      status: "PASSED",
      similarityScore: 0.91,
      threshold: 0.78,
      topK: 3,
      processedAt: new Date("2026-01-01T00:00:01.000Z"),
    },
    discoveryId: "65b7c9d4e4b0a1b2c3d4e5f3",
    ...overrides,
  };
}

describe("toVerificationAttempt", () => {
  it("renames _id to id and never exposes _id", () => {
    const dto = toVerificationAttempt(attempt(), artifact);
    expect(dto.id).toBe(ATTEMPT_ID);
    expect(dto).not.toHaveProperty("_id");
    expect(JSON.stringify(dto)).not.toContain("_id");
  });

  it("never leaks clerkUserId, embedding, createdBy or updatedBy", () => {
    const polluted = {
      ...attempt(),
      clerkUserId: "user_abc",
      embedding: [0.1, 0.2],
      createdBy: "admin1",
      updatedBy: "admin2",
    } as VerificationAttemptSource;
    const json = JSON.stringify(toVerificationAttempt(polluted, artifact));
    expect(json).not.toContain("clerkUserId");
    expect(json).not.toContain("user_abc");
    expect(json).not.toContain("embedding");
    expect(json).not.toContain("createdBy");
    expect(json).not.toContain("updatedBy");
  });

  it("derives a displayable Cloudinary URL from the publicId", () => {
    const dto = toVerificationAttempt(attempt(), artifact);
    expect(dto.verificationImageUrl).toBe(
      "https://res.cloudinary.com/sanskriti-snap-test/image/upload/snaps/verification/abc/img1",
    );
  });

  it("falls back to an explicit url when there is no publicId", () => {
    const dto = toVerificationAttempt(
      attempt({ verificationImage: { url: "https://cdn/other.jpg" } }),
      artifact,
    );
    expect(dto.verificationImageUrl).toBe("https://cdn/other.jpg");
  });

  it("returns null when no image was submitted", () => {
    const dto = toVerificationAttempt(attempt({ verificationImage: null }), artifact);
    expect(dto.verificationImageUrl).toBeNull();
  });

  it("defaults requiredMeters to 150 when the artifact does not declare one", () => {
    const dto = toVerificationAttempt(attempt(), { ...artifact, verificationRadiusMeters: undefined });
    expect(dto.gps.requiredMeters).toBe(150);
  });

  it("reports cv.required false for NOT_REQUIRED", () => {
    const dto = toVerificationAttempt(attempt({ cvVerification: { status: "NOT_REQUIRED" } }), artifact);
    expect(dto.cv).not.toBeNull();
    expect(dto.cv!.required).toBe(false);
    expect(dto.cv!.similarityScore).toBeNull();
    expect(dto.cv!.processedAt).toBeNull();
  });

  it("reports cv.required true for PASSED and FAILED", () => {
    for (const status of ["PASSED", "FAILED"] as const) {
      const dto = toVerificationAttempt(attempt({ cvVerification: { status } }), artifact);
      expect(dto.cv!.required).toBe(true);
    }
  });

  it("returns cv null when the attempt has no CV block at all", () => {
    const dto = toVerificationAttempt(attempt({ cvVerification: null }), artifact);
    expect(dto.cv).toBeNull();
  });

  it("stringifies ObjectId-like ids rather than serialising the object", () => {
    const oidLike = { toString: () => ATTEMPT_ID } as unknown as unknown;
    const dto = toVerificationAttempt(attempt({ _id: oidLike }), { ...artifact, _id: oidLike });
    expect(dto.id).toBe(ATTEMPT_ID);
    expect(typeof dto.id).toBe("string");
    expect(dto.artifact.id).toBe(ATTEMPT_ID);
  });

  it("maps a missing discoveryId to null rather than omitting the key", () => {
    const dto = toVerificationAttempt(attempt({ discoveryId: null }), artifact);
    expect("discoveryId" in dto).toBe(true);
    expect(dto.discoveryId).toBeNull();
  });

  it("defaults a missing rejectionReason to null", () => {
    const dto = toVerificationAttempt(attempt({ rejectionReason: undefined }), artifact);
    expect(dto.rejectionReason).toBeNull();
  });

  it("emits ISO-8601 strings for every timestamp", () => {
    const dto = toVerificationAttempt(attempt(), artifact);
    expect(dto.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dto.gps.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dto.cv!.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("toUserProfile", () => {
  const source = {
    _id: USER_ID,
    username: "ram",
    displayName: "Ram",
    profileImage: { url: "https://cdn/p.jpg" },
    role: "USER",
    accountStatus: "ACTIVE",
    lifetimeXp: 500,
    pointsBalance: 120,
    notifications: { enabled: true, radiusMeters: 250 },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  it("maps the happy path", () => {
    const dto = toUserProfile(source);
    expect(dto.id).toBe(USER_ID);
    expect(dto.profileImageUrl).toBe("https://cdn/p.jpg");
    expect(dto.notifications).toEqual({ enabled: true, radiusMeters: 250 });
  });

  it("never exposes clerkUserId", () => {
    const json = JSON.stringify(toUserProfile({ ...source, clerkUserId: "user_abc" } as never));
    expect(json).not.toContain("clerkUserId");
    expect(json).not.toContain("user_abc");
  });

  it("defaults notifications to disabled at 1000 m when absent", () => {
    const dto = toUserProfile({ ...source, notifications: null });
    expect(dto.notifications).toEqual({ enabled: false, radiusMeters: 1000 });
  });

  it("partially fills a notifications object with missing sub-fields", () => {
    const dto = toUserProfile({ ...source, notifications: { enabled: true } });
    expect(dto.notifications).toEqual({ enabled: true, radiusMeters: 1000 });
  });

  it("nulls a missing profile image", () => {
    expect(toUserProfile({ ...source, profileImage: null }).profileImageUrl).toBeNull();
    expect(toUserProfile({ ...source, profileImage: {} }).profileImageUrl).toBeNull();
  });

  it("falls back to the epoch so createdAt stays non-nullable", () => {
    expect(toUserProfile({ ...source, createdAt: null }).createdAt).toBe(
      new Date(0).toISOString(),
    );
  });

  it("round-trips a Date createdAt", () => {
    expect(toUserProfile(source).createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("survives a missing createdAt", () => {
    const withoutCreatedAt = { ...source } as Record<string, unknown>;
    delete withoutCreatedAt.createdAt;
    expect(toUserProfile(withoutCreatedAt as typeof source).createdAt).toBe(
      new Date(0).toISOString(),
    );
  });
});

describe("toAdminContribution", () => {
  const contribution = {
    _id: "65b7c9d4e4b0a1b2c3d4e5f4",
    name: "New Gate",
    description: "A gate",
    category: "MONUMENT",
    tags: ["gate"],
    location: { coordinates: [85.3253, 27.6726] },
    humanReadableLocation: "Patan",
    culturalSignificance: "Significant",
    photos: [
      { url: "https://cdn/1.jpg", publicId: "contributions/1" },
      { url: "https://cdn/2.jpg", publicId: "contributions/2" },
    ],
    status: "SUBMITTED",
    submittedBy: USER_ID,
    officialArtifactId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const user = { _id: USER_ID, username: "ram", displayName: "Ram" };

  it("reverses GeoJSON [longitude, latitude] into flat lat/lng", () => {
    const dto = toAdminContribution(contribution, user);
    expect(dto.longitude).toBe(85.3253);
    expect(dto.latitude).toBe(27.6726);
    // The stored order must never be presented as latitude.
    expect(dto.latitude).not.toBe(85.3253);
  });

  it("exposes photo URLs only, never the Cloudinary publicId", () => {
    const dto = toAdminContribution(contribution, user);
    expect(dto.photos).toEqual(["https://cdn/1.jpg", "https://cdn/2.jpg"]);
    expect(JSON.stringify(dto)).not.toContain("publicId");
    expect(JSON.stringify(dto)).not.toContain("contributions/1");
  });

  it("defaults missing tags and photos to empty arrays", () => {
    const dto = toAdminContribution(
      { ...contribution, tags: null, photos: null },
      user,
    );
    expect(dto.tags).toEqual([]);
    expect(dto.photos).toEqual([]);
  });

  it("nulls an absent humanReadableLocation and review", () => {
    const dto = toAdminContribution({ ...contribution, humanReadableLocation: null }, user);
    expect(dto.humanReadableLocation).toBeNull();
    expect(dto.review).toBeNull();
  });

  it("stringifies officialArtifactId", () => {
    const dto = toAdminContribution({ ...contribution, officialArtifactId: ARTIFACT_ID }, user);
    expect(dto.officialArtifactId).toBe(ARTIFACT_ID);
  });

  it("maps a missing officialArtifactId to null", () => {
    expect(toAdminContribution(contribution, user).officialArtifactId).toBeNull();
  });

  it("emits ISO timestamps and nested submitter ids", () => {
    const dto = toAdminContribution(contribution, user);
    expect(dto.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(dto.submittedBy).toEqual({ id: USER_ID, username: "ram", displayName: "Ram" });
  });

  it("formats a present review", () => {
    const dto = toAdminContribution(
      {
        ...contribution,
        review: {
          reviewedBy: "65b7c9d4e4b0a1b2c3d4e5f5",
          reviewedAt: new Date("2026-02-01T00:00:00.000Z"),
          note: "ok",
        },
      },
      user,
    );
    expect(dto.review).toEqual({
      reviewedBy: "65b7c9d4e4b0a1b2c3d4e5f5",
      reviewedAt: "2026-02-01T00:00:00.000Z",
      note: "ok",
    });
  });
});

describe("toAdminVerificationAttempt", () => {
  const user = { _id: USER_ID, username: "ram", displayName: "Ram" };

  const adminSource: AdminVerificationAttemptSource = {
    ...attempt({ status: "FLAGGED" }),
    flagReason: "low similarity",
    cvVerification: {
      status: "FAILED",
      similarityScore: 0.41,
      threshold: 0.78,
      topK: 3,
      processedAt: new Date("2026-01-01T00:00:01.000Z"),
      model: { name: "openai/clip-vit-base-patch32", version: "1" },
      matchedReferenceIds: [{ toString: () => "ref-a" }, "ref-b"],
    },
  };

  it("adds user, model and matchedReferenceIds on top of the public DTO", () => {
    const dto = toAdminVerificationAttempt(adminSource, artifact, user);
    expect(dto.user).toEqual({ id: USER_ID, username: "ram", displayName: "Ram" });
    expect(dto.cv!.model).toEqual({ name: "openai/clip-vit-base-patch32", version: "1" });
    expect(dto.cv!.matchedReferenceIds).toEqual(["ref-a", "ref-b"]);
    expect(dto.flagReason).toBe("low similarity");
  });

  it("defaults flagReason to null and drops model/matchedReferenceIds with the CV block", () => {
    const dto = toAdminVerificationAttempt(
      attempt({ status: "FLAGGED", cvVerification: null }),
      artifact,
      user,
    );
    expect(dto.flagReason).toBeNull();
    expect(dto.cv).toBeNull();
  });

  it("maps an empty matchedReferenceIds array when the field is null", () => {
    const source: AdminVerificationAttemptSource = {
      ...attempt(),
      cvVerification: {
        status: "PASSED",
        similarityScore: 0.9,
        threshold: 0.78,
        topK: 3,
        processedAt: new Date(),
        matchedReferenceIds: null,
        model: null,
      },
    };
    const dto = toAdminVerificationAttempt(source, artifact, user);
    expect(dto.cv!.matchedReferenceIds).toEqual([]);
    expect(dto.cv!.model).toBeNull();
  });

  it("nulls an absent review and formats a present one", () => {
    expect(toAdminVerificationAttempt(attempt(), artifact, user).review).toBeNull();

    const dto = toAdminVerificationAttempt(
      {
        ...attempt(),
        review: {
          reviewedBy: "65b7c9d4e4b0a1b2c3d4e5f5",
          reviewedAt: new Date("2026-03-01T00:00:00.000Z"),
          decision: "APPROVED",
          note: null,
        },
      },
      artifact,
      user,
    );
    expect(dto.review).toEqual({
      reviewedBy: "65b7c9d4e4b0a1b2c3d4e5f5",
      reviewedAt: "2026-03-01T00:00:00.000Z",
      decision: "APPROVED",
      note: null,
    });
  });

  it("keeps every public DTO field intact", () => {
    const dto = toAdminVerificationAttempt(adminSource, artifact, user);
    expect(dto.id).toBe(ATTEMPT_ID);
    expect(dto.status).toBe("FLAGGED");
    expect(dto.gps.distanceMeters).toBe(12);
    expect(dto.artifact.xpReward).toBe(100);
  });
});
