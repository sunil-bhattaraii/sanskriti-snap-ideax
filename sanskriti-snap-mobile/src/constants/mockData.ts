import type { ArtifactDetail } from '../types/artifact';

export const MOCK_ARTIFACTS: (ArtifactDetail & { lat: number; lng: number; distance: number })[] = [
  {
    id: 'patan-durbar-square',
    name: 'Patan Durbar Square',
    category: 'site',
    description:
      'Ancient royal palace complex of the Malla Kings featuring exquisite Newari woodcarving and stone architecture.',
    story: `# Historical Origins
Constructed during the Malla dynasty in the 14th to 18th centuries, Patan Durbar Square was the seat of the Malla kings of Lalitpur. It is one of the three Durbar Squares in the Kathmandu Valley.

# Architectural Brilliance
The square is an open-air museum displaying traditional Newari craftsmanship with intricate terracotta brickwork, ornate wooden windows, and stone statues of guardian deities.

# Cultural Significance
It remains an active spiritual and community hub where centuries-old festivals such as Rato Machhindranath Jatra and Krishna Janmashtami are celebrated with deep devotion.`,
    tags: ['UNESCO', 'Malla Dynasty', 'Palace', 'Newari Heritage'],
    location: { latitude: 27.6727, longitude: 85.3253 },
    lat: 27.6727,
    lng: 85.3253,
    human_readable_location: 'Lalitpur, Kathmandu Valley',
    verification_radius_m: 50,
    story_unlock_radius_m: 100,
    xp_value: 350,
    reference_images: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    ],
    distance: 0.2,
    requires_snap: true,
    requires_cv: false,
    warnings: [],
  },
  {
    id: 'krishna-mandir',
    name: 'Krishna Mandir',
    category: 'temple',
    description:
      'Iconic 17th-century stone temple built by King Siddhi Narasimha Malla in the Shikhara architectural style.',
    story: `# The Legend of the Dream
Built in 1637 AD by King Siddhi Narasimha Malla, legend holds that the king saw Lord Krishna and Radha in a dream standing on this exact spot and immediately commissioned this grand temple.

# Master Stone Carvings
Unlike most pagoda temples in Nepal, Krishna Mandir is built entirely of stone. The first floor displays friezes depicting the epic Mahabharata, while the second floor portrays scenes from the Ramayana.

# Cultural Significance
Every year during Krishna Janmashtami, thousands of pilgrims from across Nepal and India gather here to chant hymns and celebrate the birth of Lord Krishna.`,
    tags: ['Stone Architecture', 'Shikhara', 'Mahabharata', 'Krishna'],
    location: { latitude: 27.6732, longitude: 85.3258 },
    lat: 27.6732,
    lng: 85.3258,
    human_readable_location: 'Patan Durbar Square, Lalitpur',
    verification_radius_m: 30,
    story_unlock_radius_m: 80,
    xp_value: 450,
    reference_images: [
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80',
    ],
    distance: 0.3,
    requires_snap: true,
    requires_cv: false,
    warnings: [],
  },
  {
    id: 'golden-temple',
    name: 'Golden Temple (Hiranya Varna Mahavihar)',
    category: 'temple',
    description:
      'Historic 12th-century Buddhist monastery monastery known for its gilded copper facade and silver toranas.',
    story: `# Monastic Tradition
Founded in the 12th century by King Bhaskar Deva Varma, this courtyard monastery is home to unique Buddhist rituals led by a head priest who is traditionally a young boy under twelve.

# Gilded Masterpiece
The monastery's exterior is embellished in glistening gilded copper plates, sacred prayer wheels, and magnificent bronze lion sentinels guarding the sanctuary.

# Living Buddhist Philosophy
Hiranya Varna Mahavihar remains one of the most vibrant centers of Newari Vajrayana Buddhism, preserving ancient Sanskrit manuscripts and devotional rituals.`,
    tags: ['Buddhist Monastery', 'Gilded Copper', 'Vajrayana', 'Newar Art'],
    location: { latitude: 27.6755, longitude: 85.3241 },
    lat: 27.6755,
    lng: 85.3241,
    human_readable_location: 'Kwalakhu Road, Lalitpur',
    verification_radius_m: 40,
    story_unlock_radius_m: 90,
    xp_value: 300,
    reference_images: [
      'https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=800&auto=format&fit=crop&q=80',
    ],
    distance: 0.5,
    requires_snap: true,
    requires_cv: false,
    warnings: [],
  },
  {
    id: 'mahabouddha-temple',
    name: 'Mahabouddha Temple',
    category: 'temple',
    description:
      'Known as the Temple of Thousand Buddhas, crafted entirely from terracotta tiles each bearing an image of Buddha.',
    story: `# The Temple of Ten Thousand Buddhas
Modelled after the Mahabodhi Temple in Bodh Gaya, this 16th-century architectural marvel was crafted by priest Abhaya Raj Shakya and his family across generations.

# Terracotta Craftsmanship
Every single terracotta brick used to build the spire is embossed with a delicate relief carving of the Buddha, requiring exceptional precision and ceramic artistry.

# Resilience and Heritage
Destroyed during the devastating 1934 earthquake, the temple was lovingly reconstructed brick by brick using the original terracotta tiles recovered by the community.`,
    tags: ['Terracotta', 'Bodh Gaya Style', 'Shakya Heritage'],
    location: { latitude: 27.6711, longitude: 85.3285 },
    lat: 27.6711,
    lng: 85.3285,
    human_readable_location: 'Okubahal, Lalitpur',
    verification_radius_m: 35,
    story_unlock_radius_m: 75,
    xp_value: 400,
    reference_images: [
      'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop&q=80',
    ],
    distance: 0.7,
    requires_snap: true,
    requires_cv: false,
    warnings: [],
  },
  {
    id: 'kumbheshwar-temple',
    name: 'Kumbheshwar Temple',
    category: 'temple',
    description:
      'One of only two five-tiered pagoda temples in the Kathmandu Valley, dedicated to Lord Shiva.',
    story: `# Ancient Shiva Sanctuary
Dating back to 1392 AD, Kumbheshwar is one of the oldest and most revered five-story pagodas in Nepal, famous for its natural water spring connected to the sacred high-altitude Gosaikunda Lake.

# Engineering and Scale
Standing tall above the narrow alleys of northern Patan, its towering wooden brackets and carved multi-roof design exemplify classic Malla architecture.

# Janai Purnima Celebrations
During the sacred festival of Janai Purnima, thousands of devotees take holy dips in the temple pond to honor Lord Shiva.`,
    tags: ['Five Tier Pagoda', 'Lord Shiva', 'Gosaikunda Spring'],
    location: { latitude: 27.6778, longitude: 85.3262 },
    lat: 27.6778,
    lng: 85.3262,
    human_readable_location: 'Kumbheshwar, Lalitpur',
    verification_radius_m: 45,
    story_unlock_radius_m: 85,
    xp_value: 280,
    reference_images: [
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop&q=80',
    ],
    distance: 0.9,
    requires_snap: true,
    requires_cv: false,
    warnings: [],
  },
];

export const MOCK_USER_PROFILE = {
  id: 'user-nepal-01',
  fullName: 'Aarav Sharma',
  username: 'aarav_heritage',
  email: 'aarav.sharma@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  level: 5,
  xp: 1850,
  nextLevelXp: 2500,
  discoveredCount: 14,
  totalArtifacts: 48,
  rank: 'Heritage Guardian',
  badges: [
    { id: 'b1', name: 'Patan Explorer', icon: 'compass', description: 'Discovered 5+ sites in Patan' },
    { id: 'b2', name: 'Master Scholar', icon: 'book', description: 'Unlocked 10 complete artifact stories' },
    { id: 'b3', name: 'Early Bird', icon: 'sunny', description: 'Captured sunrise at a heritage temple' },
    { id: 'b4', name: 'Stone Crafter', icon: 'hammer', description: 'Identified 3 Malla stone reliefs' },
  ],
  recentDiscoveries: [
    {
      id: 'patan-durbar-square',
      name: 'Patan Durbar Square',
      category: 'site',
      discoveredDate: 'Yesterday',
      xpEarned: 350,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'krishna-mandir',
      name: 'Krishna Mandir',
      category: 'temple',
      discoveredDate: '3 days ago',
      xpEarned: 450,
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80',
    },
  ],
};
