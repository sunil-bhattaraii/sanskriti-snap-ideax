// src/components/RewardFilterTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RewardFilter } from '../data/mockRewards';

interface RewardFilterTabsProps {
  activeFilter: RewardFilter;
  onFilterChange: (filter: RewardFilter) => void;
}

export const RewardFilterTabs: React.FC<RewardFilterTabsProps> = ({ activeFilter, onFilterChange }) => {
  const filters: RewardFilter[] = ['All Rewards', 'Food & Drink', 'Experiences', 'Crafts'];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onFilterChange(filter)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FDFBF9',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  activeTab: {
    backgroundColor: '#9C4221',
    borderColor: '#9C4221',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});