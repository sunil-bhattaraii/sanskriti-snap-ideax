import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { MOCK_ARTIFACTS, MOCK_USER_PROFILE } from '@/constants/mockData';
import { getCategoryIcon } from '@/constants/MapIcons';
import AppHeader from '@/components/AppHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'sparkles' },
  { id: 'temple', label: 'Temples', icon: 'home' },
  { id: 'site', label: 'Monuments', icon: 'location' },
  { id: 'statue', label: 'Statues', icon: 'body' },
  { id: 'architecture', label: 'Crafts', icon: 'business' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredArtifacts =
    selectedCategory === 'all'
      ? MOCK_ARTIFACTS
      : MOCK_ARTIFACTS.filter((a) => a.category === selectedCategory);

  const featured = MOCK_ARTIFACTS[0];
  const progressPercent = Math.min(
    100,
    Math.round((MOCK_USER_PROFILE.xp / MOCK_USER_PROFILE.nextLevelXp) * 100)
  );

  return (
    <View style={styles.container}>
      <AppHeader logo />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
      >
        {/* Welcome & User Level Banner */}
        <View style={styles.userBanner}>
          <View style={styles.userBannerTop}>
            <View>
              <Text style={styles.greetingText}>Namaste,</Text>
              <Text style={styles.userNameText}>{MOCK_USER_PROFILE.fullName}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#FF6B35" />
              <Text style={styles.streakText}>5 Day Streak</Text>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
                <Text style={styles.levelBadgeText}>
                  Level {MOCK_USER_PROFILE.level}
                </Text>
              </View>
              <Text style={styles.rankText}>{MOCK_USER_PROFILE.rank}</Text>
              <Text style={styles.xpText}>
                {MOCK_USER_PROFILE.xp} / {MOCK_USER_PROFILE.nextLevelXp} XP
              </Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Daily Quest Highlight */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Quest</Text>
            <View style={styles.questRewardBadge}>
              <Ionicons name="flash" size={12} color="#D4AF37" />
              <Text style={styles.questRewardText}>+350 XP</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.questCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/artifacts/${featured.id}`)}
          >
            <Image
              source={{ uri: featured.reference_images[0] }}
              style={styles.questImage}
            />
            <View style={styles.questContent}>
              <View style={styles.questTag}>
                <Text style={styles.questTagText}>TODAY&apos;S MISSION</Text>
              </View>
              <Text style={styles.questTitle}>{featured.name}</Text>
              <Text style={styles.questDescription} numberOfLines={2}>
                {featured.description}
              </Text>
              <View style={styles.questFooter}>
                <View style={styles.questLocation}>
                  <Ionicons name="location-outline" size={14} color={COLORS.tertiary} />
                  <Text style={styles.questLocationText}>
                    {featured.human_readable_location}
                  </Text>
                </View>
                <View style={styles.questActionBtn}>
                  <Text style={styles.questActionText}>Explore</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.white} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories Bar */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Explore Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={isSelected ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Heritage Sites */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Heritage Sites</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAllText}>Open Map →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {filteredArtifacts.map((artifact) => (
              <TouchableOpacity
                key={artifact.id}
                style={styles.featuredCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/artifacts/${artifact.id}`)}
              >
                <View style={styles.featuredImageContainer}>
                  <Image
                    source={{ uri: artifact.reference_images[0] }}
                    style={styles.featuredImage}
                  />
                  <View style={styles.featuredXpBadge}>
                    <Ionicons name="flash" size={12} color="#D4AF37" />
                    <Text style={styles.featuredXpText}>
                      {artifact.xp_value} XP
                    </Text>
                  </View>
                  <View style={styles.featuredCategoryBadge}>
                    <Ionicons
                      name={getCategoryIcon(artifact.category)}
                      size={12}
                      color={COLORS.white}
                    />
                    <Text style={styles.featuredCategoryText}>
                      {artifact.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>
                    {artifact.name}
                  </Text>
                  <Text style={styles.featuredDescription} numberOfLines={2}>
                    {artifact.description}
                  </Text>

                  <View style={styles.featuredFooter}>
                    <View style={styles.featuredDistance}>
                      <Ionicons name="walk-outline" size={14} color={COLORS.tertiary} />
                      <Text style={styles.featuredDistanceText}>
                        {Math.round(artifact.distance * 1000)}m away
                      </Text>
                    </View>
                    <View style={styles.featuredArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.primary}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Heritage Trivia Card */}
        <View style={styles.triviaCard}>
          <View style={styles.triviaHeader}>
            <View style={styles.triviaIconBox}>
              <Ionicons name="bulb-outline" size={20} color="#D4AF37" />
            </View>
            <Text style={styles.triviaTitle}>Cultural Heritage Insight</Text>
          </View>
          <Text style={styles.triviaBody}>
            Patan is historically known as &quot;Lalitpur&quot;, meaning the City of Fine
            Arts. It is globally acclaimed for its master bronze casters, stone
            sculptors, and traditional Newari wood carvers.
          </Text>
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
  userBanner: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  userBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFD4C2',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E05318',
  },
  levelCard: {
    backgroundColor: '#FDF9F6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.1)',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EAE6E2',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  questRewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  questCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  questImage: {
    width: '100%',
    height: 150,
  },
  questContent: {
    padding: 16,
  },
  questTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  questTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  questDescription: {
    fontSize: 13,
    color: COLORS.tertiary,
    lineHeight: 18,
    marginBottom: 12,
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  questLocationText: {
    fontSize: 12,
    color: COLORS.tertiary,
  },
  questActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  questActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EAE6E2',
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(142, 59, 34, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featuredImageContainer: {
    height: 130,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredXpBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredXpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  featuredCategoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(28, 27, 26, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  featuredContent: {
    padding: 14,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 12,
    color: COLORS.tertiary,
    lineHeight: 16,
    marginBottom: 10,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F2EF',
    paddingTop: 8,
  },
  featuredDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredDistanceText: {
    fontSize: 11,
    color: COLORS.tertiary,
  },
  featuredArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triviaCard: {
    marginHorizontal: 20,
    backgroundColor: '#FEF9F3',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE5C8',
    marginBottom: 20,
  },
  triviaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  triviaIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triviaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  triviaBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
});
