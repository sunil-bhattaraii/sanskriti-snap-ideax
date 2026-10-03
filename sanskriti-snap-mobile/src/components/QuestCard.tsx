// src/components/QuestCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Quest } from '../data/mockQuests';

interface QuestCardProps {
  quest: Quest;
  onPress?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress }) => {
  const progressPercentage = Math.round((quest.currentProgress / quest.totalProgress) * 100);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Top Row: Image, Title, Description, Star */}
      <View style={styles.topRow}>
        <Image
          source={{ uri: quest.image }}
          style={styles.questImage}
          resizeMode="cover"
        />
        
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{quest.title}</Text>
            <Ionicons 
              name={quest.isFeatured ? "star" : "star-outline"} 
              size={20} 
              color={quest.isFeatured ? "#3B82F6" : "#9CA3AF"} 
            />
          </View>
          <Text style={styles.description} numberOfLines={2}>{quest.description}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressText}>
            {quest.currentProgress}/{quest.totalProgress} ({progressPercentage}%)
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Rewards Section */}
      <View style={styles.rewardsSection}>
        <View style={styles.rewardsLabelContainer}>
          <Ionicons name="trophy-outline" size={16} color="#6B7280" />
          <Text style={styles.rewardsLabel}>Rewards</Text>
        </View>
        <View style={styles.rewardBadges}>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{quest.xpReward} XP</Text>
          </View>
          {quest.hasBadgeReward && (
            <View style={styles.badgeIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#9C4221" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  questImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9C4221',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9C4221',
    borderRadius: 4,
  },
  rewardsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  rewardsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  rewardBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  badgeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});