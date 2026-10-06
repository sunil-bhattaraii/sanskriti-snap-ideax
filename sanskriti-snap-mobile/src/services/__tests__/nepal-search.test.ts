import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const { mockCreateMemoryAsyncStorage: make } = jest.requireActual(
    '../../test/memory-async-storage',
  );
  return {
    __esModule: true,
    default: make(),
  };
});

const mockApi = { apiRequest: jest.fn() };
jest.mock('../api', () => mockApi);

const { searchNepalArtifacts, getNearbyNepalArtifacts, readNepalSearchCache } =
  jest.requireActual('../nepal-search');

const CACHE_KEY = '@sanskriti_nepal_search_catalog_v1';

const baseItem = {
  latitude: 27.68,
  longitude: 85.33,
  coverImageUrl: 'https://img.example/ptan.jpg',
  humanReadableLocation: 'Patan',
  xpReward: 50,
  discoveryCount: 3,
};

function item(id: string, name: string) {
  return { id, name, ...baseItem };
}

const cachedRow = (id: string, name: string, lat = 27.68, lng = 85.33) => ({
  id,
  name,
  description: '',
  category: 'Heritage',
  tags: ['temple'],
  reference_images: ['https://img.example/ptan.jpg'],
  human_readable_location: 'Patan',
  xp_value: 50,
  verification_radius_m: 100,
  requires_snap: true,
  warnings: null,
  discovery_count: 3,
  distance_m: 0,
  lat,
  lng,
});

async function seedCache(rows: unknown[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rows));
}

describe('nepal-search offline behaviour', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('caches successful search results for later offline fallback', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [item('a1', 'Durbar Square')] });
    const results = await searchNepalArtifacts('durbar');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Durbar Square');
    expect(await readNepalSearchCache()).toHaveLength(1);
  });

  it('falls back to the cached catalog when the network fails', async () => {
    await seedCache([cachedRow('a1', 'Durbar Square')]);
    mockApi.apiRequest.mockRejectedValue(new Error('offline'));
    const results = await searchNepalArtifacts('DURBAR');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
  });

  it('returns nothing from the cache when nothing matches', async () => {
    await seedCache([cachedRow('a1', 'Durbar Square')]);
    mockApi.apiRequest.mockRejectedValue(new Error('offline'));
    expect(await searchNepalArtifacts('boudhanath')).toEqual([]);
  });

  it('filters the cached catalog by distance for nearby results offline', async () => {
    await seedCache([
      cachedRow('far', 'Far Temple', 27.0, 84.0),
      cachedRow('near', 'Near Temple', 27.6801, 85.3301),
    ]);
    mockApi.apiRequest.mockRejectedValue(new Error('offline'));
    const results = await getNearbyNepalArtifacts(27.68, 85.33, 5000);
    expect(results.map((r: { id: string }) => r.id)).toEqual(['near']);
  });

  it('merges new results into the cache without clobbering earlier rows', async () => {
    await seedCache([cachedRow('a1', 'Durbar Square')]);
    mockApi.apiRequest.mockResolvedValue({ items: [item('b2', 'Boudhanath Stupa')] });
    await searchNepalArtifacts('boudhanath');
    const catalog = await readNepalSearchCache();
    expect(catalog.map((c: { id: string }) => c.id).sort()).toEqual(['a1', 'b2']);
  });
});