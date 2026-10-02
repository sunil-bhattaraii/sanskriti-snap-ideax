/**
 * The discovery award transaction.
 *
 * Extracted from `processVerificationAttempt` because two callers now grant the
 * same reward: the synchronous verification pipeline (docs/API Contract.md 6.2)
 * and an admin approving a `FLAGGED` attempt (9). Both must produce the same
 * ledger entries, so the body lives in exactly one place.
 *
 * The caller owns the transaction and passes its `session`. Everything here is
 * Mongo-only and takes the session on every operation: `withTransaction` may run
 * its callback more than once, so nothing in this module may do network I/O,
 * allocate Cloudinary state, or lean on an in-memory counter that a retry would
 * double. The user's points balance is therefore read inside the callback rather
 * than passed in.
 */

import { Types } from "mongoose";
import type { ClientSession } from "./db";
import type { ArtifactCategory } from "./contracts";
import { Artifact } from "@/models/artifact";
import {
  Badge,
  PointsTransaction,
  Quest,
  UserBadge,
  UserQuestProgress,
  XpTransaction,
} from "@/models/gamification";
import { User } from "@/models/user";
import { Discovery, VerificationAttempt } from "@/models/verification";

export type AwardableArtifact = {
  _id: Types.ObjectId;
  xpReward: number;
  /**
   * The enum, not `string`: `Artifact.find({ category })` below is typed against
   * the model's enum, and widening this to `string` moves the error to the query
   * instead of catching a bad category at the boundary.
   */
  category: ArtifactCategory;
};

export type DiscoveryAwardReceipt = {
  discoveryId: string;
  xpAwarded: number;
  pointsAwarded: number;
  pointsBalance: number;
  quest: { id: string; discoveredCount: number; artifactCount: number } | null;
  badge: { name: string; iconUrl: string | null } | null;
};

/**
 * Turns an attempt that has already been accepted into a Discovery and pays out
 * everything it earns: XP, points, quest progress and badges.
 *
 * The attempt row must exist before this is called — the verification pipeline
 * writes it first inside the same transaction, and the admin approval path is
 * mutating one that already does. The only thing written back to it here is the
 * `discoveryId` link.
 */
export async function grantDiscoveryAwards(
  session: ClientSession,
  params: {
    userId: Types.ObjectId;
    artifact: AwardableArtifact;
    attemptId: Types.ObjectId;
    discoveredAt?: Date;
  },
): Promise<DiscoveryAwardReceipt> {
  const { userId, artifact, attemptId } = params;
  const discoveredAt = params.discoveredAt ?? new Date();

  const [discovery] = await Discovery.create(
    [
      {
        userId,
        artifactId: artifact._id,
        verificationAttemptId: attemptId,
        discoveredAt,
        xpAwarded: artifact.xpReward,
      },
    ],
    { session },
  );

  await VerificationAttempt.findByIdAndUpdate(
    attemptId,
    { $set: { discoveryId: discovery._id } },
    { session },
  );

  await Artifact.findByIdAndUpdate(
    artifact._id,
    { $inc: { discoveryCount: 1 } },
    { session },
  );

  // Read the balance inside the callback: a retry must start from the committed
  // value, not from whatever the caller saw before the transaction opened.
  const user = await User.findById(userId)
    .select("pointsBalance")
    .session(session)
    .lean();

  const discoveryXp = artifact.xpReward;
  const discoveryPoints = artifact.xpReward;
  let runningPointsBalance = (user?.pointsBalance ?? 0) + discoveryPoints;
  let totalXpGained = discoveryXp;

  await XpTransaction.create(
    [
      {
        userId,
        amount: discoveryXp,
        type: "DISCOVERY",
        referenceType: "DISCOVERY",
        referenceId: discovery._id,
      },
    ],
    { session },
  );

  await PointsTransaction.create(
    [
      {
        userId,
        type: "EARNED",
        amount: discoveryPoints,
        balanceAfter: runningPointsBalance,
        reason: "DISCOVERY",
        referenceId: discovery._id,
      },
    ],
    { session },
  );

  let completedQuestReceipt: DiscoveryAwardReceipt["quest"] = null;

  const affectedQuests = await Quest.find({
    status: "ACTIVE",
    artifactIds: artifact._id,
  }).session(session);

  for (const quest of affectedQuests) {
    let progress = await UserQuestProgress.findOne({
      userId,
      questId: quest._id,
    }).session(session);

    if (!progress) {
      progress = new UserQuestProgress({
        userId,
        questId: quest._id,
        discoveredArtifactIds: [],
      });
    }

    const alreadyTracked = progress.discoveredArtifactIds.some(
      (id) => String(id) === String(artifact._id),
    );

    if (!alreadyTracked) {
      progress.discoveredArtifactIds.push(artifact._id);
    }

    const allFound = quest.artifactIds.every((requiredId) =>
      progress.discoveredArtifactIds.some(
        (foundId) => String(foundId) === String(requiredId),
      ),
    );

    if (allFound && !progress.completedAt) {
      progress.completedAt = new Date();

      if (quest.xpReward > 0) {
        runningPointsBalance += quest.xpReward;
        totalXpGained += quest.xpReward;

        await XpTransaction.create(
          [
            {
              userId,
              amount: quest.xpReward,
              type: "QUEST_COMPLETION",
              referenceType: "QUEST",
              referenceId: quest._id,
            },
          ],
          { session },
        );

        await PointsTransaction.create(
          [
            {
              userId,
              type: "EARNED",
              amount: quest.xpReward,
              balanceAfter: runningPointsBalance,
              reason: "QUEST_COMPLETION",
              referenceId: quest._id,
            },
          ],
          { session },
        );
      }

      if (!completedQuestReceipt) {
        completedQuestReceipt = {
          id: String(quest._id),
          discoveredCount: progress.discoveredArtifactIds.length,
          artifactCount: quest.artifactIds.length,
        };
      }
    }

    await progress.save({ session });
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $inc: { lifetimeXp: totalXpGained },
      $set: { pointsBalance: runningPointsBalance },
    },
    { session },
  );

  let awardedBadgeReceipt: DiscoveryAwardReceipt["badge"] = null;

  // Sequential, not `Promise.all`: the driver documents concurrent operations on
  // one session as undefined behaviour.
  const activeBadges = await Badge.find({ status: "ACTIVE" }).session(session);
  const userEarnedBadges = await UserBadge.find({ userId }).session(session);
  const totalUserDiscoveries = await Discovery.countDocuments({ userId }).session(
    session,
  );

  const earnedBadgeIds = new Set(
    userEarnedBadges.map((userBadge) => String(userBadge.badgeId)),
  );

  for (const badge of activeBadges) {
    if (earnedBadgeIds.has(String(badge._id))) continue;

    let earned = false;

    switch (badge.condition.type) {
      case "FIRST_DISCOVERY":
        earned = totalUserDiscoveries >= 1;
        break;

      case "DISCOVERY_COUNT":
        earned = totalUserDiscoveries >= (badge.condition.value ?? 1);
        break;

      case "CATEGORY_COUNT": {
        // The badge's own category if it named one, else the category of the
        // artifact that just triggered the check. `condition.category` is stored
        // as a plain string, so it is narrowed here rather than at the query.
        const targetCategory = (badge.condition.category ??
          artifact.category) as ArtifactCategory;

        const categoryArtifacts = await Artifact.find({ category: targetCategory })
          .select("_id")
          .lean()
          .session(session);

        const categoryDiscoveries = await Discovery.countDocuments({
          userId,
          artifactId: { $in: categoryArtifacts.map((a) => a._id) },
        }).session(session);

        earned = categoryDiscoveries >= (badge.condition.value ?? 1);
        break;
      }

      case "QUEST_COMPLETION": {
        if (badge.condition.questId) {
          const completed = await UserQuestProgress.findOne({
            userId,
            questId: badge.condition.questId,
            completedAt: { $ne: null },
          }).session(session);

          earned = Boolean(completed);
        } else {
          const anyCompleted = await UserQuestProgress.countDocuments({
            userId,
            completedAt: { $ne: null },
          }).session(session);

          earned = anyCompleted >= 1;
        }
        break;
      }
    }

    if (!earned) continue;

    await UserBadge.create(
      [
        {
          userId,
          badgeId: badge._id,
          discoveryId: discovery._id,
          earnedAt: new Date(),
        },
      ],
      { session },
    );

    if (!awardedBadgeReceipt) {
      awardedBadgeReceipt = {
        name: badge.name,
        iconUrl: badge.iconUrl ?? null,
      };
    }
  }

  return {
    discoveryId: String(discovery._id),
    xpAwarded: discoveryXp,
    pointsAwarded: discoveryPoints,
    pointsBalance: runningPointsBalance,
    quest: completedQuestReceipt,
    badge: awardedBadgeReceipt,
  };
}
