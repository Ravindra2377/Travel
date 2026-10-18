import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import { Ionicons } from "../components/Icon";

const { width } = Dimensions.get("window");

export const PublicTripViewerScreen = ({ route, navigation }) => {
  const { trip, tripId } = route.params || {};
  const { themeColors, isDark } = useTheme();
  const { trips, activeTrip, moments, diaryEntries } = useTrips();

  const currentTrip = useMemo(() => {
    if (trip) return trip;
    if (tripId) {
      return trips.find((t) => t.id === tripId) || activeTrip || trips[0];
    }
    return activeTrip || trips[0];
  }, [trip, tripId, trips, activeTrip]);

  const primaryTint = currentTrip?.themeColor || themeColors.primary;

  const tripMoments = useMemo(() => {
    if (!currentTrip) return [];
    return moments
      .filter((m) => m.tripId === currentTrip.id)
      .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  }, [currentTrip, moments]);

  // Group by day for public view
  const groupedDays = useMemo(() => {
    const dayMap = {};
    tripMoments.forEach((m) => {
      const dateKey = new Date(m.takenAt).toISOString().split("T")[0];
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateKey,
          dateObj: new Date(m.takenAt),
          city: m.city || currentTrip.city || "Destination",
          weather: m.weather,
          moments: [],
        };
      }
      dayMap[dateKey].moments.push(m);
    });
    return Object.values(dayMap).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );
  }, [tripMoments, currentTrip]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Top Web Chrome Bar */}
      <View
        style={[
          styles.webBar,
          {
            backgroundColor: themeColors.surface,
            borderBottomColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.ink} />
        </TouchableOpacity>

        <View style={styles.webBarCenter}>
          <Text
            style={[
              FONTS.ticketStamp,
              { color: primaryTint, fontSize: 10 },
            ]}
          >
            PUBLIC WEB VIEWER
          </Text>
          <Text
            style={[
              FONTS.captionBold,
              styles.webUrl,
              { color: themeColors.inkSoft },
            ]}
            numberOfLines={1}
          >
            tripmoments.app/share/{currentTrip?.shareSlug || "trip"}
          </Text>
        </View>

        <View
          style={[
            styles.verifiedBadge,
            { backgroundColor: `${primaryTint}18` },
          ]}
        >
          <Ionicons name="shield-checkmark" size={13} color={primaryTint} />
          <Text style={[FONTS.captionBold, { color: primaryTint, fontSize: 10, marginLeft: 3 }]}>
            Live
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed Hero Card */}
        <View style={[styles.heroCard, SHADOWS.md]}>
          <Image
            source={{ uri: currentTrip?.coverUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.30)", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <LiquidGlass radius={10} intensity={40} style={styles.glassBadge}>
                <Ionicons name="location" size={12} color="#FFFFFF" />
                <Text style={styles.glassBadgeText}>
                  {currentTrip?.city}, {currentTrip?.country}
                </Text>
              </LiquidGlass>

              <LiquidGlass radius={10} intensity={40} style={styles.glassBadge}>
                <Ionicons name="images" size={12} color="#FFFFFF" />
                <Text style={styles.glassBadgeText}>
                  {tripMoments.length} moments
                </Text>
              </LiquidGlass>
            </View>

            <Text style={styles.heroDates}>
              {currentTrip?.startDate} — {currentTrip?.endDate}
            </Text>
            <Text style={styles.heroTitle}>
              {currentTrip?.title}
            </Text>
            {currentTrip?.notes ? (
              <Text style={styles.heroNotes}>
                {currentTrip.notes}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Days & Story Timeline */}
        <View style={styles.timelineSection}>
          <Text
            style={[
              FONTS.ticketStamp,
              styles.sectionTitle,
              { color: themeColors.inkSoft },
            ]}
          >
            DAY-BY-DAY STORY
          </Text>

          {groupedDays.map((day, idx) => {
            const formattedDate = day.dateObj.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            // Check if public diary exists
            const diary = diaryEntries.find(
              (d) =>
                d.tripId === currentTrip?.id &&
                d.dateKey === day.dateKey &&
                !d.isPrivate &&
                !d.deletedAt
            );

            return (
              <View key={day.dateKey} style={styles.dayBlock}>
                {/* Day Header */}
                <View
                  style={[
                    styles.dayHeader,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.06)",
                    },
                    SHADOWS.sm,
                  ]}
                >
                  <View style={styles.dayHeaderLeft}>
                    <Text
                      style={[
                        FONTS.ticketStamp,
                        { color: primaryTint, fontSize: 11 },
                      ]}
                    >
                      DAY {String(idx + 1).padStart(2, "0")} · {formattedDate.toUpperCase()}
                    </Text>
                    <Text
                      style={[
                        FONTS.caption,
                        { color: themeColors.inkSoft, marginTop: 2 },
                      ]}
                    >
                      {day.city}
                    </Text>
                  </View>

                  {day.weather && (
                    <View style={styles.weatherTag}>
                      <Ionicons
                        name={day.weather.icon || "sunny"}
                        size={14}
                        color={primaryTint}
                      />
                      <Text
                        style={[
                          FONTS.monoBold,
                          { color: themeColors.ink, fontSize: 12, marginLeft: 4 },
                        ]}
                      >
                        {day.weather.temp}°C
                      </Text>
                    </View>
                  )}
                </View>

                {/* Public Diary Note if non-private */}
                {diary && (
                  <View
                    style={[
                      styles.publicDiaryCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        FONTS.uiBody,
                        styles.diaryText,
                        { color: themeColors.ink },
                      ]}
                    >
                      "{diary.text}"
                    </Text>
                  </View>
                )}

                {/* Moments Photos */}
                {day.moments.map((moment) => (
                  <View
                    key={moment.id}
                    style={[
                      styles.publicMomentCard,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                      },
                      SHADOWS.sm,
                    ]}
                  >
                    <Image
                      source={{ uri: moment.mediaUri }}
                      style={styles.publicMomentImg}
                      contentFit="cover"
                      transition={200}
                    />
                    <View style={styles.publicMomentContent}>
                      <View style={styles.momentMetaRow}>
                        <Ionicons name="pin" size={12} color={primaryTint} />
                        <Text
                          style={[
                            FONTS.captionBold,
                            styles.momentPlace,
                            { color: primaryTint },
                          ]}
                        >
                          {moment.placeName || moment.city}
                        </Text>
                      </View>
                      <Text
                        style={[
                          FONTS.h3,
                          styles.momentTitle,
                          { color: themeColors.ink },
                        ]}
                      >
                        {moment.title}
                      </Text>
                      {moment.text ? (
                        <Text
                          style={[
                            FONTS.body,
                            styles.momentText,
                            { color: themeColors.inkSoft },
                          ]}
                        >
                          {moment.text}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Footer Brand Banner */}
        <View
          style={[
            styles.footerBanner,
            { backgroundColor: `${primaryTint}12`, borderColor: `${primaryTint}30` },
          ]}
        >
          <Ionicons name="compass" size={24} color={primaryTint} />
          <Text
            style={[
              FONTS.h3,
              styles.footerTitle,
              { color: themeColors.ink },
            ]}
          >
            Follow this expedition on Trip Moments
          </Text>
          <Text
            style={[
              FONTS.caption,
              styles.footerSub,
              { color: themeColors.inkSoft },
            ]}
          >
            India-first, globally usable travel story app
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  webBarCenter: {
    alignItems: "center",
  },
  webUrl: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    height: 320,
    position: "relative",
    justifyContent: "flex-end",
    padding: 20,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  glassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  glassBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "InterMedium",
    marginLeft: 4,
  },
  heroContent: {},
  heroDates: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMonoMedium",
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 4,
    opacity: 0.9,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  heroNotes: {
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  timelineSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    marginBottom: 16,
  },
  dayBlock: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  dayHeaderLeft: {},
  weatherTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  publicDiaryCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  diaryText: {
    fontStyle: "italic",
    fontSize: 13,
    lineHeight: 20,
  },
  publicMomentCard: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 14,
  },
  publicMomentImg: {
    width: "100%",
    height: 200,
  },
  publicMomentContent: {
    padding: 14,
  },
  momentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  momentPlace: {
    fontSize: 11,
    marginLeft: 4,
  },
  momentTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  momentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerBanner: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  footerTitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
  footerSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});

export default PublicTripViewerScreen;
