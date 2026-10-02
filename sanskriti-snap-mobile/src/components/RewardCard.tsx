// src/components/RewardCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reward } from '../data/mockRewards';

interface RewardCardProps {
  reward: Reward;
  onRedeem?: () => void;
  onClaim?: () => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, onRedeem, onClaim }) => {
  const isClaimed = reward.status === 'claimed';
  const isLocked = reward.status === 'locked';

  const getCategoryIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      restaurant: 'restaurant-outline',
      brush: 'brush-outline',
      'check-circle': 'checkmark-circle-outline',
      bed: 'bed-outline',
    };
    return iconMap[icon] || 'star-outline';
  };

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: reward.image }}
          style={[styles.rewardImage, isClaimed && styles.claimedImage]}
          resizeMode="cover"
        />
        
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name={getCategoryIconName(reward.categoryIcon)} size={14} color="#4B5563" />
          <Text style={styles.categoryText}>{reward.category}</Text>
        </View>

        {/* Points Badge */}
        <View style={[styles.pointsBadge, isLocked && styles.lockedBadge]}>
          {isLocked ? (
            <Ionicons name="lock-closed" size={12} color="#6B7280" />
          ) : (
            <Ionicons name="star" size={12} color="#F59E0B" />
          )}
          <Text style={[styles.pointsBadgeText, isLocked && styles.lockedBadgeText]}>
            {reward.pointsRequired.toLocaleString()}
          </Text>
        </View>

        {/* Claimed Overlay */}
        {isClaimed && (
          <View style={styles.claimedOverlay}>
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.claimedBadgeText}>Claimed</Text>
            </View>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.businessName}>{reward.businessName}</Text>
        <Text style={styles.title}>{reward.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{reward.description}</Text>

        {/* Location (if available) */}
        {reward.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.locationText}>{reward.location}</Text>
          </View>
        )}

        {/* Action Button */}
        {reward.status === 'available' && reward.location && (
          <TouchableOpacity style={styles.redeemButton} onPress={onRedeem} activeOpacity={0.9}>
            <Text style={styles.redeemButtonText}>Redeem</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {reward.status === 'available' && !reward.location && (
          <TouchableOpacity style={styles.claimButton} onPress={onClaim} activeOpacity={0.9}>
            <Text style={styles.claimButtonText}>Claim Reward</Text>
          </TouchableOpacity>
        )}

        {isClaimed && (
          <View style={styles.usedButton}>
            <Text style={styles.usedButtonText}>Reward Used</Text>
          </View>
        )}

        {isLocked && reward.pointsNeeded !== undefined && (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedText}>Need {reward.pointsNeeded.toLocaleString()} more</Text>
            <View style={styles.progressBarBackground}>
              <View style={styles.progressBarFill} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  rewardImage: {
    width: '100%',
    height: '100%',
  },
  claimedImage: {
    opacity: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  pointsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  lockedBadge: {
    backgroundColor: '#F3F4F6',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lockedBadgeText: {
    color: '#6B7280',
  },
  claimedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  claimedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9C4221',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C4221',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  claimButton: {
    borderWidth: 2,
    borderColor: '#9C4221',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#9C4221',
    fontSize: 15,
    fontWeight: '700',
  },
  usedButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  usedButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  lockedContainer: {
    marginTop: 8,
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '25%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
});