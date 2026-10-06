import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const { mockCreateMemoryAsyncStorage: make } = jest.requireActual(
    '../../test/memory-async-storage',
  );
  return { __esModule: true, default: make() };
});

const mockApi = { apiRequest: jest.fn() };
jest.mock('../api', () => mockApi);

const progress = jest.requireActual('../progress');

const USER = 'user_1';
const ITEM = {
  id: '65b7c9d4e4b0a1b2c3d4e5f6',
  name: 'Golden Temple',
  humanReadableLocation: 'Patan',
  xpReward: 100,
  coverImageUrl: 'https://cdn/x.jpg',
  rarity: 'Rare',
};

const QUEST = {
  id: 'q1',
  name: 'Patan Trail',
  description: 'Walk it',
  discoveredCount: 2,
  artifactCount: 4,
  xpReward: 250,
  badge: { id: 'b1', name: 'Explorer' },
  completed: false,
};

describe('fetchCollection', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('maps server items to the client shape and writes the cache', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [ITEM] });

    const items = await progress.fetchCollection(USER);

    expect(items).toEqual([
      {
        id: '65b7c9d4e4b0a1b2c3d4e5f6',
        title: 'Golden Temple',
        location: 'Patan',
        xp: 100,
        imageUrl: 'https://cdn/x.jpg',
        rarity: 'Rare',
        isDiscovered: true,
      },
    ]);
    const cached = await AsyncStorage.getItem('@sanskriti_collection_user_1');
    expect(JSON.parse(cached as string)).toHaveLength(1);
  });

  it('coerces missing/malformed fields so the UI never crashes on a null', async () => {
    mockApi.apiRequest.mockResolvedValue({
      items: [{ id: 7, rarity: null, name: null }],
    });

    const items = await progress.fetchCollection(USER);
    expect(items[0]).toMatchObject({
      id: '7',
      title: '',
      location: '',
      xp: 0,
      imageUrl: '',
      rarity: 'Common',
      isDiscovered: true,
    });
  });

  it('uses a guest key when there is no user', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [] });
    await progress.fetchCollection(null);
    expect(await AsyncStorage.getItem('@sanskriti_collection_guest')).toBe('[]');
  });
});

describe('fetchQuests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('maps quest progress fields and flags badge rewards', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [QUEST] });

    const quests = await progress.fetchQuests(USER);

    expect(quests[0]).toMatchObject({
      id: 'q1',
      name: 'Patan Trail',
      current_progress: 2,
      total_progress: 4,
      xp_reward: 250,
      has_badge_reward: true,
      completed: false,
    });
    const cached = await AsyncStorage.getItem('@sanskriti_quests_user_1');
    expect(JSON.parse(cached as string)).toHaveLength(1);
  });

  it('marks has_badge_reward false when the badge is absent', async () => {
    const { badge: _drop, ...noBadge } = QUEST;
    mockApi.apiRequest.mockResolvedValue({ items: [noBadge as never] });
    const quests = await progress.fetchQuests(USER);
    expect(quests[0].has_badge_reward).toBe(false);
  });

  it('defaults a sparse item so a missing field cannot crash the row', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [{} as never] });
    const quests = await progress.fetchQuests(USER);
    expect(quests[0]).toMatchObject({
      name: '',
      description: '',
      current_progress: 0,
      total_progress: 0,
      xp_reward: 0,
    });
  });
});

describe('fetchQuestDetails', () => {
  it('derives hero, badge name and artifact list from the server item', async () => {
    mockApi.apiRequest.mockResolvedValue({
      ...QUEST,
      artifactIds: ['a'],
      artifacts: [
        {
          id: 'a1',
          name: 'Krishna Mandir',
          humanReadableLocation: 'Patan',
          coverImageUrl: 'https://cdn/k.jpg',
          discovered: true,
        },
      ],
    });

    const details = await progress.fetchQuestDetails('q1', USER);

    expect(details.heroImageUrl).toBe('https://cdn/k.jpg');
    expect(details.category).toBe('Heritage');
    expect(details.badgeName).toBe('Explorer');
    expect(details.totalArtifacts).toBe(4);
    expect(details.discoveredCount).toBe(2);
    expect(details.artifacts).toEqual([
      {
        id: 'a1',
        name: 'Krishna Mandir',
        location: 'Patan',
        imageUrl: 'https://cdn/k.jpg',
        isDiscovered: true,
      },
    ]);
  });

  it('returns empty artifacts and no badge name when absent', async () => {
    const { badge: _drop, ...rest } = QUEST;
    mockApi.apiRequest.mockResolvedValue(rest as never);

    const details = await progress.fetchQuestDetails('q1', USER);
    expect(details.artifacts).toEqual([]);
    expect(details.badgeName).toBeUndefined();
    expect(details.heroImageUrl).toBe('');
  });
});

describe('cache lifecycle helpers', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('readQuestCache returns null before data exists and the parsed row after', async () => {
    expect(await progress.readQuestCache(USER)).toBeNull();
    await AsyncStorage.setItem('@sanskriti_quests_user_1', JSON.stringify([QUEST]));
    const read = await progress.readQuestCache(USER);
    expect(read[0].name).toBe('Patan Trail');
  });

  it('invalidateQuestCache removes only the user\'s quest key', async () => {
    await AsyncStorage.setItem('@sanskriti_quests_user_1', '[]');
    await AsyncStorage.setItem('@sanskriti_quests_user_2', '[]');
    await progress.invalidateQuestCache(USER);
    expect(await AsyncStorage.getItem('@sanskriti_quests_user_1')).toBeNull();
    expect(await AsyncStorage.getItem('@sanskriti_quests_user_2')).toBe('[]');
  });

  it('warmQuestCache and refreshQuestCache both refetch and re-cache', async () => {
    mockApi.apiRequest.mockResolvedValue({ items: [QUEST] });
    await progress.warmQuestCache(USER);
    mockApi.apiRequest.mockResolvedValue({ items: [QUEST] });
    await progress.refreshQuestCache(USER);
    expect(mockApi.apiRequest).toHaveBeenCalledTimes(2);
    expect(mockApi.apiRequest).toHaveBeenCalledWith('/quests');
  });
});