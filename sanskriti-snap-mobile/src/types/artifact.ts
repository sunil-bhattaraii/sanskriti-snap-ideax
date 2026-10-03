import type { Database } from '@/services/backendClient';

// Extract the exact Row type for the artifacts table
export type ArtifactDetail = Database['public']['Tables']['artifacts']['Row'];

// Optional: If you need to override the 'unknown' location type for PostGIS
// to make your component code cleaner, you can intersect it like this:
// export type ArtifactDetail = Database['public']['Tables']['artifacts']['Row'] & {
//   location?: { type: string; coordinates: [number, number] } | null;
// };

export type DiscoveryStatus = {
  isDiscovered: boolean;
  isStoryUnlocked: boolean;
  distanceToArtifact: number | null;
};
