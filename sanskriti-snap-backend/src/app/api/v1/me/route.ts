/**
 * docs/API Contract.md 4 — own profile.
 *
 * The client calls GET on launch and after any XP-affecting action, so this is
 * its XP source of truth; both handlers therefore answer with a full
 * `UserProfile` rather than a patch acknowledgement.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { imageUrl } from "@/lib/cloudinary";
import { PatchProfileRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { loadOwnProfile, updateOwnProfile } from "@/lib/profile";

export async function GET() {
  try {
    const { user } = await requireAuthContext();
    return NextResponse.json(await loadOwnProfile(user._id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuthContext();

    // `.strict()`, so an attempt to set lifetimeXp / role / accountStatus is a
    // 422 rather than a silently ignored key (docs/API Contract.md 4).
    const body = PatchProfileRequest.parse(await readJsonBody(request));

    const update: Record<string, unknown> = {};
    if (body.displayName !== undefined) update.displayName = body.displayName;
    if (body.profileImagePublicId !== undefined) {
      // Only the public id is accepted; the URL is derived here so a client
      // cannot point its avatar at an arbitrary host.
      update.profileImage = {
        publicId: body.profileImagePublicId,
        url: imageUrl(body.profileImagePublicId),
      };
    }

    return NextResponse.json(await updateOwnProfile(user._id, update));
  } catch (err) {
    return toErrorResponse(err);
  }
}
