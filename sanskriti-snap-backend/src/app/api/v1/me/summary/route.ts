/**
 * docs/API Contract.md 4 — profile screen aggregate.
 *
 * Replaces the separate `user_quest_progress` read the client used to make, so
 * the numbers are counted here rather than assembled from several round trips.
 *
 * `questCount` is the number of quests the caller has progress on, not the
 * number that exist: the screen reads "2 of 5". `rank` and `totalUsers` are both
 * computed over `accountStatus: "ACTIVE"` so they agree with each other and with
 * the leaderboard (docs/API Contract.md 7.6), and rank is competition-ranked --
 * users level on XP share a rank, so it is not an array index.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth";
import type { ProfileSummary } from "@/lib/contracts";
import { toErrorResponse } from "@/lib/errors";
import { loadOwnProfile } from "@/lib/profile";
import { User } from "@/models/user";
import { UserBadge, UserQuestProgress } from "@/models/gamification";
import { Discovery } from "@/models/verification";

export async function GET() {
  try {
    const { user } = await requireAuthContext();
    const userId = user._id;

    const [
      profile,
      discoveryCount,
      questCount,
      completedQuestCount,
      badgeCount,
      usersAhead,
      totalUsers,
    ] = await Promise.all([
      loadOwnProfile(userId),
      Discovery.countDocuments({ userId }),
      UserQuestProgress.countDocuments({ userId }),
      UserQuestProgress.countDocuments({ userId, completedAt: { $ne: null } }),
      UserBadge.countDocuments({ userId }),
      // Strictly greater, so everyone tied on this XP shares one rank.
      User.countDocuments({
        accountStatus: "ACTIVE",
        lifetimeXp: { $gt: user.lifetimeXp },
      }),
      User.countDocuments({ accountStatus: "ACTIVE" }),
    ]);

    const body: ProfileSummary = {
      profile,
      stats: {
        discoveryCount,
        questCount,
        completedQuestCount,
        badgeCount,
        rank: usersAhead + 1,
        totalUsers,
      },
    };

    return NextResponse.json(body);
  } catch (err) {
    return toErrorResponse(err);
  }
}
