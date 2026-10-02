// src/data/mockBadges.ts

export interface Badge {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isUnlocked: boolean;
}

export interface BadgesData {
  currentCount: number;
  totalCount: number;
  badges: Badge[];
}

export const MOCK_BADGES: BadgesData = {
  currentCount: 8,
  totalCount: 24,
  badges: [
    {
      id: "1",
      title: "First Discovery",
      description: "Logged your very first artifact.",
      imageUrl:
        "https://images.unsplash.com/photo-1599940824399-b87987ce0799?w=200&q=80",
      isUnlocked: true,
    },
    {
      id: "2",
      title: "Patan Explorer",
      description: "Found 5 hidden artifacts in Patan.",
      imageUrl:
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=200&q=80",
      isUnlocked: true,
    },
    {
      id: "3",
      title: "Master Historian",
      description: "Unlock by finding 50 artifacts.",
      imageUrl: "",
      isUnlocked: false,
    },
    {
      id: "4",
      title: "Night Owl",
      description: "Discover artifacts at night.",
      imageUrl: "",
      isUnlocked: false,
    },
  ],
};
