import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import SearchBar from '@/components/ui/SearchBar';
import ProfileAvatar from '@/components/ProfileAvatar';
import { useAuthStore } from '@/store/authstore';

export default function TopHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuthStore();
  const displayName = profile?.display_name ?? user?.email ?? 'Guest User';

  return (
    <View style={styles.headerContainer}>
      {/* 1. Search Bar Container: Takes up all available space */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Places..."
          onFilterPress={() => {
            console.log('Filter pressed');
          }}
          onFocus={() =>
            router.push({
              pathname: '/(tabs)/explore',
              params: { focus: `header-${Date.now()}` },
            })
          }
        />
      </View>

      {/* 2. Profile Avatar: Fixed size, stays on the right */}
      <ProfileAvatar
        displayName={displayName}
        imageUrl={profile?.profile_image_url}
        size={44}
        onPress={() => router.push('/(tabs)/profile')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
});
