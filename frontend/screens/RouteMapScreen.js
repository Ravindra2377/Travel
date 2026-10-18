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
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "../components/Icon";
import InteractiveMap from "../components/InteractiveMap";
import BottomSheet from "../components/BottomSheet";
import trackingService from "../services/trackingService";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

const RouteMapScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
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

  const handleNextStop = () => {
    if (selectedIndex < tripMoments.length - 1) {
      Haptics.selectionAsync();
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrevStop = () => {
    if (selectedIndex > 0) {
      Haptics.selectionAsync();
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
      {/* ── BACKGROUND: FULL-BLEED INTERACTIVE TILE MAP ─────────────── */}
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
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── FLOATING TOP HEADER & CONTROLS ──────────────────────────── */}
      <SafeAreaView
        edges={["top"]}
        style={styles.floatingHeaderArea}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.floatingBar,
            {
              backgroundColor: isDark
                ? "rgba(18, 26, 22, 0.90)"
                : "rgba(255, 255, 255, 0.90)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.08)",
            },
            SHADOWS.md,
          ]}
        >
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

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[FONTS.ticketStamp, { color: primaryTint, fontSize: 10 }]}>
              ROUTE MAP & PINS
            </Text>
            <Text
              style={[FONTS.h3, styles.titleText, { color: themeColors.ink }]}
              numberOfLines={1}
            >
              {currentTrip?.title || "Trip Path"}
            </Text>
          </View>

          {/* Layer Style Switcher */}
          <View
            style={[
              styles.tileSwitchGroup,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            {[
              { id: "voyager", label: "Voyager" },
              { id: "osm", label: "Roads" },
              { id: "satellite", label: "Sat" },
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
                        fontSize: 9,
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

        {/* Floating Tracking Indicator Pill */}
        <View style={styles.trackingPillRow}>
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
                  ? "rgba(18, 26, 22, 0.90)"
                  : "rgba(255, 255, 255, 0.90)",
                borderColor: isTracking
                  ? "#22C55E"
                  : isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
              },
              SHADOWS.sm,
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
                  color: isTracking
                    ? isDark
                      ? "#86EFAC"
                      : "#15803D"
                    : themeColors.inkSoft,
                  fontSize: 11,
                  marginLeft: 5,
                },
              ]}
            >
              {isTracking ? "Recording GPS" : "Record Route"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── FOREGROUND: SPRING-DRIVEN STOPS & ROUTE BOTTOM SHEET ─────── */}
      <BottomSheet
        snapPoints={[130, SCREEN_HEIGHT * 0.44, SCREEN_HEIGHT * 0.85]}
        initialSnap={0}
        renderHeader={({ snapIndex, snapTo }) => (
          <View style={styles.sheetHeaderTeaser}>
            {selectedMoment ? (
              <View style={styles.teaserLeft}>
                <Image
                  source={{ uri: selectedMoment.mediaUri }}
                  style={styles.teaserThumb}
                  contentFit="cover"
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text
                    style={[
                      FONTS.ticketStamp,
                      { color: primaryTint, fontSize: 10 },
                    ]}
                  >
                    STOP #{selectedIndex + 1} OF {tripMoments.length}
                  </Text>
                  <Text
                    style={[FONTS.h3, { color: themeColors.ink, fontSize: 14 }]}
                    numberOfLines={1}
                  >
                    {selectedMoment.title}
                  </Text>
                  <Text
                    style={[
                      FONTS.caption,
                      { color: themeColors.inkSoft, fontSize: 11 },
                    ]}
                    numberOfLines={1}
                  >
                    📍 {selectedMoment.placeName || selectedMoment.city || "Stop"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[FONTS.captionBold, { color: themeColors.inkSoft }]}>
                No moments recorded
              </Text>
            )}

            {/* Stepper buttons (prev/next) */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={handlePrevStop}
                disabled={selectedIndex <= 0}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    opacity: selectedIndex <= 0 ? 0.35 : 1,
                  },
                ]}
              >
                <Ionicons name="chevron-back" size={16} color={themeColors.ink} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextStop}
                disabled={selectedIndex >= tripMoments.length - 1}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    opacity: selectedIndex >= tripMoments.length - 1 ? 0.35 : 1,
                  },
                ]}
              >
                <Ionicons name="chevron-forward" size={16} color={themeColors.ink} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {/* Horizontal Scrubber Strip */}
          <View style={styles.scrubberSection}>
            <View style={styles.scrubberHeader}>
              <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
                ROUTE TIMELINE · {tripMoments.length} STOPS
              </Text>
              <Text style={[FONTS.mono, { color: themeColors.inkFaint, fontSize: 11 }]}>
                Tap to scrub
              </Text>
            </View>

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

          {/* Selected Moment Card Detail */}
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

                {selectedMoment.placeName ? (
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.previewPlace,
                      { color: themeColors.inkSoft },
                    ]}
                    numberOfLines={1}
                  >
                    📍 {selectedMoment.placeName}
                  </Text>
                ) : null}

                {selectedMoment.text ? (
                  <Text
                    style={[
                      FONTS.caption,
                      styles.previewText,
                      { color: themeColors.inkSoft },
                    ]}
                    numberOfLines={2}
                  >
                    {selectedMoment.text}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Full Stops Timeline */}
          <View style={styles.fullTimelineSection}>
            <Text
              style={[
                FONTS.ticketStamp,
                { color: themeColors.inkSoft, marginBottom: 12 },
              ]}
            >
              ALL ROUTE WAYPOINTS
            </Text>

            {tripMoments.map((m, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <TouchableOpacity
                  key={m.id || idx}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedIndex(idx);
                  }}
                  style={[
                    styles.timelineRow,
                    {
                      backgroundColor: isSelected
                        ? `${primaryTint}14`
                        : "transparent",
                      borderLeftColor: isSelected
                        ? primaryTint
                        : isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      FONTS.monoBold,
                      {
                        color: isSelected ? primaryTint : themeColors.inkSoft,
                        width: 24,
                        fontSize: 12,
                      },
                    ]}
                  >
                    #{idx + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        FONTS.captionBold,
                        { color: themeColors.ink, fontSize: 13 },
                      ]}
                      numberOfLines={1}
                    >
                      {m.title}
                    </Text>
                    <Text
                      style={[
                        FONTS.caption,
                        { color: themeColors.inkFaint, fontSize: 11 },
                      ]}
                      numberOfLines={1}
                    >
                      {m.placeName || m.city} ·{" "}
                      {new Date(m.takenAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isSelected ? primaryTint : themeColors.inkFaint}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingHeaderArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 16,
  },
  tileSwitchGroup: {
    flexDirection: "row",
    borderRadius: RADIUS.full,
    padding: 2,
  },
  tileSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  trackingPillRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: "flex-start",
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sheetHeaderTeaser: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  teaserLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  teaserThumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scrubberSection: {
    marginBottom: 16,
  },
  scrubberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stopsList: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  stopStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  previewDetails: {
    flex: 1,
    gap: 2,
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
    fontSize: 15,
  },
  previewPlace: {
    fontSize: 12,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 16,
  },
  fullTimelineSection: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
});

export default RouteMapScreen;
