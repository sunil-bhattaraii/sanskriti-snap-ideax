// src/components/QuestsHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const QuestsHeader: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color="#9C4221" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Quests</Text>
      
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="search-outline" size={24} color="#9C4221" />
      </TouchableOpacity>
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
    backgroundColor: '#F9F5F0',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9C4221',
  },
});