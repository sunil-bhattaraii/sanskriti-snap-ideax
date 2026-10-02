import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import ScreenHeader from "../../components/ScreenHeader";
import ComingSoonPlaceholder from "../../components/coming-soon/ComingSoonPlaceholder";
import { COLORS } from "../../constants/colors";

// Import mock data
import {
    MOCK_COMING_SOON,
    type ComingSoonData,
} from "../../constants/data/mockComingSoon";

export default function ComingSoonScreen() {
  const params = useLocalSearchParams();

  // Allow overriding the default text via URL params
  const displayData: ComingSoonData = {
    ...MOCK_COMING_SOON,
    title: (params.title as string) || MOCK_COMING_SOON.title,
    description: (params.description as string) || MOCK_COMING_SOON.description,
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title={displayData.title} />

      <ComingSoonPlaceholder data={displayData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
});
