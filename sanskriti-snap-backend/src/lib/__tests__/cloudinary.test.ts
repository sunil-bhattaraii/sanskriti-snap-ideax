import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { describe, expect, it, vi } from "vitest";

import { assertMediaOwnership, signUpload, imageUrl } from "../cloudinary";
import { env } from "../env";

describe("env", () => {
  it("exposes the required server variables", () => {
    const e = env();
    expect(e.MONGODB_URI).toBeTruthy();
    expect(e.CLOUDINARY_CLOUD_NAME).toBeTruthy();
    expect(e.CLOUDINARY_API_KEY).toBeTruthy();
    expect(e.CLOUDINARY_API_SECRET).toBeTruthy();
  });

  it("never requires a NEXT_PUBLIC_ prefixed secret", () => {
    const e = env() as unknown as Record<string, unknown>;
    expect(Object.keys(e).some((k) => k.startsWith("NEXT_PUBLIC_"))).toBe(false);
    expect(Object.keys(e)).toEqual([
      "MONGODB_URI",
      "CLERK_SECRET_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "CV_SERVICE_URL",
      "CV_SERVICE_SECRET",
    ]);
  });

  it("caches the parsed object rather than re-validating per call", () => {
    expect(env()).toBe(env());
  });

  it("reports CV unconfigured until BOTH url and secret are set", async () => {
    const hadUrl = "CV_SERVICE_URL" in process.env;
    const hadSecret = "CV_SERVICE_SECRET" in process.env;
    const url = process.env.CV_SERVICE_URL;
    const secret = process.env.CV_SERVICE_SECRET;

    try {
      delete process.env.CV_SERVICE_URL;
      delete process.env.CV_SERVICE_SECRET;
      vi.resetModules();
      expect((await import("../env")).isCvConfigured()).toBe(false);

      process.env.CV_SERVICE_URL = "http://cv.local";
      vi.resetModules();
      expect((await import("../env")).isCvConfigured()).toBe(false);

      process.env.CV_SERVICE_SECRET = "s3cret";
      vi.resetModules();
      expect((await import("../env")).isCvConfigured()).toBe(true);

      // A present-but-empty URL is a boot failure, not a soft "disabled".
      process.env.CV_SERVICE_URL = "";
      vi.resetModules();
      const fresh = await import("../env");
      expect(() => fresh.env()).toThrow(/Invalid server environment configuration/);
      expect(() => fresh.isCvConfigured()).toThrow();
    } finally {
      if (hadUrl) process.env.CV_SERVICE_URL = url;
      else delete process.env.CV_SERVICE_URL;
      if (hadSecret) process.env.CV_SERVICE_SECRET = secret;
      else delete process.env.CV_SERVICE_SECRET;
      vi.resetModules();
    }
  });
});

describe("imageUrl", () => {
  it("builds an unsigned, always-displayable CDN url", () => {
    expect(imageUrl("snaps/verification/abc/img1")).toBe(
      "https://res.cloudinary.com/sanskriti-snap-test/image/upload/snaps/verification/abc/img1",
    );
  });

  it("carries no signature or expiry so a cached row never goes stale", () => {
    expect(imageUrl("a/b")).not.toMatch(/(sig|exp|timestamp)=/);
  });
});

describe("signUpload", () => {
  const userId = new Types.ObjectId();

  it("returns the exact keys Cloudinary echoes back", () => {
    const res = signUpload("PROFILE_IMAGE", userId);
    expect(res).toEqual({
      cloudName: expect.any(String),
      apiKey: expect.any(String),
      timestamp: expect.any(Number),
      signature: expect.any(String),
      folder: expect.any(String),
      resourceType: "image",
    });
    expect(res.resourceType).toBe("image");
  });

  it("places the asset inside a fixed purpose folder the client cannot choose", () => {
    expect(signUpload("PROFILE_IMAGE", userId).folder).toContain("/users/profile/");
    expect(signUpload("VERIFICATION_SNAP", userId).folder).toContain("/snaps/verification/");
    expect(signUpload("VERIFICATION_GALLERY", userId).folder).toContain("/snaps/verification/");
    expect(signUpload("COMMUNITY_SNAP", userId).folder).toContain("/community/");
    expect(signUpload("CONTRIBUTION_PHOTO", userId).folder).toContain("/contributions/");
  });

  it("binds the folder to a per-user HMAC token so a publicId is user-scoped", () => {
    const other = new Types.ObjectId();
    expect(signUpload("PROFILE_IMAGE", userId).folder).not.toBe(
      signUpload("PROFILE_IMAGE", other).folder,
    );
  });

  it("gives the same user and purpose a stable folder across calls", () => {
    const a = signUpload("PROFILE_IMAGE", userId);
    const b = signUpload("PROFILE_IMAGE", userId);
    expect(a.folder).toBe(b.folder);
    // The signature covers `timestamp`, so it is only stable within the same
    // second — signing is deliberately not a deterministic function of the folder.
    expect(a.signature).toMatch(/^[0-9a-f]{40}$/);
  });

  it("produces a 40-char hex sha1 signature", () => {
    expect(signUpload("PROFILE_IMAGE", userId).signature).toMatch(/^[0-9a-f]{40}$/);
  });

  it("embeds the folder in the signature, so rewriting the path invalidates it", () => {
    const signed = signUpload("PROFILE_IMAGE", userId);
    // The signature is a hash of `folder=...&timestamp=...SECRET`. Recompute it
    // independently to prove the response matches the documented scheme.
    const expected = createHash("sha1")
      .update(
        `folder=${signed.folder}&timestamp=${signed.timestamp}${env().CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");
    expect(signed.signature).toBe(expected);
  });
});

describe("assertMediaOwnership", () => {
  const userId = new Types.ObjectId();
  const otherUserId = new Types.ObjectId();

  it("accepts a publicId the caller signed", () => {
    const { folder } = signUpload("PROFILE_IMAGE", userId);
    expect(assertMediaOwnership(`${folder}/img123.jpg`, "PROFILE_IMAGE", userId)).toBe(true);
  });

  it("rejects the same publicId presented by a different user", () => {
    const { folder } = signUpload("PROFILE_IMAGE", userId);
    expect(assertMediaOwnership(`${folder}/img123.jpg`, "PROFILE_IMAGE", otherUserId)).toBe(false);
  });

  it("rejects a publicId signed for a different purpose", () => {
    const { folder } = signUpload("COMMUNITY_SNAP", userId);
    expect(assertMediaOwnership(`${folder}/img.jpg`, "PROFILE_IMAGE", userId)).toBe(false);
  });

  it("rejects an arbitrary publicId outside the signed folder", () => {
    expect(assertMediaOwnership("snaps/verification/whatever/x.jpg", "VERIFICATION_SNAP", userId)).toBe(
      false,
    );
  });

  it("rejects a prefix that merely starts with the folder without the boundary slash", () => {
    const { folder } = signUpload("PROFILE_IMAGE", userId);
    // `${folder}evil/...` must not pass: the check requires `${folder}/`.
    expect(assertMediaOwnership(`${folder}evil/x.jpg`, "PROFILE_IMAGE", userId)).toBe(false);
  });

  it("rejects an empty publicId", () => {
    expect(assertMediaOwnership("", "PROFILE_IMAGE", userId)).toBe(false);
  });
});
