// src/app/(tabs)/quests.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { QuestsHeader } from '../../components/QuestsHeader';
import { QuestFilterTabs } from '../../components/QuestFilterTabs';
import { QuestCard } from '../../components/QuestCard';
import { BottomNav } from '../../components/BottomNav';
import { mockQuests, QuestFilter } from '../../data/mockQuests';

export default function QuestsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<QuestFilter>('All Quests');

  const handleQuestPress = (questId: string) => {
    console.log('Navigate to quest detail:', questId);
    // router.push(`/quests/${questId}`);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'quests') return;
    router.push(`/${tab}`);
  };

  // In a real app, you would filter mockQuests based on activeFilter here
  const filteredQuests = mockQuests; 

  return (
    <View style={styles.container}>
      <QuestsHeader />
      
      <QuestFilterTabs 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredQuests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onPress={() => handleQuestPress(quest.id)}
          />
        ))}
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
    paddingTop: 8,
    paddingBottom: 16,
  },
});