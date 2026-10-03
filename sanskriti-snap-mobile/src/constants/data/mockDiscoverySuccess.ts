// src/data/mockDiscoverySuccess.ts

export interface DiscoverySuccessData {
  placeName: string;
  rarity: string;
  imageUrl: string;
  xpEarned: number;
  pointsEarned: number;
  quest: {
    name: string;
    progress: number;
    total: number;
  };
  badge: {
    name: string;
    icon: string;
  };
}

export const MOCK_DISCOVERY_SUCCESS: DiscoverySuccessData = {
  placeName: "Krishna Mandir",
  rarity: "RARE ARTIFACT",
  imageUrl:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
  xpEarned: 150,
  pointsEarned: 150,
  quest: {
    name: "Hidden Patan",
    progress: 4,
    total: 5,
  },
  badge: {
    name: "Heritage Explorer",
    icon: "medal",
  },
};
