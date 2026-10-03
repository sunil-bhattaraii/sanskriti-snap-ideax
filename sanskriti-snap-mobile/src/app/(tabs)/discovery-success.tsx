import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import CollectionAdded from "../../components/discovery/CollectionAdded";
import DiscoveryResultCard from "../../components/discovery/DiscoveryResultCard";
import SuccessHeader from "../../components/discovery/SuccessHeader";
import XPReward from "../../components/discovery/XPReward";
import { COLORS } from "../../constants/colors";

import { apiRequest } from "@/services/api";
import type { DiscoverySuccessData } from "../../constants/data/mockDiscoverySuccess";

export default function DiscoverySuccessScreen() {
  const router = useRouter();
  const { discoveryId } = useLocalSearchParams<{ discoveryId: string }>();
  const [discoveryData, setDiscoveryData] = useState<DiscoverySuccessData | null>(null);

  useEffect(() => {
    if (!discoveryId) return;
    apiRequest<{
      xpAwarded: number;
      pointsAwarded: number;
      artifact: {
        name: string;
        category: string;
        coverImageUrl: string | null;
      };
      quest: {
        name: string;
        discoveredCount: number;
        artifactCount: number;
      } | null;
      badge: { name: string; iconUrl: string | null } | null;
    }>(`/discoveries/${encodeURIComponent(discoveryId)}/receipt`)
      .then((receipt) => {
        setDiscoveryData({
          placeName: receipt.artifact.name,
          rarity: receipt.artifact.category.toUpperCase(),
          imageUrl: receipt.artifact.coverImageUrl ?? "",
          xpEarned: receipt.xpAwarded,
          pointsEarned: receipt.pointsAwarded,
          quest: {
            name: receipt.quest?.name ?? "Cultural Exploration",
            progress: receipt.quest?.discoveredCount ?? 0,
            total: receipt.quest?.artifactCount ?? 0,
          },
          badge: {
            name: receipt.badge?.name ?? "Discovery completed",
            icon: "medal",
          },
        });
      })
      .catch((error) => {
        console.error("Unable to load discovery receipt:", error);
      });
  }, [discoveryId]);

  if (!discoveryData)
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SuccessHeader />

        <DiscoveryResultCard data={discoveryData} />
        <XPReward data={discoveryData} />
        <CollectionAdded data={discoveryData} />
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Continue Exploring" onPress={() => router.replace("/(tabs)/explore")} variant="primary" size="lg" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  loader: { flex: 1, alignSelf: "center" },
  scrollContent: { padding: 20, paddingBottom: 120 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.neutral,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingBottom: 30,
  },
});
