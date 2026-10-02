// src/app/(tabs)/saved-places.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SavedPlacesHeader } from '../../components/SavedPlacesHeader';
import { SavedPlaceCard } from '../../components/SavedPlaceCard';
import { BottomNav } from '../../components/BottomNav';
import { mockSavedPlaces } from '../../data/mockSavedPlaces';

export default function SavedPlacesScreen() {
  const router = useRouter();

  const handleNavigate = (placeName: string) => {
    console.log(`Navigating to ${placeName}`);
    // router.push(`/navigation?place=${placeName}`);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'profile') return; // Already on profile-related screen
    router.push(`/${tab}`);
  };

  return (
    <View style={styles.container}>
      <SavedPlacesHeader />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {mockSavedPlaces.map((place) => (
          <SavedPlaceCard
            key={place.id}
            item={place}
            onNavigate={() => handleNavigate(place.name)}
          />
        ))}
      </ScrollView>

      {/* Profile is active in the bottom nav as this is accessed from the Profile menu */}
      <BottomNav activeTab="profile" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
});