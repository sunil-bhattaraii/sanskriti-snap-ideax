/**
 * Test env defaults.
 *
 * `src/lib/env.ts` validates at first use and caches for the process, so the
 * required server vars must be present before any module under test calls
 * `env()`. Real secrets are never needed here — these are structural values.
 */

process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/sanskriti-snap-test";
process.env.CLERK_SECRET_KEY ??= "sk_test_vitest";
process.env.CLOUDINARY_CLOUD_NAME ??= "sanskriti-snap-test";
process.env.CLOUDINARY_API_KEY ??= "000000000000000";
process.env.CLOUDINARY_API_SECRET ??= "vitest-api-secret";

export {};
