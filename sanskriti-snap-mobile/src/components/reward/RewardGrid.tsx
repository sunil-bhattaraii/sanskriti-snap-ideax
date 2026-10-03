import React from "react";
import { FlatList, StyleSheet } from "react-native";
import RewardCard, { type Reward } from "./RewardCard";

interface RewardGridProps {
  rewards: Reward[];
  userXP: number;
  onClaimReward: (reward: Reward) => void;
  claimingRewardId?: string | null;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export default function RewardGrid({
  rewards,
  userXP,
  onClaimReward,
  claimingRewardId,
  ListHeaderComponent,
  ListEmptyComponent,
}: RewardGridProps) {
  const renderItem = ({ item }: { item: Reward }) => (
    <RewardCard
      reward={item}
      onClaim={onClaimReward}
      canAfford={userXP >= item.xpCost}
      isClaiming={claimingRewardId === item.id}
    />
  );

  return (
    <FlatList
      data={rewards}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});