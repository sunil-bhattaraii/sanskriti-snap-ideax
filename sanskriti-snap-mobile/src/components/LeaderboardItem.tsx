// src/components/LeaderboardItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardUser } from '../data/mockLeaderboard';

interface LeaderboardItemProps {
  user: LeaderboardUser;
}

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ user }) => {
  const isCurrent = user.isCurrentUser;

  return (
    <View style={[styles.container, isCurrent && styles.currentContainer]}>
      {/* Rank */}
      <Text style={[styles.rank, isCurrent && styles.currentRank]}>{user.rank}</Text>

      {/* Avatar */}
      <Image
        source={{ uri: user.avatar }}
        style={[styles.avatar, isCurrent && styles.currentAvatar]}
        resizeMode="cover"
      />

      {/* User Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, isCurrent && styles.currentName]} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={[styles.level, isCurrent && styles.currentLevel]}>
          Lvl {user.level}{isCurrent ? ' (You)' : ''}
        </Text>
      </View>

      {/* XP */}
      <Text style={[styles.xp, isCurrent && styles.currentXp]}>
        {user.xp.toLocaleString()} XP
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  currentContainer: {
    backgroundColor: '#9C4221',
    shadowColor: '#9C4221',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    width: 30,
    textAlign: 'center',
  },
  currentRank: {
    color: '#FFFFFF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  currentAvatar: {
    borderColor: '#FEE2E2',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  currentName: {
    color: '#FFFFFF',
  },
  level: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  currentLevel: {
    color: '#FECACA',
  },
  xp: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9C4221',
  },
  currentXp: {
    color: '#FFFFFF',
  },
});