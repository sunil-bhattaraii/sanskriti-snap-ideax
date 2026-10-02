// src/data/mockBadges.ts
export interface Badge {
  id: string;
  title: string;
  description: string;
  image: string;
  isUnlocked: boolean;
  isNew?: boolean;
}

export interface BadgeProgress {
  current: number;
  total: number;
}

export const mockBadgeProgress: BadgeProgress = {
  current: 8,
  total: 24,
};

export const mockBadges: Badge[] = [
  {
    id: 'badge_001',
    title: 'First Discovery',
    description: 'Logged your very first artifact.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy84BYGz20jj30p9io7HuIvRYX4c8NnrVWpQ1LMMjp_RKwB5RA2ptHxs2_ByCxm3JCFQ0yo-HXHbZcaxeSXxhfRKl1wLX1FSgTb4cAbKaKrqXslK7zhJbsZ2Dra_oE5_OE_YRlHi6FINO0cJXMY7P1T40oTME5mHliwVYq8ST09rpkqrRUDx8mPSfyriDZLL-Up7axpuTCasoNV1FCASglRMMXYgew_yLz2gUYxmYuWEA1jjUM7EtD',
    isUnlocked: true,
    isNew: false,
  },
  {
    id: 'badge_002',
    title: 'Patan Explorer',
    description: 'Found 5 hidden artifacts in Patan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9usLEAYTa_VyU9LMLoAMk7aM3oO8lAIE2_dlBez3wAaddEHnmJ2mVpp8XapYbK41waIRd6uo3QxR6Q-pHcEnWOVhB7b26pkNyPypTw4v6tQnMSTlHYei3yw2e2YD4sRGoDfNKaPULre34Rcy0UK45aePlhfnjnYymsKjSP5gbG9mtpKgcoM2hXliPqyZYwofEOC51bi7Fu960fHpdPdy-2mbcUxvqdznMDaB6cheYtFhhrb0rnbtj',
    isUnlocked: true,
    isNew: true,
  },
  {
    id: 'badge_003',
    title: 'Master Historian',
    description: 'Discover 20 historical artifacts.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCm31fo8q_Jc3ldSI58ZOKKMZObj2G6GuLj1-6umiRwwx_MlSC1IAfKYQlPmUZGqSngLWHBvzu4g_xgFHJkAJcRT6IHMl7SZnTFdnA3rCKZIfENZMZy0Qt5c6RqktycS-SxT5kO3st_XYIMP11UAo20-6wDA8vhl5_LDE6V1tlsC0djaThNgbM8m_myKdLtTSnVWlhcIdS1qV8EeqWBG3vevEWkKeOeZk3YOYcQGc5sHiO-A0rfB1Mo',
    isUnlocked: false,
  },
  {
    id: 'badge_004',
    title: 'Night Owl',
    description: 'Discover 5 artifacts after sunset.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdm8gR5xTFCTjsPcikXQnx5JgqpOujWvB_AQtg8eSTlabxxkH3WtYDOpq3mN53eSmlX5V_Y0tBAduMIMmjQPfXg9GYB4qCLNIjjJV9azeKIR-7KW5PjP60cX93bJjNA6dXWpW3OjPZUZdl-Gg3RWRZ3KwIO2LD6_-3Ulfe3ZRbAD6IYprrI7p2nR72A7UyKuzlB49YrmfbGuGAT9QFVM3FrfOyFaZuLi3PkpgtFMJBdZOM8kiNv6TM',
    isUnlocked: false,
  },
];