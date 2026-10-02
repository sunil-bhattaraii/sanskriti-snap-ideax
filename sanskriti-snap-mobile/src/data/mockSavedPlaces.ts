// src/data/mockSavedPlaces.ts
export interface SavedPlace {
  id: string;
  name: string;
  location: string;
  distance: string;
  image: string;
}

export const mockSavedPlaces: SavedPlace[] = [
  {
    id: 'place_001',
    name: 'Golden Window',
    location: 'Patan Museum',
    distance: '1.2 km away',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA74MZqvCzXCtf6ofUOIT0y0i8TTupRnHELiqXq6jpEMC2Nn8mgBhyVdJZeUFqsjRyv8vO5MyZfI6fAIaoVMyCgS1FHz5u_cicU_Kv6dTKrNWwPsKb_ORYKJXrNdh-L3alVlW20h0RzR0DxYxogGJdEnMBCZ4-HIiWNNs6RFkadUV1S1-BH9phmfPfZH0QUj5ATqTCXuj9xUAczJ5SzR4LcyNp4BjeyQppv3RKOTewdGcwUu2BdCUlN',
  },
  {
    id: 'place_002',
    name: 'Stone Spout',
    location: 'Sundari Chowk',
    distance: '2.4 km away',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDANx6fpQ840lhTOrd54_Oscdy7z-2H8FyX0dZAs3DvzT9gOJNyalfLsAjq_5AAgmpqIM5b82vKrx5j6PoM2BB2YejZrZ0hQ-RNhbqLUf5QmimnTGYNTy_sRG-_QbV76iZki8qgcBvieJFzBvj7tlc1mzAxcTAfhlQuMVpXREb10ac0gKkzmzBsJf9FDeXWHTz5Ruu92cQJ708ujqHZ0NUry6E2xHJtVvbYnwUL6LmXyfk1VDm9aT66',
  },
  {
    id: 'place_003',
    name: 'Krishna Mandir',
    location: 'Patan Durbar Sq',
    distance: '3.1 km away',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1SHbtK8Z8aQl9296RdWmTcFT_9eaXUzSupRoxuF3uZsjtC64rDkiD2v4QO8soizNzYyjDWw6dwiLBPuMO9oee1byeKiUn-ktjAJL7bsnLoxY3qaCm2LXA6y9v70XMdKnTK7FpwLrufQQI9gYowPNiHKWU8k5K_-qgkNk2q4nmhNpklSVLfjo7NXBboBXhdTjCckr0KSO-bxKF-Psf-TiUqHTiYqzZhZOAbX-Cjwk7rlUL-ufaecPo',
  },
];