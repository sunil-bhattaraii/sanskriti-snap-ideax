import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProfileAvatar from '@/components/ProfileAvatar';
import type { LeaderboardUser } from '@/types/leaderboard';
import { COLORS } from '@/constants/colors';

interface LeaderboardListItemProps {
  user: LeaderboardUser;
  isPinned?: boolean;
  onPress?: (user: LeaderboardUser) => void;
}

export default function LeaderboardListItem({ user, isPinned = false, onPress }: LeaderboardListItemProps) {
  const isCurrent = user.isCurrentUser;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrent && styles.currentRow,
        isPinned && styles.pinnedRow,
      ]}
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, isCurrent && styles.currentRankText]}>
          {user.rank}
        </Text>
      </View>

      <View style={styles.avatarContainer}>
        <ProfileAvatar
          displayName={user.display_name}
          imageUrl={user.profile_image_url}
          size={44}
        />
        {isCurrent && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>You</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={[styles.username, isCurrent && styles.currentUsername]} numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text style={[styles.level, isCurrent && styles.currentLevel]}>
          Lvl {user.level}
        </Text>
      </View>

      <View style={styles.xpContainer}>
        <Text style={[styles.xpText, isCurrent && styles.currentXpText]}>
          {user.lifetime_xp.toLocaleString()} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 72,
  },
  currentRow: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
  },
  pinnedRow: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginVertical: 0,
    marginHorizontal: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderBottomWidth: 0,
    minHeight: 72,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  currentRankText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  youBadge: {
    position: 'absolute',
    bottom: -4,
    right: -10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentUsername: {
    color: COLORS.white,
    fontWeight: '700',
  },
  level: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  currentLevel: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  currentXpText: {
    color: COLORS.white,
  },
});