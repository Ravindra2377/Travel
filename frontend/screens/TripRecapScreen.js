import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  StatusBar,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import { Ionicons } from "../components/Icon";

const { width, height } = Dimensions.get("window");
const SLIDE_DURATION_MS = 5000;

export default function TripRecapScreen({ route, navigation }) {
  const { tripId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { trips, activeTrip, moments, toggleFavoriteMoment } = useTrips();

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

    return [...tripMoments].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(a.takenAt) - new Date(b.takenAt);
    });
  }, [currentTrip, moments]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Reanimated shared values
  const progressAnim = useSharedValue(0);
  const kenBurnsScale = useSharedValue(1.0);
  const overlayOpacity = useSharedValue(1.0);

  // Reset animations when moment index changes
  useEffect(() => {
    if (isFinished || !isPlaying || isHolding || recapMoments.length === 0) {
      return;
    }

    // Reset progress
    progressAnim.value = 0;
    progressAnim.value = withTiming(1, {
      duration: SLIDE_DURATION_MS,
      easing: Easing.linear,
    });

    // Ken Burns subtle zoom
    kenBurnsScale.value = 1.0;
    kenBurnsScale.value = withTiming(1.07, {
      duration: SLIDE_DURATION_MS,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });

    const timer = setTimeout(() => {
      handleNext();
    }, SLIDE_DURATION_MS);

    return () => {
      clearTimeout(timer);
      cancelAnimation(progressAnim);
      cancelAnimation(kenBurnsScale);
    };
  }, [currentIndex, isPlaying, isHolding, isFinished, recapMoments.length]);

  const handleNext = () => {
    if (currentIndex >= recapMoments.length - 1) {
      setIsFinished(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isFinished) {
      setIsFinished(false);
      setCurrentIndex(recapMoments.length - 1);
      return;
    }
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handlePressIn = () => {
    setIsHolding(true);
    cancelAnimation(progressAnim);
    cancelAnimation(kenBurnsScale);
    overlayOpacity.value = withTiming(0.1, { duration: 200 });
  };

  const handlePressOut = () => {
    setIsHolding(false);
    overlayOpacity.value = withTiming(1.0, { duration: 200 });
  };

  const handleToggleFavorite = async () => {
    const moment = recapMoments[currentIndex];
    if (moment) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await toggleFavoriteMoment(moment.id);
    }
  };

  const handleShareStory = async () => {
    try {
      const moment = recapMoments[currentIndex];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `Reliving ${currentTrip?.title}: "${moment?.title}" in ${moment?.city} · Captured on Trip Moments`,
      });
    } catch (e) {}
  };

  const currentMoment = recapMoments[currentIndex] || recapMoments[0];

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: kenBurnsScale.value }],
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnim.value * 100}%`,
    };
  });

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

  // Finished summary card
  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: "#0B1511" }]}>
        <StatusBar barStyle="light-content" />
        <Image
          source={{ uri: currentTrip.coverUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(11,21,17,0.95)"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.finishedCard, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}>
          <View style={styles.crestCircle}>
            <Ionicons name="sparkles" size={32} color="#F59E0B" />
          </View>
          <Text style={[FONTS.captionBold, styles.finishedSubtitle, { color: primaryTint }]}>
            EXPEDITION RECAP COMPLETE
          </Text>
          <Text style={[FONTS.h1, styles.finishedTitle]}>
            {currentTrip.title}
          </Text>
          <Text style={styles.finishedLocation}>
            {currentTrip.city}, {currentTrip.country}
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsSummaryGrid}>
            <View style={styles.statSummaryBox}>
              <Text style={styles.statNumber}>{recapMoments.length}</Text>
              <Text style={styles.statLabel}>MOMENTS</Text>
            </View>
            <View style={styles.statSummaryBox}>
              <Text style={styles.statNumber}>
                {new Set(recapMoments.map((m) => m.placeName || m.city)).size}
              </Text>
              <Text style={styles.statLabel}>STOPS</Text>
            </View>
            <View style={styles.statSummaryBox}>
              <Text style={styles.statNumber}>
                {currentTrip.id === "trip-1" ? "42" : currentTrip.id === "trip-2" ? "318" : "75"}
              </Text>
              <Text style={styles.statLabel}>KM LOGGED</Text>
            </View>
          </View>

          <View style={styles.finishedActions}>
            <TouchableOpacity
              style={[styles.replayBtn, { backgroundColor: primaryTint }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsFinished(false);
                setCurrentIndex(0);
              }}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.replayBtnText}>Replay Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeSummaryBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeSummaryBtnText}>Back to Trip Journal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      <StatusBar barStyle="light-content" hidden={false} />

      {/* Main Fullscreen Story Image with Ken Burns zoom */}
      <View style={styles.slideWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
          <Image
            source={{ uri: currentMoment.mediaUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        </Animated.View>

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.65)",
            "transparent",
            "rgba(0,0,0,0.30)",
            "rgba(0,0,0,0.92)",
          ]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Story Progress Bars */}
        <Animated.View
          style={[
            styles.progressBarsRow,
            { paddingTop: insets.top + 8 },
            animatedOverlayStyle,
          ]}
        >
          {recapMoments.map((_, idx) => (
            <View key={idx} style={styles.progressBarTrack}>
              {idx < currentIndex && (
                <View
                  style={[
                    styles.progressBarFill,
                    { width: "100%", backgroundColor: primaryTint },
                  ]}
                />
              )}
              {idx === currentIndex && (
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: primaryTint },
                    animatedProgressStyle,
                  ]}
                />
              )}
              {idx > currentIndex && (
                <View style={[styles.progressBarFill, { width: "0%" }]} />
              )}
            </View>
          ))}
        </Animated.View>

        {/* Top Navigation Controls */}
        <Animated.View style={[styles.topControls, animatedOverlayStyle]}>
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
              onPress={handleToggleFavorite}
              style={styles.storyIconBtn}
            >
              <Ionicons
                name={currentMoment.isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={currentMoment.isFavorite ? "#EF4444" : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Story Tap Touch Zones: Left (30%) & Right (70%), with PressIn/PressOut for hold-to-pause */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <TouchableWithoutFeedback
            onPress={handlePrev}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.touchLeft} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.touchRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Story Bottom Content Overlay */}
        <Animated.View
          style={[
            styles.bottomContent,
            { paddingBottom: insets.bottom + 20 },
            animatedOverlayStyle,
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.badgeRow}>
            <LiquidGlass radius={12} intensity={40} style={styles.storyGlassBadge}>
              <Ionicons name="location-sharp" size={12} color="#10B981" />
              <Text style={styles.storyBadgeText}>
                {currentMoment.placeName || currentMoment.city} ·{" "}
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
                  color="#F59E0B"
                />
                <Text style={[styles.storyBadgeText, { marginLeft: 4 }]}>
                  {currentMoment.weather.temp}°C
                </Text>
              </LiquidGlass>
            )}

            {currentMoment.latitude && currentMoment.longitude && (
              <LiquidGlass radius={12} intensity={40} style={styles.storyGlassBadge}>
                <Ionicons name="compass-outline" size={12} color="#60A5FA" />
                <Text style={[styles.storyBadgeText, { marginLeft: 4 }]}>
                  {currentMoment.latitude.toFixed(2)}°, {currentMoment.longitude.toFixed(2)}°
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
              <Text style={styles.shareActionText}>Share Moment Card</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  slideWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  progressBarsRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 16,
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
    borderRadius: 2,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 10,
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storyIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  touchLeft: {
    position: "absolute",
    left: 0,
    top: 60,
    bottom: 120,
    width: "35%",
    zIndex: 5,
  },
  touchRight: {
    position: "absolute",
    right: 0,
    top: 60,
    bottom: 120,
    width: "65%",
    zIndex: 5,
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  storyGlassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  storyBadgeText: {
    color: "#FFFFFF",
    fontFamily: "InterMedium",
    fontSize: 11,
    marginLeft: 3,
  },
  storyTripName: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "InterSemiBold",
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  storyMomentTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 26,
    lineHeight: 32,
    marginVertical: 4,
  },
  storyQuote: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "InterRegular",
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    marginTop: 4,
  },
  shareRow: {
    marginTop: 16,
  },
  shareActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  shareActionText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
    fontSize: 14,
  },
  backHomeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
  },
  finishedCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  crestCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245,158,11,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  finishedSubtitle: {
    letterSpacing: 1.5,
    fontSize: 12,
    marginBottom: 6,
  },
  finishedTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 4,
  },
  finishedLocation: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "InterMedium",
    fontSize: 14,
    marginBottom: 28,
  },
  statsSummaryGrid: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 32,
  },
  statSummaryBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statNumber: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 24,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "InterSemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  finishedActions: {
    width: "100%",
    gap: 12,
  },
  replayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  replayBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
    fontSize: 15,
  },
  closeSummaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeSummaryBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "InterMedium",
    fontSize: 14,
  },
});
