/**
 * Request helpers shared by route handlers.
 */

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
