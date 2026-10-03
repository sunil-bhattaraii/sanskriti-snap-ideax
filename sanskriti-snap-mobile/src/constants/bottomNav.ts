import { Ionicons } from "@expo/vector-icons";

export interface BottomNavItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  route: string;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    name: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/(tabs)/home",
  },
  {
    name: "quests",
    label: "Quests",
    icon: "book-outline",
    activeIcon: "book",
    route: "/(tabs)/quest",
  },
  {
    name: "explore",
    label: "Explore",
    icon: "compass-outline",
    activeIcon: "compass",
    route: "/(tabs)/explore",
  },
  {
    name: "leaderboard",
    label: "Leaderboard",
    icon: "trophy-outline",
    activeIcon: "trophy",
    route: "/(tabs)/leaderboard",
  },
  {
    name: "rewards",
    label: "Rewards",
    icon: "gift-outline",
    activeIcon: "gift",
    route: "/(tabs)/rewards",
  },
];