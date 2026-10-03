import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';
import { COLORS } from '@/constants/colors';

interface QuestProgressCardProps {
  discoveredCount: number;
  totalArtifacts: number;
  xpReward: number;
  badgeName: string;
}

export default function QuestProgressCard({ discoveredCount, totalArtifacts, xpReward, badgeName }: QuestProgressCardProps) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quest Progress</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{discoveredCount} / {totalArtifacts} Discovered</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        current={discoveredCount}
        total={totalArtifacts}
        label=""
        height={8}
        fillColor={COLORS.primary}
        trackColor="#E5E7EB"
        style={styles.progressBar}
      />

      {/* Rewards Row */}
      <View style={styles.rewardsRow}>
        {/* XP Reward */}
        <View style={styles.rewardColumn}>
          <Text style={styles.rewardLabel}>XP Reward</Text>
          <View style={styles.xpContainer}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
        </View>

        {/* Completion Badge */}
        <View style={styles.rewardColumn}>
          <Text style={styles.rewardLabel}>Completion Badge</Text>
          <View style={styles.badgeContainer}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
            <Text style={styles.badgeText} numberOfLines={1}>{badgeName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -20, // Overlap the hero image
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: '#FEE2E2', // Light red/pink as per design
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626', // Red text
  },
  progressBar: {
    marginBottom: 20,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  rewardColumn: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginBottom: 8,
    fontWeight: '500',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1, // Prevents long badge names from breaking layout
  },
});