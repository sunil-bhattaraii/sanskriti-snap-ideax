import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProfileAvatar from '@/components/ProfileAvatar';
import type { LeaderboardUser } from '@/types/leaderboard';
import { COLORS } from '@/constants/colors';

interface CurrentUserCardProps {
  user: LeaderboardUser;
}

export default function CurrentUserCard({ user }: CurrentUserCardProps) {
  return (
    <View style={styles.container}>
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{user.rank}</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <ProfileAvatar
          displayName={user.display_name}
          imageUrl={user.profile_image_url}
          size={44}
        />
        <View style={styles.currentUserIndicator}>
          <Text style={styles.currentUserIndicatorText}>You</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text style={styles.level}>Lvl {user.level} [You]</Text>
      </View>

      {/* XP */}
      <View style={styles.xpContainer}>
        <Text style={styles.xpText}>
          {user.lifetime_xp.toLocaleString()} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  currentUserIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentUserIndicatorText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  level: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});