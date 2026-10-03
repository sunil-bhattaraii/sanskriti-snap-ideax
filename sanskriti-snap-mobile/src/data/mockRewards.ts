// src/data/mockRewards.ts
export interface Reward {
  id: string;
  category: string;
  categoryIcon: string;
  businessName: string;
  title: string;
  description: string;
  image: string;
  pointsRequired: number;
  location?: string;
  status: 'available' | 'claimed' | 'locked';
  pointsNeeded?: number;
}

export interface UserPoints {
  current: number;
}

export const mockUserPoints: UserPoints = {
  current: 1250,
};

export const mockRewards: Reward[] = [
  {
    id: 'reward_001',
    category: 'Cafe',
    categoryIcon: 'restaurant',
    businessName: 'Heritage Brews',
    title: '15% Off Hand-Drip Coffee',
    description: 'Experience the rich aroma of locally sourced beans, roasted to perfection and brewed using traditional methods. Valid for one artisan drip coffee.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuSFrmf-2tz76tPNoYRYYqcDkM6gJd0zIOpg6VgNhFDA-YJblWxuX50jHkRp2VBBs8vK0mRirxM2sWve8SF7R55kYJebU1rVuTtMwohFDYHeNUPrao-alCduX1ksyQATqMechvYAniZMhDOUFId3HC8Yxq1bjqmXy024JW6CYiqV_8GazEjFAJNddCI3TBTAvAhhkG8hTif2-XlzUksvFvkq636NB76k8ph1EusDxhuGYRaAXeCSeA',
    pointsRequired: 500,
    location: '0.5 km away • Patan Durbar Square',
    status: 'available',
  },
  {
    id: 'reward_002',
    category: 'Workshop',
    categoryIcon: 'brush',
    businessName: 'Patan Artisans',
    title: 'Free Traditional Pottery Workshop',
    description: 'Learn the ancient techniques of Newari pottery making in a 2-hour guided session.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHMKTHJZTP-Njz996BE0-GB6YUPwKS3UO2sJyKP8e28p9wFpVu6Tq2FxnOmgz13HgKEE11Oopz4h8kmF_XnERJK-xTkIqymZx9dBtZk7YAWBHr1DITrxwAXal1B4Axf-DUlb15grlDRsw9xRTl6YygRuVc8qfceofImkwXDKaiIBmbht62kIDN83Am2kqWUqpHq4Ml_GnurPqylJHBj8fJX5yw5pMk3kqQc6hgDvyG1S0MMOJK-fZQ',
    pointsRequired: 1200,
    status: 'available',
  },
  {
    id: 'reward_003',
    category: 'Experience',
    categoryIcon: 'check-circle',
    businessName: 'The Heritage Inn',
    title: 'Complimentary Heritage Tour',
    description: 'Guided evening walk through the historic wings of the estate with the resident historian.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt1eJnTNdUdJA6LG_1kvH3YLeDvBaJBZDOm5PmYF_r-VTOjHsuNJJSsKngCUpnULWLdcqVrLNaVCjjdnEu5Y6vBGTdxzGvEiFOlM-PKU_fayjT2o_1rEOJOJsnp2xGpROSS_TfD0cEw9k08yOBL9x60-iv83i0bgpJM5217SKXDog51AXkvfrjlD6RPA4SG8ByQDu6Ir9VxTqMDGT-po-orSKZT8XxLrltIEQSwZWVrZ3F1ifb6gxD',
    pointsRequired: 800,
    status: 'claimed',
  },
  {
    id: 'reward_004',
    category: 'Dining',
    categoryIcon: 'restaurant',
    businessName: 'Thali House',
    title: '2-for-1 Royal Thali Experience',
    description: 'Enjoy an authentic multi-course thali feast. Bring a friend and their meal is on us.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATPDyS5a1mhT4i0qg37OjybsHc3uFJfOmG--D5vjemaihjvktiktPuUhE_d0IG6gvpeRSnVwnhwb2uSy8_FnsUNk3-0C8T6fsjb38UUpbUNrRUTm2tOrhY4bh_r9oz3H9jOSFRpp-uiCNZC_37cy9EBoZskNmP2YO7A2B6CA6_N4NUbpCMCBkU3Eab6aq7S37FAYMivz8H9RECx882zNL-tBgn26DS5vdhKwOpEONFpnEa6z2L6AsQ',
    pointsRequired: 800,
    status: 'available',
  },
  {
    id: 'reward_005',
    category: 'Stay',
    categoryIcon: 'bed',
    businessName: 'Himalayan Retreat',
    title: 'One Night Luxury Stay',
    description: 'Escape to the mountains with a complimentary overnight stay including breakfast.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCrw5fK0ikawH4vA5H4unuyJFTxkLAeuuPhmBP0vC5s-rZCe96P_BACATG8sqWfN3Kpuf0KCA9XRXaW4-6aHVukrJyjf7SikCNoul5KC_oI1WjLOcnZOtSu2znm2IYis-5NS6X2c6tFm2XH8M1HG8Ba6pnhZ8o01CRaEfSqqY2RLhztk2ML3R3v2j3PH1RL8z0z-AOz9QMuyNdZoVlLXJ5wjGTf73hDJsnlQrEGjyphA7fmBcdE6BU',
    pointsRequired: 5000,
    status: 'locked',
    pointsNeeded: 3750,
  },
];

export type RewardFilter = 'All Rewards' | 'Food & Drink' | 'Experiences' | 'Crafts';