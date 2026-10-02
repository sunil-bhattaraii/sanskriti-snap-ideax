/**
 * Error envelope and codes.
 *
 * Clients branch on `code`, never on `message` (docs/API Contract.md 2.4).
 * `details` carries the numbers a client needs to render useful UI, so the
 * client never recomputes a server-authoritative value — that is how the
 * failure screen gets "move 340 m closer" without doing its own geometry.
 *
 * Stack traces are never returned.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const ErrorCode = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ACCOUNT_SUSPENDED: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  VALIDATION_FAILED: 422,
  USERNAME_TAKEN: 409,
  ALREADY_DISCOVERED: 409,
  ARTIFACT_UNAVAILABLE: 409,
  REWARD_ALREADY_REDEEMED: 409,
  INVALID_STATE_TRANSITION: 409,
  GPS_OUTSIDE_RADIUS: 422,
  IMAGE_REQUIRED: 422,
  CV_UNAVAILABLE: 503,
  CV_TIMEOUT: 504,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ErrorCode;

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = ErrorCode[code];
    this.details = details;
  }

  static unauthenticated(message = "Sign in to continue.") {
    return new ApiError("UNAUTHENTICATED", message);
  }

  static forbidden(message = "You do not have access to this resource.") {
    return new ApiError("FORBIDDEN", message);
  }

  static notFound(message = "Not found.") {
    return new ApiError("NOT_FOUND", message);
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new ApiError("VALIDATION_FAILED", message, details);
  }

  /**
   * docs/API Contract.md 2.4 — prefer 404 over 403 whenever revealing that a
   * resource exists would leak information, e.g. a DISABLED artifact seen by a
   * non-admin, or another user's verification attempt.
   */
  static notVisible() {
    return new ApiError("NOT_FOUND", "Not found.");
  }
}

type ErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): NextResponse<ErrorBody> {
  return NextResponse.json(
    { error: details ? { code, message, details } : { code, message } },
    { status: ErrorCode[code] },
  );
}

export function toErrorResponse(err: unknown): NextResponse<ErrorBody> {
  if (err instanceof ApiError) {
    return errorResponse(err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_root";
      (fields[key] ??= []).push(issue.message);
    }
    return errorResponse(
      "VALIDATION_FAILED",
      "The request body failed validation.",
      { fields },
    );
  }

  // Duplicate key from a unique index. The index is the real guarantee against
  // duplicate rewards; this just turns it into a clean 409.
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (code === 11000) {
      const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
      if (keyPattern && "username" in keyPattern) {
        return errorResponse("USERNAME_TAKEN", "That username is already taken.");
      }
      return errorResponse(
        "INVALID_STATE_TRANSITION",
        "That record already exists.",
      );
    }
  }

  console.error("[api] unhandled error", err);
  return errorResponse("INTERNAL_ERROR", "Something went wrong. Please try again.");
}
