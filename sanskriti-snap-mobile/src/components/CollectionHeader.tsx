// src/components/CollectionHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const CollectionHeader: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <Text style={styles.title}>My Collection</Text>
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
    backgroundColor: '#F9F5F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B4513',
  },
  placeholder: {
    width: 40,
  },
});