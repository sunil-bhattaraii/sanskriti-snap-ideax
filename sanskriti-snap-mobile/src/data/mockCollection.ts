// src/data/mockCollection.ts
export interface CollectionItem {
  id: string;
  name: string;
  location: string;
  xp: number;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Epic';
  image: string;
  discovered: boolean;
}

export interface CollectionStats {
  totalDiscoveries: number;
  lifetimeXP: number;
}

export const mockCollectionStats: CollectionStats = {
  totalDiscoveries: 12,
  lifetimeXP: 1800,
};

export const mockCollectionItems: CollectionItem[] = [
  {
    id: 'artifact_001',
    name: 'Krishna Mandir',
    location: 'Patan',
    xp: 150,
    rarity: 'Rare',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdm8gR5xTFCTjsPcikXQnx5JgqpOujWvB_AQtg8eSTlabxxkH3WtYDOpq3mN53eSmlX5V_Y0tBAduMIMmjQPfXg9GYB4qCLNIjjJV9azeKIR-7KW5PjP60cX93bJjNA6dXWpW3OjPZUZdl-Gg3RWRZ3KwIO2LD6_-3Ulfe3ZRbAD6IYprrI7p2nR72A7UyKuzlB49YrmfbGuGAT9QFVM3FrfOyFaZuLi3PkpgtFMJBdZOM8kiNv6TM',
    discovered: true,
  },
  {
    id: 'artifact_002',
    name: 'Golden Window',
    location: 'Bhaktapur',
    xp: 300,
    rarity: 'Legendary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASaVz_906RO2OyeTVr22JEMxFnAq4LL7e-w-09gPtq4eL7wXZF5VSab-Q-GI5sSHMUd005BB9SoBjbLWCWbcJgThpQp97cy7eOK9poubaCMf577qoJNQskcQ2jKbZMiSsrZ-SdNvu9__XdiNAzzVH7JbqTmHkWtMweT53zzm0Z4CKZKQvMKo-3f8zRnDq1wIETEm6gT98c4igP4WBg4kaSXRWqOWBWSvGs1ysUdDS2Du-_S2jT8gCm',
    discovered: true,
  },
  {
    id: 'artifact_003',
    name: 'Stone Spout',
    location: 'Kathmandu',
    xp: 50,
    rarity: 'Common',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm31fo8q_Jc3ldSI58ZOKKMZObj2G6GuLj1-6umiRwwx_MlSC1IAfKYQlPmUZGqSngLWHBvzu4g_xgFHJkAJcRT6IHMl7SZnTFdnA3rCKZIfENZMZy0Qt5c6RqktycS-SxT5kO3st_XYIMP11UAo20-6wDA8vhl5_LDE6V1tlsC0djaThNgbM8m_myKdLtTSnVWlhcIdS1qV8EeqWBG3vevEWkKeOeZk3YOYcQGc5sHiO-A0rfB1Mo',
    discovered: true,
  },
  {
    id: 'empty_001',
    name: '',
    location: '',
    xp: 0,
    rarity: 'Common',
    image: '',
    discovered: false,
  },
];

export const getRarityConfig = (rarity: string) => {
  const configs: Record<string, { badgeColor: string; textColor: string; borderColor: string }> = {
    Common: {
      badgeColor: '#FFFFFF',
      textColor: '#6B7280',
      borderColor: '#E5E7EB',
    },
    Rare: {
      badgeColor: '#3B82F6',
      textColor: '#FFFFFF',
      borderColor: '#3B82F6',
    },
    Epic: {
      badgeColor: '#A855F7',
      textColor: '#FFFFFF',
      borderColor: '#A855F7',
    },
    Legendary: {
      badgeColor: '#F59E0B',
      textColor: '#FFFFFF',
      borderColor: '#F59E0B',
    },
  };
  return configs[rarity] || configs.Common;
};