import { useAuthStore } from "@/store/authstore";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenHeader from "../../components/ScreenHeader";
import SettingsItem from "../../components/settings/SettingsItem";
import SettingsSection from "../../components/settings/SettingsSection";
import { COLORS } from "../../constants/colors";
import { backendClient } from "../../services/backendClient";
import { invalidateOfflineCache } from "../../services/offline";
import { syncOfflineData } from "../../services/offline-sync";
import { getPendingUploadCount, processPendingVerifications } from "../../services/upload-queue";

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const [proximityAlerts, setProximityAlerts] = useState(profile?.notifications.enabled ?? true);
  const [syncing, setSyncing] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);

  const refreshPendingUploads = useCallback(() => {
    void getPendingUploadCount().then(setPendingUploads).catch(() => undefined);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPendingUploads();
    }, [refreshPendingUploads]),
  );

  const enabledPref = profile?.notifications.enabled;
  const [prevEnabledPref, setPrevEnabledPref] = useState(enabledPref);
  if (prevEnabledPref !== enabledPref) {
    setPrevEnabledPref(enabledPref);
    setProximityAlerts(enabledPref ?? true);
  }

  const handleProximityAlertsChange = async (enabled: boolean) => {
    setProximityAlerts(enabled);
    if (!user) return;

    const { error } = await backendClient.from("profiles").update({ notifications_enabled: enabled }).eq("id", user.id);

    if (error) {
      setProximityAlerts(!enabled);
      Alert.alert("Unable to update alerts", error.message);
      return;
    }

    await fetchProfile(user.id);
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await invalidateOfflineCache();
      await syncOfflineData(user?.id ?? null);
      refreshPendingUploads();
      Alert.alert("Sync complete", "Your offline data has been refreshed.");
    } catch (error) {
      Alert.alert(
        "Sync failed",
        error instanceof Error ? error.message : "Unable to refresh offline data.",
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleUploadPending = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const before = await getPendingUploadCount();
      if (before === 0) {
        Alert.alert("Nothing to upload", "All your submissions have already been uploaded.");
        return;
      }
      await processPendingVerifications();
      const after = await getPendingUploadCount();
      setPendingUploads(after);
      Alert.alert(
        after === 0 ? "Upload complete" : "Retry needed",
        after === 0
          ? `Your ${before} queued submission(s) have been uploaded.`
          : `${after} submission(s) are still waiting. They will retry automatically when you're back online.`,
      );
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Unable to upload queued submissions.",
      );
    } finally {
      setSyncing(false);
      refreshPendingUploads();
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Hide the default native header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. Add your custom ScreenHeader */}
      <ScreenHeader title="Settings" />

      {/* 3. Your Settings Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingsSection title="ACCOUNT">
          <SettingsItem icon="person-outline" title="Profile Info" hasArrow onPress={() => router.push("/(tabs)/profile")} />
          <SettingsItem
            icon="lock-closed-outline"
            title="Change Password"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/coming-soon");
            }}
          />
        </SettingsSection>

        <SettingsSection title="PREFERENCES">
          <SettingsItem
            icon="notifications-outline"
            title="Proximity Alerts"
            subtitle="Notify when near historical sites"
            hasToggle
            isToggleOn={proximityAlerts}
            onToggleChange={handleProximityAlertsChange}
          />
          <SettingsItem
            icon="location-outline"
            title="Discovery Radius"
            value="5 km"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/coming-soon");
            }}
          />
          <SettingsItem
            icon="language-outline"
            title="Language"
            value="English"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/coming-soon");
            }}
          />
        </SettingsSection>

        <SettingsSection title="PRIVACY & SECURITY">
          <SettingsItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/privacy-policy");
            }}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Terms of Service"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/terms-of-service");
            }}
          />
        </SettingsSection>

        <SettingsSection title="ABOUT">
          <SettingsItem
            icon="sync-outline"
            title="Sync Data"
            subtitle="Refresh offline data now"
            value={syncing ? "Syncing..." : "Sync now"}
            hasArrow
            onPress={() => void handleSync()}
          />
          <SettingsItem
            icon="cloud-upload-outline"
            title="Pending Uploads"
            subtitle="Verifications queued while offline"
            value={syncing ? "Uploading..." : String(pendingUploads)}
            hasArrow
            onPress={() => void handleUploadPending()}
          />
          <SettingsItem icon="information-circle-outline" title="Version" value="1.0.0" />
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            hasArrow
            onPress={() => {
              router.push("/(tabs)/help-support");
            }}
          />
        </SettingsSection>

        {user && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutral },
  scrollContent: { paddingVertical: 20, paddingBottom: 40 },
  logoutContainer: { marginTop: 10, paddingHorizontal: 20 },
  logoutButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  logoutText: { color: "#E53E3E", fontSize: 16, fontWeight: "700" },
});
