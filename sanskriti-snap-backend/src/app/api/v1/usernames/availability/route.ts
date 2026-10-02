/**
 * docs/API Contract.md 4 — debounced availability probe.
 *
 * A taken name is a normal answer (`available: false`), never a 404. The query
 * is validated with the same schema as the claim itself so the probe cannot
 * disagree with `PATCH /api/v1/me/username` about what is even a candidate.
 *
 * Matching is case-sensitive, because `users.username` carries no collation and
 * `Asha` / `asha` are therefore distinct rows; a case-insensitive probe would
 * answer "taken" and then let the claim succeed.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import { UsernameRequest } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { User } from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthContext();

    const requested = request.nextUrl.searchParams.get("username") ?? "";
    const { username } = UsernameRequest.parse({ username: requested });

    const existing = await User.findOne({ username }).select("_id").lean();

    // Already holding the name is not a conflict: the row of the caller must
    // not make the current username look unavailable to its owner.
    const available = !existing || String(existing._id) === String(user._id);

    return NextResponse.json({ username, available });
  } catch (err) {
    return toErrorResponse(err);
  }
}
