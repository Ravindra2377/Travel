import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";

const { width } = Dimensions.get("window");

const PRESET_COLORS = [
  { primary: "#16845B", secondary: "#D97706", name: "Forest & Amber" },
  { primary: "#BE123C", secondary: "#1E293B", name: "Autumn Crimson" },
  { primary: "#0284C7", secondary: "#F59E0B", name: "Azure & Lemon" },
  { primary: "#7C3AED", secondary: "#EC4899", name: "Dusk Violet" },
  { primary: "#0F766E", secondary: "#F97316", name: "Emerald & Coral" },
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1600100397608-f010f4439c2e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop",
];

const HomeScreen = ({ navigation }) => {
  const { themeColors, isDark } = useTheme();
  const { trips, activeTrip, setActiveTrip, moments, addTrip } = useTrips();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newStartDate, setNewStartDate] = useState("2026-10-18");
  const [newEndDate, setNewEndDate] = useState("2026-10-24");
  const [newNotes, setNewNotes] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);

  // Active Trip Moments
  const activeMoments = useMemo(() => {
    if (!activeTrip) return [];
    return moments.filter((m) => m.tripId === activeTrip.id);
  }, [activeTrip, moments]);

  // "On This Day" Memory
  const onThisDayMoment = useMemo(() => {
    if (!moments || moments.length === 0) return null;
    const favorite = moments.find((m) => m.isFavorite);
    return favorite || moments[0];
  }, [moments]);

  const handleCreateTrip = async () => {
    if (!newTitle.trim()) {
      Alert.alert("Missing Title", "Please give your trip a title.");
      return;
    }
    const colorPreset = PRESET_COLORS[selectedColorIndex];
    const coverUri = PRESET_COVERS[selectedCoverIndex];

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const created = await addTrip({
        title: newTitle.trim(),
        city: newCity.trim() || "Wanderland",
        country: newCountry.trim() || "Earth",
        startDate: newStartDate,
        endDate: newEndDate,
        status: "active",
        coverUri,
        themeColor: colorPreset.primary,
        secondaryColor: colorPreset.secondary,
        notes: newNotes.trim(),
      });

      setCreateModalVisible(false);
      setNewTitle("");
      setNewCity("");
      setNewCountry("");
      setNewNotes("");

      navigation.navigate("TripCover", { tripId: created.id });
    } catch (e) {
      Alert.alert("Error", "Could not create trip.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text
            style={[
              FONTS.captionBold,
              styles.subtitle,
              { color: themeColors.primary },
            ]}
          >
            JOURNAL & DISCOVERY
          </Text>
          <Text
            style={[
              FONTS.h1,
              styles.headerTitle,
              { color: themeColors.ink },
            ]}
          >
            Trip Moments
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.newTripBtn,
              { backgroundColor: themeColors.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCreateModalVisible(true);
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newTripBtnText}>New Trip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Search");
            }}
          >
            <Ionicons name="search" size={20} color={themeColors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Trip Banner */}
        {activeTrip ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.pulseDotWrapper}>
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: themeColors.primary },
                  ]}
                />
                <Text
                  style={[
                    FONTS.ticketStamp,
                    { color: themeColors.primary },
                  ]}
                >
                  ACTIVE EXPEDITION
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Capture", { tripId: activeTrip.id });
                }}
                style={[
                  styles.quickCaptureBtn,
                  { backgroundColor: `${themeColors.primary}18` },
                ]}
              >
                <Ionicons
                  name="camera"
                  size={15}
                  color={themeColors.primary}
                />
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: themeColors.primary, marginLeft: 6 },
                  ]}
                >
                  Capture
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTrip(activeTrip);
                navigation.navigate("TripCover", { tripId: activeTrip.id });
              }}
              style={[styles.heroCard, SHADOWS.lg]}
            >
              <Image
                source={{ uri: activeTrip.coverUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(0,0,0,0.30)",
                  "rgba(0,0,0,0.85)",
                ]}
                style={StyleSheet.absoluteFill}
              />

              {/* Badges on top */}
              <View style={styles.heroTopBadges}>
                <LiquidGlass
                  radius={12}
                  intensity={40}
                  style={styles.heroGlassBadge}
                >
                  <Text style={styles.heroBadgeText}>
                    {activeTrip.city ? `${activeTrip.city}, ` : ""}
                    {activeTrip.country || "Explore"}
                  </Text>
                </LiquidGlass>

                <LiquidGlass
                  radius={12}
                  intensity={40}
                  style={styles.heroGlassBadge}
                >
                  <Ionicons name="images" size={13} color="#FFFFFF" />
                  <Text style={[styles.heroBadgeText, { marginLeft: 5 }]}>
                    {activeMoments.length} moments
                  </Text>
                </LiquidGlass>
              </View>

              {/* Title & Stats */}
              <View style={styles.heroContent}>
                <Text style={styles.heroDates}>
                  {activeTrip.startDate} — {activeTrip.endDate}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {activeTrip.title}
                </Text>

                {activeTrip.notes ? (
                  <Text style={styles.heroNotes} numberOfLines={2}>
                    {activeTrip.notes}
                  </Text>
                ) : null}

                {/* Bottom Action Strip */}
                <View style={styles.heroActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.heroActionBtn,
                      { backgroundColor: themeColors.primary },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("Journal", {
                        tripId: activeTrip.id,
                      });
                    }}
                  >
                    <Ionicons name="journal" size={16} color="#FFFFFF" />
                    <Text style={styles.heroActionBtnText}>View Journal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroActionGhostBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("Map", { tripId: activeTrip.id });
                    }}
                  >
                    <Ionicons name="map-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.heroActionGhostText}>Route Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {/* Today's Diary Entry Prompt */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Journal", {
                  tripId: activeTrip.id,
                  openDiaryForToday: true,
                });
              }}
              style={[
                styles.todayDiaryPromptCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.06)",
                },
                SHADOWS.sm,
              ]}
            >
              <View style={styles.todayDiaryLeft}>
                <View
                  style={[
                    styles.todayDiaryIconBox,
                    { backgroundColor: `${themeColors.primary}18` },
                  ]}
                >
                  <Ionicons name="book" size={17} color={themeColors.primary} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <View style={styles.todayDiaryLabelRow}>
                    <Text
                      style={[
                        FONTS.ticketStamp,
                        { color: themeColors.primary, fontSize: 10 },
                      ]}
                    >
                      DAILY DIARY
                    </Text>
                    <View
                      style={[
                        styles.todayDiaryPulseDot,
                        { backgroundColor: themeColors.primary },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.todayDiaryTitle,
                      { color: themeColors.ink },
                    ]}
                  >
                    Write today's diary entry
                  </Text>
                  <Text
                    style={[
                      FONTS.caption,
                      styles.todayDiarySub,
                      { color: themeColors.inkSoft },
                    ]}
                  >
                    Capture your mood, food discoveries, and reflections
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.todayDiaryActionBtn,
                  { backgroundColor: `${themeColors.primary}18` },
                ]}
              >
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: themeColors.primary, marginRight: 2 },
                  ]}
                >
                  Write
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={themeColors.primary}
                />
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* "On This Day" Memory Strip */}
        {onThisDayMoment ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  FONTS.ticketStamp,
                  { color: themeColors.inkSoft },
                ]}
              >
                ON THIS DAY · PAST MEMORIES
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("MomentDetail", {
                  moment: onThisDayMoment,
                });
              }}
              style={[
                styles.memoryCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.06)",
                },
                SHADOWS.sm,
              ]}
            >
              <Image
                source={{ uri: onThisDayMoment.mediaUri }}
                style={styles.memoryThumb}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.memoryDetails}>
                <View style={styles.memoryTopRow}>
                  <Text
                    style={[
                      FONTS.ticketStamp,
                      { color: themeColors.primary },
                    ]}
                  >
                    {onThisDayMoment.city} ·{" "}
                    {new Date(onThisDayMoment.takenAt).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )}
                  </Text>
                  {onThisDayMoment.isFavorite && (
                    <Ionicons name="heart" size={15} color="#EF4444" />
                  )}
                </View>

                <Text
                  style={[
                    FONTS.h3,
                    styles.memoryTitle,
                    { color: themeColors.ink },
                  ]}
                  numberOfLines={1}
                >
                  {onThisDayMoment.title}
                </Text>

                <Text
                  style={[
                    FONTS.caption,
                    styles.memoryCaption,
                    { color: themeColors.inkSoft },
                  ]}
                  numberOfLines={2}
                >
                  {onThisDayMoment.text}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* All Stories & Journeys */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                FONTS.ticketStamp,
                { color: themeColors.inkSoft },
              ]}
            >
              ALL JOURNEYS ({trips.length})
            </Text>
          </View>

          {trips.map((trip) => {
            const tripMomentsCount = moments.filter(
              (m) => m.tripId === trip.id
            ).length;
            const isCurrent = activeTrip?.id === trip.id;

            return (
              <TouchableOpacity
                key={trip.id}
                activeOpacity={0.9}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTrip(trip);
                  navigation.navigate("TripCover", { tripId: trip.id });
                }}
                style={[
                  styles.tripCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: isCurrent
                      ? trip.themeColor || themeColors.primary
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.05)",
                    borderWidth: isCurrent ? 2 : 1,
                  },
                  SHADOWS.md,
                ]}
              >
                <View style={styles.tripCardImageContainer}>
                  <Image
                    source={{ uri: trip.coverUri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={250}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.65)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.tripCardPill}>
                    <Text style={styles.tripCardStatusText}>
                      {trip.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.tripCardBody}>
                  <View style={styles.tripCardHeaderRow}>
                    <Text
                      style={[
                        FONTS.ticketStamp,
                        { color: trip.themeColor || themeColors.primary },
                      ]}
                    >
                      {trip.city ? `${trip.city.toUpperCase()}, ` : ""}
                      {trip.country?.toUpperCase() || "TRAVEL"}
                    </Text>
                    <Text
                      style={[
                        FONTS.mono,
                        { color: themeColors.inkFaint, fontSize: 11 },
                      ]}
                    >
                      {tripMomentsCount} moments
                    </Text>
                  </View>

                  <Text
                    style={[
                      FONTS.h2,
                      styles.tripCardTitle,
                      { color: themeColors.ink },
                    ]}
                    numberOfLines={1}
                  >
                    {trip.title}
                  </Text>

                  <Text
                    style={[
                      FONTS.caption,
                      { color: themeColors.inkSoft, marginTop: 4 },
                    ]}
                    numberOfLines={1}
                  >
                    {trip.startDate} — {trip.endDate}
                  </Text>

                  {trip.notes ? (
                    <Text
                      style={[
                        FONTS.caption,
                        { color: themeColors.inkFaint, marginTop: 6 },
                      ]}
                      numberOfLines={2}
                    >
                      {trip.notes}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* New Trip Creation Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    FONTS.ticketStamp,
                    { color: themeColors.primary },
                  ]}
                >
                  NEW CHAPTER
                </Text>
                <Text
                  style={[
                    FONTS.h2,
                    styles.modalTitle,
                    { color: themeColors.ink },
                  ]}
                >
                  Create a Trip
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color={themeColors.ink} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[
                  FONTS.captionBold,
                  styles.fieldLabel,
                  { color: themeColors.ink },
                ]}
              >
                TRIP TITLE
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: themeColors.ink,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                    backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                  },
                ]}
                placeholder="e.g. Lost in the Himalayan Valleys"
                placeholderTextColor={themeColors.inkFaint}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.fieldLabel,
                      { color: themeColors.ink },
                    ]}
                  >
                    PRIMARY CITY
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: themeColors.ink,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.1)",
                        backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                      },
                    ]}
                    placeholder="e.g. Manali"
                    placeholderTextColor={themeColors.inkFaint}
                    value={newCity}
                    onChangeText={setNewCity}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.fieldLabel,
                      { color: themeColors.ink },
                    ]}
                  >
                    COUNTRY
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: themeColors.ink,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.1)",
                        backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                      },
                    ]}
                    placeholder="e.g. India"
                    placeholderTextColor={themeColors.inkFaint}
                    value={newCountry}
                    onChangeText={setNewCountry}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.fieldLabel,
                      { color: themeColors.ink },
                    ]}
                  >
                    START DATE
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: themeColors.ink,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.1)",
                        backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                      },
                    ]}
                    value={newStartDate}
                    onChangeText={setNewStartDate}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.fieldLabel,
                      { color: themeColors.ink },
                    ]}
                  >
                    END DATE
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: themeColors.ink,
                        borderColor: isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.1)",
                        backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                      },
                    ]}
                    value={newEndDate}
                    onChangeText={setNewEndDate}
                  />
                </View>
              </View>

              <Text
                style={[
                  FONTS.captionBold,
                  styles.fieldLabel,
                  { color: themeColors.ink },
                ]}
              >
                TRIP STORY / INTENTION
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 70,
                    textAlignVertical: "top",
                    color: themeColors.ink,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)",
                    backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                  },
                ]}
                placeholder="What is this trip about?"
                placeholderTextColor={themeColors.inkFaint}
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
              />

              <Text
                style={[
                  FONTS.captionBold,
                  styles.fieldLabel,
                  { color: themeColors.ink },
                ]}
              >
                COVER PHOTO THEME
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.coverSelectorRow}
              >
                {PRESET_COVERS.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedCoverIndex(idx)}
                    style={[
                      styles.coverChoice,
                      selectedCoverIndex === idx && {
                        borderColor: themeColors.primary,
                        borderWidth: 3,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text
                style={[
                  FONTS.captionBold,
                  styles.fieldLabel,
                  { color: themeColors.ink },
                ]}
              >
                ACCENT PALETTE
              </Text>
              <View style={styles.colorPaletteRow}>
                {PRESET_COLORS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedColorIndex(idx)}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: preset.primary },
                      selectedColorIndex === idx && {
                        borderWidth: 3,
                        borderColor: themeColors.ink,
                        transform: [{ scale: 1.15 }],
                      },
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.createSubmitBtn,
                  { backgroundColor: themeColors.primary },
                ]}
                onPress={handleCreateTrip}
              >
                <Text style={styles.createSubmitBtnText}>
                  Begin This Story
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  subtitle: {
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "FrauncesBold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    gap: 4,
  },
  newTripBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pulseDotWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickCaptureBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heroCard: {
    height: 360,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 20,
  },
  heroTopBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroGlassBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  heroContent: {
    gap: 6,
  },
  heroDates: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "IBMPlexMono",
    fontSize: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 26,
    lineHeight: 32,
  },
  heroNotes: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  heroActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  heroActionBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 13,
  },
  heroActionGhostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  heroActionGhostText: {
    color: "#FFFFFF",
    fontFamily: "InterMedium",
    fontSize: 13,
  },
  memoryCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 14,
  },
  memoryThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  memoryDetails: {
    flex: 1,
    gap: 3,
  },
  memoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memoryTitle: {
    fontSize: 16,
    fontFamily: "FrauncesSemiBold",
  },
  memoryCaption: {
    fontSize: 12,
    lineHeight: 16,
  },
  tripCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  tripCardImageContainer: {
    height: 160,
    width: "100%",
  },
  tripCardPill: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.50)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tripCardStatusText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 10,
    letterSpacing: 1,
  },
  tripCardBody: {
    padding: 16,
  },
  tripCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tripCardTitle: {
    fontSize: 20,
    fontFamily: "FrauncesBold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "FrauncesBold",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter",
  },
  formRow: {
    flexDirection: "row",
  },
  coverSelectorRow: {
    marginVertical: 6,
  },
  coverChoice: {
    width: 90,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
  },
  colorPaletteRow: {
    flexDirection: "row",
    gap: 14,
    marginVertical: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  createSubmitBtn: {
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  createSubmitBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 16,
  },
  // Diary Prompt Card Styles
  todayDiaryPromptCard: {
    marginTop: 12,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayDiaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  todayDiaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  todayDiaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  todayDiaryPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  todayDiaryTitle: {
    fontSize: 14,
  },
  todayDiarySub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  todayDiaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
});

export default HomeScreen;
