import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { apiRequest } from './api';

export type ExploreCoordinate = [number, number];

export type CachedExploreArtifact = {
  id: string;
  name: string;
  description: string;
  category: string;
  reference_images: string[];
  xp_value: number;
  lat: number;
  lng: number;
  distance: number;
};

export type ExploreCache = {
  savedAt: number;
  userLocation: ExploreCoordinate;
  artifacts: CachedExploreArtifact[];
};

const CACHE_KEY = '@sanskriti_explore_cache_v1';
export const EXPLORE_CACHE_TTL_MS = 15 * 60 * 1000;
let warmupPromise: Promise<ExploreCache | null> | null = null;

export async function readExploreCache(): Promise<ExploreCache | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    return cached ? (JSON.parse(cached) as ExploreCache) : null;
  } catch (error) {
    console.warn('Unable to read explore cache:', error);
    return null;
  }
}

export function isExploreCacheFresh(cache: ExploreCache): boolean {
  return Date.now() - cache.savedAt < EXPLORE_CACHE_TTL_MS;
}

async function fetchExploreData(): Promise<ExploreCache | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 30 * 60 * 1000,
    requiredAccuracy: 500,
  });
  const location =
    lastKnown ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));
  const userLocation: ExploreCoordinate = [
    location.coords.longitude,
    location.coords.latitude,
  ];

  const data = await apiRequest<{
    items: Array<Record<string, unknown>>;
  }>(
    `/artifacts/nearby?latitude=${userLocation[1]}&longitude=${userLocation[0]}&radiusMeters=5000`,
  );

  const artifacts: CachedExploreArtifact[] = (data.items || [])
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      description: String(item.description ?? ''),
      category: String(item.category ?? ''),
      reference_images: item.coverImageUrl ? [String(item.coverImageUrl)] : [],
      xp_value: Number(item.xpReward ?? 0),
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      distance: Number(item.distanceMeters ?? 0) / 1000,
    }))
    .filter(
      (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)
    )
    .sort((a, b) => a.distance - b.distance);

  const cache: ExploreCache = {
    savedAt: Date.now(),
    userLocation,
    artifacts,
  };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  return cache;
}

export function warmExploreCache(): Promise<ExploreCache | null> {
  if (!warmupPromise) {
    warmupPromise = fetchExploreData().finally(() => {
      warmupPromise = null;
    });
  }
  return warmupPromise;
}
