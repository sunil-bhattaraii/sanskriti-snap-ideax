import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  CompareRequest,
  CompareResponse,
  createCvClient,
  CvServiceUnavailableError,
  CV_DEFAULT_TOP_K,
  CV_MAX_ATTEMPTS,
  EmbedRequest,
  EmbedResponse,
  CvServiceError,
} from "../cv-contract";

const VALID_ID = "65b7c9d4e4b0a1b2c3d4e5f6";
const MODEL = { name: "openai/clip-vit-base-patch32", version: "1" };

/**
 * The exported `CompareRequest` type is the *output* type, so `topK` (which the
 * schema defaults) is required on the way in. This is the value the client
 * sends when it has no preference of its own.
 */
const compareReq = { image: "img", artifactId: VALID_ID, topK: CV_DEFAULT_TOP_K };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("CompareRequest", () => {
  it("requires exactly one of artifactId or references", () => {
    expect(CompareRequest.safeParse({ image: "img" }).success).toBe(false);
    expect(
      CompareRequest.safeParse({ image: "img", artifactId: VALID_ID, references: [] }).success,
    ).toBe(false);
    expect(CompareRequest.safeParse({ image: "img", artifactId: VALID_ID }).success).toBe(true);
  });

  it("rejects a partial reference set (silently comparing a subset)", () => {
    const r = CompareRequest.safeParse({
      image: "img",
      artifactId: VALID_ID,
      references: [{ referenceId: "r1", embedding: [0.1], embeddingDimension: 1 }],
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toContain("exactly one");
  });

  it("defaults topK to 3", () => {
    const r = CompareRequest.parse({ image: "img", artifactId: VALID_ID });
    expect(r.topK).toBe(CV_DEFAULT_TOP_K);
    expect(r.topK).toBe(3);
  });

  it("rejects a topK below 1", () => {
    expect(
      CompareRequest.safeParse({ image: "img", artifactId: VALID_ID, topK: 0 }).success,
    ).toBe(false);
  });

  it("requires every explicit reference to carry a dimension", () => {
    const r = CompareRequest.safeParse({
      image: "img",
      references: [{ referenceId: "r1", embedding: [0.1, 0.2] }],
    });
    expect(r.success).toBe(false);
  });

  it("is strict — no extra keys on the request", () => {
    const r = CompareRequest.safeParse({ image: "img", artifactId: VALID_ID, topK: 3, secret: "x" });
    expect(r.success).toBe(false);
  });
});

describe("CompareResponse", () => {
  const base = {
    similarityScore: 0.87,
    topK: 3,
    matchedReferenceIds: ["a", "b"],
    referenceCount: 5,
    model: MODEL,
  };

  it("accepts a well-formed response", () => {
    expect(CompareResponse.safeParse(base).success).toBe(true);
  });

  it("bounds similarityScore to [-1, 1] — cosine cannot exceed it", () => {
    expect(CompareResponse.safeParse({ ...base, similarityScore: 1.0001 }).success).toBe(false);
    expect(CompareResponse.safeParse({ ...base, similarityScore: -1.0001 }).success).toBe(false);
    expect(CompareResponse.safeParse({ ...base, similarityScore: -1 }).success).toBe(true);
    expect(CompareResponse.safeParse({ ...base, similarityScore: 1 }).success).toBe(true);
  });

  it("accepts perReference when present and rejects unknown keys", () => {
    expect(
      CompareResponse.safeParse({
        ...base,
        perReference: [{ referenceId: "a", score: 0.9 }],
      }).success,
    ).toBe(true);
    expect(CompareResponse.safeParse({ ...base, verdict: "PASSED" }).success).toBe(false);
  });

  it("requires an explicit model stamp so mismatched vectors are never compared", () => {
    const withoutModel = { ...base } as Record<string, unknown>;
    delete withoutModel.model;
    expect(CompareResponse.safeParse(withoutModel).success).toBe(false);
  });

  it("requires a non-negative referenceCount", () => {
    expect(CompareResponse.safeParse({ ...base, referenceCount: -1 }).success).toBe(false);
  });
});

describe("EmbedRequest / EmbedResponse", () => {
  it("accepts an image reference plus an optional model", () => {
    expect(EmbedRequest.safeParse({ image: "https://x/y.jpg" }).success).toBe(true);
    expect(EmbedRequest.safeParse({ image: "https://x/y.jpg", model: MODEL }).success).toBe(true);
  });

  it("rejects an empty image and a malformed model", () => {
    expect(EmbedRequest.safeParse({ image: "" }).success).toBe(false);
    expect(EmbedRequest.safeParse({ image: "i", model: { name: "", version: "1" } }).success).toBe(false);
  });

  it("requires the embedding dimension to be positive", () => {
    expect(
      EmbedResponse.safeParse({ embedding: [0.1], embeddingDimension: 0, model: MODEL }).success,
    ).toBe(false);
    expect(
      EmbedResponse.safeParse({ embedding: [0.1], embeddingDimension: 1, model: MODEL }).success,
    ).toBe(true);
  });

  it("does not force the embedding and dimension to agree — that is a separate error class", () => {
    expect(
      EmbedResponse.safeParse({ embedding: [0.1], embeddingDimension: 512, model: MODEL }).success,
    ).toBe(true);
  });
});

describe("CvServiceError", () => {
  it("accepts every documented error code", () => {
    for (const code of [
      "INVALID_REQUEST",
      "INVALID_IMAGE",
      "UNSUPPORTED_MODEL",
      "NO_REFERENCES",
      "DIMENSION_MISMATCH",
      "INTERNAL_ERROR",
    ]) {
      expect(CvServiceError.safeParse({ error: { code, message: "m" } }).success).toBe(true);
    }
  });

  it("rejects an undocumented code", () => {
    expect(CvServiceError.safeParse({ error: { code: "PENDING", message: "m" } }).success).toBe(false);
  });

  it("is strict on the envelope", () => {
    expect(
      CvServiceError.safeParse({ error: { code: "NO_REFERENCES", message: "m" }, status: 500 })
        .success,
    ).toBe(false);
  });
});

describe("CvServiceUnavailableError", () => {
  it("records the reason and attempt count", () => {
    const e = new CvServiceUnavailableError("timeout", 3);
    expect(e.reason).toBe("timeout");
    expect(e.attempts).toBe(3);
    expect(e.name).toBe("CvServiceUnavailableError");
    expect(e.message).toContain("timeout after 3 attempt(s)");
  });

  it("is distinguishable from a low score, which is a number not a throw", () => {
    expect(new CvServiceUnavailableError("bad_response", 1)).toBeInstanceOf(Error);
  });
});

describe("createCvClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let sleeps: number[];

  const client = (overrides: Record<string, unknown> = {}) =>
    createCvClient({
      baseUrl: "http://cv.local",
      secret: "s3cret",
      attemptTimeoutMs: 50,
      maxAttempts: 3,
      fetchImpl: fetchMock as unknown as typeof fetch,
      sleepImpl: async (ms) => {
        sleeps.push(ms);
      },
      ...overrides,
    });

  beforeEach(() => {
    fetchMock = vi.fn();
    sleeps = [];
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports configured only when both url and secret exist", () => {
    expect(client().isConfigured()).toBe(true);
    expect(createCvClient({ baseUrl: undefined, secret: "x" }).isConfigured()).toBe(false);
    expect(createCvClient({ baseUrl: "http://x", secret: undefined }).isConfigured()).toBe(false);
  });

  it("sends the bearer secret and content-type on every call", async () => {
    const compareBody = {
      similarityScore: 0.5,
      topK: 3,
      matchedReferenceIds: ["a"],
      referenceCount: 1,
      model: MODEL,
    };
    fetchMock.mockResolvedValue(jsonResponse(200, compareBody));

    await client().compare(compareReq);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://cv.local/compare");
    expect(init.headers.authorization).toBe("Bearer s3cret");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns the parsed body on 200", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        embedding: [0.1, 0.2],
        embeddingDimension: 2,
        model: MODEL,
      }),
    );
    const res = await client().embed({ image: "img" });
    expect(res.embeddingDimension).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 4xx — it is a contract violation, not a transient fault", async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { error: "bad" }));

    const err = await client()
      .compare(compareReq)
      .catch((e) => e);

    expect(err).toBeInstanceOf(CvServiceUnavailableError);
    expect((err as CvServiceUnavailableError).reason).toBe("bad_response");
    expect((err as CvServiceUnavailableError).attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 401 either", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {}));
    await expect(client().embed({ image: "img" })).rejects.toThrow(CvServiceUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx up to maxAttempts with linear backoff", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, {}));

    const err = await client()
      .embed({ image: "img" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(CvServiceUnavailableError);
    expect((err as CvServiceUnavailableError).attempts).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([1000, 2000]);
  });

  it("caps backoff at 2000 ms", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await client({ maxAttempts: 4 }).embed({ image: "img" }).catch(() => {});

    expect(sleeps).toEqual([1000, 2000, 2000]);
  });

  it("classifies an aborted request as timeout", async () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    fetchMock.mockRejectedValue(abortErr);

    const err = await client({ maxAttempts: 1 }).embed({ image: "img" }).catch((e) => e);
    expect((err as CvServiceUnavailableError).reason).toBe("timeout");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("classifies a network failure as unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
    const err = await client({ maxAttempts: 1 }).embed({ image: "img" }).catch((e) => e);
    expect((err as CvServiceUnavailableError).reason).toBe("unreachable");
  });

  it("treats a malformed 200 body as a retryable bad_response, never a verdict", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { similarityScore: 5 }));

    const err = await client()
      .compare(compareReq)
      .catch((e) => e);

    // The parse failure is caught inside `post`, so the attempt is retried and
    // then surfaces as a technical failure. Nothing is ever written for it.
    expect(err).toBeInstanceOf(CvServiceUnavailableError);
    expect((err as CvServiceUnavailableError).attempts).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws synchronously when the outgoing request fails validation", () => {
    expect(() => client().compare({ ...compareReq, artifactId: "not-an-id" })).toThrow(z.ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates the embed request before sending it", () => {
    expect(() => client().embed({ image: "" })).toThrow(z.ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts an attempt that exceeds attemptTimeoutMs", async () => {
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        }),
    );

    const err = await client({ attemptTimeoutMs: 5, maxAttempts: 1 })
      .embed({ image: "img" })
      .catch((e) => e);

    expect((err as CvServiceUnavailableError).reason).toBe("timeout");
  });

  it("passes the caller's topK through to the wire", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        similarityScore: 0.1,
        topK: 1,
        matchedReferenceIds: [],
        referenceCount: 0,
        model: MODEL,
      }),
    );
    await client().compare({ image: "img", artifactId: VALID_ID, topK: 1 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.topK).toBe(1);
  });

  it("exposes the documented retry budget constants", () => {
    expect(CV_MAX_ATTEMPTS).toBe(3);
  });
});
