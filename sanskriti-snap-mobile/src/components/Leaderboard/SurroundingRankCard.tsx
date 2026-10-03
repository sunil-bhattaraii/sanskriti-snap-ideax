import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProfileAvatar from '@/components/ProfileAvatar';
import type { LeaderboardUser } from '@/types/leaderboard';
import { COLORS } from '@/constants/colors';

interface SurroundingRankCardProps {
  users: LeaderboardUser[];
}

export default function SurroundingRankCard({ users }: SurroundingRankCardProps) {
  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>YOUR RANK</Text>
      <View style={styles.card}>
        {users.map((user) => {
          const isCurrent = user.isCurrentUser;
          return (
            <View
              key={user.id}
              style={[
                styles.row,
                isCurrent && styles.currentRow,
                users.indexOf(user) === users.length - 1 && styles.lastRow
              ]}
            >
              {/* Rank */}
              <Text style={[styles.rankText, isCurrent && styles.currentRankText]}>
                {user.rank}
              </Text>

              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                <ProfileAvatar
                  displayName={user.display_name}
                  imageUrl={user.profile_image_url}
                  size={40}
                />
                {isCurrent && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>You</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.infoContainer}>
                <Text style={[styles.nameText, isCurrent && styles.currentNameText]} numberOfLines={1}>
                  {user.display_name}
                </Text>
                <Text style={[styles.levelText, isCurrent && styles.currentLevelText]}>
                  Lvl {user.level}
                </Text>
              </View>

              {/* XP */}
              <Text style={[styles.xpText, isCurrent && styles.currentXpText]}>
                {user.lifetime_xp.toLocaleString()} XP
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  currentRow: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rankText: {
    width: 30,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  currentRankText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  avatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  youBadge: {
    position: 'absolute',
    bottom: -6,
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
  infoContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentNameText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  levelText: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  currentLevelText: {
    color: 'rgba(255, 255, 255, 0.85)',
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