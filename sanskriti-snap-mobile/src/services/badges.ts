import { apiRequest } from './api';

export interface Badge {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  isUnlocked: boolean;
}

export interface BadgesData {
  currentCount: number;
  totalCount: number;
  badges: Badge[];
}

export async function getBadges(_userId?: string): Promise<BadgesData> {
  const result = await apiRequest<{ badges: Badge[] } | Badge[]>('/badges');
  const badges = Array.isArray(result) ? result : result.badges;
  return {
    currentCount: badges.filter((badge) => badge.isUnlocked).length,
    totalCount: badges.length,
    badges,
  };
}
