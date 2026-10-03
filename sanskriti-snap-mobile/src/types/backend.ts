export type Profile = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  role: 'USER' | 'EXPERT' | 'ADMIN';
  lifetimeXp: number;
  pointsBalance: number;
  notifications: {
    enabled: boolean;
    radiusMeters: number;
  };
};

export type ProfileSummary = {
  profile: Profile;
  stats: {
    discoveryCount: number;
    questCount: number;
    completedQuestCount: number;
    badgeCount: number;
    rank: number;
    totalUsers: number;
  };
};

export type ArtifactSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  distanceMeters?: number;
};

export type ArtifactDetail = ArtifactSummary & {
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
  story?: string;
};
