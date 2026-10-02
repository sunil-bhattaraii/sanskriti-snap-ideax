import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '@/components/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { getClaimedRewards, type ClaimedReward } from '@/services/claimed-rewards';
import { useAuthStore } from '@/store/authstore';

const statusColors: Record<ClaimedReward['status'], string> = {
  pending: '#D97706',
  verified: '#2563EB',
  redeemed: '#059669',
  expired: '#DC2626',
};

export default function ClaimedRewardsScreen() {
  const user = useAuthStore((state) => state.user);
  const [rewards, setRewards] = useState<ClaimedReward[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRewards = useCallback(async () => {
    if (!user) {
      setRewards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setRewards(await getClaimedRewards(user.id));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load claimed rewards.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadRewards();
    }, [loadRewards])
  );

  const renderReward = ({ item }: { item: ClaimedReward }) => (
    <View style={styles.rewardCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="gift" size={22} color="#B45309" />
      </View>
      <View style={styles.rewardContent}>
        <Text style={styles.partnerName}>{item.partnerName}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.metadata}>
          Claimed {new Date(item.redeemedAt).toLocaleDateString()} · {item.pointsSpent} points
        </Text>
      </View>
      <View
        style={[
          styles.status,
          { backgroundColor: `${statusColors[item.status]}1A` },
        ]}
      >
        <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Claimed Rewards" />

      {isLoading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadRewards()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            rewards.length === 0 ? styles.emptyList : styles.list
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={42} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>
                {user ? 'No claimed rewards yet' : 'Sign in to view rewards'}
              </Text>
              <Text style={styles.emptyText}>
                {user
                  ? 'Rewards you claim will appear here for use at the partner business.'
                  : 'Claimed rewards are available from your signed-in profile.'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  list: { padding: 20, paddingBottom: 40 },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  rewardCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rewardContent: { flex: 1 },
  partnerName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  description: { color: COLORS.tertiary, fontSize: 13, marginTop: 3 },
  metadata: { color: '#9CA3AF', fontSize: 11, marginTop: 6 },
  status: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  errorText: { color: COLORS.tertiary, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: COLORS.primary, fontWeight: '700' },
  emptyState: { alignItems: 'center' },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 14 },
  emptyText: { color: COLORS.tertiary, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
});
