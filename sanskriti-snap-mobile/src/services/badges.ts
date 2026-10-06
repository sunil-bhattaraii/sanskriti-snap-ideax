import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiRequestError, apiRequest } from './api';

const BADGES_CACHE_KEY = '@sanskriti_badges_v1';

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

type BackendBadge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  unlocked: boolean;
};

export async function readBadgesCache(): Promise<BadgesData | null> {
  try {
    const raw = await AsyncStorage.getItem(BADGES_CACHE_KEY);
    return raw ? (JSON.parse(raw) as BadgesData) : null;
  } catch (error) {
    console.warn('Unable to read badges cache:', error);
    return null;
  }
}

export async function getBadges(_userId?: string): Promise<BadgesData> {
  try {
    const result = await apiRequest<{
      items?: Array<{
        id: string;
        name: string;
        description: string;
        iconUrl: string | null;
        unlocked: boolean;
      }>;
    } | { badges?: Badge[] } | Badge[]>('/badges');

    const objectResult = result as { items?: BackendBadge[]; badges?: Badge[] };
    const items: Array<BackendBadge | Badge> = Array.isArray(result)
      ? result
      : objectResult.items ?? objectResult.badges ?? [];
    const badges: Badge[] = items.map((badge: BackendBadge | Badge) => ({
      id: badge.id,
      title: 'name' in badge ? badge.name : badge.title,
      description: badge.description,
      imageUrl: 'iconUrl' in badge ? badge.iconUrl : badge.imageUrl,
      isUnlocked: 'unlocked' in badge ? badge.unlocked : badge.isUnlocked,
    }));

    const badgesData = {
      currentCount: badges.filter((badge) => badge.isUnlocked).length,
      totalCount: badges.length,
      badges,
    };
    await AsyncStorage.setItem(BADGES_CACHE_KEY, JSON.stringify(badgesData));
    return badgesData;
  } catch (error) {
    // A missing badge collection is a valid empty state for new users.
    if (error instanceof ApiRequestError && error.status === 404) {
      return { currentCount: 0, totalCount: 0, badges: [] };
    }
    const cached = await readBadgesCache();
    if (cached) return cached;
    throw error;
  }
}
