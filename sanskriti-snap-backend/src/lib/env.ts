/**
 * Environment configuration.
 *
 * Validated once at import time so a missing secret fails at boot rather than
 * on the first request that happens to need it. Server-only values are read
 * without the NEXT_PUBLIC_ prefix and must never be exposed to the client
 * (docs/Backend TDS.md 99).
 */

import { z } from "zod";

const ServerEnv = z.object({
  MONGODB_URI: z.string().min(1),

  CLERK_SECRET_KEY: z.string().min(1),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  /**
   * Optional this sprint. CV lands in the next block; until the service is
   * reachable, CV-enabled artifacts cannot be verified and the verification
   * handler refuses them explicitly instead of passing every image.
   */
  CV_SERVICE_URL: z.string().url().optional(),
  CV_SERVICE_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof ServerEnv>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (cached) return cached;

  const parsed = ServerEnv.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CV_SERVICE_URL: process.env.CV_SERVICE_URL,
    CV_SERVICE_SECRET: process.env.CV_SERVICE_SECRET,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `Invalid server environment configuration. Checked: ${missing}. ` +
      `See docs/Backend TDS.md 99.`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** True when the CV service is configured and reachable-capable. */
export function isCvConfigured(): boolean {
  const e = env();
  return Boolean(e.CV_SERVICE_URL && e.CV_SERVICE_SECRET);
}
