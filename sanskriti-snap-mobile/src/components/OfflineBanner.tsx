import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getPendingUploadCount } from "@/services/upload-queue";

export default function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false;
      setOffline(isOffline);
      if (isOffline) {
        void getPendingUploadCount()
          .then(setQueued)
          .catch(() => setQueued(0));
      } else {
        setQueued(0);
      }
    });
  }, []);

  if (!offline) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + 4 }]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={13} color="#FFD166" />
      <Text style={styles.text}>Offline - showing saved data</Text>
      {queued > 0 && (
        <Text style={styles.text}>
          &middot; {queued} queued upload{queued === 1 ? "" : "s"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 6,
    backgroundColor: "#27272A",
    elevation: 8,
  },
  text: {
    color: "#F4F4F5",
    fontSize: 12,
    fontWeight: "600",
  },
});