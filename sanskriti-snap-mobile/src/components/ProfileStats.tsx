// src/components/ProfileStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileStatsProps {
  totalXP: number;
  discoveries: number;
  quests: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  totalXP,
  discoveries,
  quests,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
        <Text style={styles.statLabel}>TOTAL XP</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{discoveries}</Text>
        <Text style={styles.statLabel}>DISCOVERIES</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{quests}</Text>
        <Text style={styles.statLabel}>QUESTS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});