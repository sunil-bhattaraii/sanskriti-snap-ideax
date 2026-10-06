import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import AppHeader from '../../components/AppHeader';
import { ExploreArtifact } from '../../components/explore/MapView';
import {
  getNearbyNepalArtifacts,
  searchNepalArtifacts,
} from '../../services/nepal-search';
import { nowTimestamp } from '../../utils/time';

type RecentSearch = {
  id: string;
  query: string;
  timestamp: number;
};

type Destination = {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
};

type SearchResult = {
  destination: Destination | null;
  artifacts: ExploreArtifact[];
};

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = params.query?.toString() || '';
  const returnToExplore = params.source?.toString() === 'explore';

  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'results'>('recent');

  async function performSearch(searchQuery: string) {
    setLoading(true);
    try {
      const matches = await searchNepalArtifacts(searchQuery);
      const uniqueDestinations = new Map<string, Destination>();
      matches.forEach((item) => {
        const location = item.human_readable_location || 'Nepal';
        if (!uniqueDestinations.has(location)) {
          uniqueDestinations.set(location, {
            id: `place-${location}`,
            name: location,
            subtitle: 'Nepal heritage location',
            lat: item.lat,
            lng: item.lng,
          });
        }
      });
      const destResults = [...uniqueDestinations.values()].slice(0, 5);
      const nearbyMatches = destResults[0]
        ? await getNearbyNepalArtifacts(destResults[0].lat, destResults[0].lng)
        : matches;
      const artifacts = nearbyMatches.map((item) => ({
        ...item,
        distance: item.distance_m / 1000,
      })) as ExploreArtifact[];

      setDestinations(destResults);
      setSearchResults({
        destination: destResults[0] ?? null,
        artifacts,
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load recent searches on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@sanskriti_recent_searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    })();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (query.trim().length === 0) return;
    const timer = setTimeout(() => {
      performSearch(query);
      setActiveTab('results');
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setActiveTab('recent');
      setSearchResults(null);
      setDestinations([]);
    }
  };

  const saveRecentSearch = async (searchQuery: string) => {
    try {
      const newSearch: RecentSearch = {
        id: nowTimestamp().toString(),
        query: searchQuery,
        timestamp: nowTimestamp(),
      };

      const updated = [
        newSearch,
        ...recentSearches.filter((s) => s.query !== searchQuery),
      ].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(
        '@sanskriti_recent_searches',
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearch = async (id: string) => {
    const updated = recentSearches.filter((s) => s.id !== id);
    setRecentSearches(updated);
    await AsyncStorage.setItem(
      '@sanskriti_recent_searches',
      JSON.stringify(updated)
    );
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem('@sanskriti_recent_searches');
  };

  const handleSelectDestination = (dest: Destination) => {
    saveRecentSearch(query);
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        lat: String(dest.lat),
        lng: String(dest.lng),
        focus: `${dest.id}-${nowTimestamp()}`,
      },
    });
  };

  const handleSelectArtifact = (artifact: ExploreArtifact) => {
    saveRecentSearch(query);
    if (returnToExplore) {
      router.push({
        pathname: '/(tabs)/explore',
        params: {
          lat: String(artifact.lat),
          lng: String(artifact.lng),
          artifactId: artifact.id,
          focus: `${artifact.id}-${nowTimestamp()}`,
        },
      });
      return;
    }
    router.push(`/artifacts/${artifact.id}`);
  };

  const handleRecentSearch = (recent: RecentSearch) => {
    setQuery(recent.query);
  };

  const renderRecentSearches = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={clearAllRecent}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentSearches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={COLORS.tertiary} />
          <Text style={styles.emptyText}>No recent searches</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {recentSearches.map((recent) => (
            <TouchableOpacity
              key={recent.id}
              style={styles.recentItem}
              onPress={() => handleRecentSearch(recent)}
            >
              <View style={styles.recentLeft}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <Text style={styles.recentText}>{recent.query}</Text>
              </View>
              <TouchableOpacity
                onPress={() => clearRecentSearch(recent.id)}
                style={styles.removeButton}
              >
                <Ionicons name="close" size={18} color={COLORS.tertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderDestinations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Destinations</Text>
      <View style={styles.cardContainer}>
        {destinations.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            style={styles.destinationCard}
            onPress={() => handleSelectDestination(dest)}
          >
            <View style={styles.destinationIcon}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.destinationContent}>
              <Text style={styles.destinationName}>{dest.name}</Text>
              <Text style={styles.destinationSubtitle}>{dest.subtitle}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.tertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderArtifacts = () => {
    if (!searchResults?.artifacts.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Heritage Discoveries</Text>
        <Text style={styles.sectionSubtitle}>
          Near {searchResults.destination?.name}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.artifactsList}
        >
          {searchResults.artifacts.map((artifact) => (
            <TouchableOpacity
              key={artifact.id}
              style={styles.artifactCard}
              onPress={() => handleSelectArtifact(artifact)}
            >
              <View style={styles.artifactImageContainer}>
                {artifact.reference_images?.length > 0 ? (
                  <Image
                    source={{ uri: artifact.reference_images[0] }}
                    style={styles.artifactImage}
                  />
                ) : (
                  <View style={styles.artifactPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.rarityBadge}>
                  <Text style={styles.rarityText}>
                    {artifact.xp_value >= 150 ? 'RARE' : 'COMMON'}
                  </Text>
                </View>
              </View>

              <View style={styles.artifactContent}>
                <Text style={styles.artifactName} numberOfLines={1}>
                  {artifact.name}
                </Text>
                <View style={styles.artifactMeta}>
                  <Text style={styles.artifactCategory}>
                    {artifact.category}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.artifactDistance}>
                    <Ionicons name="walk" size={12} color={COLORS.tertiary} />{' '}
                    {artifact.distance < 1
                      ? `${Math.round(artifact.distance * 1000)}m`
                      : `${artifact.distance.toFixed(1)}km`}
                  </Text>
                </View>
                <Text style={styles.xpValue}>+{artifact.xp_value} XP</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        showBack
        centerContent={
          <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities, landmarks, or artifacts"
            placeholderTextColor={COLORS.tertiary}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.tertiary} />
            </TouchableOpacity>
          )}
          </View>
        }
      />

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : activeTab === 'recent' ? (
          renderRecentSearches()
        ) : (
          <>
            {destinations.length > 0 && renderDestinations()}
            {searchResults &&
              searchResults?.artifacts.length > 0 &&
              renderArtifacts()}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.neutral,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchIcon: {
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
    marginLeft: 4,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(142, 59, 34, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationContent: {
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  destinationSubtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  artifactsList: {
    paddingRight: 20,
  },
  artifactCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  artifactImageContainer: {
    height: 140,
    position: 'relative',
  },
  artifactImage: {
    width: '100%',
    height: '100%',
  },
  artifactPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  artifactContent: {
    padding: 16,
    gap: 8,
  },
  artifactName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  artifactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artifactCategory: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  dot: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  artifactDistance: {
    fontSize: 14,
    color: COLORS.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.tertiary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
