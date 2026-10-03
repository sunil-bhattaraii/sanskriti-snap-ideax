import { router, Stack } from "expo-router";
import React from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import ScreenHeader from "../../components/ScreenHeader";
import SupportItem from "../../components/settings/SupportItem";
import { COLORS } from "../../constants/colors";

// Import mock data
import { SUPPORT_CATEGORIES } from "../../constants/data/mockSettings";

export default function HelpSupportScreen() {
  const handlePress = (category: string) => {
    if (category === "Contact Support") {
      Linking.openURL("mailto:support@sanskritisnap.com");
    } else if (category === "FAQs") {
      Alert.alert("FAQs", "Frequently asked questions would open here.");
    } else if (category === "Report a Bug") {
      Alert.alert("Report a Bug", "Bug report form would open here.");
    } else if (category === "Feature Request") {
      Alert.alert("Feature Request", "Feature request form would open here.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Help & Support" />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORT_CATEGORIES.map((category) => (
          <SupportItem
            key={category.id}
            category={category}
            onPress={() => router.push("/(tabs)/coming-soon")}
          />
        ))}
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
    padding: 20,
  },
});
