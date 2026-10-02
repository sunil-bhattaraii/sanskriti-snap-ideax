// src/components/QuestProgressCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuestDetailsData } from '@/data/mockQuestDetails';

interface QuestProgressCardProps {
  data: QuestDetailsData;
}

export const QuestProgressCard: React.FC<QuestProgressCardProps> = ({ data }) => {
  const progressPercentage = (data.currentProgress / data.totalProgress) * 100;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Quest Progress</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>
            {data.currentProgress} / {data.totalProgress} Discovered
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      {/* Rewards Row */}
      <View style={styles.rewardsRow}>
        {/* XP Reward */}
        <View style={styles.rewardColumn}>
          <Text style={styles.rewardLabel}>XP Reward</Text>
          <View style={styles.xpContainer}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.xpText}>+{data.xpReward} XP</Text>
          </View>
        </View>

        {/* Badge Reward */}
        <View style={styles.rewardColumn}>
          <Text style={styles.rewardLabel}>Completion Badge</Text>
          <View style={styles.badgeContainer}>
            <Ionicons name="shield-checkmark" size={18} color="#9C4221" />
            <Text style={styles.badgeText}>{data.badgeName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#1A1A1A',
  },
  progressPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9C4221',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9C4221',
    borderRadius: 5,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardColumn: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
});