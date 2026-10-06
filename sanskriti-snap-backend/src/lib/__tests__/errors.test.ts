import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError, ErrorCode, errorResponse, toErrorResponse } from "../errors";

describe("ErrorCode", () => {
  it("maps every code to an HTTP status", () => {
    expect(Object.keys(ErrorCode).length).toBeGreaterThan(10);
    for (const status of Object.values(ErrorCode)) {
      expect(typeof status).toBe("number");
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(600);
    }
  });

  it("uses 409 for every conflict-shaped code", () => {
    expect(ErrorCode.ALREADY_DISCOVERED).toBe(409);
    expect(ErrorCode.USERNAME_TAKEN).toBe(409);
    expect(ErrorCode.ARTIFACT_UNAVAILABLE).toBe(409);
    expect(ErrorCode.REWARD_ALREADY_REDEEMED).toBe(409);
    expect(ErrorCode.INVALID_STATE_TRANSITION).toBe(409);
  });

  it("gives ACCOUNT_SUSPENDED the same status as FORBIDDEN", () => {
    expect(ErrorCode.ACCOUNT_SUSPENDED).toBe(ErrorCode.FORBIDDEN);
  });
});

describe("ApiError", () => {
  it("derives status from the code", () => {
    const err = new ApiError("GPS_OUTSIDE_RADIUS", "too far", { distanceMeters: 40 });
    expect(err.status).toBe(422);
    expect(err.code).toBe("GPS_OUTSIDE_RADIUS");
    expect(err.details).toEqual({ distanceMeters: 40 });
    expect(err.name).toBe("ApiError");
  });

  it("carries details as an optional property", () => {
    expect(new ApiError("NOT_FOUND", "gone").details).toBeUndefined();
  });

  it("provides helpers with contract-correct defaults", () => {
    expect(ApiError.unauthenticated().status).toBe(401);
    expect(ApiError.forbidden().status).toBe(403);
    expect(ApiError.notFound().status).toBe(404);
    expect(ApiError.validation("bad").status).toBe(422);
    expect(ApiError.unauthenticated().message).toBe("Sign in to continue.");
  });

  it("notVisible() answers 404 rather than 403 so ids cannot be probed", () => {
    const err = ApiError.notVisible();
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Not found.");
  });

  it("is instanceof Error so `catch` still works", () => {
    expect(new ApiError("INTERNAL_ERROR", "x")).toBeInstanceOf(Error);
  });
});

describe("errorResponse", () => {
  it("sets the status from the error code table", () => {
    expect(errorResponse("VALIDATION_FAILED", "bad").status).toBe(422);
    expect(errorResponse("CV_TIMEOUT", "slow").status).toBe(504);
    expect(errorResponse("CV_UNAVAILABLE", "down").status).toBe(503);
  });

  it("omits details entirely when none is given", async () => {
    const res = errorResponse("NOT_FOUND", "gone");
    const body = await res.json();
    expect(body).toEqual({ error: { code: "NOT_FOUND", message: "gone" } });
    expect("details" in body.error).toBe(false);
  });

  it("includes details when given", async () => {
    const res = errorResponse("GPS_OUTSIDE_RADIUS", "far", { distanceMeters: 40 });
    const body = await res.json();
    expect(body.error.details).toEqual({ distanceMeters: 40 });
  });
});

describe("toErrorResponse", () => {
  it("passes an ApiError through with its own code and status", async () => {
    const res = toErrorResponse(new ApiError("ALREADY_DISCOVERED", "dup", { discoveryId: "d1" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_DISCOVERED");
    expect(body.error.details).toEqual({ discoveryId: "d1" });
  });

  it("turns a ZodError into 422 with per-field messages", async () => {
    const schema = z.object({ name: z.string().min(3), age: z.number().int() });
    const parsed = schema.safeParse({ name: "a", age: "nope" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const res = toErrorResponse(parsed.error);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details.fields.name).toHaveLength(1);
    expect(body.error.details.fields.age).toHaveLength(1);
  });

  it("keys a pathless Zod issue under _root", async () => {
    const schema = z.string().refine(() => false, { message: "nope" });
    const parsed = schema.safeParse("x");
    if (parsed.success) throw new Error("expected failure");

    const body = await toErrorResponse(parsed.error).json();
    expect(body.error.details.fields._root).toEqual(["nope"]);
  });

  it("groups multiple issues on one field into one array", async () => {
    const schema = z.object({
      n: z
        .number()
        .refine((n) => n % 2 === 0, { message: "must be even" })
        .refine((n) => n % 3 === 0, { message: "must be divisible by 3" }),
    });
    const parsed = schema.safeParse({ n: 5 });
    if (parsed.success) throw new Error("expected failure");

    const body = await toErrorResponse(parsed.error).json();
    expect(body.error.details.fields.n).toHaveLength(2);
    expect(body.error.details.fields.n).toEqual(["must be even", "must be divisible by 3"]);
  });

  it("maps a duplicate username key to USERNAME_TAKEN 409", async () => {
    const res = toErrorResponse({ code: 11000, keyPattern: { username: 1 } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("USERNAME_TAKEN");
  });

  it("maps a duplicate rewardId key to REWARD_ALREADY_REDEEMED 409", async () => {
    const res = toErrorResponse({ code: 11000, keyPattern: { rewardId: 1 } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("REWARD_ALREADY_REDEEMED");
  });

  it("maps any other duplicate key to INVALID_STATE_TRANSITION 409", async () => {
    const res = toErrorResponse({ code: 11000, keyPattern: { slug: 1 } });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_STATE_TRANSITION");
  });

  it("never leaks a stack trace for an unexpected error", async () => {
    const body = await toErrorResponse(new Error("boom\n    at secret.ts:1")).json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Something went wrong. Please try again.");
    expect(JSON.stringify(body)).not.toContain("secret.ts");
    expect(JSON.stringify(body)).not.toContain("boom");
  });

  it("handles null and primitive inputs without throwing", async () => {
    for (const input of [null, undefined, 42, "str", true]) {
      const body = await toErrorResponse(input).json();
      expect(body.error.code).toBe("INTERNAL_ERROR");
    }
  });

  it("treats an object with a non-11000 code as internal", async () => {
    const body = await toErrorResponse({ code: 12345 }).json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
