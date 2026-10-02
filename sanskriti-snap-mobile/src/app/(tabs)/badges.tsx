// src/app/(tabs)/badges.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BadgesHeader } from '../../components/BadgesHeader';
import { ProgressCircle } from '../../components/ProgressCircle';
import { BadgeCard } from '../../components/BadgeCard';
import { BottomNav } from '../../components/BottomNav';
import { mockBadges, mockBadgeProgress } from '../../data/mockBadges';

export default function BadgesScreen() {
  const router = useRouter();

  const handleTabPress = (tab: string) => {
    if (tab === 'profile') return;
    router.push(`/(tabs)/${tab}` as any);
  };

  return (
    <View style={styles.container}>
      <BadgesHeader />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Section */}
        <ProgressCircle progress={mockBadgeProgress} />
        
        <Text style={styles.sectionTitle}>Exploration Progress</Text>
        <Text style={styles.sectionSubtitle}>
          Keep discovering artifacts to expand your collection.
        </Text>

        <View style={styles.divider} />

        {/* Badges Grid */}
        <View style={styles.gridContainer}>
          {mockBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab="profile" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF9',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});