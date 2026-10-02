import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import BottomSheet from '../../components/explore/BottomSheet';
import MapControls from '../../components/explore/MapControls';
import ExploreMapView, {
  ExploreArtifact,
  MapViewHandle,
} from '../../components/explore/MapView';
import SearchBar from '../../components/explore/SearchBar';
import { MOCK_ARTIFACTS } from '../../constants/mockData';

type Coordinate = [number, number];

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

  const userLocation: Coordinate = [85.3253, 27.6727]; // Default: Patan Durbar Square coords
  const artifacts: ExploreArtifact[] = MOCK_ARTIFACTS;
  const [selectedArtifact, setSelectedArtifact] =
    useState<ExploreArtifact | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults: SearchResult[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return artifacts
      .filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      )
      .map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: `${a.category.toUpperCase()} • ${Math.round(a.distance * 1000)}m away`,
        type: 'artifact' as const,
        data: a,
      }));
  }, [searchQuery, artifacts]);

  const mapViewRef = useRef<MapViewHandle>(null);

  // Deep linking: Fly to coordinate params passed from another screen
  useEffect(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const timer = setTimeout(() => {
      mapViewRef.current?.flyTo([lng, lat], 16);
      const matched = artifacts.find(
        (a) => Math.abs(a.lat - lat) < 0.001 && Math.abs(a.lng - lng) < 0.001
      );
      if (matched) {
        setSelectedArtifact(matched);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [params.lat, params.lng, params.focus, artifacts]);

  // Handle Search Result Interactions
  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'artifact') {
      setSelectedArtifact(result.data);
      mapViewRef.current?.flyTo([result.data.lng, result.data.lat], 16);
    } else if (result.type === 'location') {
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

  return (
    <View style={styles.container}>
      <BottomSheet
        artifacts={artifacts}
        selectedArtifact={selectedArtifact}
        onArtifactPress={handleArtifactPress}
      />

      <AppHeader
        overlay
        centerContent={
          <SearchBar
            embedded
            query={searchQuery}
            setQuery={setSearchQuery}
            results={searchResults}
            onSelect={handleSearchSelect}
            onClose={() => setSearchQuery('')}
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
});
