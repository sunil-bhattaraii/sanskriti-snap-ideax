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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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
