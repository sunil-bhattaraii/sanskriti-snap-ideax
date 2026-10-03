import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { backendClient } from "./backendClient";

export const PROXIMITY_TASK_NAME = "sanskriti-proximity-geofence";
const NOTIFIED_ARTIFACTS_KEY = "@sanskriti_proximity_notified_v1";
const ARTIFACT_NAMES_KEY = "@sanskriti_proximity_artifact_names_v1";
const MAX_GEOFENCES = 20;
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const notificationLocks = new Set<string>();

type ProximityTaskData = { eventType: Location.GeofencingEventType; region: Location.LocationRegion };

type NearbyArtifact = { id: string; name: string; lat: number; lng: number; verification_radius_m: number };

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

if (!TaskManager.isTaskDefined(PROXIMITY_TASK_NAME)) {
  TaskManager.defineTask<ProximityTaskData>(PROXIMITY_TASK_NAME, async ({ data, error }) => {
    if (error || !data || data.eventType !== Location.GeofencingEventType.Enter) {
      if (error) console.warn("Proximity geofence failed:", error.message);
      return;
    }

    const artifactId = data.region.identifier;
    if (!artifactId) return;

    const { data: sessionData } = await backendClient.auth.getSession();
    if (!sessionData.session) return;
    if (notificationLocks.has(artifactId)) return;
    notificationLocks.add(artifactId);

    try {
      const notified = await readJson<Record<string, number>>(NOTIFIED_ARTIFACTS_KEY, {});
      if (Date.now() - (notified[artifactId] ?? 0) < NOTIFICATION_COOLDOWN_MS) return;

      const artifactNames = await readJson<Record<string, string>>(ARTIFACT_NAMES_KEY, {});
      const artifactName = artifactNames[artifactId] ?? "a nearby heritage site";

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "A discovery is nearby",
          body: `You are close to ${artifactName}. Tap to view the artifact.`,
          data: { url: `/artifacts/${artifactId}`, artifactId },
        },
        trigger: null,
      });

      await AsyncStorage.setItem(NOTIFIED_ARTIFACTS_KEY, JSON.stringify({ ...notified, [artifactId]: Date.now() }));
    } finally {
      notificationLocks.delete(artifactId);
    }
  });
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getArtifactPathFromNotification(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data;
  const artifactId = data && typeof data.artifactId === "string" ? data.artifactId : null;
  return artifactId && /^[0-9a-f-]{36}$/i.test(artifactId) ? `/artifacts/${artifactId}` : null;
}

export async function prepareProximityNotifications(): Promise<boolean> {
  const existingNotificationPermission = await Notifications.getPermissionsAsync();
  const notificationPermission = existingNotificationPermission.granted
    ? existingNotificationPermission
    : await Notifications.requestPermissionsAsync();
  if (!notificationPermission.granted) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("proximity-alerts", {
      name: "Proximity alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existingForeground = await Location.getForegroundPermissionsAsync();
  const foreground = existingForeground.granted ? existingForeground : await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;

  const existingBackground = await Location.getBackgroundPermissionsAsync();
  const background = existingBackground.granted ? existingBackground : await Location.requestBackgroundPermissionsAsync();
  return background.status === "granted";
}

export async function refreshProximityGeofences(enabled: boolean, radiusMeters: number): Promise<void> {
  if (!enabled) {
    await stopProximityGeofences();
    return;
  }

  if (!(await prepareProximityNotifications())) return;

  const location =
    (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000, requiredAccuracy: 1000 })) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  const { data, error } = await backendClient.rpc("nearby_artifacts", {
    p_lat: location.coords.latitude,
    p_lng: location.coords.longitude,
    p_radius_m: 50000,
  });
  if (error) throw error;

  const artifacts = (data ?? [])
    .filter(
      (artifact): artifact is NearbyArtifact => Boolean(artifact.id) && Number.isFinite(artifact.lat) && Number.isFinite(artifact.lng),
    )
    .slice(0, MAX_GEOFENCES);

  await AsyncStorage.setItem(
    ARTIFACT_NAMES_KEY,
    JSON.stringify(Object.fromEntries(artifacts.map((artifact) => [artifact.id, artifact.name]))),
  );

  await stopProximityGeofences();
  if (artifacts.length === 0) return;

  await Location.startGeofencingAsync(
    PROXIMITY_TASK_NAME,
    artifacts.map((artifact) => ({
      identifier: artifact.id,
      latitude: artifact.lat,
      longitude: artifact.lng,
      radius: Math.max(radiusMeters, artifact.verification_radius_m ?? 0),
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}

export async function stopProximityGeofences(): Promise<void> {
  if (await Location.hasStartedGeofencingAsync(PROXIMITY_TASK_NAME)) {
    await Location.stopGeofencingAsync(PROXIMITY_TASK_NAME);
  }
}
