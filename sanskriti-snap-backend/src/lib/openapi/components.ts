/**
 * Reusable OpenAPI components: the shared error envelope, the bearer security
 * scheme the Scalar console authorizes with, and parameter builders used across
 * many operations.
 */

import { ErrorCode } from "@/lib/errors";
import { toOpenApiSchema } from "./zod";
import type { JsonSchema, ParameterObject } from "./zod";

/**
 * Mirror of the wire error envelope (`src/lib/errors.ts`): every failure is
 * `{ error: { code, message, details? } }`. Clients branch on `code`, so the
 * enum is generated from the `ErrorCode` table rather than hand-listed.
 */
export const errorEnvelopeSchema: JsonSchema = {
  type: "object",
  required: ["error"],
  additionalProperties: false,
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      additionalProperties: false,
      properties: {
        code: { type: "string", enum: Object.keys(ErrorCode) },
        message: { type: "string" },
        details: {
          type: "object",
          additionalProperties: true,
          description:
            "Server-authoritative numbers a client needs to render the failure (e.g. how far outside the GPS radius).",
        },
      },
    },
  },
};

/**
 * Clerk accepts a session cookie or `Authorization: Bearer <JWT>`. The console
 * uses the bearer form: paste a Clerk session JWT into Authorize. Roles are not
 * expressible in a bearer scheme — they are noted in each operation's prose.
 */
export const bearerAuthScheme = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "Clerk session JWT. In a signed-in client, obtain one via `getToken()`; for manual testing, copy a session token from the Clerk dashboard dev instance.",
} as const;

/** A MongoDB ObjectId path parameter (24 hex chars), matching route validation. */
export function objectIdPath(name: string): ParameterObject {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
    description: "MongoDB ObjectId (24 hexadecimal characters).",
  };
}

/**
 * The `Idempotency-Key` header. Required on `POST /verification-attempts` (a
 * replay must never cost GPU time or double-award); optional on other stateful
 * POSTs. A replay returns the original response unchanged.
 */
export function idempotencyKeyHeader(required: boolean): ParameterObject {
  return {
    name: "Idempotency-Key",
    in: "header",
    required,
    schema: { type: "string", format: "uuid" },
    description:
      "UUID v4. Resubmitting with the same key returns the original response instead of acting twice.",
  };
}

/** A query parameter constrained to the members of a Zod enum. */
export function enumQueryParam(
  name: string,
  enumSchema: Parameters<typeof toOpenApiSchema>[0],
  description: string,
  required = false,
): ParameterObject {
  return {
    name,
    in: "query",
    required,
    schema: toOpenApiSchema(enumSchema),
    description,
  };
}

/**
 * Security requirement for optional-auth endpoints (handlers using
 * `getAuthContext()`): a bearer token is accepted and enriches the response, but
 * anonymous access is allowed. The empty object is the "no credentials" branch.
 */
export const optionalAuth: unknown[] = [{ bearerAuth: [] }, {}];
