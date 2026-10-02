// src/data/mockQuests.ts
export interface Quest {
  id: string;
  title: string;
  description: string;
  image: string;
  currentProgress: number;
  totalProgress: number;
  xpReward: number;
  hasBadgeReward: boolean;
  isFeatured: boolean; // Represents the star icon
}

export const mockQuests: Quest[] = [
  {
    id: 'quest_001',
    title: 'Hidden Patan',
    description: 'Discover 5 overlooked shrines in the heart of Patan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9usLEAYTa_VyU9LMLoAMk7aM3oO8lAIE2_dlBez3wAaddEHnmJ2mVpp8XapYbK41waIRd6uo3QxR6Q-pHcEnWOVhB7b26pkNyPypTw4v6tQnMSTlHYei3yw2e2YD4sRGoDfNKaPULre34Rcy0UK45aePlhfnjnYymsKjSP5gbG9mtpKgcoM2hXliPqyZYwofEOC51bi7Fu960fHpdPdy-2mbcUxvqdznMDaB6cheYtFhhrb0rnbtj',
    currentProgress: 3,
    totalProgress: 5,
    xpReward: 500,
    hasBadgeReward: true,
    isFeatured: true,
  },
  {
    id: 'quest_002',
    title: 'Stupa Explorer',
    description: 'Visit and document 3 ancient stupas in the Kathmandu Valley.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4XsNeEoP2OYaaeNkG0ok-eoxNl47qZ-mtbgp0yTTcNDcDCdvzbXb7HqxwxUIV4XClf5zfLdlKAIDRI1v6jWaEfE_ZEW5nf5_lQOldNEr_oZF6zVTE4yHr9Kfg7zXw0BJydXX3b9LWR-eA-yjVBo81TJehf2FY5_W49bP_jHRc-mdQ2eBGRBj5jeM9BkGjmrz_Lr-v7ZUEZIypR2SY02qJT4uQ8GvWJpM2Q6GNzdQXbT9zPaQdhlJ4',
    currentProgress: 1,
    totalProgress: 3,
    xpReward: 300,
    hasBadgeReward: false,
    isFeatured: false,
  },
  {
    id: 'quest_003',
    title: 'Malla Dynasty Trails',
    description: 'Complete the grand tour of the three major Durbar Squares.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAK6K2Wp5u8sUVFktPznX1L-UzCai5zaGabm7L48GPlXzdgrZi29cegbTRXL7VG1BNjrzNfziV1OL2hehbslZxInA6XQ0FSlzK4unQJP-VeAUtn4jzJ3lSlbKrH0RBwOEtbuTjpeEUVlLTHdt3cJ3fYGb3XX9cpH6id0_GpaIaMUZL4OOjQNDvG0dx015IvBQZtnO3vkClzBSShhi5Zf8rnBc0PZ-Du-Kua0LNFHT9U4KMLFEZdo79b',
    currentProgress: 0,
    totalProgress: 3,
    xpReward: 1000,
    hasBadgeReward: true,
    isFeatured: true,
  },
];

export type QuestFilter = 'All Quests' | 'In Progress' | 'Completed';