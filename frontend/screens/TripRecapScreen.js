import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import { Ionicons } from "../components/Icon";

const { width, height } = Dimensions.get("window");
const SLIDE_DURATION_MS = 4500;

const TripRecapScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { trips, activeTrip, moments } = useTrips();

  const currentTrip = useMemo(() => {
    if (tripId) {
      return trips.find((t) => t.id === tripId) || activeTrip || trips[0];
    }
    return activeTrip || trips[0];
  }, [tripId, activeTrip, trips]);

  const primaryTint = currentTrip?.themeColor || themeColors.primary;

  // Curate recap moments: favorites first, variety across days
  const recapMoments = useMemo(() => {
    if (!currentTrip) return [];
    const tripMoments = moments.filter((m) => m.tripId === currentTrip.id);
    if (tripMoments.length === 0) return [];

    // Sort: favorites first, then chronological
    const sorted = [...tripMoments].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(a.takenAt) - new Date(b.takenAt);
    });

    return sorted.slice(0, 6);
  }, [currentTrip, moments]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isShareCardMode, setIsShareCardMode] = useState(false);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || recapMoments.length <= 1 || isShareCardMode) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % recapMoments.length);
    }, SLIDE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, recapMoments.length, isShareCardMode]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => (prev + 1) % recapMoments.length);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => (prev - 1 + recapMoments.length) % recapMoments.length);
  };

  const handleShareStory = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `Reliving ${currentTrip?.title}: "${currentMoment?.title}" in ${currentMoment?.city} · Captured on Trip Moments`,
      });
    } catch (e) {}
  };

  const currentMoment = recapMoments[currentIndex] || recapMoments[0];

  if (!currentTrip || recapMoments.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: "#000000" }]}>
        <StatusBar barStyle="light-content" />
        <Text style={[FONTS.h2, { color: "#FFFFFF", textAlign: "center" }]}>
          No moments available to replay yet.
        </Text>
        <TouchableOpacity
          style={[styles.backHomeBtn, { backgroundColor: primaryTint }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#FFFFFF", fontFamily: "InterSemiBold" }}>
            Return to Trip
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      <StatusBar barStyle="light-content" hidden={false} />

      {/* Main Fullscreen Story Image */}
      <View
        style={[
          styles.slideWrapper,
          isShareCardMode && styles.shareCardModeWrapper,
        ]}
      >
        <Image
          source={{ uri: currentMoment.mediaUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.60)",
            "transparent",
            "rgba(0,0,0,0.30)",
            "rgba(0,0,0,0.92)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Story Progress Bars */}
        <View style={[styles.progressBarsRow, { paddingTop: insets.top + 8 }]}>
          {recapMoments.map((_, idx) => (
            <View key={idx} style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: idx <= currentIndex ? "100%" : "0%",
                    backgroundColor: idx === currentIndex ? primaryTint : "#FFFFFF",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Top Navigation Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.storyIconBtn}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.topRightControls}>
            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.storyIconBtn}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsShareCardMode(!isShareCardMode)}
              style={[
                styles.storyModePill,
                isShareCardMode && { backgroundColor: primaryTint },
              ]}
            >
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              <Text style={styles.storyModePillText}>
                {isShareCardMode ? "9:16 Card" : "Card View"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Tap Touch Zones (Left & Right) */}
        {!isShareCardMode && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.touchLeft}
              onPress={handlePrev}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.touchRight}
              onPress={handleNext}
              activeOpacity={1}
            />
          </View>
        )}

        {/* Story Bottom Content Overlay */}
        <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.badgeRow}>
            <LiquidGlass radius={12} intensity={40} style={styles.storyGlassBadge}>
              <Text style={styles.storyBadgeText}>
                {currentMoment.city?.toUpperCase()} ·{" "}
                {new Date(currentMoment.takenAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </LiquidGlass>

            {currentMoment.weather && (
              <LiquidGlass radius={12} intensity={40} style={styles.storyGlassBadge}>
                <Ionicons
                  name={currentMoment.weather.icon || "sunny"}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={[styles.storyBadgeText, { marginLeft: 4 }]}>
                  {currentMoment.weather.temp}°C
                </Text>
              </LiquidGlass>
            )}
          </View>

          <Text style={styles.storyTripName}>{currentTrip.title}</Text>
          <Text style={styles.storyMomentTitle}>{currentMoment.title}</Text>

          {currentMoment.text ? (
            <Text style={styles.storyQuote} numberOfLines={3}>
              "{currentMoment.text}"
            </Text>
          ) : null}

          {/* Share Card Bottom Button */}
          <View style={styles.shareRow}>
            <TouchableOpacity
              style={[styles.shareActionBtn, { backgroundColor: primaryTint }]}
              onPress={handleShareStory}
            >
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.shareActionText}>Share Story Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backHomeBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
  },
  slideWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    position: "relative",
  },
  shareCardModeWrapper: {
    marginVertical: 40,
    marginHorizontal: 20,
    width: width - 40,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.20)",
  },
  progressBarsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    zIndex: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.30)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  storyIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.50)",
    alignItems: "center",
    justifyContent: "center",
  },
  storyModePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  storyModePillText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 12,
  },
  touchLeft: {
    position: "absolute",
    left: 0,
    top: 80,
    bottom: 160,
    width: width * 0.35,
  },
  touchRight: {
    position: "absolute",
    right: 0,
    top: 80,
    bottom: 160,
    width: width * 0.65,
  },
  bottomContent: {
    paddingHorizontal: 24,
    gap: 8,
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  storyGlassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  storyBadgeText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  storyTripName: {
    color: "rgba(255,255,255,0.70)",
    fontFamily: "IBMPlexMono",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  storyMomentTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 30,
    lineHeight: 36,
  },
  storyQuote: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    marginTop: 2,
  },
  shareRow: {
    marginTop: 12,
  },
  shareActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 18,
    gap: 8,
  },
  shareActionText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 14,
  },
});

export default TripRecapScreen;
