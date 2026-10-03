// src/data/mockComingSoon.ts

export interface ComingSoonData {
  title: string;
  description: string;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
}

export const MOCK_COMING_SOON: ComingSoonData = {
  title: "Coming Soon",
  description:
    "We are currently building this feature. Check back soon for updates!",
  icon: "construct-outline",
};
