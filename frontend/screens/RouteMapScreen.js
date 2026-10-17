import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line, Text as SvgText, G } from "react-native-svg";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";

const { width, height } = Dimensions.get("window");
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = 380;

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

  // Project coordinates into SVG coordinates
  const projectedPoints = useMemo(() => {
    if (tripMoments.length === 0) return [];

    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;

    tripMoments.forEach((m) => {
      if (m.latitude < minLat) minLat = m.latitude;
      if (m.latitude > maxLat) maxLat = m.latitude;
      if (m.longitude < minLng) minLng = m.longitude;
      if (m.longitude > maxLng) maxLng = m.longitude;
    });

    const latSpan = Math.max(maxLat - minLat, 0.005);
    const lngSpan = Math.max(maxLng - minLng, 0.005);
    const padding = 45;

    return tripMoments.map((m, index) => {
      // Invert lat because higher lat is up (lower Y in SVG)
      const x = padding + ((m.longitude - minLng) / lngSpan) * (MAP_WIDTH - padding * 2);
      const y = padding + ((maxLat - m.latitude) / latSpan) * (MAP_HEIGHT - padding * 2);
      return {
        x,
        y,
        moment: m,
        index,
      };
    });
  }, [tripMoments]);

  // SVG Path string for the route line
  const routePathD = useMemo(() => {
    if (projectedPoints.length < 2) return "";
    let d = `M ${projectedPoints[0].x} ${projectedPoints[0].y}`;
    for (let i = 1; i < projectedPoints.length; i++) {
      // Smooth curve between waypoints
      const prev = projectedPoints[i - 1];
      const curr = projectedPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY} T ${curr.x} ${curr.y}`;
    }
    return d;
  }, [projectedPoints]);

  const selectedPoint = projectedPoints[selectedIndex] || projectedPoints[0];
  const selectedMoment = selectedPoint?.moment || tripMoments[0];

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
        {/* Map Canvas Card */}
        <View
          style={[
            styles.mapCard,
            {
              backgroundColor: isDark ? "#121A15" : "#EAF1EC",
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.06)",
            },
            SHADOWS.md,
          ]}
        >
          {/* Subtle Grid Lines */}
          <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={StyleSheet.absoluteFill}>
            <Line
              x1="0"
              y1={MAP_HEIGHT * 0.25}
              x2={MAP_WIDTH}
              y2={MAP_HEIGHT * 0.25}
              stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
              strokeDasharray="4 4"
            />
            <Line
              x1="0"
              y1={MAP_HEIGHT * 0.5}
              x2={MAP_WIDTH}
              y2={MAP_HEIGHT * 0.5}
              stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
              strokeDasharray="4 4"
            />
            <Line
              x1="0"
              y1={MAP_HEIGHT * 0.75}
              x2={MAP_WIDTH}
              y2={MAP_HEIGHT * 0.75}
              stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}
              strokeDasharray="4 4"
            />

            {/* Route connecting line */}
            {routePathD ? (
              <Path
                d={routePathD}
                stroke={primaryTint}
                strokeWidth={3}
                strokeDasharray="6 3"
                fill="none"
              />
            ) : null}

            {/* Pins */}
            {projectedPoints.map((pt) => {
              const isSelected = pt.index === selectedIndex;
              return (
                <G key={pt.index}>
                  {isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={18}
                      fill={primaryTint}
                      opacity={0.25}
                    />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 10 : 7}
                    fill={isSelected ? primaryTint : "#FFFFFF"}
                    stroke={primaryTint}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <SvgText
                    x={pt.x}
                    y={pt.y - 14}
                    fill={isDark ? "#FFFFFF" : themeColors.ink}
                    fontSize={10}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    #{pt.index + 1}
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          {/* Map Top Badge */}
          <View style={styles.mapCompassBadge}>
            <Ionicons name="compass" size={16} color={primaryTint} />
            <Text
              style={[
                FONTS.ticketStamp,
                { color: themeColors.ink, fontSize: 10, marginLeft: 4 },
              ]}
            >
              {currentTrip?.city?.toUpperCase() || "TERRAIN"}
            </Text>
          </View>
        </View>

        {/* Route Scrub Controller */}
        <View style={styles.scrubberSection}>
          <View style={styles.scrubberHeader}>
            <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
              ROUTE SCRUBBER · STOP {selectedIndex + 1} OF {projectedPoints.length}
            </Text>
            <Text style={[FONTS.mono, { color: themeColors.inkFaint, fontSize: 11 }]}>
              Swipe or tap along path
            </Text>
          </View>

          {/* Scrubber Dots / Segments */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stopsList}
          >
            {projectedPoints.map((pt) => {
              const isSelected = pt.index === selectedIndex;
              return (
                <TouchableOpacity
                  key={pt.index}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedIndex(pt.index);
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
                    {pt.index + 1}
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
  mapCard: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    marginTop: 10,
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
