// src/data/mockQuestDetails.ts
export interface DiscoveryItem {
  id: string;
  name: string;
  location: string;
  image?: string;
  status: 'completed' | 'locked';
}

export interface QuestDetailsData {
  id: string;
  category: string;
  title: string;
  description: string;
  heroImage: string;
  currentProgress: number;
  totalProgress: number;
  xpReward: number;
  badgeName: string;
  discoveries: DiscoveryItem[];
}

export const mockQuestDetails: QuestDetailsData = {
  id: 'quest_001',
  category: 'City Exploration',
  title: 'Hidden Patan',
  description: 'Uncover the secret shrines and hidden architectural gems tucked away in the courtyards of Patan.',
  heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9usLEAYTa_VyU9LMLoAMk7aM3oO8lAIE2_dlBez3wAaddEHnmJ2mVpp8XapYbK41waIRd6uo3QxR6Q-pHcEnWOVhB7b26pkNyPypTw4v6tQnMSTlHYei3yw2e2YD4sRGoDfNKaPULre34Rcy0UK45aePlhfnjnYymsKjSP5gbG9mtpKgcoM2hXliPqyZYwofEOC51bi7Fu960fHpdPdy-2mbcUxvqdznMDaB6cheYtFhhrb0rnbtj',
  currentProgress: 3,
  totalProgress: 5,
  xpReward: 500,
  badgeName: 'Hidden Patan Badge',
  discoveries: [
    {
      id: 'disc_001',
      name: 'Krishna Mandir',
      location: 'Patan Durbar Square',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUhnesknRFr0LNKezevTvKiT7WbuBHqmKCxS0ivrpmhdcvW-KAUXUBqSVgDbbe4I8VORd3K13n__Du9OWhONA72HZ1MAN7-swyE0LXr25Crzw8qMvbA-4XhS1Z67XDiSGhdQyKmx9RLpW5kzY4bE68RcOGNdGxNvxAcTyJDhhPMEjlcOMRoFig3BZBktKbMwK62FQQRoKs4j1zgYipI_4bJPxWU1ECY3_z7kMdN2cfsZkwhCHPkEyU',
      status: 'completed',
    },
    {
      id: 'disc_002',
      name: 'Golden Window',
      location: 'Patan Museum',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiRA_XidmvIt4kbca1sfVY0KKyUWh-mAJhmdWQIsYX864njtRGgPeY2afxWiRTEkJxKvXctwD1GM3nuHt-KVl7SeI6VSnzQACmHFql6PJg7Y-xj5vvRQePf2zDj0Ctmu0FSjMHVzwG98I-QFyCkfebbJi2YT0Q9wVKvy_H_6ZTt-2JIyeE9BeqmW9CR0Pt71TOIe-zhXsBgd64jT925uADwkgW3keZ44v2dx_yOt2Q3M1hYOIHZGF5',
      status: 'completed',
    },
    {
      id: 'disc_003',
      name: 'Stone Spout',
      location: 'Sundari Chowk',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQm5hRHe4pxGxKj7AND_sKa8hugq_uwc6My5THSEb2hdvt_4QdX2JF8p-NGgTciJ-x816yWzQQoxDxHJy0PLUP-9gndaPXvrQsJC2Hpki7BlzgIU3-qRaIaRimQzslhiy5aFFJAzQ7P0_mQpWRnr1W-efrKGIIUIDt7qY3CFYw7HK_ldN-NJvH32KXE6sFlD5bzi5x8l3mYBxJHwtl_kITsK1oxGKbGaOg4U-rKC_Q_HqDCOJpdAcZ',
      status: 'completed',
    },
    {
      id: 'disc_004',
      name: 'Hidden Shrine',
      location: 'Gabahal',
      status: 'locked',
    },
    {
      id: 'disc_005',
      name: 'Traditional Statue',
      location: 'Pim Bahal',
      status: 'locked',
    },
  ],
};