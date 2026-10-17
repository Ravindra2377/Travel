import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";

const { width } = Dimensions.get("window");

const TripCoverScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = useTheme();
  const { trips, moments, deleteTrip, setActiveTrip } = useTrips();

  const trip = useMemo(() => {
    return trips.find((t) => t.id === tripId) || trips[0];
  }, [trips, tripId]);

  const tripMoments = useMemo(() => {
    if (!trip) return [];
    return moments
      .filter((m) => m.tripId === trip.id)
      .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  }, [trip, moments]);

  // Derived stats
  const stats = useMemo(() => {
    if (!trip) return { days: 1, places: 0, photos: 0, distanceKm: 0 };

    const places = new Set(tripMoments.map((m) => m.placeName || m.city).filter(Boolean));
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 1);

    return {
      days,
      places: places.size || 1,
      photos: tripMoments.length,
      distanceKm: trip.id === "trip-1" ? 42 : trip.id === "trip-2" ? 318 : 65,
    };
  }, [trip, tripMoments]);

  const primaryTint = trip?.themeColor || themeColors.primary;
  const secondaryTint = trip?.secondaryColor || themeColors.turmeric;

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Reliving our trip: "${trip.title}" across ${trip.city || "places"}, with ${tripMoments.length} moments captured on Trip Moments!`,
      });
    } catch (e) {
      // dismissed
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete "${trip.title}" and its ${tripMoments.length} moments?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteTrip(trip.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!trip) return null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-bleed Hero Cover Header */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: trip.coverUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.40)",
              "transparent",
              "rgba(0,0,0,0.45)",
              "rgba(0,0,0,0.92)",
            ]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar Floating Chrome */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={styles.floatingGlassBtn}
            >
              <LiquidGlass radius={20} intensity={45} style={styles.iconGlassContent}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </LiquidGlass>
            </TouchableOpacity>

            <View style={styles.topRightBtns}>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.floatingGlassBtn}
              >
                <LiquidGlass radius={20} intensity={45} style={styles.iconGlassContent}>
                  <Ionicons name="share-social" size={19} color="#FFFFFF" />
                </LiquidGlass>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={styles.floatingGlassBtn}
              >
                <LiquidGlass radius={20} intensity={45} style={styles.iconGlassContent}>
                  <Ionicons name="trash-outline" size={19} color="#FF6B6B" />
                </LiquidGlass>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cover Hero Content */}
          <View style={styles.heroBottomContent}>
            <LiquidGlass
              radius={14}
              intensity={40}
              style={styles.locationTicket}
            >
              <Ionicons name="location" size={14} color={primaryTint} />
              <Text style={styles.locationTicketText}>
                {trip.city ? `${trip.city.toUpperCase()}, ` : ""}
                {trip.country?.toUpperCase() || "WORLD"}
              </Text>
            </LiquidGlass>

            <Text style={styles.heroTitle}>{trip.title}</Text>

            <Text style={styles.heroDates}>
              {trip.startDate} — {trip.endDate}
            </Text>

            {/* Quiet Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.days}</Text>
                <Text style={styles.statLabel}>DAYS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.places}</Text>
                <Text style={styles.statLabel}>PLACES</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.photos}</Text>
                <Text style={styles.statLabel}>MOMENTS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.distanceKm}</Text>
                <Text style={styles.statLabel}>KILOMETERS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons Floating Card */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: primaryTint }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveTrip(trip);
              navigation.navigate("Journal", { tripId: trip.id });
            }}
          >
            <Ionicons name="journal" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Open Day Journal</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTrip(trip);
                navigation.navigate("Map", { tripId: trip.id });
              }}
            >
              <Ionicons name="map-outline" size={18} color={primaryTint} />
              <Text style={[styles.secondaryActionText, { color: themeColors.ink }]}>
                Route Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("TripRecap", { tripId: trip.id });
              }}
            >
              <Ionicons name="sparkles" size={18} color={secondaryTint} />
              <Text style={[styles.secondaryActionText, { color: themeColors.ink }]}>
                Play Recap
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Summary Note */}
        {trip.notes ? (
          <View style={styles.storyNoteWrapper}>
            <Text style={[FONTS.ticketStamp, { color: primaryTint, marginBottom: 6 }]}>
              CHRONICLE NOTES
            </Text>
            <Text style={[styles.storyNoteText, { color: themeColors.inkSoft }]}>
              "{trip.notes}"
            </Text>
          </View>
        ) : null}

        {/* Moments Showcase Preview */}
        <View style={styles.showcaseSection}>
          <View style={styles.showcaseHeader}>
            <Text style={[FONTS.ticketStamp, { color: themeColors.inkSoft }]}>
              MOMENTS PREVIEW ({tripMoments.length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Journal", { tripId: trip.id });
              }}
            >
              <Text style={[FONTS.captionBold, { color: primaryTint }]}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalShowcaseList}
          >
            {tripMoments.map((moment) => (
              <TouchableOpacity
                key={moment.id}
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("MomentDetail", { moment });
                }}
                style={styles.momentPreviewCard}
              >
                <Image
                  source={{ uri: moment.mediaUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.75)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.momentPreviewBottom}>
                  <Text style={styles.momentPreviewTitle} numberOfLines={1}>
                    {moment.title}
                  </Text>
                  <Text style={styles.momentPreviewTime}>
                    {new Date(moment.takenAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Moment Card */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Capture", { tripId: trip.id });
              }}
              style={[
                styles.addMomentPreviewCard,
                {
                  backgroundColor: `${primaryTint}15`,
                  borderColor: `${primaryTint}40`,
                },
              ]}
            >
              <Ionicons name="add" size={32} color={primaryTint} />
              <Text style={[styles.addMomentPreviewText, { color: primaryTint }]}>
                Add Moment
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    height: 480,
    width: "100%",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topRightBtns: {
    flexDirection: "row",
    gap: 10,
  },
  floatingGlassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  iconGlassContent: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottomContent: {
    padding: 24,
    gap: 8,
  },
  locationTicket: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 4,
  },
  locationTicketText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 34,
    lineHeight: 40,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDates: {
    color: "rgba(255,255,255,0.78)",
    fontFamily: "IBMPlexMono",
    fontSize: 13,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 18,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  primaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 15,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  secondaryActionText: {
    fontFamily: "InterMedium",
    fontSize: 13,
  },
  storyNoteWrapper: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  storyNoteText: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  showcaseSection: {
    marginTop: 24,
  },
  showcaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  horizontalShowcaseList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  momentPreviewCard: {
    width: 140,
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 10,
  },
  momentPreviewBottom: {
    gap: 2,
  },
  momentPreviewTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesSemiBold",
    fontSize: 13,
  },
  momentPreviewTime: {
    color: "rgba(255,255,255,0.70)",
    fontFamily: "IBMPlexMono",
    fontSize: 10,
  },
  addMomentPreviewCard: {
    width: 120,
    height: 180,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addMomentPreviewText: {
    fontFamily: "InterSemiBold",
    fontSize: 12,
  },
});

export default TripCoverScreen;
