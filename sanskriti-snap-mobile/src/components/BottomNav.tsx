import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, type Href } from 'expo-router';
import { BOTTOM_NAV_ITEMS } from '@/constants/bottomNav';
import { COLORS } from '@/constants/colors';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === "/(tabs)" || route === "/") {
      return (
        pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/"
      );
    }

    const routeWithoutGroup = route.replace("/(tabs)", "");
    return pathname === route || pathname === routeWithoutGroup;
  };

  const handlePress = (route: string) => {
    router.push(route as Href);
  };

  // Find the center item (usually the 3rd item)
  const centerItemIndex = Math.floor(BOTTOM_NAV_ITEMS.length / 2);
  const leftItems = BOTTOM_NAV_ITEMS.slice(0, centerItemIndex);
  const centerItem = BOTTOM_NAV_ITEMS[centerItemIndex];
  const rightItems = BOTTOM_NAV_ITEMS.slice(centerItemIndex + 1);

  return (
    <View style={styles.container}>
      {/* Left Items */}
      <View style={styles.sideContainer}>
        {leftItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.tab}
              onPress={() => handlePress(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? item.activeIcon || item.icon : item.icon}
                size={24}
                color={active ? COLORS.primary : COLORS.tertiary}
              />
              <Text
                style={[styles.label, { color: active ? COLORS.primary : COLORS.tertiary }]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Center FAB */}
      <View style={styles.centerContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => centerItem && handlePress(centerItem.route)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={centerItem?.activeIcon || centerItem?.icon || 'compass'}
            size={28} // Slightly smaller icon to fit the smaller button
            color={COLORS.white}
          />
        </TouchableOpacity>
        {centerItem && (
          <Text style={[styles.label, styles.fabLabel, { color: COLORS.primary }]}>
            {centerItem.label}
          </Text>
        )}
      </View>

      {/* Right Items */}
      <View style={styles.sideContainer}>
        {rightItems.map((item) => {
          const active = isActive(item.route);
          return (
            <TouchableOpacity
              key={item.name}
              style={styles.tab}
              onPress={() => handlePress(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? item.activeIcon || item.icon : item.icon}
                size={24}
                color={active ? COLORS.primary : COLORS.tertiary}
              />
              <Text
                style={[styles.label, { color: active ? COLORS.primary : COLORS.tertiary }]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align items to the bottom so FAB can float up
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28, // Extra padding for bottom safe area
    // Removed borderRadius, marginHorizontal, marginBottom, and heavy shadows
  },
  sideContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 80, // Fixed width to keep center balanced
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  fabButton: {
    width: 52, // Made a bit smaller (was 64)
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26, // Pulls the button up so it overlaps the top edge of the bar
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 4,
    borderColor: COLORS.white, // Creates a clean cutout effect against the bar
  },
  fabLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});