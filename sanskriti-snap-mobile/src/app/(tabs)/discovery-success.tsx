import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import CollectionAdded from "../../components/discovery/CollectionAdded";
import DiscoveryResultCard from "../../components/discovery/DiscoveryResultCard";
import SuccessHeader from "../../components/discovery/SuccessHeader";
import XPReward from "../../components/discovery/XPReward";
import { COLORS } from "../../constants/colors";

import { backendClient } from "@/services/backendClient";
import { useAuthStore } from "@/store/authstore";
import type { DiscoverySuccessData } from "../../constants/data/mockDiscoverySuccess";

export default function DiscoverySuccessScreen() {
  const router = useRouter();
  const { discoveryId } = useLocalSearchParams<{ discoveryId: string }>();
  const user = useAuthStore((state) => state.user);
  const [discoveryData, setDiscoveryData] = useState<DiscoverySuccessData | null>(null);

  useEffect(() => {
    if (!discoveryId) return;
    backendClient
      .from("discoveries")
      .select("artifact_id, xp_awarded")
      .eq("id", discoveryId)
      .single()
      .then(async ({ data: discovery, error }) => {
        if (error || !discovery) return;
        const [{ data: artifact }, { data: questLinks }] = await Promise.all([
          backendClient.from("artifacts").select("name, category, reference_images").eq("id", discovery.artifact_id).single(),
          backendClient.from("quest_artifacts").select("quest_id").eq("artifact_id", discovery.artifact_id),
        ]);
        const questId = questLinks?.[0]?.quest_id;
        const [{ data: quest }, { data: progress }] = questId
          ? await Promise.all([
              backendClient.from("quests").select("name").eq("id", questId).single(),
              user
                ? backendClient
                    .from("user_quest_progress")
                    .select("discovered_artifact_count")
                    .eq("user_id", user.id)
                    .eq("quest_id", questId)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
            ])
          : [{ data: null }, { data: null }];
        const { data: earnedBadge } = user
          ? await backendClient
              .from("user_badges")
              .select("badge_id, badges(name)")
              .eq("user_id", user.id)
              .order("earned_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : { data: null };
        if (!artifact) return;
        const badgeRelation = earnedBadge?.badges;
        const badgeName = Array.isArray(badgeRelation) ? badgeRelation[0]?.name : badgeRelation?.name;
        setDiscoveryData({
          placeName: artifact.name,
          rarity: artifact.category.toUpperCase(),
          imageUrl: artifact.reference_images[0] ?? "",
          xpEarned: discovery.xp_awarded,
          pointsEarned: discovery.xp_awarded,
          quest: {
            name: quest?.name ?? "Cultural Exploration",
            progress: progress?.discovered_artifact_count ?? 0,
            total: questLinks?.length ?? 0,
          },
          badge: { name: badgeName ?? "Discovery completed", icon: "medal" },
        });
      });
  }, [discoveryId, user]);

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
