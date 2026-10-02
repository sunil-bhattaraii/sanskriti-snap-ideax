import { type Reward } from "@/components/reward/RewardCard";
import RewardFilter from "@/components/reward/RewardFilter";
import RewardGrid from "@/components/reward/RewardGrid";
import ScreenHeader from "@/components/ScreenHeader";
import XPBalance from "@/components/XPBalance";
import { COLORS } from "@/constants/colors";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { backendClient } from "@/services/backendClient";
import { useAuthStore } from "@/store/authstore";

export default function RewardsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userXP, setUserXP] = useState(profile?.reward_points ?? 0);
  const [loading, setLoading] = useState(true);
  const [claimingRewardId, setClaimingRewardId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "All Rewards" | "Food & Drink" | "Experiences" | "Culture" | "Other"
  >("All Rewards");

  useEffect(() => {
    queueMicrotask(() => setUserXP(profile?.reward_points ?? 0));
  }, [profile?.reward_points]);

  useEffect(() => {
    let mounted = true;
    backendClient
      .from("rewards")
      .select("id, description, terms, point_requirement, category, image_url, businesses(name)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          Alert.alert("Rewards unavailable", error.message);
          if (mounted) setLoading(false);
          return;
        }
        if (mounted) setRewards((data ?? []).map((reward) => {
          const business = Array.isArray(reward.businesses) ? reward.businesses[0] : reward.businesses;
          return {
            id: reward.id,
            title: business?.name ?? "Partner reward",
            description: reward.description,
            xpCost: reward.point_requirement,
            imageUrl: reward.image_url ?? "",
            category: reward.category,
          };
        }));
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Declared first so handleClaimReward can reference it
  const redeemReward = useCallback(async (reward: Reward) => {
    if (!user || claimingRewardId) return;
    setClaimingRewardId(reward.id);

    try {
      const { data, error } = await backendClient.rpc("redeem_reward", {
        p_reward_id: reward.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as {
        success?: boolean;
        message?: string;
        points_remaining?: number;
      } | null;

      if (!result || !result.success) {
        throw new Error(result?.message ?? "Reward could not be claimed.");
      }

      setUserXP(result.points_remaining ?? 0);
      await fetchProfile(user.id);
      Alert.alert("Reward claimed", "Your reward is ready to use.", [
        { text: "Later", style: "cancel" },
        {
          text: "View claimed rewards",
          onPress: () => router.push("/(tabs)/claimed-rewards"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Unable to claim reward",
        error instanceof Error ? error.message : "Reward could not be claimed.",
      );
    } finally {
      setClaimingRewardId(null);
    }
  }, [user, claimingRewardId, fetchProfile, router]);

  const handleClaimReward = useCallback((reward: Reward) => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to redeem rewards.");
      return;
    }

    if (userXP < reward.xpCost) {
      Alert.alert("Not enough points", `You need ${reward.xpCost - userXP} more points to redeem this reward.`);
      return;
    }

    Alert.alert(
      "Claim Reward",
      `Are you sure you want to claim "${reward.title}" for ${reward.xpCost} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim",
          onPress: () => void redeemReward(reward),
        },
      ],
    );
  }, [user, userXP, redeemReward]);

  const filteredRewards = useMemo(
    () =>
      selectedFilter === "All Rewards"
        ? rewards
        : rewards.filter((reward) => reward.category === selectedFilter),
    [rewards, selectedFilter]
  );

  const ListHeader = useMemo(
    () => (
      <>
        <XPBalance balance={userXP} />
        <RewardFilter
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </>
    ),
    [userXP, selectedFilter]
  );

  const ListEmpty = useMemo(
    () =>
      loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <Text style={styles.emptyText}>No rewards available.</Text>
      ),
    [loading]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScreenHeader title="Available Rewards" />
        <RewardGrid
          rewards={filteredRewards}
          userXP={userXP}
          onClaimReward={handleClaimReward}
          claimingRewardId={claimingRewardId}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    color: COLORS.tertiary,
    textAlign: "center",
    padding: 32,
  },
});
