import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from '@/components/ProfileAvatar';
import type { LeaderboardUser } from '@/types/leaderboard';
import { COLORS } from '@/constants/colors';

interface LeaderboardPodiumProps {
  users: LeaderboardUser[];
}

export default function LeaderboardPodium({ users }: LeaderboardPodiumProps) {
  const [firstPlace, secondPlace, thirdPlace] = users;

  const renderPodiumUser = (user: LeaderboardUser | undefined, position: number) => {
    if (!user) return null;

    const isFirst = position === 1;
    const avatarSize = isFirst ? 88 : 64;
    const rankBadgeColor =
      position === 1 ? '#D4AF37' : position === 2 ? '#C0C0C0' : '#CD7F32';
    const rankTextColor = '#FFFFFF';
    const xpBadgeBg =
      position === 1 ? '#FEF3C7' : position === 2 ? '#F3F4F6' : '#F5E2D0';
    const xpBadgeText =
      position === 1 ? '#92400E' : position === 2 ? '#4B5563' : '#8B4513';

    return (
      <View style={isFirst ? styles.firstPlaceContainer : styles.podiumUserContainer}>
        {isFirst && (
          <View style={styles.crown}>
            <Ionicons name="star" size={28} color={COLORS.secondary} />
          </View>
        )}

        <View style={styles.avatarWrapper}>
          <ProfileAvatar
            displayName={user.display_name}
            imageUrl={user.profile_image_url}
            size={avatarSize}
          />
          <View style={[styles.rankBadge, { backgroundColor: rankBadgeColor }]}>
            <Text style={[styles.rankBadgeText, { color: rankTextColor }]}>
              #{user.rank}
            </Text>
          </View>
        </View>

        <Text style={styles.username} numberOfLines={1}>
          {user.display_name}
        </Text>

        <View style={[styles.xpBadge, { backgroundColor: xpBadgeBg }]}>
          <Ionicons name="flash" size={12} color={xpBadgeText} />
          <Text style={[styles.xpBadgeText, { color: xpBadgeText }]}>
            {user.lifetime_xp.toLocaleString()} XP
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.podiumContainer}>
      {/* 3rd Place - Left */}
      <View style={styles.sideColumn}>
        {renderPodiumUser(thirdPlace, 3)}
        <View style={[styles.podiumBlock, styles.podiumBlockThird]} />
      </View>

      {/* 1st Place - Center */}
      <View style={styles.centerColumn}>
        {renderPodiumUser(firstPlace, 1)}
        <View style={[styles.podiumBlock, styles.podiumBlockFirst]} />
      </View>

      {/* 2nd Place - Right */}
      <View style={styles.sideColumn}>
        {renderPodiumUser(secondPlace, 2)}
        <View style={[styles.podiumBlock, styles.podiumBlockSecond]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
    backgroundColor: COLORS.neutral,
  },
  centerColumn: {
    flex: 1.2,
    alignItems: 'center',
  },
  sideColumn: {
    flex: 1,
    alignItems: 'center',
  },
  firstPlaceContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumUserContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  crown: {
    marginBottom: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.neutral,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  podiumBlock: {
    width: '70%',
    borderRadius: 8,
    marginTop: 4,
  },
  podiumBlockFirst: {
    height: 116,
    backgroundColor: '#D4AF37',
  },
  podiumBlockSecond: {
    height: 82,
    backgroundColor: '#C0C0C0',
  },
  podiumBlockThird: {
    height: 64,
    backgroundColor: '#CD7F32',
  },
});