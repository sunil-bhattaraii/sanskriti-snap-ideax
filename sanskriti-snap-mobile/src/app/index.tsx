import React, { useEffect } from "react";
import { Href, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { getArtifactPathFromNotification } from "@/services/proximity-notifications";

export default function Index() {
  useEffect(() => {
    let cancelled = false;

    const redirect = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      const path = getArtifactPathFromNotification(response);

      if (cancelled) return;
      if (path) {
        router.replace(path as Href);
        Notifications.clearLastNotificationResponse();
        return;
      }

      router.replace("/(tabs)/home");
    };

    void redirect();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
