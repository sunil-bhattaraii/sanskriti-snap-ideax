// src/app/(tabs)/empty-collection.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyStateCard } from '../../components/EmptyStateCard';
import { BottomNav } from '../../components/BottomNav';
import { mockEmptyCollectionData } from '../../data/mockEmptyCollection';

export default function EmptyCollectionScreen() {
  const router = useRouter();

  const handleStartExploring = () => {
    console.log('Navigate to Explore map');
    // router.push('/explore');
  };

  const handleAddPress = () => {
    console.log('Add to collection pressed');
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'collection') return;
    const paths: Record<string, any> = {
      index: '/',
      explore: '/explore',
      profile: '/profile',
    };
    router.push(paths[tab] || '/');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{mockEmptyCollectionData.headerTitle}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State Card */}
        <EmptyStateCard 
          data={mockEmptyCollectionData} 
          onAddPress={handleAddPress} 
        />

        {/* Bottom Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.mainTitle}>{mockEmptyCollectionData.mainTitle}</Text>
          <Text style={styles.mainSubtitle}>{mockEmptyCollectionData.mainSubtitle}</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.ctaButton} 
          onPress={handleStartExploring}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaButtonText}>{mockEmptyCollectionData.ctaButtonText}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab="collection" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF9', // Light cream background
  },
  header: {
    paddingTop: 60, // Adjust for status bar
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#FDFBF9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9C4221', // Brownish-red
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Space for bottom nav
  },
  textSection: {
    paddingHorizontal: 32,
    marginTop: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  mainSubtitle: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#9C4221',
    marginHorizontal: 24,
    marginTop: 40,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#9C4221',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});