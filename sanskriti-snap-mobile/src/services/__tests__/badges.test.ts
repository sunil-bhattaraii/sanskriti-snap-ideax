import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const { mockCreateMemoryAsyncStorage: make } = jest.requireActual(
    '../../test/memory-async-storage',
  );
  return { __esModule: true, default: make() };
});

const mockApi = { apiRequest: jest.fn() };
jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  return { ...actual, apiRequest: mockApi.apiRequest };
});

const { getBadges, readBadgesCache } = jest.requireActual('../badges');

const CACHE_KEY = '@sanskriti_badges_v1';

const BACKEND_ITEMS = {
  items: [
    {
      id: 'b1',
      name: 'Explorer',
      description: 'Visited 5 sites',
      iconUrl: 'https://img.example/x.png',
      unlocked: true,
    },
    {
      id: 'b2',
      name: 'Curator',
      description: 'Collected 10 artifacts',
      iconUrl: null,
      unlocked: false,
    },
  ],
};

describe('badges', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('maps backend badges, computes counts and writes the cache', async () => {
    mockApi.apiRequest.mockResolvedValue(BACKEND_ITEMS);

    const data = await getBadges();

    expect(data.currentCount).toBe(1);
    expect(data.totalCount).toBe(2);
    expect(data.badges[0]).toMatchObject({ id: 'b1', title: 'Explorer' });
    expect(data.badges[1].imageUrl).toBeNull();

    const cached = await readBadgesCache();
    expect(cached?.currentCount).toBe(1);
  });

  it('treats a missing badge collection as an empty state', async () => {
    const { ApiRequestError } = jest.requireActual('../api');
    mockApi.apiRequest.mockRejectedValue(
      new ApiRequestError('Not found', 404, 'NotFoundError', {}),
    );

    const data = await getBadges();
    expect(data).toEqual({ currentCount: 0, totalCount: 0, badges: [] });
  });

  it('falls back to the cached badges when the network fails', async () => {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        currentCount: 1,
        totalCount: 1,
        badges: [{ id: 'b1', title: 'Explorer', description: '', imageUrl: null, isUnlocked: true }],
      }),
    );
    mockApi.apiRequest.mockRejectedValue(new Error('offline'));

    const data = await getBadges();
    expect(data.badges[0].title).toBe('Explorer');
    expect(data.currentCount).toBe(1);
  });

  it('rethrows when offline and nothing is cached', async () => {
    mockApi.apiRequest.mockRejectedValue(new Error('offline'));

    await expect(getBadges()).rejects.toThrow('offline');
  });
});