export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface CollectionItem {
  id: string;
  title: string;
  location: string;
  xp: number;
  imageUrl?: string;
  rarity: Rarity;
  isDiscovered: boolean;
}

export const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: "1",
    title: "Krishna Mandir",
    location: "Patan",
    xp: 150,
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    rarity: "Common",
    isDiscovered: true,
  },
  {
    id: "2",
    title: "Stone Spout",
    location: "Kathmandu",
    xp: 100,
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
    rarity: "Common",
    isDiscovered: true,
  },
  {
    id: "3",
    title: "Ancient Temple",
    location: "Lalitpur",
    xp: 175,
    rarity: "Rare",
    isDiscovered: false,
  },
  {
    id: "4",
    title: "Golden Window",
    location: "Bhaktapur",
    xp: 200,
    imageUrl:
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800",
    rarity: "Epic",
    isDiscovered: true,
  },
];
