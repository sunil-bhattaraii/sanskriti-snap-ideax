import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureApiTokenProvider } from '@/services/api';
import { refreshProximityGeofences } from '@/services/proximity-notifications';
import { useAuthStore } from '@/store/authstore';

function AuthenticatedLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const setSession = useAuthStore((state) => state.setSession);
  const setSignOut = useAuthStore((state) => state.setSignOut);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

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
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <AuthenticatedLayout />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
