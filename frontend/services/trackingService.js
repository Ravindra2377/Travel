import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const BREADCRUMBS_KEY = "@trip_moments_breadcrumbs_v1";
const ACTIVE_TRACKING_KEY = "@trip_moments_active_tracking_v1";

class TrackingService {
  constructor() {
    this.isTracking = false;
    this.currentTripId = null;
    this.locationSubscription = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({ isTracking: this.isTracking, currentTripId: this.currentTripId });
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener({ isTracking: this.isTracking, currentTripId: this.currentTripId });
      } catch (e) {
        console.warn("[TrackingService] Listener error:", e);
      }
    }
  }

  async getBreadcrumbs(tripId) {
    try {
      const data = await AsyncStorage.getItem(BREADCRUMBS_KEY);
      const all = data ? JSON.parse(data) : [];
      if (tripId) {
        return all.filter((b) => b.tripId === tripId);
      }
      return all;
    } catch (e) {
      console.error("[TrackingService] Failed to load breadcrumbs:", e);
      return [];
    }
  }

  async recordBreadcrumb(point) {
    try {
      const data = await AsyncStorage.getItem(BREADCRUMBS_KEY);
      const all = data ? JSON.parse(data) : [];
      all.push(point);
      await AsyncStorage.setItem(BREADCRUMBS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error("[TrackingService] Failed to record breadcrumb:", e);
    }
  }

  async requestPermissions() {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        return { granted: false, reason: "Foreground permission denied" };
      }

      // Background permission is optional on native
      if (Platform.OS !== "web" && Location.requestBackgroundPermissionsAsync) {
        try {
          const { status: bgStatus } =
            await Location.requestBackgroundPermissionsAsync();
          return { granted: true, background: bgStatus === "granted" };
        } catch (bgErr) {
          return { granted: true, background: false };
        }
      }

      return { granted: true, background: false };
    } catch (err) {
      return { granted: false, error: err };
    }
  }

  async startTracking(tripId) {
    if (this.isTracking) return { success: true };

    const perm = await this.requestPermissions();
    if (!perm.granted) {
      return { success: false, error: "Location permission required" };
    }

    this.isTracking = true;
    this.currentTripId = tripId;
    this.notify();
    await AsyncStorage.setItem(ACTIVE_TRACKING_KEY, tripId);

    try {
      // Record initial fix
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (initial && initial.coords) {
        await this.recordBreadcrumb({
          id: `bc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tripId,
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          altitude: initial.coords.altitude,
          speed: initial.coords.speed,
          timestamp: new Date().toISOString(),
        });
      }

      // Start continuous location updates (every 50m or 15s)
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 50,
        },
        async (loc) => {
          if (loc && loc.coords && this.isTracking && this.currentTripId) {
            await this.recordBreadcrumb({
              id: `bc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              tripId: this.currentTripId,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              speed: loc.coords.speed,
              timestamp: new Date().toISOString(),
            });
          }
        }
      );

      return { success: true };
    } catch (e) {
      console.error("[TrackingService] Failed to start location watch:", e);
      this.isTracking = false;
      this.currentTripId = null;
      this.notify();
      return { success: false, error: e };
    }
  }

  async stopTracking() {
    this.isTracking = false;
    this.currentTripId = null;
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    await AsyncStorage.removeItem(ACTIVE_TRACKING_KEY);
    this.notify();
    return { success: true };
  }
}

export const trackingService = new TrackingService();
export default trackingService;
