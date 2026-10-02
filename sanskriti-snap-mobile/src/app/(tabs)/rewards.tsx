// src/app/(tabs)/rewards.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { RewardsHeader } from '../../components/RewardsHeader';
import { RewardFilterTabs } from '@/components/RewardFilterTabs';
import { RewardCard } from '../../components/RewardCard';
import { BottomNav } from '../../components/BottomNav';
import { mockRewards, mockUserPoints, RewardFilter } from '../../data/mockRewards';

export default function RewardsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<RewardFilter>('All Rewards');

  const handleRedeem = (rewardId: string) => {
    console.log('Redeem reward:', rewardId);
  };

  const handleClaim = (rewardId: string) => {
    console.log('Claim reward:', rewardId);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'profile') return;
    const paths: Record<string, any> = {
      index: '/',
      explore: '/explore',
      collection: '/collection',
    };
    router.push(paths[tab] || '/');
  };

  // In a real app, filter rewards based on activeFilter
  const filteredRewards = mockRewards;

  return (
    <View style={styles.container}>
      <RewardsHeader userPoints={mockUserPoints} />
      
      <RewardFilterTabs 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredRewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            onRedeem={() => handleRedeem(reward.id)}
            onClaim={() => handleClaim(reward.id)}
          />
        ))}
      </ScrollView>

      <BottomNav activeTab="profile" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF9',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
});