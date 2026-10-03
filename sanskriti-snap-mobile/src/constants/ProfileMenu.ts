import { ProfileMenuItemProps } from "@/components/ProfileMenuItems";
import { router } from "expo-router";

export const MENU_SECTIONS: {
  title: string;
  items: ProfileMenuItemProps[];
}[] = [
    {
      title: "MY PROGRESS",
      items: [
        {
          icon: "trophy-outline",
          iconBgColor: "#DBEAFE",
          iconColor: "#3B82F6",
          label: "Badges",
          onPress: () => router.push("/(tabs)/badges"),
        },
        {
          icon: "bar-chart-outline",
          iconBgColor: "#FEF3C7",
          iconColor: "#F59E0B",
          label: "Leaderboard",
          onPress: () => router.push("/(tabs)/leaderboard"),
        },
      ],
    },
    {
      title: "EXPLORATION",
      items: [
        {
          icon: "grid-outline",
          iconBgColor: "#FED7AA",
          iconColor: "#EA580C",
          label: "My Collection",
          onPress: () => router.push("/(tabs)/collection"),
        },
      ],
    },
    {
      title: "REWARDS",
      items: [
        {
          icon: "gift-outline",
          iconBgColor: "#FEE2E2",
          iconColor: "#EF4444",
          label: "Available Rewards",
          onPress: () => router.push("/(tabs)/rewards"),
        },
        {
          icon: "receipt-outline",
          iconBgColor: "#FEF3C7",
          iconColor: "#B45309",
          label: "Claimed Rewards",
          onPress: () => router.push("/(tabs)/claimed-rewards"),
        },
      ],
    },
    {
      title: "SETTINGS & ACCOUNT",
      items: [
        {
          icon: "settings-outline",
          iconBgColor: "#F3F4F6",
          iconColor: "#6B7280",
          label: "Settings",
          onPress: () => router.push("/(tabs)/settings"),
        },
        {
          icon: "help-circle-outline",
          iconBgColor: "#F3F4F6",
          iconColor: "#6B7280",
          label: "Help & Support",
          onPress: () => router.push("/(tabs)/help-support"),
        },
      ],
    },
  ];
