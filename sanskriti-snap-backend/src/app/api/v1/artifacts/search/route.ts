import { type NextRequest, NextResponse } from "next/server";

import { requireAuthContext } from "@/lib/auth";
import { SearchQuery, type ArtifactSummary } from "@/lib/contracts";
import { connect } from "@/lib/db";
import { ApiError, toErrorResponse } from "@/lib/errors";
import { Artifact } from "@/models/artifact";

type ArtifactListDoc = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  category: ArtifactSummary["category"];
  tags: string[];
  location: { coordinates: number[] };
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  discoveryCount: number;
  coverImageUrl: string | null;
  rarity: ArtifactSummary["rarity"];
};

function toArtifactSummary(doc: ArtifactListDoc): ArtifactSummary {
  const [longitude, latitude] = doc.location.coordinates;
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    tags: doc.tags ?? [],
    latitude,
    longitude,
    humanReadableLocation: doc.humanReadableLocation,
    storyUnlockRadiusMeters: doc.storyUnlockRadiusMeters,
    verificationRadiusMeters: doc.verificationRadiusMeters,
    xpReward: doc.xpReward,
    requiresSnap: doc.requiresSnap,
    requiresCV: doc.requiresCV,
    warnings: doc.warnings ?? null,
    discoveryCount: doc.discoveryCount,
    coverImageUrl: doc.coverImageUrl ?? null,
    rarity: doc.rarity,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthContext();
    await connect();

    const { searchParams } = new URL(request.url);
    const parsed = SearchQuery.safeParse({
      q: searchParams.get("q"),
      category: searchParams.get("category") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      throw ApiError.validation("Invalid search parameters.", {
        fields: Object.fromEntries(
          Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
            key,
            value?.[0] ?? "Invalid value",
          ]),
        ),
      });
    }

    const { q, category, limit } = parsed.data;
    const query = q.trim();
    const filter: Record<string, unknown> = { status: "PUBLISHED" };
    if (category) filter.category = category;

    const docs = await Artifact.find({
      ...filter,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
        { humanReadableLocation: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ discoveryCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      items: (docs as ArtifactListDoc[]).map((doc) => toArtifactSummary(doc)),
      meta: { count: docs.length, query },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
