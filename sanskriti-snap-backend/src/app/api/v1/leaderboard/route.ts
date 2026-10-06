/**
 * docs/API Contract.md 7.6 — Ranked users by lifetime XP.
 *
 * Optional auth. Returns top users with rank computed server-side via $rank.
 * Only ACTIVE users are included. Anonymous callers see currentUser: null.
 * Rank is all-time, no time-window parameter.
 */

import { NextResponse, type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { User } from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Number.parseInt(searchParams.get("limit") ?? "100", 10) || 100,
      500,
    );

    // Aggregate with rank computed server-side
    const results = await User.aggregate([
      { $match: { accountStatus: "ACTIVE" } },
      { $sort: { lifetimeXp: -1 } },
      {
        $setWindowFields: {
          partitionBy: null,
          sortBy: { lifetimeXp: -1 },
          output: { rank: { $rank: {} } },
        },
      },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          username: 1,
          displayName: 1,
          profileImage: 1,
          lifetimeXp: 1,
          rank: 1,
        },
      },
    ]);

    const items = results.map((row) => ({
      rank: row.rank,
      userId: String(row._id),
      username: row.username,
      displayName: row.displayName,
      profileImageUrl: row.profileImage?.url ?? null,
      lifetimeXp: row.lifetimeXp,
    }));

    // Compute current user's rank and XP if authenticated
    let currentUserMeta: { rank: number; lifetimeXp: number } | null = null;

    if (ctx?.user) {
      // Ranks count competitions: ties share the rank of the worst member, so a
      // user's rank is 1 + (# ACTIVE users with strictly more XP). An indexed
      // count replaces a second full-collection $setWindowFields pass.
      const aboveCount = await User.countDocuments({
        accountStatus: "ACTIVE",
        lifetimeXp: { $gt: ctx.user.lifetimeXp },
      });
      currentUserMeta = {
        rank: aboveCount + 1,
        lifetimeXp: ctx.user.lifetimeXp,
      };
    }

    // Count total ACTIVE users for metadata
    const totalCount = await User.countDocuments({
      accountStatus: "ACTIVE",
    });

    return NextResponse.json({
      items,
      meta: {
        totalRanked: totalCount,
        currentUser: currentUserMeta,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
