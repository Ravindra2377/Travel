import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";
import InteractiveMap from "../components/InteractiveMap";
import trackingService from "../services/trackingService";

const { width, height } = Dimensions.get("window");
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = 400;

const RouteMapScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = useTheme();
  const { trips, activeTrip, moments } = useTrips();

  const currentTrip = useMemo(() => {
    if (tripId) {
      return trips.find((t) => t.id === tripId) || activeTrip || trips[0];
    }
    return activeTrip || trips[0];
  }, [tripId, activeTrip, trips]);

  const primaryTint = currentTrip?.themeColor || themeColors.primary;

  const tripMoments = useMemo(() => {
    if (!currentTrip) return [];
    return moments
      .filter((m) => m.tripId === currentTrip.id)
      .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  }, [currentTrip, moments]);

  // Scrub index
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tileStyle, setTileStyle] = useState("voyager"); // "voyager" | "satellite" | "osm"
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isTracking, setIsTracking] = useState(false);

  // Load GPS Breadcrumbs and subscribe to tracking updates
  useEffect(() => {
    if (currentTrip?.id) {
      trackingService.getBreadcrumbs(currentTrip.id).then(setBreadcrumbs);
    }
    const unsubscribe = trackingService.subscribe((state) => {
      setIsTracking(state.isTracking && state.currentTripId === currentTrip?.id);
      if (currentTrip?.id) {
        trackingService.getBreadcrumbs(currentTrip.id).then(setBreadcrumbs);
      }
    });
    return () => unsubscribe();
  }, [currentTrip?.id]);

  const handleToggleTracking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isTracking) {
      await trackingService.stopTracking();
      Alert.alert("Tracking Paused", "GPS breadcrumb recording has been paused.");
    } else {
      const res = await trackingService.startTracking(currentTrip.id);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Permission Required", res.error || "Could not start GPS tracking.");
      }
    }
  };

  const selectedMoment = tripMoments[selectedIndex] || tripMoments[0];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.ink} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
            ROUTE MAP & PINS
          </Text>
          <Text
            style={[FONTS.h2, styles.titleText, { color: themeColors.ink }]}
            numberOfLines={1}
          >
            {currentTrip?.title || "Trip Path"}
          </Text>
        </View>

        <View
          style={[
            styles.statsBadge,
            { backgroundColor: `${primaryTint}18` },
          ]}
        >
          <Ionicons name="navigate-outline" size={14} color={primaryTint} />
          <Text
            style={[
              FONTS.monoBold,
              { color: primaryTint, fontSize: 11, marginLeft: 4 },
            ]}
          >
            {tripMoments.length} Stops
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Controls: Tracking Pill & Tile Style Switcher */}
        <View style={styles.mapControlBar}>
          <TouchableOpacity
            onPress={handleToggleTracking}
            activeOpacity={0.8}
            style={[
              styles.trackingPill,
              {
                backgroundColor: isTracking
                  ? isDark
                    ? "#0A2F1D"
                    : "#DCFCE7"
                  : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
                borderColor: isTracking ? "#22C55E" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View
              style={[
                styles.trackingDot,
                { backgroundColor: isTracking ? "#22C55E" : themeColors.inkFaint },
              ]}
            />
            <Text
              style={[
                FONTS.captionBold,
                {
                  color: isTracking ? (isDark ? "#86EFAC" : "#15803D") : themeColors.inkSoft,
                  fontSize: 11,
                  marginLeft: 5,
                },
              ]}
            >
              {isTracking ? "Recording GPS" : "Record Route"}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.tileSwitchGroup,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            {[
              { id: "voyager", label: "Voyager" },
              { id: "osm", label: "Streets" },
              { id: "satellite", label: "Satellite" },
            ].map((t) => {
              const active = tileStyle === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTileStyle(t.id);
                  }}
                  style={[
                    styles.tileSwitchBtn,
                    active && { backgroundColor: primaryTint },
                  ]}
                >
                  <Text
                    style={[
                      FONTS.captionBold,
                      {
                        color: active ? "#FFFFFF" : themeColors.inkSoft,
                        fontSize: 10,
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Real Interactive Map */}
        <InteractiveMap
          moments={tripMoments}
          breadcrumbs={breadcrumbs}
          selectedIndex={selectedIndex}
          onSelectMoment={(idx) => {
            Haptics.selectionAsync();
            setSelectedIndex(idx);
          }}
          themeColor={primaryTint}
          tileStyle={tileStyle}
          style={styles.mapCard}
        />

        {/* Route Scrub Controller */}
        <View style={styles.scrubberSection}>
          <View style={styles.scrubberHeader}>
            <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
              ROUTE SCRUBBER · STOP {selectedIndex + 1} OF {tripMoments.length}
            </Text>
            <Text style={[FONTS.mono, { color: themeColors.inkFaint, fontSize: 11 }]}>
              Tap pin or swipe stops
            </Text>
          </View>

          {/* Scrubber Dots / Segments */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stopsList}
          >
            {tripMoments.map((moment, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <TouchableOpacity
                  key={moment.id || idx}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedIndex(idx);
                  }}
                  style={[
                    styles.stopStepBtn,
                    {
                      backgroundColor: isSelected
                        ? primaryTint
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      FONTS.monoBold,
                      {
                        color: isSelected ? "#FFFFFF" : themeColors.ink,
                        fontSize: 12,
                      },
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Moment Preview Card */}
        {selectedMoment ? (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("MomentDetail", { moment: selectedMoment });
            }}
            style={[
              styles.previewCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.06)",
              },
              SHADOWS.md,
            ]}
          >
            <Image
              source={{ uri: selectedMoment.mediaUri }}
              style={styles.previewImage}
              contentFit="cover"
              transition={200}
            />

            <View style={styles.previewDetails}>
              <View style={styles.previewTopRow}>
                <View style={styles.previewStopBadge}>
                  <Text
                    style={[
                      FONTS.ticketStamp,
                      { color: primaryTint, fontSize: 10 },
                    ]}
                  >
                    STOP #{selectedIndex + 1} ·{" "}
                    {new Date(selectedMoment.takenAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={primaryTint} />
              </View>

              <Text
                style={[
                  FONTS.h3,
                  styles.previewTitle,
                  { color: themeColors.ink },
                ]}
                numberOfLines={1}
              >
                {selectedMoment.title}
              </Text>

              <Text
                style={[
                  FONTS.caption,
                  styles.previewPlace,
                  { color: themeColors.inkSoft },
                ]}
                numberOfLines={1}
              >
                📍 {selectedMoment.placeName || selectedMoment.city}
              </Text>

              <Text
                style={[
                  FONTS.caption,
                  styles.previewText,
                  { color: themeColors.inkFaint },
                ]}
                numberOfLines={2}
              >
                {selectedMoment.text}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 20,
    fontFamily: "FrauncesBold",
  },
  statsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mapControlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  trackingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileSwitchGroup: {
    flexDirection: "row",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  tileSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  mapCard: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  mapCompassBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  scrubberSection: {
    marginTop: 20,
  },
  scrubberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  stopsList: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  stopStepBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    marginTop: 18,
    alignItems: "center",
    gap: 14,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  previewDetails: {
    flex: 1,
    gap: 3,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewStopBadge: {
    alignSelf: "flex-start",
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: "FrauncesSemiBold",
  },
  previewPlace: {
    fontSize: 12,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default RouteMapScreen;
