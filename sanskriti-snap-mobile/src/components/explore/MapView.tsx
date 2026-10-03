import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Map, Camera } from '@maplibre/maplibre-react-native';
import UserLocationMarker from './UserLocationMarker';
import ArtifactMarker from './ArtifactMarker';

type Coordinate = [number, number];

export type ExploreArtifact = {
  id: string;
  name: string;
  description: string;
  category: string;
  reference_images: string[];
  xp_value: number;
  lat: number;
  lng: number;
  distance: number;
};

interface MapViewProps {
  userLocation: Coordinate | null;
  artifacts: ExploreArtifact[];
  selectedArtifact: ExploreArtifact | null;
  onArtifactPress: (artifact: ExploreArtifact) => void;
}

// ✅ 1. Define the methods we want to expose to the parent
export interface MapViewHandle {
  recenter: (coords: Coordinate) => void;
  resetNorth: () => void;
  flyTo: (coords: Coordinate, zoom?: number) => void; //
}

const DEFAULT_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ✅ 2. Wrap with forwardRef
const ExploreMapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ userLocation, artifacts, selectedArtifact, onArtifactPress }, ref) => {
    const cameraRef = useRef<any>(null);

    // ✅ 3. Expose the camera methods to the parent component
    useImperativeHandle(ref, () => ({
      recenter: (coords: Coordinate) => {
        cameraRef.current?.flyTo({
          center: coords,
          zoom: 15,
          duration: 500,
        });
      },
      resetNorth: () => {
        cameraRef.current?.easeTo({
          heading: 0,
          duration: 300,
        });
      },
      flyTo: (coords: Coordinate, zoom = 15) => {
        // ✅ Added
        if (cameraRef.current) {
          cameraRef.current.flyTo({
            center: coords,
            zoom: zoom,
            duration: 1500,
            padding: { top: 100, bottom: 100, left: 20, right: 20 },
          });
        }
      },
    }));

    // Auto-move camera when an artifact is selected
    const lastSelectedArtifactId = useRef<string | null>(null);
    useEffect(() => {
      if (
        selectedArtifact &&
        selectedArtifact.id !== lastSelectedArtifactId.current &&
        cameraRef.current
      ) {
        lastSelectedArtifactId.current = selectedArtifact.id;
        cameraRef.current.flyTo({
          center: [selectedArtifact.lng, selectedArtifact.lat],
          zoom: 15,
          duration: 1000,
          padding: { top: 100, bottom: 300, left: 20, right: 20 },
        });
      }
    }, [selectedArtifact]);

    return (
      <Map
        style={{ flex: 1 }}
        mapStyle={DEFAULT_MAP_STYLE}
        compass={true}
        compassPosition={{ top: 100, right: 20 }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: userLocation || [85.324, 27.7172],
            zoom: 13,
          }}
        />

        {userLocation && <UserLocationMarker coordinate={userLocation} />}

        {artifacts.map((artifact) => (
          <ArtifactMarker
            key={`${artifact.id}-${selectedArtifact?.id === artifact.id}`}
            id={artifact.id}
            coordinate={[artifact.lng, artifact.lat]}
            category={artifact.category}
            isSelected={selectedArtifact?.id === artifact.id}
            onSelect={() => onArtifactPress(artifact)}
          />
        ))}
      </Map>
    );
  }
);

ExploreMapView.displayName = 'ExploreMapView';

export default ExploreMapView;
