import { apiRequest } from './api';
import type { CommunitySnap, CommunitySnapsPage } from '@/types/community';

export type { CommunitySnap, CommunitySnapsPage } from '@/types/community';

export async function fetchArtifactSnaps(
  artifactId: string,
  limit = 100
): Promise<CommunitySnap[]> {
  const data = await apiRequest<CommunitySnapsPage>(
    `/artifacts/${encodeURIComponent(artifactId)}/snaps?limit=${limit}`
  );
  return data.items;
}