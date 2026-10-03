/**
 * Request helpers shared by route handlers.
 */

import { type ZodType } from "zod";

import { ApiError } from "./errors";

/**
 * Reads and parses a JSON body.
 *
 * `request.json()` rejects on malformed input, and that rejection is a
 * SyntaxError rather than a ZodError — without this it would fall through
 * `toErrorResponse` to an unhandled 500. A body the client failed to serialise
 * is a client error, so it becomes 422 like every other validation failure
 * (docs/API Contract.md 2.4).
 */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw ApiError.validation("Request body must be valid JSON.");
  }
}

/**
 * Parses query-string parameters with a zod schema.
 *
 * `schema.parse()` throws a bare `ZodError`, which `toErrorResponse` renders
 * with its hardcoded body message ("The request body failed validation.") —
 * wrong on a GET, which has no body. A query failure is its own error: 422 with
 * the offending params in `details.fields`, so the client can point at the box
 * that is too long rather than at a body it never sent.
 */
export function parseQuery<T>(
  schema: ZodType<T>,
  params: Record<string, string | undefined>,
): T {
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    // Built from `issues` rather than `flatten().fieldErrors`: on a generic
    // `ZodType<T>` the flattened shape is not statically known, and `issues`
    // carries the same information with the path intact.
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_root";
      fields[key] ??= issue.message;
    }
    throw ApiError.validation("Invalid query parameters.", { fields });
  }
  return parsed.data;
}
