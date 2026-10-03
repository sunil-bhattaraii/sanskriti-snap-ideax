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
const CACHE_TTL_MS = 60 * 60 * 1000;
const NEPAL_CENTER = { lat: 28.25, lng: 84.0 };
const NEPAL_RADIUS_M = 500_000;

let catalogPromise: Promise<NepalSearchArtifact[]> | null = null;

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

export async function searchNepalArtifacts(query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const response = await apiRequest<{ items: Array<Record<string, unknown>> }>(
    `/artifacts/search?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
  );

  return response.items
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
  const response = await apiRequest<{ items: Array<Record<string, unknown>> }>(
    `/artifacts/nearby?latitude=${lat}&longitude=${lng}&radiusMeters=${radiusMeters}`,
  );
  return response.items
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
}
