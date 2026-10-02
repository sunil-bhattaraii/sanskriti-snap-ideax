/**
 * Builders that turn a compact per-operation descriptor into an OpenAPI
 * Operation Object, plus the error-response mapper.
 *
 * Keeping this mechanical is the point: each registry entry names its tags,
 * summary, params, request body and the error codes the handler can throw, and
 * `op()` assembles the rest. Response bodies are described, not schematised,
 * except for an illustrative `okExample` on the main endpoints — the response
 * DTOs live in `contracts.ts` as plain types and are not duplicated here.
 */

import { ErrorCode } from "@/lib/errors";
import type { JsonSchema, ParameterObject } from "./zod";

type ErrorCodeName = keyof typeof ErrorCode;

/** One entry in `paths`: a URL mapped to its operations keyed by HTTP method. */
export type PathsFragment = Record<string, Record<string, unknown>>;

/** The shared error envelope, referenced from `components.schemas.Error`. */
const errorRef: JsonSchema = { $ref: "#/components/schemas/Error" };

/**
 * Map a set of error codes to a responses fragment. Several codes can share one
 * HTTP status (e.g. multiple 409s); they are grouped under that status and the
 * code names listed in the description so a tester knows which to expect.
 */
export function errorResponses(
  codes: ErrorCodeName[],
): Record<string, unknown> {
  const byStatus = new Map<number, string[]>();
  for (const code of codes) {
    const status = ErrorCode[code];
    const names = byStatus.get(status) ?? [];
    if (!names.includes(code)) {
      names.push(code);
    }
    byStatus.set(status, names);
  }

  const responses: Record<string, unknown> = {};
  for (const [status, names] of byStatus) {
    responses[String(status)] = {
      description: names.join(" / "),
      content: { "application/json": { schema: errorRef } },
    };
  }
  return responses;
}

export type OperationInput = {
  tags: string[];
  summary: string;
  description?: string;
  /**
   * Omit to inherit the document's global `bearerAuth`. Pass `[]` only for a
   * handler that calls no `require*` helper (a genuinely public route).
   */
  security?: unknown[];
  /** Path, query and header parameters. */
  params?: ParameterObject[];
  /** Request body schema (`application/json`). */
  body?: JsonSchema;
  /** Defaults to `true` when a body is present. */
  bodyRequired?: boolean;
  /** Success status code. Defaults to 200. */
  okStatus?: number;
  okDescription?: string;
  /** Illustrative response body, attached only on the main endpoints. */
  okExample?: unknown;
  errors?: ErrorCodeName[];
};

/** Assemble an OpenAPI Operation Object from a compact descriptor. */
export function op(input: OperationInput): Record<string, unknown> {
  const operation: Record<string, unknown> = {
    tags: input.tags,
    summary: input.summary,
  };

  if (input.description) {
    operation.description = input.description;
  }
  if (input.security !== undefined) {
    operation.security = input.security;
  }
  if (input.params && input.params.length > 0) {
    operation.parameters = input.params;
  }
  if (input.body) {
    operation.requestBody = {
      required: input.bodyRequired ?? true,
      content: { "application/json": { schema: input.body } },
    };
  }

  const okStatus = input.okStatus ?? 200;
  const okResponse: Record<string, unknown> = {
    description: input.okDescription ?? "Success.",
  };
  if (input.okExample !== undefined) {
    okResponse.content = {
      "application/json": { example: input.okExample },
    };
  }

  operation.responses = {
    [String(okStatus)]: okResponse,
    ...errorResponses(input.errors ?? []),
  };

  return operation;
}
