import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseQuery, readJsonBody } from "../http";
import { ApiError } from "../errors";

describe("readJsonBody", () => {
  it("returns the parsed body", async () => {
    const req = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    });
    await expect(readJsonBody(req)).resolves.toEqual({ a: 1 });
  });

  it("throws 422 ApiError on malformed JSON rather than a bare SyntaxError", async () => {
    const req = new Request("http://x", { method: "POST", body: "{not json" });
    const err = await readJsonBody(req).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).code).toBe("VALIDATION_FAILED");
  });

  it("throws 422 when there is no body at all", async () => {
    const req = new Request("http://x", { method: "POST" });
    const err = await readJsonBody(req).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
  });
});

describe("parseQuery", () => {
  const schema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().optional(),
  });

  it("returns parsed values and applies defaults", () => {
    expect(parseQuery(schema, {})).toEqual({ limit: 20 });
  });

  it("coerces string query params", () => {
    expect(parseQuery(schema, { limit: "5" })).toEqual({ limit: 5, q: undefined });
  });

  it("throws an ApiError (not a bare ZodError) so a GET gets 422 with fields", () => {
    let err: unknown;
    try {
      parseQuery(schema, { limit: "999" });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("VALIDATION_FAILED");
    expect((err as ApiError).message).toBe("Invalid query parameters.");
    expect((err as ApiError).details).toHaveProperty("fields.limit");
  });

  it("keeps the offending message text so the client can point at the field", () => {
    let err: ApiError | undefined;
    try {
      parseQuery(schema, { limit: "0" });
    } catch (e) {
      err = e as ApiError;
    }
    const fields = err?.details?.fields as Record<string, string> | undefined;
    expect(typeof fields?.limit).toBe("string");
    expect(fields!.limit).toMatch(/(less than or equal|Too small|>=1)/);
  });

  it("accepts undefined optional params", () => {
    expect(parseQuery(schema, { q: undefined })).toEqual({ limit: 20, q: undefined });
  });

  it("does not mutate the input params object", () => {
    const params = { limit: "7" };
    parseQuery(schema, params);
    expect(params).toEqual({ limit: "7" });
  });
});
