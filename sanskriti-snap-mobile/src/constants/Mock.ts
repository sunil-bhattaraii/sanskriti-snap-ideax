// mocks/questData.ts

export interface MockQuest {
    id: string;
    name: string;
    description: string;
    current_progress: number;
    total_progress: number;
    xp_reward: number;
    has_badge_reward: boolean;
    is_favorite: boolean;
}

export const MOCK_QUESTS: MockQuest[] = [
    {
        id: 'quest-hidden-patan-uuid',
        name: 'Hidden Patan',
        description: 'Discover 5 overlooked shrines in the heart of Patan.',
        current_progress: 3,
        total_progress: 5,
        xp_reward: 500,
        has_badge_reward: true,
        is_favorite: true,
    },
    {
        id: 'quest-stupa-explorer-uuid',
        name: 'Stupa Explorer',
        description: 'Visit and document 3 ancient stupas in the Kathmandu Valley.',
        current_progress: 1,
        total_progress: 3,
        xp_reward: 300,
        has_badge_reward: false,
        is_favorite: false,
    },
    {
        id: 'quest-malla-dynasty-uuid',
        name: 'Malla Dynasty Trails',
        description: 'Complete the grand tour of the three major Durbar Squares.',
        current_progress: 0,
        total_progress: 3,
        xp_reward: 1000,
        has_badge_reward: true,
        is_favorite: true,
    },
];

export interface MockUser {
    id: string;
    display_name: string;
    username: string;
    email: string;
    profile_image_url: string | null;
    lifetime_xp: number;
    reward_points: number;
    level: number;
    next_level_xp: number;
    discovery_count: number;
}

export const MOCK_USER: MockUser = {
    id: 'user-123-uuid',
    display_name: 'Manish Karki',
    username: '@manish_k',
    email: 'manish@example.com',
    profile_image_url: null,
    lifetime_xp: 1800,
    reward_points: 450,
    level: 12,
    next_level_xp: 2500,
    discovery_count: 12,
};


export interface LeaderboardUser {
    id: string;
    username: string;
    display_name: string;
    profile_image_url: string | null;
    lifetime_xp: number;
    level: number;
    rank: number;
    isCurrentUser?: boolean;
}

export const MOCK_LEADERBOARD_DATA: LeaderboardUser[] = [
    {
        id: 'user-001',
        username: 'ananya_explores',
        display_name: 'Ananya_Explores',
        profile_image_url: null,
        lifetime_xp: 14200,
        level: 26,
        rank: 1,
    },
    {
        id: 'user-002',
        username: 'rohan_88',
        display_name: 'Rohan_88',
        profile_image_url: null,
        lifetime_xp: 12450,
        level: 23,
        rank: 2,
    },
    {
        id: 'user-003',
        username: 'questmaster',
        display_name: 'QuestMaster',
        profile_image_url: null,
        lifetime_xp: 11100,
        level: 21,
        rank: 3,
    },
    {
        id: 'user-004',
        username: 'yetitracker',
        display_name: 'YetiTracker',
        profile_image_url: null,
        lifetime_xp: 10850,
        level: 20,
        rank: 4,
    },
    {
        id: 'user-005',
        username: 'kathmandukid',
        display_name: 'KathmanduKid',
        profile_image_url: null,
        lifetime_xp: 9400,
        level: 19,
        rank: 5,
    },
    {
        id: 'user-006',
        username: 'mountainman',
        display_name: 'MountainMan',
        profile_image_url: null,
        lifetime_xp: 8200,
        level: 18,
        rank: 6,
    },
    {
        id: 'user-007',
        username: 'templerunner',
        display_name: 'TempleRunner',
        profile_image_url: null,
        lifetime_xp: 7500,
        level: 17,
        rank: 7,
    },
    {
        id: 'user-008',
        username: 'stupaseeker',
        display_name: 'StupaSeeker',
        profile_image_url: null,
        lifetime_xp: 6800,
        level: 16,
        rank: 8,
    },
    {
        id: 'user-009',
        username: 'carvingking',
        display_name: 'CarvingKing',
        profile_image_url: null,
        lifetime_xp: 6100,
        level: 15,
        rank: 9,
    },
    {
        id: 'user-010',
        username: 'durbarwanderer',
        display_name: 'DurbarWanderer',
        profile_image_url: null,
        lifetime_xp: 5400,
        level: 14,
        rank: 10,
    },
    {
        id: 'user-011',
        username: 'patanlocal',
        display_name: 'PatanLocal',
        profile_image_url: null,
        lifetime_xp: 4700,
        level: 13,
        rank: 11,
    },
    {
        id: 'user-012',
        username: 'culturewalker',
        display_name: 'CultureWalker',
        profile_image_url: null,
        lifetime_xp: 4300,
        level: 12,
        rank: 12,
    },
    {
        id: 'user-013',
        username: 'heritagehunter',
        display_name: 'HeritageHunter',
        profile_image_url: null,
        lifetime_xp: 3950,
        level: 12,
        rank: 13,
    },
    {
        id: 'user-014',
        username: 'valleyexplorer',
        display_name: 'ValleyExplorer',
        profile_image_url: null,
        lifetime_xp: 3500,
        level: 11,
        rank: 14,
    },
    {
        id: 'user-015',
        username: 'heritagehunter_23',
        display_name: 'HeritageHunter_23',
        profile_image_url: null,
        lifetime_xp: 3200,
        level: 10,
        rank: 15,
        isCurrentUser: true,
    },
    {
        id: 'user-016',
        username: 'ancientpath',
        display_name: 'AncientPath',
        profile_image_url: null,
        lifetime_xp: 2900,
        level: 10,
        rank: 16,
    },
    {
        id: 'user-017',
        username: 'patanphotowalk',
        display_name: 'PatanPhotoWalk',
        profile_image_url: null,
        lifetime_xp: 2550,
        level: 9,
        rank: 17,
    },
    {
        id: 'user-018',
        username: 'temple_tales',
        display_name: 'TempleTales',
        profile_image_url: null,
        lifetime_xp: 2200,
        level: 8,
        rank: 18,
    },
    {
        id: 'user-019',
        username: 'newariexplorer',
        display_name: 'NewariExplorer',
        profile_image_url: null,
        lifetime_xp: 1850,
        level: 7,
        rank: 19,
    },
    {
        id: 'user-020',
        username: 'hiddenheritage',
        display_name: 'HiddenHeritage',
        profile_image_url: null,
        lifetime_xp: 1500,
        level: 6,
        rank: 20,
    },
];

export const getLeaderboardData = () => {
    const currentUser = MOCK_LEADERBOARD_DATA.find(u => u.isCurrentUser);

    // Top 3 for podium
    const podiumUsers = MOCK_LEADERBOARD_DATA.slice(0, 3);

    // Rest of the list (rank 4 onwards)
    const listUsers = MOCK_LEADERBOARD_DATA.slice(3);

    // Find current user's index in the list (for sticky header)
    const currentUserIndex = currentUser && currentUser.rank > 3
        ? currentUser.rank - 4
        : -1;

    return { podiumUsers, listUsers, currentUserIndex, currentUser };
};

// constants/questData.ts

export interface QuestArtifact {
    id: string;
    name: string;
    location: string;
    imageUrl: string;
    isDiscovered: boolean;
}

export interface QuestDetail {
    id: string;
    name: string;
    description: string;
    category: string;
    heroImageUrl: string;
    totalArtifacts: number;
    discoveredCount: number;
    xpReward: number;
    badgeName: string;
    artifacts: QuestArtifact[];
}

export const MOCK_QUEST_DETAILS: QuestDetail = {
    id: 'quest-hidden-patan',
    name: 'Hidden Patan',
    description: 'Uncover the secret shrines and hidden architectural gems tucked away in the courtyards of Patan.',
    category: 'City Exploration',
    heroImageUrl: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800', // Replace with real asset
    totalArtifacts: 5,
    discoveredCount: 3,
    xpReward: 500,
    badgeName: 'Hidden Patan Badge',
    artifacts: [
        {
            id: 'art-001',
            name: 'Krishna Mandir',
            location: 'Patan Durbar Square',
            imageUrl: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=200',
            isDiscovered: true,
        },
        {
            id: 'art-002',
            name: 'Golden Window',
            location: 'Patan Museum',
            imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200',
            isDiscovered: true,
        },
        {
            id: 'art-003',
            name: 'Stone Spout',
            location: 'Sundari Chowk',
            imageUrl: 'https://images.unsplash.com/photo-1580228063266-4e4089758988?w=200',
            isDiscovered: true,
        },
        {
            id: 'art-004',
            name: 'Hidden Shrine',
            location: 'Gabahal',
            imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200', // Placeholder
            isDiscovered: false,
        },
        {
            id: 'art-005',
            name: 'Traditional Statue',
            location: 'Pim Bahal',
            imageUrl: 'https://images.unsplash.com/photo-1580228063266-4e4089758988?w=200', // Placeholder
            isDiscovered: false,
        },
    ],
};


// constants/artifactData.ts

export type ArtifactCategory = 'temple' | 'site' | 'statue' | 'carving' | 'architecture' | 'other';
export type ArtifactRarity = 'common' | 'rare' | 'legendary';
export type StoryUnlockState = 'locked' | 'arrived' | 'unlocked';

export interface StorySection {
    id: string;
    title: string;
    icon: string; // Ionicons name
    content: string;
}

export interface Artifact {
    id: string;
    name: string;
    description: string;
    story: string | null; // Null until unlocked
    category: ArtifactCategory;
    tags: string[];
    human_readable_location: string;
    verification_radius_m: number;
    story_unlock_radius_m: number;
    xp_value: number;
    rarity: ArtifactRarity;
    reference_images: string[];
    requires_snap: boolean;
    warnings: string | null;
    discovery_count: number;
    distance_m: number; // Calculated from user's current location
    story_sections: StorySection[];
    significance: string;
}

export const MOCK_ARTIFACTS: Artifact[] = [
    {
        id: 'art-krishna-mandir',
        name: 'Krishna Mandir',
        description: 'A masterpiece of stone architecture, this shikhara-style temple stands as a testament to 17th-century craftsmanship. Its intricate carvings narrate epics long forgotten by many, waiting to be rediscovered by those who wander near.',
        story: 'Commissioned in 1637 by King Siddhinarasimha Malla following a vivid dream where he witnessed Krishna and Radha at this very location. The temple was built entirely from stone in the shikhara style, unusual for the Kathmandu Valley where brick and wood dominate. The 21 pinnacles represent the days of Krishna\'s life according to local tradition. Every surface tells a story — from the Mahabharata on the first floor to the Ramayana on the second.',
        category: 'temple',
        tags: ['stone architecture', 'shikhara', 'Malla dynasty', '17th century'],
        human_readable_location: 'Patan Durbar Square',
        verification_radius_m: 50,
        story_unlock_radius_m: 100,
        xp_value: 150,
        rarity: 'legendary',
        reference_images: [
            'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800',
        ],
        requires_snap: true,
        warnings: 'Photography permitted. Please remove shoes before entering.',
        discovery_count: 1247,
        distance_m: 120,
        story_sections: [
            {
                id: 's1',
                title: 'Historical Context',
                icon: 'time-outline',
                content: 'Commissioned in 1637 by King Siddhinarasimha Malla following a vivid dream where he witnessed Krishna and Radha at this very location.',
            },
            {
                id: 's2',
                title: 'Architectural Marvel',
                icon: 'build-outline',
                content: 'Built entirely from stone in the shikhara style, unusual for the Kathmandu Valley where brick and wood dominate. The 21 pinnacles represent the days of Krishna\'s life.',
            },
            {
                id: 's3',
                title: 'Did You Know?',
                icon: 'bulb-outline',
                content: 'The first floor carvings depict scenes from the Mahabharata, while the second floor tells the story of the Ramayana. Locals believe the temple was built in a single night by divine architects.',
            },
        ],
        significance: 'Krishna Mandir is considered one of the finest examples of shikhara-style architecture in Nepal. It represents the fusion of Indian temple architecture with Newari craftsmanship, making it a unique cultural landmark in the Kathmandu Valley.',
    },
    {
        id: 'art-golden-window',
        name: 'Golden Window',
        description: 'An exquisite example of Newari metalwork, this gilded window is one of the most photographed details in Patan.',
        story: null, // Locked
        category: 'carving',
        tags: ['metalwork', 'Newari', 'golden'],
        human_readable_location: 'Patan Museum',
        verification_radius_m: 30,
        story_unlock_radius_m: 80,
        xp_value: 100,
        rarity: 'rare',
        reference_images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800'],
        requires_snap: true,
        warnings: null,
        discovery_count: 892,
        distance_m: 450,
        story_sections: [],
        significance: 'The Golden Window is a masterpiece of Newari repoussé work, showcasing the extraordinary metalworking traditions of the Kathmandu Valley.',
    },
];

export const getArtifactById = (id: string): Artifact | undefined => {
    return MOCK_ARTIFACTS.find(a => a.id === id);
};

export const getStoryUnlockState = (artifact: Artifact): StoryUnlockState => {
    if (artifact.distance_m <= artifact.story_unlock_radius_m) {
        return artifact.story ? 'unlocked' : 'arrived';
    }
    return 'locked';
};