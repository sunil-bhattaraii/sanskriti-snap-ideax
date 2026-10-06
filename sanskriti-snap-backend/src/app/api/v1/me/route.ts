/**
 * docs/API Contract.md 4 — own profile.
 *
 * The client calls GET on launch and after any XP-affecting action, so this is
 * its XP source of truth; both handlers therefore answer with a full
 * `UserProfile` rather than a patch acknowledgement.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { destroyAsset, imageUrl } from "@/lib/cloudinary";
import { PatchProfileRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { loadOwnProfile, updateOwnProfile } from "@/lib/profile";
import { User } from "@/models/user";

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

    // Read before the write: once profileImage is replaced the old publicId is
    // gone from the document, so it must be captured here for the cleanup below.
    let previousPublicId: string | null = null;
    if (body.profileImagePublicId !== undefined) {
      // Only the public id is accepted; the URL is derived here so a client
      // cannot point its avatar at an arbitrary host.
      update.profileImage = {
        publicId: body.profileImagePublicId,
        url: imageUrl(body.profileImagePublicId),
      };
      const previous = await User.findById(user._id)
        .select("profileImage")
        .lean();
      previousPublicId = previous?.profileImage?.publicId ?? null;
    }

    const profile = await updateOwnProfile(user._id, update);

    // A replaced avatar orphans the previous Cloudinary asset unless we remove
    // it. Destroy after the write commits and only when the id actually
    // changed; a re-upload of the same image must survive untouched.
    if (
      body.profileImagePublicId !== undefined &&
      previousPublicId &&
      previousPublicId !== body.profileImagePublicId
    ) {
      await destroyAsset(previousPublicId);
    }

    return NextResponse.json(profile);
  } catch (err) {
    return toErrorResponse(err);
  }
}
