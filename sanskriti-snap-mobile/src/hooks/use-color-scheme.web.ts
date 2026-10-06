import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
const emptySubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(emptySubscribe, isClient, isServer);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}