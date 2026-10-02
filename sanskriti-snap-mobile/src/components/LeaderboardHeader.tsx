// src/components/LeaderboardHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const LeaderboardHeader: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#9C4221" />
      </TouchableOpacity>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.placeholder} />
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9C4221',
  },
  placeholder: {
    width: 40,
  },
});  