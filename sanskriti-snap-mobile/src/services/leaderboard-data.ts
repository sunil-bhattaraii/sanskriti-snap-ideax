import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';
import { getLevelFromXp, type LeaderboardUser } from '@/types/leaderboard';

const CACHE_KEY = '@sanskriti_leaderboard_v1';
const CACHE_TTL_MS = 60 * 60 * 1000;
let warmupPromise: Promise<LeaderboardUser[]> | null = null;

async function fetchLeaderboard(): Promise<LeaderboardUser[]> {
  const data = await apiRequest<{
    items: Array<{
      userId: string;
      username: string;
      displayName: string;
      profileImageUrl: string | null;
      lifetimeXp: number;
      rank: number;
    }>;
  }>('/leaderboard');
  return data.items.map((row) => ({
    id: row.userId,
    username: row.username,
    display_name: row.displayName,
    profile_image_url: row.profileImageUrl,
    lifetime_xp: row.lifetimeXp,
    rank: row.rank,
    level: getLevelFromXp(row.lifetimeXp),
  }));
}

export async function readLeaderboardCache(): Promise<LeaderboardUser[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { savedAt: number; users: LeaderboardUser[] };
    return Date.now() - cached.savedAt < CACHE_TTL_MS ? cached.users : null;
  } catch (error) {
    console.warn('Unable to read leaderboard cache:', error);
    return null;
  }
}

export function warmLeaderboardCache(): Promise<LeaderboardUser[]> {
  if (!warmupPromise) {
    warmupPromise = fetchLeaderboard()
      .then(async (users) => {
        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ savedAt: Date.now(), users })
        );
        return users;
      })
      .finally(() => {
        warmupPromise = null;
      });
  }
  return warmupPromise;
}
