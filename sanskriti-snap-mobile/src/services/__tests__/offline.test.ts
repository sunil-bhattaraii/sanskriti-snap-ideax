import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_TTL_MS, invalidateOfflineCache, queryClient } from '../offline';

jest.mock('@react-native-async-storage/async-storage', () => {
  const { mockCreateMemoryAsyncStorage: make } = jest.requireActual(
    '../../test/memory-async-storage',
  );
  return {
    __esModule: true,
    default: make(),
  };
});

const memory = (AsyncStorage as unknown as {
  __store: Map<string, string>;
}).__store;


describe('offline cache', () => {
  const FEATURED_KEY = '@sanskriti_featured_artifacts_v1';
  const EXPLORE_KEY = '@sanskriti_explore_cache_v1';
  const QUERY_KEY = '@sanskriti_query_cache_v1';
  const UNRELATED_KEY = '@sanskriti_anything_else';

  beforeEach(() => {
    memory.clear();
    jest.clearAllMocks();
  });

  it('exposes the one-hour cache TTL', () => {
    expect(CACHE_TTL_MS).toBe(60 * 60 * 1000);
  });

  it('does not set anything up front', () => {
    expect(memory.size).toBe(0);
  });

  it('removes the persisted query cache and clears the in-memory client', async () => {
    memory.set(QUERY_KEY, '{"cached":true}');
    const clearSpy = jest.spyOn(queryClient, 'clear');
    queryClient.setQueryData(['x'], { v: 1 });

    await invalidateOfflineCache();

    expect(memory.has(QUERY_KEY)).toBe(false);
    expect(clearSpy).toHaveBeenCalled();
    expect(queryClient.getQueryData(['x'])).toBeUndefined();
  });

  it('strips every feature cache prefix during invalidation', async () => {
    const keys = [
      '@sanskriti_collection_1',
      '@sanskriti_quests_1',
      EXPLORE_KEY,
      '@sanskriti_leaderboard_v1',
      '@sanskriti_nepal_search_catalog_v1',
      '@sanskriti_artifact_abc',
      FEATURED_KEY,
    ];
    for (const key of keys) memory.set(key, '1');
    memory.set(UNRELATED_KEY, 'keep');

    await invalidateOfflineCache();

    for (const key of keys) expect(memory.has(key)).toBe(false);
    expect(memory.has(UNRELATED_KEY)).toBe(true);
  });

  it('also removes the featured cache — regression: comma bug skipped it', async () => {
    memory.set(FEATURED_KEY, '[]');
    await invalidateOfflineCache();
    expect(memory.has(FEATURED_KEY)).toBe(false);
  });

  it('never leaves the query-cache buster behind', async () => {
    memory.set(QUERY_KEY, 'x');
    await invalidateOfflineCache();
    expect(memory.has(QUERY_KEY)).toBe(false);
  });
});
