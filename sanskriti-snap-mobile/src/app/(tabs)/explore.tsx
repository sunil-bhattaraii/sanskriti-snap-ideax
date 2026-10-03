import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import ExploreMapView, {
  MapViewHandle,
  ExploreArtifact,
} from '../../components/explore/MapView';
import SearchBar from '../../components/explore/SearchBar';
import MapControls from '../../components/explore/MapControls';
import BottomSheet from '../../components/explore/BottomSheet';
import AppHeader from '../../components/AppHeader';
import {
  isExploreCacheFresh,
  readExploreCache,
  warmExploreCache,
} from '../../services/explore-data';
import { searchNepalArtifacts } from '../../services/nepal-search';

type Coordinate = [number, number];

// Define the unified search result type
type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type: 'artifact' | 'location';
  data: any;
};

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    focus?: string;
  }>();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [artifacts, setArtifacts] = useState<ExploreArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] =
    useState<ExploreArtifact | null>(null);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const mapViewRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      let cachedDataWasShown = false;
      try {
        const cached = await readExploreCache();
        if (cached && isMounted) {
          cachedDataWasShown = true;
          setUserLocation(cached.userLocation);
          setArtifacts(cached.artifacts);
          setLoading(false);
        }

        const fresh =
          cached && isExploreCacheFresh(cached)
            ? cached
            : await warmExploreCache();
        if (fresh && isMounted) {
          setUserLocation(fresh.userLocation);
          setArtifacts(fresh.artifacts);
        }
      } catch (error) {
        console.error(error);
        if (isMounted && !cachedDataWasShown) {
          Alert.alert(
            'Unable to load nearby artifacts',
            error instanceof Error ? error.message : 'Please try again.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || loading) return;

    // The explore route can already be mounted when navigation returns from home.
    // Wait for the transition and map ref before moving the camera.
    const timer = setTimeout(() => {
      mapViewRef.current?.flyTo([lng, lat], 16);
    }, 250);
    return () => clearTimeout(timer);
  }, [loading, params.lat, params.lng, params.focus]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const matches = await searchNepalArtifacts(searchQuery);
        if (cancelled) return;
        setSearchResults(
          matches.map((item) => ({
            id: `art-${item.id}`,
            title: item.name,
            subtitle: `${item.category} • ${item.human_readable_location || 'Nepal'}`,
            type: 'artifact',
            data: item,
          }))
        );
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // ✅ Handle Search Selection
  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'artifact') {
      router.push(`/artifacts/${encodeURIComponent(result.data.id)}`);
    } else if (result.type === 'location') {
      // Fly to the location coordinates
      mapViewRef.current?.flyTo(result.data, 16);
    }
  };

  const handleArtifactPress = (artifact: ExploreArtifact) => {
    setSelectedArtifact(artifact);
  };

  const handleRecenter = () => {
    if (userLocation && mapViewRef.current) {
      mapViewRef.current.recenter(userLocation);
    }
  };

  const handleNorth = () => {
    mapViewRef.current?.resetNorth();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BottomSheet
        artifacts={artifacts}
        selectedArtifact={selectedArtifact}
        onArtifactPress={handleArtifactPress}
      />

      <AppHeader
        overlay
        overlayTop={30}
        centerContent={
          <SearchBar
            embedded
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchResults}
            onSelect={handleSearchSelect}
            onClose={() => setSearchResults([])}
            autoFocus={Boolean(params.focus)}
          />
        }
      />

      <ExploreMapView
        ref={mapViewRef}
        userLocation={userLocation}
        artifacts={artifacts}
        selectedArtifact={selectedArtifact}
        onArtifactPress={handleArtifactPress}
      />

      <MapControls onRecenter={handleRecenter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf9f6' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf9f6',
  },
});
