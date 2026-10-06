import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import CommunityBar from '../ArtifactDetail/CommunityBar';
import { fetchArtifactSnaps } from '@/services/community';
import type { CommunitySnap } from '@/types/community';

jest.mock('@/services/community', () => ({
  fetchArtifactSnaps: jest.fn(),
}));

const mockFetchArtifactSnaps = fetchArtifactSnaps as jest.Mock;

const SNAPS: CommunitySnap[] = [
  {
    id: 'a',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
    caption: null,
    author: { username: 'ram', displayName: 'Ram', profileImageUrl: null },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/b.jpg',
    caption: 'Nice!',
    author: { username: 'sita', displayName: 'Sita', profileImageUrl: null },
    createdAt: new Date().toISOString(),
  },
];

afterEach(() => {
  jest.clearAllMocks();
});

test('renders snapshots and the view-all link', async () => {
  mockFetchArtifactSnaps.mockResolvedValue(SNAPS);

  await render(<CommunityBar artifactId="abc" onOpenGallery={() => {}} />);

  const thumbnails = await screen.findAllByTestId('community-thumbnail');
  expect(thumbnails).toHaveLength(2);
  expect(screen.getByText('View all')).toBeTruthy();
  expect(mockFetchArtifactSnaps).toHaveBeenCalledWith('abc', 6);
});

test('renders nothing when there are no snapshots', async () => {
  mockFetchArtifactSnaps.mockResolvedValue([]);

  const { toJSON } = await render(
    <CommunityBar artifactId="abc" onOpenGallery={() => {}} />
  );

  await waitFor(() => expect(mockFetchArtifactSnaps).toHaveBeenCalled());
  await waitFor(() => expect(toJSON()).toBeNull());
});