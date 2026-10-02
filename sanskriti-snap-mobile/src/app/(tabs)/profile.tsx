import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ProfileAvatar from '@/components/ProfileAvatar';
import AppHeader from '@/components/AppHeader';
import ProfileMenuItem from '@/components/ProfileMenuItems';
import StatItem from '@/components/StatItem';
import { Button } from '@/components/Button'; // Adjust path if needed (e.g., '../../components/Button')
import { MENU_SECTIONS } from '@/constants/ProfileMenu';
import { useAuthStore } from '@/store/authstore'; // Adjust path to match your actual store location
import { backendClient } from '@/services/backendClient';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuthStore();

  const isAuthenticated = !!user;

  const displayName =
    profile?.display_name ?? (isAuthenticated ? user.email : 'Guest User');
  const username = profile?.username ?? 'guest';
  const imageUrl = profile?.profile_image_url ?? null;
  const lifetimeXp = profile?.lifetime_xp ?? 0;
  const rewardPoints = profile?.reward_points ?? 0;
  const [questCount, setQuestCount] = useState(0);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setQuestCount(0));
      return;
    }

    backendClient
      .from('user_quest_progress')
      .select('quest_id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .then(({ data }) => setQuestCount(data?.length ?? 0));
  }, [user]);

  // Dynamic level calculation based on XP (e.g., 1000 XP = Level 2)
  const level = isAuthenticated ? Math.floor(lifetimeXp / 1000) + 1 : 1;
  const levelTitle = isAuthenticated
    ? level >= 5
      ? 'Master Explorer'
      : level >= 2
        ? 'Active Explorer'
        : 'Novice Explorer'
    : 'Guest';

  const renderMenuSection = (
    section: (typeof MENU_SECTIONS)[0],
    index: number
  ) => {
    const visibleItems = section.items.filter(
      (item) => isAuthenticated || !item.isDestructive
    );

    return (
      <View key={index} style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.menuCard}>
          {visibleItems.map((item, itemIndex) => (
            <React.Fragment key={itemIndex}>
              <ProfileMenuItem {...item} />
              {itemIndex < visibleItems.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  // Show loading spinner while initial auth state is being resolved
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <AppHeader title="Profile" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <ProfileAvatar
            displayName={displayName}
            imageUrl={imageUrl}
            size={100}
          />

          <Text style={styles.username}>
            {username || displayName}&nbsp;
            <Pressable
              onPress={() => {
                router.replace({
                  pathname: '/(auth)/choose-username',
                  params: {
                    mode: 'edit',
                  },
                });
              }}
              hitSlop={10}
            >
              <Ionicons name="create-outline" size={22} color="#475569" />
            </Pressable>
          </Text>

          <View style={styles.levelBadge}>
            <Ionicons
              name="star"
              size={14}
              color="#F59E0B"
              style={styles.levelIcon}
            />
            <Text style={styles.levelText}>
              Level {level}: {levelTitle}
            </Text>
          </View>

          {/* Guest Login Prompt */}
          {!isAuthenticated && (
            <View style={styles.guestPrompt}>
              <Text style={styles.guestText}>
                Sign in to save discoveries, earn XP, and complete cultural
                quests.
              </Text>
              <Button
                title="Login / Register"
                onPress={() => router.push('/(auth)/login')}
                variant="primary"
                size="md"
              />
            </View>
          )}
        </View>
        {/* Stats Row - Aligned with your DB schema (lifetime_xp, reward_points) */}
        <View style={styles.statsContainer}>
          <StatItem
            value={lifetimeXp.toString()}
            label="TOTAL XP"
            icon="flash"
            iconColor="#F59E0B"
          />
          <View style={styles.statDivider} />
          <StatItem
            value={rewardPoints.toString()}
            label="REWARD POINTS"
            icon="gift"
            iconColor="#5C3D2E"
          />
          <View style={styles.statDivider} />
          <StatItem
            value={questCount.toString()}
            label="QUESTS"
            icon="trophy"
            iconColor="#8B4513"
          />
        </View>

        {/* Menu Sections - Mapped from Constants */}
        {MENU_SECTIONS.map(renderMenuSection)}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain exactly the same as before, with minor additions for Guest/Logout states
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelIcon: {
    marginRight: 6,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  // --- New styles for Guest/Logout states ---
  guestPrompt: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
