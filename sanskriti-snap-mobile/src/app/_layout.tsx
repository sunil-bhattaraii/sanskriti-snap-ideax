import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureApiTokenProvider } from '@/services/api';
import { refreshProximityGeofences } from '@/services/proximity-notifications';
import { useAuthStore } from '@/store/authstore';
import {
  configureOfflineNetwork,
  queryClient,
  restoreOfflineQueryCache,
} from '@/services/offline';
import { processPendingVerifications } from '@/services/upload-queue';
import { syncOfflineData } from '@/services/offline-sync';
import NetInfo from '@react-native-community/netinfo';

function OfflineServices() {
  useEffect(() => {
    const cleanup = configureOfflineNetwork();
    void restoreOfflineQueryCache();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) void processPendingVerifications();
    });
    void NetInfo.fetch().then((state) => {
      if (state.isConnected) void processPendingVerifications();
    });
    return () => {
      cleanup();
      unsubscribe();
    };
  }, []);

  return null;
}

function AuthenticatedLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const setSession = useAuthStore((state) => state.setSession);
  const setSignOut = useAuthStore((state) => state.setSignOut);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return undefined;

    const syncWhenOnline = () => {
      void NetInfo.fetch().then((state) => {
        if (state.isConnected) {
          void syncOfflineData(clerkUser.id).catch((error) => {
            console.warn('Unable to sync offline data:', error);
          });
        }
      });
    };

    syncWhenOnline();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) syncWhenOnline();
    });
    const interval = setInterval(syncWhenOnline, 15 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [clerkUser?.id, isSignedIn]);

  useEffect(() => {
    configureApiTokenProvider(() => getToken());
    setSignOut(signOut);
  }, [getToken, setSignOut, signOut]);

  useEffect(() => {
    if (!isLoaded) return;
    const user = clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
          username: clerkUser.username ?? '',
          fullName:
            clerkUser.fullName ??
            clerkUser.firstName ??
            clerkUser.username ??
            'Explorer',
          imageUrl: clerkUser.imageUrl,
        }
      : null;

    setSession(user);
    if (user) {
      void fetchProfile(user.id).catch((error) => {
        console.warn('Unable to load profile:', error);
      });
    }
  }, [clerkUser, fetchProfile, isLoaded, setSession]);

  const profileNotificationsEnabled = useAuthStore(
    (state) => state.profile?.notifications.enabled ?? false,
  );
  const profileNotificationRadius = useAuthStore(
    (state) => state.profile?.notifications.radiusMeters ?? 100,
  );

  useEffect(() => {
    if (!isSignedIn || !profileNotificationsEnabled) return;
    void refreshProximityGeofences(true, profileNotificationRadius).catch((error) => {
      console.warn('Unable to refresh proximity notifications:', error);
    });
  }, [isSignedIn, profileNotificationsEnabled, profileNotificationRadius]);

  useEffect(() => {
    if (!isLoaded) return;
    const routeGroup = segments[0];
    const isAuthRoute = routeGroup === '(auth)';
    const isPublicRoute =
      isAuthRoute ||
      routeGroup === 'artifacts' ||
      routeGroup === undefined;

    if (!isSignedIn && !isPublicRoute) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, router, segments]);

  if (!isLoaded) return null;

  return <Slot />;
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not configured. Add the Clerk publishable key to the mobile environment.',
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <OfflineServices />
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
              <AuthenticatedLayout />
            </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
