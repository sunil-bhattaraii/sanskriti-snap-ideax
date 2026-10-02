/**
 * docs/API Contract.md 4 — claim or change username.
 *
 * There is no read-then-write availability check here on purpose: two callers
 * can both see a name free. The unique index on `users.username` is the
 * guarantee, and `toErrorResponse` maps its duplicate-key error to
 * `409 USERNAME_TAKEN`. `GET /api/v1/usernames/availability` is a UX affordance,
 * not the correctness boundary.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { UsernameRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { updateOwnProfile } from "@/lib/profile";

export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuthContext();
    const { username } = UsernameRequest.parse(await readJsonBody(request));

    return NextResponse.json(await updateOwnProfile(user._id, { username }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
