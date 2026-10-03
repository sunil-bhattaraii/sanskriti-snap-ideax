import { ClerkProvider, useAuth, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

type StartupIssue = {
  title: string;
  details: string[];
};

function getStartupIssues(): StartupIssue[] {
  const issues: StartupIssue[] = [];
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!publishableKey) {
    issues.push({
      title: 'Clerk publishable key is missing',
      details: [
        'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY was not included in this build.',
        'Add it to the EAS environment used by the build, then rebuild the app.',
      ],
    });
  } else if (!publishableKey.startsWith('pk_')) {
    issues.push({
      title: 'Clerk publishable key is invalid',
      details: [
        'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_.',
        'Check the EAS environment value and rebuild the app.',
      ],
    });
  }

  if (!apiUrl) {
    issues.push({
      title: 'Backend URL is missing',
      details: [
        'EXPO_PUBLIC_API_URL was not included in this build.',
        'Add the backend origin to the EAS environment and rebuild the app.',
      ],
    });
  } else if (!/^https?:\/\/[^/\s]+(?:\/.*)?$/i.test(apiUrl)) {
      issues.push({
        title: 'Backend URL is invalid',
        details: [
          `The configured value is not a valid HTTP(S) URL: ${apiUrl}`,
          'Set EXPO_PUBLIC_API_URL to the backend origin and rebuild the app.',
        ],
      });
  }

  return issues;
}

function StartupErrorScreen({
  title,
  message,
  details,
  onRetry,
}: {
  title: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={startupStyles.container}>
      <ScrollView contentContainerStyle={startupStyles.content}>
        <Text style={startupStyles.heading}>{title}</Text>
        <Text style={startupStyles.message}>{message}</Text>
        {details ? <Text style={startupStyles.details}>{details}</Text> : null}
        {onRetry ? (
          <Pressable style={startupStyles.button} onPress={onRetry}>
            <Text style={startupStyles.buttonText}>Try again</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

class StartupErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application startup failed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <StartupErrorScreen
          title="Sanskriti Snap could not start"
          message={this.state.error.message || 'An unexpected startup error occurred.'}
          details={this.state.error.stack}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }

    return this.props.children;
  }
}

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
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const startupIssues = getStartupIssues();

  if (startupIssues.length > 0) {
    return (
      <StartupErrorScreen
        title="Sanskriti Snap is not configured"
        message="This build is missing required environment configuration."
        details={startupIssues
          .flatMap((issue) => [`${issue.title}:`, ...issue.details])
          .join('\n\n')}
      />
    );
  }

  return (
    <StartupErrorBoundary>
      <ClerkProvider publishableKey={publishableKey ?? ''} tokenCache={tokenCache}>
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
    </StartupErrorBoundary>
  );
}

const startupStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3F0',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    color: '#3B2520',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  message: {
    color: '#5F4840',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  details: {
    color: '#6B5148',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#8E3B2F',
    borderRadius: 10,
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
