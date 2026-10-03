// src/components/LeaderboardTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type TabType = 'GLOBAL' | 'FRIENDS';

interface LeaderboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const LeaderboardTabs: React.FC<LeaderboardTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'GLOBAL' && styles.activeTab]}
        onPress={() => onTabChange('GLOBAL')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, activeTab === 'GLOBAL' && styles.activeTabText]}>
          GLOBAL
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'FRIENDS' && styles.activeTab]}
        onPress={() => onTabChange('FRIENDS')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, activeTab === 'FRIENDS' && styles.activeTabText]}>
          FRIENDS
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: '#9C4221',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});