/**
 * docs/API Contract.md 4 — notification toggle and radius.
 *
 * `enabled` defaults to false in the schema, so discovery notifications are
 * opt-in; the default radius is 1 km.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { PatchPreferencesRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { updateOwnProfile } from "@/lib/profile";

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuthContext();
    const body = PatchPreferencesRequest.parse(await readJsonBody(request));

    // Dot paths, so a partial update cannot blank the sibling field.
    const update: Record<string, unknown> = {};
    if (body.enabled !== undefined) {
      update["notifications.enabled"] = body.enabled;
    }
    if (body.radiusMeters !== undefined) {
      update["notifications.radiusMeters"] = body.radiusMeters;
    }

    return NextResponse.json(await updateOwnProfile(user._id, update));
  } catch (err) {
    return toErrorResponse(err);
  }
}
