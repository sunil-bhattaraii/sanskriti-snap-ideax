import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { connect } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";
import { Contribution } from "@/models/community";
import { Quest } from "@/models/gamification";
import { User } from "@/models/user";
import { VerificationAttempt } from "@/models/verification";

export async function GET() {
  try {
    await requireAdmin();
    await connect();

    const [
      users,
      publishedArtifacts,
      pendingContributions,
      flaggedVerifications,
      activeQuests,
    ] = await Promise.all([
      User.countDocuments({ accountStatus: { $ne: "DELETED" } }),
      Artifact.countDocuments({ status: "PUBLISHED" }),
      Contribution.countDocuments({
        status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
      }),
      VerificationAttempt.countDocuments({ status: "FLAGGED" }),
      Quest.countDocuments({ status: "ACTIVE" }),
    ]);

    return NextResponse.json({
      stats: {
        users,
        publishedArtifacts,
        pendingContributions,
        flaggedVerifications,
        activeQuests,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
