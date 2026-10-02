// src/app/(tabs)/collection.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CollectionHeader } from '../../components/CollectionHeader';
import { CollectionStats } from '../../components/CollectionStats';
import { CollectionGrid } from '../../components/CollectionGrid';
import { BottomNav } from '../../components/BottomNav';
import { mockCollectionItems, mockCollectionStats } from '../../data/mockCollection';
import { useRouter } from 'expo-router';

export default function CollectionScreen() {
  const router = useRouter();

  const handleItemPress = (item: any) => {
    if (item.discovered) {
      console.log('Navigate to artifact detail:', item.id);
      // router.push(`/artifacts/${item.id}`);
    }
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'collection') return;
    router.push(`/${tab}`);
  };

  return (
    <View style={styles.container}>
      <CollectionHeader />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CollectionStats stats={mockCollectionStats} />
        <CollectionGrid 
          items={mockCollectionItems} 
          onItemPress={handleItemPress}
        />
      </ScrollView>
      <BottomNav activeTab="collection" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scrollContent: {
    flexGrow: 1,
  },
});