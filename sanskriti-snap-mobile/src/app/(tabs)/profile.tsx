import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { MOCK_USER_PROFILE } from '@/constants/mockData';
import AppHeader from '@/components/AppHeader';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = MOCK_USER_PROFILE;

  const progressPercent = Math.min(
    100,
    Math.round((user.xp / user.nextLevelXp) * 100)
  );

  const handleEditUsername = () => {
    router.push({
      pathname: '/(auth)/choose-username',
      params: { mode: 'edit' },
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => router.push('/(auth)/login'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Explorer Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarSection}>
            <ProfileAvatar
              displayName={user.fullName}
              imageUrl={user.avatarUrl}
              size={76}
            />
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={handleEditUsername}
            >
              <Ionicons name="pencil" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.nameText}>{user.fullName}</Text>
          <Text style={styles.usernameText}>@{user.username}</Text>
          <Text style={styles.emailText}>{user.email}</Text>

          <View style={styles.rankBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#B45309" />
            <Text style={styles.rankBadgeText}>{user.rank}</Text>
          </View>

          {/* Level Progress */}
          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Level {user.level} Explorer</Text>
              <Text style={styles.xpNumbers}>
                {user.xp} / {user.nextLevelXp} XP
              </Text>
            </View>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.xpRemaining}>
              {user.nextLevelXp - user.xp} XP needed for Level {user.level + 1}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="compass" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{user.discoveredCount}</Text>
            <Text style={styles.statLabel}>Discovered</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flash" size={22} color="#D4AF37" />
            <Text style={styles.statValue}>{user.xp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="ribbon" size={22} color="#7C3AED" />
            <Text style={styles.statValue}>{user.badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flame" size={22} color="#E05318" />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked Achievements</Text>
          <View style={styles.badgeGrid}>
            {user.badges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={styles.badgeIconWrap}>
                  <Ionicons
                    name={badge.icon as any}
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {badge.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Discoveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Heritage Discoveries</Text>
          {user.recentDiscoveries.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.discoveryCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/artifacts/${item.id}`)}
            >
              <Image source={{ uri: item.image }} style={styles.discoveryImage} />
              <View style={styles.discoveryInfo}>
                <Text style={styles.discoveryName}>{item.name}</Text>
                <Text style={styles.discoveryDate}>
                  Discovered {item.discoveredDate}
                </Text>
              </View>
              <View style={styles.discoveryXp}>
                <Ionicons name="flash" size={12} color="#D4AF37" />
                <Text style={styles.discoveryXpText}>+{item.xpEarned} XP</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu & Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Settings</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditUsername}
            >
              <View style={styles.menuLeft}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <Text style={styles.menuText}>Edit Username</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(auth)/login')}
            >
              <View style={styles.menuLeft}>
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <Text style={styles.menuText}>Switch Account / Login</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleSignOut}
            >
              <View style={styles.menuLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={COLORS.error}
                />
                <Text style={[styles.menuText, { color: COLORS.error }]}>
                  Sign Out
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
  scrollContent: {
    paddingTop: 16,
  },
  userCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 12,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  usernameText: {
    fontSize: 14,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  emailText: {
    fontSize: 12,
    color: '#8A8580',
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  xpCard: {
    width: '100%',
    backgroundColor: '#FDF9F6',
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.1)',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  xpNumbers: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#EAE6E2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpRemaining: {
    fontSize: 11,
    color: COLORS.tertiary,
    marginTop: 6,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiary,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    alignItems: 'center',
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF2EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  discoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    gap: 12,
  },
  discoveryImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  discoveryInfo: {
    flex: 1,
  },
  discoveryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  discoveryDate: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  discoveryXp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  discoveryXpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EF',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
