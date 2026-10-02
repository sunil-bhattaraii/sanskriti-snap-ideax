/**
 * Assembles the OpenAPI 3.1 document from the path registries and shared
 * components. Memoized at module scope — the Zod conversions are cheap but
 * there is no reason to repeat them on every request.
 */

import { ErrorCode } from "@/lib/errors";
import { bearerAuthScheme, errorEnvelopeSchema } from "./components";
import { adminPaths } from "./paths/admin";
import { artifactsPaths } from "./paths/artifacts";
import { engagementPaths } from "./paths/engagement";
import { identityPaths } from "./paths/identity";
import { rewardsPaths } from "./paths/rewards";
import { verificationPaths } from "./paths/verification";

let cached: Record<string, unknown> | null = null;

export function buildDocument(): Record<string, unknown> {
  if (cached) return cached;

  cached = {
    openapi: "3.1.0",
    info: {
      title: "Sanskriti Snap API",
      version: "1.0.0",
      description:
        "REST API for Sanskriti Snap — a gamified cultural-heritage discovery app for Patan/Lalitpur.\n\n" +
        "## Authentication\n\n" +
        "Most endpoints require a Clerk session JWT. Click **Authorize** and paste your token " +
        "(obtain one via `getToken()` in a signed-in client, or from the Clerk dashboard dev instance).\n\n" +
        "## Authorization\n\n" +
        "Role enforcement happens in each handler, not at the gateway. " +
        "The required role is stated in each operation's description:\n\n" +
        "- *Requires a signed-in user* — `requireAuthContext()`: any active account\n" +
        "- *Requires ADMIN* — `requireAdmin()`: ADMIN role only\n" +
        "- *Requires EXPERT or ADMIN* — `requireReviewer()`: EXPERT or ADMIN role\n\n" +
        "A non-owner always receives 404, never 403, so routes cannot be used to probe which ids exist.",
    },
    servers: [{ url: "/" }],

    tags: [
      { name: "Identity", description: "Profile, preferences, media upload signing." },
      {
        name: "Artifacts",
        description:
          "Browse, search and discover cultural-heritage artifacts; proximity checks; community snaps.",
      },
      {
        name: "Verification",
        description:
          "Submit and recheck visit-verification attempts. Synchronous: one request yields one terminal verdict.",
      },
      {
        name: "Engagement",
        description: "Collection, discoveries, quests, badges, leaderboard.",
      },
      {
        name: "Rewards & Points",
        description: "Reward catalogue, redemptions, points ledger, notifications.",
      },
      { name: "Admin", description: "Admin-only management operations (ADMIN role)." },
      {
        name: "Admin · Contributions",
        description: "Contribution review queue (EXPERT or ADMIN role).",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: bearerAuthScheme,
      },
      schemas: {
        Error: errorEnvelopeSchema,
        ErrorCode: {
          type: "string",
          enum: Object.keys(ErrorCode),
          description: "Clients branch on `code`, never on `message`.",
        },
      },
    },

    // Global default: every operation inherits bearerAuth unless it overrides
    // with security: [] (optional-auth endpoints) or security: [{}] (public).
    security: [{ bearerAuth: [] }],

    paths: {
      ...identityPaths,
      ...artifactsPaths,
      ...verificationPaths,
      ...engagementPaths,
      ...rewardsPaths,
      ...adminPaths,
    },
  };

  return cached;
}
