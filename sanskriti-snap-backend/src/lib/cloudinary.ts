/**
 * Cloudinary delivery URLs.
 *
 * Signed upload parameters belong to `POST /api/v1/media/sign` (API Contract.md
 * 6.1), which is not built yet; this module currently only derives the read URL
 * for an asset the client already uploaded.
 */

import { env } from "./env";

/**
 * The CDN URL for an uploaded image.
 *
 * Not signed, deliberately: `profileImageUrl` is embedded in the leaderboard
 * (API Contract.md 7.6), where per-row signing is not viable.
 *
 * No transformation is applied. The contract does not pin a size, so the client
 * asks for the variant it needs rather than the backend guessing one.
 */
export function imageUrl(publicId: string): string {
  return `https://res.cloudinary.com/${env().CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
}
