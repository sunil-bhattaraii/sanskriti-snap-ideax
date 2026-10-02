export interface ArtifactDetail {
  id: string;
  name: string;
  description: string;
  story: string;
  category: string;
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  human_readable_location: string;
  verification_radius_m: number;
  story_unlock_radius_m: number;
  xp_value: number;
  reference_images: string[];
  requires_snap?: boolean;
  requires_cv?: boolean;
  warnings?: string[];
}

export interface DiscoveryStatus {
  isDiscovered: boolean;
  isStoryUnlocked: boolean;
  distanceToArtifact: number | null;
}

export interface ExploreArtifact {
  id: string;
  name: string;
  description: string;
  category: string;
  reference_images: string[];
  xp_value: number;
  lat: number;
  lng: number;
  distance: number;
}
