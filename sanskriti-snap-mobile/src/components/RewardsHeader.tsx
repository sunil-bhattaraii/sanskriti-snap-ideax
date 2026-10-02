// src/components/RewardsHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserPoints } from '../data/mockRewards';

interface RewardsHeaderProps {
  userPoints: UserPoints;
}

export const RewardsHeader: React.FC<RewardsHeaderProps> = ({ userPoints }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color="#9C4221" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Rewards</Text>
      
      <View style={styles.pointsBadge}>
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text style={styles.pointsText}>{userPoints.current.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FDFBF9',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9C4221',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
});