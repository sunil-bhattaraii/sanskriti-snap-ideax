import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '../../components/BottomNav';
import { mockLeaderboardUsers } from '../../data/mockLeaderboard';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FRIENDS'>('GLOBAL');

  const handleTabPress = (tab: string) => {
    if (tab === 'collection') return;
    router.push(`/(tabs)/${tab}` as any);
  };

  const topThree = mockLeaderboardUsers.slice(0, 3);
  const listUsers = mockLeaderboardUsers.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#9C4221" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'GLOBAL' && styles.activeTab]}
          onPress={() => setActiveTab('GLOBAL')}
        >
          <Text style={[styles.tabText, activeTab === 'GLOBAL' && styles.activeTabText]}>GLOBAL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'FRIENDS' && styles.activeTab]}
          onPress={() => setActiveTab('FRIENDS')}
        >
          <Text style={[styles.tabText, activeTab === 'FRIENDS' && styles.activeTabText]}>FRIENDS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Podium Section */}
        <View style={styles.podiumContainer}>
          {/* Second Place - Left */}
          {topThree[1] && (
            <View style={styles.podiumItem}>
              <View style={styles.podiumImageContainer}>
                <Image source={{ uri: topThree[1].avatar }} style={styles.podiumAvatar} resizeMode="cover" />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>2</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name}</Text>
              <Text style={styles.podiumXP}>{topThree[1].xp.toLocaleString()} XP</Text>
            </View>
          )}

          {/* First Place - Center (Highest) */}
          {topThree[0] && (
            <View style={styles.podiumItemFirst}>
              <View style={styles.crownContainer}>
                <Ionicons name="trophy" size={28} color="#F59E0B" />
              </View>
              <View style={styles.podiumImageContainerFirst}>
                <Image source={{ uri: topThree[0].avatar }} style={styles.podiumAvatarFirst} resizeMode="cover" />
                <View style={[styles.rankBadge, styles.rankBadgeFirst]}>
                  <Text style={styles.rankBadgeText}>1</Text>
                </View>
              </View>
              <Text style={styles.podiumNameFirst} numberOfLines={1}>{topThree[0].name}</Text>
              <Text style={styles.podiumXPFirst}>{topThree[0].xp.toLocaleString()} XP</Text>
            </View>
          )}

          {/* Third Place - Right */}
          {topThree[2] && (
            <View style={styles.podiumItem}>
              <View style={styles.podiumImageContainer}>
                <Image source={{ uri: topThree[2].avatar }} style={styles.podiumAvatar} resizeMode="cover" />
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>3</Text>
                </View>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name}</Text>
              <Text style={styles.podiumXP}>{topThree[2].xp.toLocaleString()} XP</Text>
            </View>
          )}
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          {listUsers.map((user) => (
            <View key={user.id} style={[styles.listItem, user.isCurrentUser && styles.currentListItem]}>
              <Text style={[styles.rank, user.isCurrentUser && styles.currentRank]}>{user.rank}</Text>
              <Image source={{ uri: user.avatar }} style={[styles.listAvatar, user.isCurrentUser && styles.currentListAvatar]} resizeMode="cover" />
              <View style={styles.infoContainer}>
                <Text style={[styles.name, user.isCurrentUser && styles.currentName]} numberOfLines={1}>{user.name}</Text>
                <Text style={[styles.level, user.isCurrentUser && styles.currentLevel]}>
                  Lvl {user.level}{user.isCurrentUser ? ' (You)' : ''}
                </Text>
              </View>
              <Text style={[styles.xp, user.isCurrentUser && styles.currentXp]}>{user.xp.toLocaleString()} XP</Text>
            </View>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav activeTab="collection" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FDFBF9' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#9C4221' },
  placeholder: { width: 40 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', marginHorizontal: 16, marginTop: 16, marginBottom: 24, borderRadius: 30, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25 },
  activeTab: { backgroundColor: '#9C4221' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  activeTabText: { color: '#FFFFFF' },

  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Aligns items to the bottom
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 30,
    minHeight: 220, // Ensures container has height even if images load slowly
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20, // Pushes 2nd and 3rd place down
  },
  podiumItemFirst: {
    flex: 1.2,
    alignItems: 'center',
    marginBottom: 50, // Pushes 1st place higher up
  },
  crownContainer: { position: 'absolute', top: -35, zIndex: 10 },
  podiumImageContainer: { position: 'relative' },
  podiumImageContainerFirst: { position: 'relative' },
  
  podiumAvatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6', // Fallback color
  },
  podiumAvatarFirst: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 4, borderColor: '#F59E0B',
    backgroundColor: '#F3F4F6', // Fallback color
  },
  
  rankBadge: {
    position: 'absolute', bottom: -5, right: -5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#9CA3AF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  rankBadgeFirst: {
    backgroundColor: '#F59E0B', width: 28, height: 28, borderRadius: 14,
  },
  rankBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  
  podiumName: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginTop: 12, maxWidth: 90, textAlign: 'center' },
  podiumNameFirst: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginTop: 12, maxWidth: 110, textAlign: 'center' },
  podiumXP: { fontSize: 12, fontWeight: '600', color: '#9C4221', marginTop: 4 },
  podiumXPFirst: { fontSize: 14, fontWeight: '700', color: '#F59E0B', marginTop: 4 },

  // List Styles
  listContainer: { marginTop: 16, paddingHorizontal: 16 },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  currentListItem: {
    backgroundColor: '#9C4221',
    shadowColor: '#9C4221', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  rank: { fontSize: 16, fontWeight: '700', color: '#6B7280', width: 30, textAlign: 'center' },
  currentRank: { color: '#FFFFFF' },
  listAvatar: {
    width: 44, height: 44, borderRadius: 22, marginRight: 12,
    borderWidth: 2, borderColor: '#F3F4F6', backgroundColor: '#F3F4F6',
  },
  currentListAvatar: { borderColor: '#FEE2E2' },
  infoContainer: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  currentName: { color: '#FFFFFF' },
  level: { fontSize: 12, color: '#9CA3AF' },
  currentLevel: { color: '#FECACA' },
  xp: { fontSize: 15, fontWeight: '700', color: '#9C4221' },
  currentXp: { color: '#FFFFFF' },
  bottomSpacer: { height: 20 },
});