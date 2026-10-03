import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  onlineManager,
  focusManager,
} from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/query-persist-client-core';

export const CACHE_TTL_MS = 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TTL_MS,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@sanskriti_query_cache_v1',
  throttleTime: 1000,
});

let restorePromise: Promise<void> | null = null;

export function restoreOfflineQueryCache() {
  if (!restorePromise) {
    const [, restored] = persistQueryClient({
      queryClient,
      persister: queryPersister,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      buster: 'sanskriti-mobile-v1',
    });
    restorePromise = restored.then(() => undefined);
  }
  return restorePromise;
}

export async function invalidateOfflineCache() {
  queryClient.clear();
  await AsyncStorage.removeItem('@sanskriti_query_cache_v1');

  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter(
    (key) =>
      key.startsWith('@sanskriti_collection_') ||
      key.startsWith('@sanskriti_quests_') ||
      key === '@sanskriti_explore_cache_v1' ||
      key === '@sanskriti_leaderboard_v1' ||
      key === '@sanskriti_nepal_search_catalog_v1' ||
      key.startsWith('@sanskriti_artifact_'),
  );
  if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
  restorePromise = null;
}

export function configureOfflineNetwork() {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
  );

  const unsubscribeFocus = AppState.addEventListener(
    'change',
    (status: AppStateStatus) => focusManager.setFocused(status === 'active'),
  );

  return () => unsubscribeFocus.remove();
}
