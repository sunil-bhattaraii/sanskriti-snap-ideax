/**
 * FastAPI CV service contract — the single source of truth for the
 * backend <-> CV service boundary.
 *
 * The CV service is an internal specialized service. It computes image
 * embeddings and similarity. It does NOT decide whether a discovery is valid,
 * and it never sees XP, quests, badges, or user eligibility
 * (docs/Backend TDS.md 29).
 *
 * Authority split, per docs/Backend TDS.md 35-36:
 *   FastAPI  — embedding, per-reference similarity, top-K aggregation.
 *   Next.js  — threshold comparison, verification verdict, all awards.
 *
 * Service auth: every request carries `Authorization: Bearer <CV_SERVICE_SECRET>`
 * (docs/Backend TDS.md 85). The service must reject unauthenticated calls.
 * The secret never leaves the server; it is never a NEXT_PUBLIC_ variable.
 */

import { z } from "zod";

export const CV_SERVICE_URL_ENV = "CV_SERVICE_URL";
export const CV_SERVICE_SECRET_ENV = "CV_SERVICE_SECRET";

/** docs/API Contract.md 6.2a — 10s per attempt, 3 attempts, ~31s worst case. */
export const CV_ATTEMPT_TIMEOUT_MS = 10_000;
export const CV_MAX_ATTEMPTS = 3;

/** A CV-enabled artifact with no reference set is a configuration error. */
export const CV_DEFAULT_TOP_K = 3;

export const CvModel = z
  .object({
    name: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();

export type CvModel = z.infer<typeof CvModel>;

/* ------------------------------------------------------------- /embed ---- */

/**
 * Generates an embedding for one image. Used by the admin reference pipeline
 * (docs/Backend TDS.md 33, Path A), not by the verification path.
 */
export const EmbedRequest = z
  .object({
    /** Either an http(s) URL or a Cloudinary public id. */
    image: z.string().min(1),
    model: CvModel.optional(),
  })
  .strict();

export const EmbedResponse = z
  .object({
    embedding: z.array(z.number()),
    embeddingDimension: z.number().int().positive(),
    model: CvModel,
  })
  .strict();

export type EmbedRequest = z.infer<typeof EmbedRequest>;
export type EmbedResponse = z.infer<typeof EmbedResponse>;

/* ------------------------------------------------------------ /compare --- */

const ReferenceInput = z
  .object({
    referenceId: z.string().min(1),
    embedding: z.array(z.number()),
    embeddingDimension: z.number().int().positive(),
  })
  .strict();

export const CompareRequest = z
  .object({
    /** The submitted verification snap. */
    image: z.string().min(1),

    /**
     * Exactly one of these identifies the reference set:
     *
     *  - `artifactId`: the service loads references from MongoDB. Preferred.
     *    Keeps ~50 x 512-dim vectors off the verification hot path.
     *  - `references`: explicit vectors. Used by tests and by the offline
     *    dataset tooling, which already holds the embeddings in memory.
     *
     * Mixing them is rejected: a partially-supplied set is a silent
     * correctness bug, since the service would compare against a subset.
     */
    artifactId: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
    references: z.array(ReferenceInput).min(1).optional(),

    /** Aggregation width. Final score is the mean of the top K scores. */
    topK: z.number().int().min(1).default(CV_DEFAULT_TOP_K),

    model: CvModel.optional(),
  })
  .strict()
  .refine((v) => (v.artifactId != null) !== (v.references != null), {
    message: "Provide exactly one of artifactId or references.",
    path: ["artifactId"],
  });

export type CompareRequest = z.infer<typeof CompareRequest>;

export const CompareResponse = z
  .object({
    /**
     * Mean similarity across the top-K matches, not the single maximum and not
     * an average over all references — reference images span angles, lighting,
     * and viewpoints, so a flat average understates a good match
     * (docs/DB Schemas.md 30).
     */
    similarityScore: z.number().min(-1).max(1),
    topK: z.number().int().positive(),
    matchedReferenceIds: z.array(z.string()),
    referenceCount: z.number().int().nonnegative(),
    model: CvModel,
    /** Per-reference breakdown. Persisted for admin review, never returned to clients. */
    perReference: z
      .array(
        z
          .object({
            referenceId: z.string(),
            score: z.number(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type CompareResponse = z.infer<typeof CompareResponse>;

/* --------------------------------------------------------------- errors -- */

/**
 * Any non-2xx from the CV service is a technical failure, never a user
 * rejection. The distinction is structural: a failure aborts before the
 * attempt row is written, so nothing is persisted and the client retries with
 * the same idempotency key (docs/DB Schemas.md 31).
 */
export const CvServiceErrorCode = z.enum([
  "INVALID_REQUEST",
  "INVALID_IMAGE",
  "UNSUPPORTED_MODEL",
  "NO_REFERENCES",
  "DIMENSION_MISMATCH",
  "INTERNAL_ERROR",
]);

export type CvServiceErrorCode = z.infer<typeof CvServiceErrorCode>;

export const CvServiceError = z
  .object({
    error: z
      .object({
        code: CvServiceErrorCode,
        message: z.string(),
      })
      .strict(),
  })
  .strict();

/* --------------------------------------------------------------- client -- */

export type CvUnavailableReason = "unreachable" | "timeout" | "bad_response";

/**
 * Distinguishes a technical failure from a low score. A low score is a
 * successful comparison that returns a number; only a thrown error here means
 * the verdict is unknown and the request must be abandoned with nothing
 * written (docs/Backend TDS.md 37).
 */
export class CvServiceUnavailableError extends Error {
  readonly reason: CvUnavailableReason;
  readonly attempts: number;

  constructor(reason: CvUnavailableReason, attempts: number, cause?: unknown) {
    super(`CV service ${reason} after ${attempts} attempt(s)`, { cause });
    this.name = "CvServiceUnavailableError";
    this.reason = reason;
    this.attempts = attempts;
  }
}

type CvClientConfig = {
  baseUrl: string | undefined;
  secret: string | undefined;
  /** Overridable for tests. */
  attemptTimeoutMs?: number;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function createCvClient(config: CvClientConfig) {
  const attemptTimeoutMs = config.attemptTimeoutMs ?? CV_ATTEMPT_TIMEOUT_MS;
  const maxAttempts = config.maxAttempts ?? CV_MAX_ATTEMPTS;
  const doFetch = config.fetchImpl ?? fetch;
  const sleep = config.sleepImpl ?? defaultSleep;

  async function post<TResponse>(
    path: string,
    body: unknown,
    parse: (value: unknown) => TResponse,
  ): Promise<TResponse> {
    let lastReason: CvUnavailableReason = "unreachable";
    const startedAt = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);

      try {
        console.info("[cv] request", {
          path,
          attempt,
          maxAttempts,
          timeoutMs: attemptTimeoutMs,
        });
        const res = await doFetch(`${config.baseUrl}${path}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.secret}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          // A 4xx is a contract violation on our side, not a transient fault.
          // Retrying it just burns the request budget, so surface it at once.
          if (res.status >= 400 && res.status < 500) {
            const detail = await res.text().catch(() => "");
            console.warn("[cv] non-success response", {
              path,
              attempt,
              status: res.status,
              durationMs: Date.now() - startedAt,
              detail,
            });
            throw new CvServiceUnavailableError("bad_response", attempt, detail);
          }
          lastReason = "unreachable";
          console.warn("[cv] retryable response", {
            path,
            attempt,
            status: res.status,
            durationMs: Date.now() - startedAt,
          });
        } else {
          const payload = await res.json();
          const parsed = parse(payload);
          console.info("[cv] response", {
            path,
            attempt,
            status: res.status,
            durationMs: Date.now() - startedAt,
          });
          clearTimeout(timer);
          return parsed;
        }
      } catch (err) {
        if (err instanceof CvServiceUnavailableError) throw err;
        lastReason =
          err instanceof Error && err.name === "AbortError" ? "timeout" : "unreachable";
        console.error("[cv] request failed", {
          path,
          attempt,
          reason: lastReason,
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - startedAt,
        });
      } finally {
        clearTimeout(timer);
      }

      if (attempt < maxAttempts) {
        // Linear backoff, bounded so the total stays inside the 25s budget.
        await sleep(Math.min(1000 * attempt, 2_000));
      }
    }

    console.error("[cv] exhausted retries", {
      path,
      attempts: maxAttempts,
      reason: lastReason,
      durationMs: Date.now() - startedAt,
    });
    throw new CvServiceUnavailableError(lastReason, maxAttempts);
  }

  return {
    embed: (req: EmbedRequest) =>
      post("/embed", EmbedRequest.parse(req), (v) => EmbedResponse.parse(v)),

    compare: (req: CompareRequest) =>
      post("/compare", CompareRequest.parse(req), (v) => CompareResponse.parse(v)),

    /**
     * True when the service is configured. When it is not, CV-enabled
     * artifacts cannot be verified and callers must decide explicitly rather
     * than silently treating every image as a pass.
     */
    isConfigured: () => Boolean(config.baseUrl && config.secret),
  };
}

export type CvClient = ReturnType<typeof createCvClient>;
