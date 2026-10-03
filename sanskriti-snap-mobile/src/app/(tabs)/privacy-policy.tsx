import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ScreenHeader from "../../components//ScreenHeader";
import PolicySection from "../../components/settings/PolicySection";
import { COLORS } from "../../constants/colors";

// Import mock data
import { PRIVACY_POLICY } from "../../constants/data/mockSettings";

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Privacy Policy" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <PolicySection content={PRIVACY_POLICY} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },
});
