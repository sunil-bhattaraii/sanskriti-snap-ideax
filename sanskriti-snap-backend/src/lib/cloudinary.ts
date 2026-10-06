/**
 * Cloudinary: URL derivation and signed direct uploads.
 *
 * The backend never touches image bytes. It hands the client a signature scoped
 * to one folder, the client uploads straight to Cloudinary, and the resulting
 * `publicId` comes back on the next write that consumes it
 * (docs/Backend TDS.md 61).
 */

import { createHash, createHmac } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { MediaPurpose, MediaSignResponse } from "./contracts";
import { env } from "./env";
import { Types } from "mongoose";

/**
 * Always displayable, never signed. A signed URL would expire out of a cached
 * leaderboard row (docs/API Contract.md 7.6).
 *
 * The display URL applies a default delivery transform (max 800px width,
 * auto format/quality) so lists, grids and detail images never ship the
 * full-resolution original — the same cap the CV service uses on its fetches.
 * Pass `null` to get the raw original, needed only where clients edit/crop.
 */
const DEFAULT_READ_TRANSFORM = "w_800,q_auto,f_auto";

export function imageUrl(
  publicId: string,
  transform: string | null = DEFAULT_READ_TRANSFORM,
): string {
  const segment = transform ? `${transform}/` : "";
  return `https://res.cloudinary.com/${env().CLOUDINARY_CLOUD_NAME}/image/upload/${segment}${publicId}`;
}

/**
 * `purpose` maps to a folder. The client sends a purpose and never a path, so
 * it cannot write outside its own area (docs/API Contract.md 6.1).
 *
 * The root mirrors the cloud name, as in docs/Backend TDS.md 62. Both
 * verification purposes share one folder: they differ in what the client may
 * attach them to, not in where the asset lives.
 */
const PURPOSE_FOLDERS: Record<MediaPurpose, string> = {
  VERIFICATION_SNAP: "snaps/verification",
  VERIFICATION_GALLERY: "snaps/verification",
  PROFILE_IMAGE: "users/profile",
  COMMUNITY_SNAP: "community",
  CONTRIBUTION_PHOTO: "contributions",
};

/**
 * Deterministic, unguessable string for a given user. Used to bind a Cloudinary
 * asset to the caller without exposing the MongoDB `_id` in the CDN URL.
 */
function userMediaToken(userId: Types.ObjectId): string {
  return createHmac("sha256", env().CLOUDINARY_API_SECRET)
    .update(userId.toString())
    .digest("hex")
    .slice(0, 16);
}

/**
 * Cloudinary signs an alphabetically sorted, `&`-joined parameter string with
 * the API secret appended. `file`, `api_key`, `cloud_name` and `resource_type`
 * are excluded by definition, and the response carries the rest verbatim -- the
 * client must echo exactly these params or the upload is refused.
 *
 * `folder` is inside the signature, which is what makes the fixed-folder rule
 * enforceable rather than advisory. By appending `userMediaToken` to the folder,
 * the signature binds the upload to the caller: a downstream write can recompute
 * the token, verify it appears in `publicId`, and satisfy the contract's "for
 * this user" rule losslessly.
 */
export function signUpload(purpose: MediaPurpose, userId: Types.ObjectId): MediaSignResponse {
  const e = env();
  const timestamp = Math.floor(Date.now() / 1000);
  const token = userMediaToken(userId);
  const folder = `${e.CLOUDINARY_CLOUD_NAME}/${PURPOSE_FOLDERS[purpose]}/${token}`;

  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${e.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  return {
    cloudName: e.CLOUDINARY_CLOUD_NAME,
    apiKey: e.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    resourceType: "image",
  };
}

/**
 * Validates that a `publicId` was signed for this user and this purpose.
 * Call this before consuming a caller-provided publicId in a write.
 */
export function assertMediaOwnership(
  publicId: string,
  purpose: MediaPurpose,
  userId: Types.ObjectId,
): boolean {
  const token = userMediaToken(userId);
  const expectedPrefix = `${env().CLOUDINARY_CLOUD_NAME}/${PURPOSE_FOLDERS[purpose]}/${token}/`;
  return publicId.startsWith(expectedPrefix);
}

let configured = false;

function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: env().CLOUDINARY_CLOUD_NAME,
      api_key: env().CLOUDINARY_API_KEY,
      api_secret: env().CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
  return cloudinary;
}

/**
 * Best-effort removal of a Cloudinary asset when a write makes it
 * unreferenced. Never throws: cleanup must not fail a write that already
 * committed, and destroying a deleted or never-uploaded asset is a no-op.
 * Call this after the DB commit, never inside a withTransaction callback
 * (AGENTS.md).
 */
export async function destroyAsset(publicId: string): Promise<void> {
  try {
    const result = await getCloudinary().uploader.destroy(publicId, {
      resource_type: "image",
    });
    if (result?.result && result.result !== "ok") {
      console.warn("[cloudinary] destroy reported a non-ok result", {
        publicId,
        result: result.result,
      });
    }
  } catch (err) {
    console.warn("[cloudinary] destroy failed, asset left in place", {
      publicId,
      err,
    });
  }
}
