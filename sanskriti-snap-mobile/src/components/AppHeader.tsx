import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import ProfileAvatar from './ProfileAvatar';
import { useAuthStore } from '@/store/authstore';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  logo?: boolean;
  overlay?: boolean; // If true, floats over content with blur
  rightActions?: ReactNode;
  centerContent?: ReactNode;
}

export default function AppHeader({
  title,
  showBack = false,
  logo = false,
  overlay = false,
  rightActions,
  centerContent,
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const displayName = profile?.display_name ?? user?.email ?? 'Guest';

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const isDarkOverlay = overlay;

  return (
    <BlurView
      intensity={85}
      tint="light"
      style={[
        styles.container,
        overlay && styles.overlay,
        { paddingTop: insets.top + 12 },
      ]}
    >
      {/* Left Side: Back Button or Logo */}
      <View style={[styles.side, !showBack && !logo && styles.emptySide]}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconButton}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkOverlay ? COLORS.white : COLORS.text}
            />
          </TouchableOpacity>
        ) : logo ? (
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.logoText, isDarkOverlay && styles.logoTextOverlay]}>
              Sanskriti Snap
            </Text>
          </View>
        ) : null}
      </View>

      {/* Center: Title or Custom Content */}
      {centerContent ?? (
        <View style={styles.titleContainer}>
          <Text
            numberOfLines={1}
            style={[styles.title, isDarkOverlay && styles.overlayText]}
          >
            {title}
          </Text>
        </View>
      )}

      {/* Right Side: Actions + Profile */}
      <View style={styles.right}>
        {rightActions}
        <ProfileAvatar
          displayName={displayName}
          imageUrl={profile?.profile_image_url}
          size={36}
          onPress={() => router.push('/(tabs)/profile')}
        />
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(253, 249, 246, 0.8)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  side: { 
    minWidth: 40, 
    zIndex: 1,
    alignItems: 'flex-start',
  },
  emptySide: { minWidth: 0, width: 0 },
  right: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    zIndex: 1,
  },
  iconButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  // Updated to match the logoText size and weight
  title: {
    fontSize: 18, 
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  overlayText: { 
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  logoImage: { 
    width: 28, 
    height: 28 
  },
  // Logo text remains the same, title now matches it
  logoText: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  logoTextOverlay: {
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },
});