import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import BottomSheet from '../../components/explore/BottomSheet';
import MapControls from '../../components/explore/MapControls';
import ExploreMapView, {
  ExploreArtifact,
  MapViewHandle,
} from '../../components/explore/MapView';
import SearchBar from '../../components/explore/SearchBar';

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

  // Clean UI Placeholders (Modify these mock arrays to test your interface elements)
  const [userLocation, setUserLocation] = useState<Coordinate | null>([85.324, 27.717]); // Default: Kathmandu
  const [artifacts, setArtifacts] = useState<ExploreArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ExploreArtifact | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const mapViewRef = useRef<MapViewHandle>(null);

  // Deep linking: Fly to coordinate params passed from another screen
  useEffect(() => {
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const timer = setTimeout(() => {
      mapViewRef.current?.flyTo([lng, lat], 16);
    }, 250);
    return () => clearTimeout(timer);
  }, [params.lat, params.lng, params.focus]);

  // Handle Search Result Interactions
  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'artifact') {
      setSelectedArtifact(result.data);
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
        // overlayTop={30}
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
});
