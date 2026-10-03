import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedImageUri } from './image-cache';

export const FEATURED_CACHE_TTL_MS = 60 * 60 * 1000;

export type CachedFeaturedArtifact = {
  id: string;
  name: string;
  description: string;
  xp: number;
  imageUrl: string;
  discoveryCount: number;
};

type FeaturedCacheEntry = {
  area: string;
  fetchedAt: number;
  artifacts: CachedFeaturedArtifact[];
};

const CACHE_KEY = '@sanskriti_featured_artifacts_v1';

export function getFeaturedCacheArea(
  latitude?: number,
  longitude?: number,
) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'global';
  }
  return `nearby-${latitude!.toFixed(2)}-${longitude!.toFixed(2)}`;
}

export async function readFeaturedCache(): Promise<FeaturedCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FeaturedCacheEntry;
    if (
      !parsed ||
      !Array.isArray(parsed.artifacts) ||
      typeof parsed.fetchedAt !== 'number' ||
      typeof parsed.area !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Unable to read featured artifact cache:', error);
    return null;
  }
}

export async function writeFeaturedCache(
  area: string,
  artifacts: CachedFeaturedArtifact[],
) {
  const entry: FeaturedCacheEntry = {
    area,
    fetchedAt: Date.now(),
    artifacts,
  };
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.warn('Unable to write featured artifact cache:', error);
  }
}

export async function cacheFeaturedImages(artifacts: CachedFeaturedArtifact[]) {
  await Promise.all(
    artifacts
      .map((artifact) => artifact.imageUrl)
      .filter(Boolean)
      .map((imageUrl) => getCachedImageUri(imageUrl)),
  );
}
