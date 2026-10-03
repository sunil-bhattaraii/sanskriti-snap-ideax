// src/data/mockUserProfile.ts
export interface UserProfile {
  id: string;
  username: string;
  profileImage: string;
  level: number;
  levelTitle: string;
  totalXP: number;
  discoveries: number;
  quests: number;
  rewardPoints: number;
}

export const mockUserProfile: UserProfile = {
  id: 'user_001',
  username: 'HeritageHunter_23',
  profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACv-_DSU8od9lBAd7lhITUPUUvi9XOy5SuL4epIfT75NfrGcIE3tEuQ496AqER12_Tke6VRc70fKKao2o40SExIRGiju0S4DnnEqZAtbE1YRYtsefSdHUJeMQvl9NNyzGm9TkRJ2YrditpuXAjknByFOOSiz_v0tv69crIyNqEPHLSvfWBdwjY85XW2jJxCx5DzFEqqwa2lMNRYJxTmAlmwR-dpa40q_NwBvnT6u6YemcqVSeynP6j',
  level: 12,
  levelTitle: 'Master Explorer',
  totalXP: 1800,
  discoveries: 12,
  quests: 4,
  rewardPoints: 450,
};

export interface ProfileMenuItem {
  id: string;
  icon: string;
  iconColor: string;
  iconBackgroundColor: string;
  title: string;
  subtitle?: string;
  section: 'progress' | 'exploration' | 'rewards';
}

export const mockProfileMenuItems: ProfileMenuItem[] = [
  {
    id: 'badges',
    icon: 'military_tech',
    iconColor: '#1E3A8A',
    iconBackgroundColor: '#DBEAFE',
    title: 'Badges',
    section: 'progress',
  },
  {
    id: 'leaderboard',
    icon: 'leaderboard',
    iconColor: '#F59E0B',
    iconBackgroundColor: '#FEF3C7',
    title: 'Leaderboard',
    section: 'progress',
  },
  {
    id: 'collection',
    icon: 'library_books',
    iconColor: '#EA580C',
    iconBackgroundColor: '#FFEDD5',
    title: 'My Collection',
    section: 'exploration',
  },
  {
    id: 'saved',
    icon: 'bookmark',
    iconColor: '#6B7280',
    iconBackgroundColor: '#F3F4F6',
    title: 'Saved Places',
    section: 'exploration',
  },
  {
    id: 'rewards',
    icon: 'redeem',
    iconColor: '#DC2626',
    iconBackgroundColor: '#FEE2E2',
    title: 'Available Rewards',
    subtitle: '450 Points',
    section: 'rewards',
  },
];