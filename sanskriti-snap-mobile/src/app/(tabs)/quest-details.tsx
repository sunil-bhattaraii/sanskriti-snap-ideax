// src/app/(tabs)/quest-details.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestDetailsHeader } from '../../components/QuestDetailsHeader';
import { QuestHeroCard } from '../../components/QuestHeroCard';
import { QuestProgressCard } from '../../components/QuestProgressCard';
import { DiscoveryItem } from '../../components/DiscoveryItem';
import { BottomNav } from '../../components/BottomNav';
import { mockQuestDetails } from '@/data/mockQuestDetails';

export default function QuestDetailsScreen() {
  const router = useRouter();

  const handleStartExploring = () => {
    console.log('Start exploring quest:', mockQuestDetails.id);
    // router.push(`/explore?quest=${mockQuestDetails.id}`);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'quests') return;
    router.push(`/${tab}`);
  };

  return (
    <View style={styles.container}>
      <QuestDetailsHeader />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <QuestHeroCard 
          data={mockQuestDetails} 
          onStartExploring={handleStartExploring} 
        />
        
        <QuestProgressCard data={mockQuestDetails} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Required Discoveries</Text>
        </View>

        <View style={styles.discoveriesList}>
          {mockQuestDetails.discoveries.map((item) => (
            <DiscoveryItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <BottomNav activeTab="quests" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  discoveriesList: {
    paddingHorizontal: 16,
  },
});