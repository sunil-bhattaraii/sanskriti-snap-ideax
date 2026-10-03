import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import ScreenHeader from '../../components/ScreenHeader';
import { SavedPlaceCard } from '../../components/SavedPlaceCard';
import { readSavedPlaces, type SavedPlace } from '../../services/saved-places';

export default function SavedPlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = React.useState<SavedPlace[]>([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      setLoading(true);
      readSavedPlaces()
        .then((saved) => mounted && setPlaces(saved))
        .catch(() => Alert.alert('Saved places unavailable', 'Unable to read saved places.'))
        .finally(() => mounted && setLoading(false));
      return () => { mounted = false; };
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Saved Places" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? <ActivityIndicator /> : places.length === 0 ? (
          <Text style={styles.emptyText}>Save an artifact to see it here.</Text>
        ) : places.map((place) => (
          <SavedPlaceCard
            key={place.id}
            item={place}
            onNavigate={() => router.push({ pathname: '/(tabs)/navigation', params: { artifactId: place.id } })}
          />
        ))}
      </ScrollView>
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
  emptyText: { padding: 24, textAlign: 'center', color: '#6B7280' },
});