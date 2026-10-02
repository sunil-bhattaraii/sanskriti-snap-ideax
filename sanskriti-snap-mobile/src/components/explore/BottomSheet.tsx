import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetView,
  BottomSheetModal,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import ArtifactCard from './ArtifactCard';
import type { ExploreArtifact } from '../../types/artifact';

export interface BottomSheetProps {
  artifacts: ExploreArtifact[];
  selectedArtifact: ExploreArtifact | null;
  onArtifactPress: (artifact: ExploreArtifact) => void;
}

// ⚠️ CRITICAL: These must exactly match the dimensions in ArtifactCard.tsx
const ITEM_WIDTH = 280;
const ITEM_GAP = 16;

export default function BottomSheet({
  artifacts,
  selectedArtifact,
  onArtifactPress
}: BottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const flatListRef = useRef<FlatList>(null);

  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);
  const sortedArtifacts = useMemo(
    () =>
      [...artifacts].sort((first, second) => {
        const firstDistance = Number.isFinite(first.distance)
          ? first.distance
          : Number.POSITIVE_INFINITY;
        const secondDistance = Number.isFinite(second.distance)
          ? second.distance
          : Number.POSITIVE_INFINITY;
        return firstDistance - secondDistance;
      }),
    [artifacts]
  );

  // Auto-present bottom sheet when artifact is selected
  useEffect(() => {
    if (selectedArtifact && bottomSheetRef.current) {
      bottomSheetRef.current.present();

      const timeoutId = setTimeout(() => {
        const index = sortedArtifacts.findIndex(
          (artifact) => artifact.id === selectedArtifact.id
        );
        if (index !== -1 && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // Centers the card
          });
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedArtifact, sortedArtifacts]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_WIDTH + ITEM_GAP,
    offset: (ITEM_WIDTH + ITEM_GAP) * index,
    index,
  }), []);

  const handleScrollToIndexFailed = useCallback((info: any) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: ExploreArtifact }) => (
    <ArtifactCard
      artifact={item}
      onPress={() => onArtifactPress(item)}
      isSelected={selectedArtifact?.id === item.id}
    />
  ), [selectedArtifact, onArtifactPress]);

  const keyExtractor = useCallback((item: ExploreArtifact) => item.id, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={selectedArtifact ? 1 : 0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}

      enableContentPanningGesture={false}

      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={1}
        />
      )}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Nearby Heritage</Text>
            <Text style={styles.subtitle}>
              {artifacts.length} locations discovered
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>
              View All <Ionicons name="arrow-forward" size={14} />
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={sortedArtifacts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
          snapToInterval={ITEM_WIDTH + ITEM_GAP}
          decelerationRate="fast"
          snapToAlignment="start"
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={handleScrollToIndexFailed}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fdf9f6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: '#E5E2DF',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8, // Added slight spacing below handle
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1c1b1a',
    fontFamily: 'Epilogue',
  },
  subtitle: {
    fontSize: 12,
    color: '#4A5568',
    marginTop: 4,
    fontWeight: '500',
  },
  viewAllText: { color: '#8E3B22', fontWeight: '700', fontSize: 12 },
  cardList: {
    paddingRight: 20,
  },
});
