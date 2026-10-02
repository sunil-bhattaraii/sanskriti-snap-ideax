import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileStats } from '@/components/ProfileStats';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { BottomNav } from '@/components/BottomNav';
import { mockUserProfile, mockProfileMenuItems } from '@/data/mockUserProfile';

// ✅ FIX 1: Use default export for Expo Router screens
export default function ProfileScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  const handleSettingsPress = () => {
    console.log('Open settings');
  };

  const handleMenuItemPress = (id: string) => {
    if (id === 'badges') {
      router.push('/badges' as any);
    } else if (id === 'leaderboard') {
      router.push('/leaderboard' as any);
    } else if (id === 'collection') {
      router.push('/collection' as any);
    } else if (id === 'saved') {
      router.push('/saved-places' as any);
    } else if (id === 'rewards') {
      router.push('/rewards' as any);
    }
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'profile') return;
    router.push(`/(tabs)/${tab}` as any);
  };

  const progressItems = mockProfileMenuItems.filter(
    (item) => item.section === 'progress'
  );
  const explorationItems = mockProfileMenuItems.filter(
    (item) => item.section === 'exploration'
  );
  const rewardsItems = mockProfileMenuItems.filter(
    (item) => item.section === 'rewards'
  );

  return (
    <View style={styles.container}>
      <ProfileHeader
        onBackPress={handleBackPress}
        onSettingsPress={handleSettingsPress}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: mockUserProfile.profileImage }}
            style={styles.profileImage}
            resizeMode="cover" // ✅ FIX 2: Moved resizeMode from style to prop
          />
          <View style={styles.starBadge}>
            <Ionicons name="star" size={16} color="#F59E0B" />
          </View>
        </View>

        {/* Username */}
        <Text style={styles.username}>{mockUserProfile.username}</Text>

        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <Ionicons name="ribbon" size={16} color="#F59E0B" />
          <Text style={styles.levelText}>
            Level {mockUserProfile.level}: {mockUserProfile.levelTitle}
          </Text>
        </View>

        {/* Stats */}
        <ProfileStats
          totalXP={mockUserProfile.totalXP}
          discoveries={mockUserProfile.discoveries}
          quests={mockUserProfile.quests}
        />

        {/* My Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MY PROGRESS</Text>
          <View style={styles.menuContainer}>
            {progressItems.map((item) => (
              <ProfileMenuItem
                key={item.id}
                icon={item.icon}
                iconColor={item.iconColor}
                iconBackgroundColor={item.iconBackgroundColor}
                title={item.title}
                onPress={() => handleMenuItemPress(item.id)}
              />
            ))}
          </View>
        </View>

        {/* Exploration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXPLORATION</Text>
          <View style={styles.menuContainer}>
            {explorationItems.map((item) => (
              <ProfileMenuItem
                key={item.id}
                icon={item.icon}
                iconColor={item.iconColor}
                iconBackgroundColor={item.iconBackgroundColor}
                title={item.title}
                onPress={() => handleMenuItemPress(item.id)}
              />
            ))}
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REWARDS</Text>
          <View style={styles.menuContainer}>
            {rewardsItems.map((item) => (
              <ProfileMenuItem
                key={item.id}
                icon={item.icon}
                iconColor={item.iconColor}
                iconBackgroundColor={item.iconBackgroundColor}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() => handleMenuItemPress(item.id)}
              />
            ))}
          </View>
        </View>

        {/* Bottom spacing for bottom nav */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab="profile" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5F0',
  },
  scrollView: {
    flex: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  starBadge: {
    position: 'absolute',
    bottom: 8,
    right: '28%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bottomSpacing: {
    height: 16,
  },
});