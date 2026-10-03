import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ScreenHeader from "../../components/ScreenHeader";
import PolicySection from "../../components/settings/PolicySection";
import { COLORS } from "../../constants/colors";

// Import mock data
import { TERMS_OF_SERVICE } from "../../constants/data/mockSettings";

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Terms of Service" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <PolicySection content={TERMS_OF_SERVICE} />
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
