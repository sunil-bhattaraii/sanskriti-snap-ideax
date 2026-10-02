/**
 * docs/API Contract.md 9 — admin user table.
 *
 * GET: paginated user list with optional substring search on username /
 * displayName. ADMIN only.
 *
 * `accountStatus` is a server/admin-managed field (docs/DB Schemas.md 4) and is
 * safe to expose in the admin table; it is deliberately withheld from public
 * profile DTOs (AGENTS.md).
 *
 * `q` is a case-insensitive substring match backed by the existing text index on
 * the users collection. When no `q` is provided the route returns all users,
 * newest first — useful for the initial table load.
 */

import { NextResponse, type NextRequest } from "next/server";
import { Types } from "mongoose";

import { requireAdmin } from "@/lib/auth";
import { AdminUserQuery } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { User } from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connect();

    const url = request.nextUrl;
    const { limit, cursor, q } = AdminUserQuery.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });

    const filter: Record<string, unknown> = {};

    if (q) {
      // Case-insensitive substring match on both lookup fields. $or with $regex
      // is acceptable at admin-table scale; the admin table is not a hot path.
      const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ username: pattern }, { displayName: pattern }];
    }

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const users = await User.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = users.length > limit;
    const pageItems = hasMore ? users.slice(0, limit) : users;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? String(pageItems[pageItems.length - 1]._id)
        : null;

    const items = pageItems.map((u) => ({
      id: String(u._id),
      username: u.username,
      displayName: u.displayName,
      profileImageUrl: u.profileImage?.url ?? null,
      role: u.role,
      // accountStatus is safe in the admin table — the field is withheld only
      // from public-facing profile DTOs (AGENTS.md).
      accountStatus: u.accountStatus,
      lifetimeXp: u.lifetimeXp,
      createdAt: new Date(u.createdAt).toISOString(),
    }));

    return NextResponse.json({ items, page: { nextCursor, hasMore } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
