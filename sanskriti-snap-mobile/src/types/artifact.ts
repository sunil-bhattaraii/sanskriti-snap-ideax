export type ArtifactDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  story?: string;
  category: string;
  tags: string[];
  latitude: number;
  longitude: number;
  humanReadableLocation: string;
  storyUnlockRadiusMeters: number;
  verificationRadiusMeters: number;
  xpReward: number;
  requiresSnap: boolean;
  requiresCV: boolean;
  warnings: string | null;
  discoveryCount: number;
  coverImageUrl: string | null;
  rarity: string;
  distanceMeters?: number | null;
  altitudeMeters: number | null;
  referenceImageUrls: string[];
  discovered: boolean;
  discoveredAt: string | null;
  questIds: string[];
  attemptSummary: {
    latestAttemptId: string | null;
    latestAttemptStatus: string | null;
  };
  storyUnlocked: boolean;
  reference_images: string[];
  human_readable_location: string;
  story_unlock_radius_m: number;
};

export type DiscoveryStatus = {
  isDiscovered: boolean;
  isStoryUnlocked: boolean;
  distanceToArtifact: number | null;
};
