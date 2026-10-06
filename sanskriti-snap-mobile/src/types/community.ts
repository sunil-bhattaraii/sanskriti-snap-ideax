export type CommunitySnapAuthor = {
  username: string;
  displayName: string;
  profileImageUrl: string | null;
};

export type CommunitySnap = {
  id: string;
  imageUrl: string;
  caption: string | null;
  author: CommunitySnapAuthor | null;
  createdAt: string;
};

export type CommunitySnapsPage = {
  items: CommunitySnap[];
  page: { nextCursor: string | null; hasMore: boolean };
};