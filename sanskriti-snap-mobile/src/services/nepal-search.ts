import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

export type NepalSearchArtifact = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  reference_images: string[];
  human_readable_location: string;
  xp_value: number;
  verification_radius_m: number;
  requires_snap: boolean;
  warnings: string | null;
  discovery_count: number;
  distance_m: number;
  lat: number;
  lng: number;
};

const CACHE_KEY = '@sanskriti_nepal_search_catalog_v1';
const MAX_CACHED = 200;

function isNepalCoordinate(lat: number, lng: number) {
  return lat >= 26.3 && lat <= 30.5 && lng >= 80 && lng <= 88.3;
}

function normalizeArtifact(item: any): NepalSearchArtifact | null {
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!item?.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!isNepalCoordinate(lat, lng)) return null;

  return {
    id: item.id,
    name: item.name ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    reference_images: Array.isArray(item.reference_images) ? item.reference_images : [],
    human_readable_location: item.human_readable_location ?? '',
    xp_value: Number(item.xp_value) || 0,
    verification_radius_m: Number(item.verification_radius_m) || 0,
    requires_snap: Boolean(item.requires_snap),
    warnings: item.warnings ?? null,
    discovery_count: Number(item.discovery_count) || 0,
    distance_m: Number(item.distance_m) || 0,
    lat,
    lng,
  };
}

/** Previously fetched search results, for offline fallback. */
export async function readNepalSearchCache(): Promise<NepalSearchArtifact[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as NepalSearchArtifact[]) : [];
  } catch (error) {
    console.warn('Unable to read search cache:', error);
    return [];
  }
}

async function writeSearchCache(items: NepalSearchArtifact[]) {
  const existing = await readNepalSearchCache();
  const merged = new Map<string, NepalSearchArtifact>();
  [...existing, ...items].forEach((item) => merged.set(item.id, item));
  const next = [...merged.values()].slice(-MAX_CACHED);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
}

async function searchCacheLocally(query: string, limit: number): Promise<NepalSearchArtifact[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];
  const catalog = await readNepalSearchCache();
  return catalog
    .filter((item) =>
      [item.name, item.category, item.human_readable_location, ...item.tags]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    )
    .slice(0, limit);
}

export async function searchNepalArtifacts(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  try {
    const response = await apiRequest<{ items: Record<string, unknown>[] }>(
      `/artifacts/search?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
    );

    const items = response.items
      .map((item) =>
        normalizeArtifact({
          ...item,
          lat: item.latitude,
          lng: item.longitude,
          reference_images: item.coverImageUrl ? [item.coverImageUrl] : [],
          human_readable_location: item.humanReadableLocation,
          xp_value: item.xpReward,
          discovery_count: item.discoveryCount,
        }),
      )
      .filter((artifact): artifact is NepalSearchArtifact => artifact !== null);

    await writeSearchCache(items).catch(() => undefined);
    return items;
  } catch (error) {
    console.warn('Search failed offline - using cached catalog:', error);
    return searchCacheLocally(normalizedQuery, 8);
  }
}

function distanceInMeters(
  firstLat: number,
  firstLng: number,
  secondLat: number,
  secondLng: number
) {
  const earthRadius = 6371000;
  const latDelta = ((secondLat - firstLat) * Math.PI) / 180;
  const lngDelta = ((secondLng - firstLng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((firstLat * Math.PI) / 180) *
    Math.cos((secondLat * Math.PI) / 180) *
    Math.sin(lngDelta / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getNearbyNepalArtifacts(
  lat: number,
  lng: number,
  radiusMeters = 5000
) {
  try {
    const response = await apiRequest<{ items: Record<string, unknown>[] }>(
      `/artifacts/nearby?latitude=${lat}&longitude=${lng}&radiusMeters=${radiusMeters}`,
    );
    const items = response.items
      .map((item) => normalizeArtifact({
        ...item,
        lat: item.latitude,
        lng: item.longitude,
        reference_images: item.coverImageUrl ? [item.coverImageUrl] : [],
        human_readable_location: item.humanReadableLocation,
        xp_value: item.xpReward,
        discovery_count: item.discoveryCount,
        distance_m: item.distanceMeters,
      }))
      .filter((artifact): artifact is NepalSearchArtifact => artifact !== null);
    await writeSearchCache(items).catch(() => undefined);
    return items;
  } catch (error) {
    console.warn('Nearby fetch failed offline - using cached catalog:', error);
    return readNepalSearchCache().then((catalog) =>
      catalog
        .map((item) => ({ ...item, distance_m: distanceInMeters(lat, lng, item.lat, item.lng) }))
        .filter((item) => item.distance_m <= radiusMeters)
        .sort((a, b) => a.distance_m - b.distance_m)
        .slice(0, 50),
    );
  }
}
