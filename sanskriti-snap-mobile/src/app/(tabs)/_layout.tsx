import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";
import BottomNavBar from "../../components/BottomNav"; // Adjust path if needed
import { COLORS } from "../../constants/colors";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      {/* 1. This renders the active screen (index, collection, settings, etc.) */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* 2. This renders your custom bottom nav on top of all tab screens */}
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral, // Match your app background
  },
  content: {
    flex: 1, // Takes up all available space above the bottom nav
  },
});
