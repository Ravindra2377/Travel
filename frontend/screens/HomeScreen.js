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
import { useI18n } from "../config/i18n";
import syncManager, { SYNC_STATUS } from "../services/syncManager";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";
import InteractiveMap, { getTripCoordinates } from "../components/InteractiveMap";
import BottomSheet from "../components/BottomSheet";
import TripCreateModal from "../components/TripCreateModal";
import PermissionPrePrompt from "../components/PermissionPrePrompt";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const { t, language, setLanguage } = useI18n();

  const [syncState, setSyncState] = useState({
    status: SYNC_STATUS.IDLE,
    pendingCount: 0,
  });

  React.useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await syncManager.syncPending();
  };

  const handleToggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(language === "en" ? "hi" : "en");
  };

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [permissionPromptVisible, setPermissionPromptVisible] = useState(false);
  const [permissionType, setPermissionType] = useState("location");
  const [flyToLocation, setFlyToLocation] = useState(null);

  const handleSelectTrip = (trip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTrip(trip);
    const coords = getTripCoordinates(trip);
    setFlyToLocation({ latitude: coords.lat, longitude: coords.lng, zoom: 11 });
  };

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

  const handleCreateTripModalSubmit = async (tripData) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const created = await addTrip(tripData);
      setCreateModalVisible(false);
      navigation.navigate("TripCover", { tripId: created.id });
    } catch (e) {
      Alert.alert("Error", "Could not create trip.");
    }
  };

  const handlePermissionAccepted = () => {
    setPermissionPromptVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── BACKGROUND CANVAS: INTERACTIVE WORLD EXPEDITION MAP ─────── */}
      <InteractiveMap
        mode="trips"
        trips={trips}
        activeTripId={activeTrip?.id}
        flyToLocation={flyToLocation}
        onSelectTrip={(tripId) => {
          const target = trips.find((t) => t.id === tripId);
          if (target) handleSelectTrip(target);
        }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── FLOATING TOP HEADER ─────────────────────────────────────── */}
      <SafeAreaView
        edges={["top"]}
        style={styles.floatingHeaderArea}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.floatingHeader,
            {
              backgroundColor: isDark
                ? "rgba(18, 26, 22, 0.88)"
                : "rgba(255, 255, 255, 0.88)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.08)",
            },
            SHADOWS.md,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                FONTS.eyebrow,
                styles.subtitle,
                { color: themeColors.primary, fontSize: 10, letterSpacing: 1.5 },
              ]}
            >
              {t("journalDiscovery")}
            </Text>
            <Text
              style={[
                FONTS.h2,
                styles.headerTitle,
                { color: themeColors.ink, fontSize: 21 },
              ]}
              numberOfLines={1}
            >
              {t("appTitle")}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Language Switcher Pill */}
            <TouchableOpacity
              style={[
                styles.langToggleBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
              onPress={handleToggleLanguage}
            >
              <Ionicons name="language" size={14} color={themeColors.primary} />
              <Text
                style={[
                  FONTS.monoBold,
                  styles.langToggleText,
                  { color: themeColors.primary },
                ]}
              >
                {language === "hi" ? "हिन्दी" : "EN"}
              </Text>
            </TouchableOpacity>

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
              <Text style={styles.newTripBtnText}>{t("newTrip")}</Text>
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

        {/* Floating Sync Status Pill - Only visible when syncing or pending offline changes */}
        {(syncState.pendingCount > 0 ||
          syncState.status === SYNC_STATUS.SYNCING ||
          syncState.status === SYNC_STATUS.ERROR) && (
          <View style={styles.syncStatusRowFloating}>
            <TouchableOpacity
              onPress={handleManualSync}
              activeOpacity={0.8}
            style={[
              styles.syncStatusPill,
              {
                backgroundColor:
                  syncState.pendingCount > 0
                    ? isDark
                      ? "#2D1B06"
                      : "#FEF3C7"
                    : syncState.status === SYNC_STATUS.SYNCING
                    ? isDark
                      ? "#082F49"
                      : "#E0F2FE"
                    : isDark
                    ? "rgba(18, 26, 22, 0.88)"
                    : "rgba(255, 255, 255, 0.88)",
                borderColor:
                  syncState.pendingCount > 0
                    ? "#F59E0B"
                    : syncState.status === SYNC_STATUS.SYNCING
                    ? "#0284C7"
                    : isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
              },
              SHADOWS.sm,
            ]}
          >
            <Ionicons
              name={
                syncState.pendingCount > 0
                  ? "cloud-offline-outline"
                  : syncState.status === SYNC_STATUS.SYNCING
                  ? "sync-outline"
                  : "cloud-done-outline"
              }
              size={12}
              color={
                syncState.pendingCount > 0
                  ? "#D97706"
                  : syncState.status === SYNC_STATUS.SYNCING
                  ? "#0284C7"
                  : themeColors.primary
              }
            />
            <Text
              style={[
                FONTS.mono,
                {
                  fontSize: 10,
                  marginLeft: 5,
                  color:
                    syncState.pendingCount > 0
                      ? "#D97706"
                      : syncState.status === SYNC_STATUS.SYNCING
                      ? "#0284C7"
                      : themeColors.primary,
                },
              ]}
            >
              {syncState.pendingCount > 0
                ? `${syncState.pendingCount} ${t("queuedOffline")}`
                : syncState.status === SYNC_STATUS.SYNCING
                ? t("syncingChanges")
                : t("allSynced")}
            </Text>
          </TouchableOpacity>
        </View>
        )}
      </SafeAreaView>

      {/* ── FOREGROUND: SPRING-DRIVEN TRIPS BOTTOM SHEET ────────────── */}
      <BottomSheet
        snapPoints={[120, SCREEN_HEIGHT * 0.48, SCREEN_HEIGHT * 0.88]}
        initialSnap={1}
        renderHeader={({ snapIndex, snapTo }) => (
          <View style={styles.sheetHeaderTeaser}>
            <View style={styles.teaserLeft}>
              <Image
                source={{ uri: activeTrip?.coverUri || PRESET_COVERS[0] }}
                style={styles.teaserThumb}
                contentFit="cover"
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text
                  style={[
                    FONTS.ticketStamp,
                    { color: themeColors.primary, fontSize: 10 },
                  ]}
                >
                  {activeTrip ? t("activeExpedition") : t("allJourneys")} · {trips.length} EXPEDITIONS
                </Text>
                <Text
                  style={[
                    FONTS.h3,
                    { color: themeColors.ink, fontSize: 15 },
                  ]}
                  numberOfLines={1}
                >
                  {activeTrip?.title || "Choose an expedition"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                snapTo(snapIndex === 0 ? 1 : 0);
              }}
              style={[
                styles.mapTogglePill,
                { backgroundColor: `${themeColors.primary}18` },
              ]}
            >
              <Ionicons
                name={snapIndex === 0 ? "chevron-up" : "map"}
                size={14}
                color={themeColors.primary}
              />
              <Text
                style={[
                  FONTS.captionBold,
                  { color: themeColors.primary, fontSize: 11, marginLeft: 4 },
                ]}
              >
                {snapIndex === 0 ? "Browse" : "Explore Map"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      >
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
                  {t("activeExpedition")}
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
                  {t("capture")}
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

                {/* Single Clear Primary Action */}
                <View style={styles.heroActionSingleRow}>
                  <View
                    style={[
                      styles.heroPrimaryPill,
                      { backgroundColor: themeColors.primary },
                    ]}
                  >
                    <Ionicons name="journal-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.heroPrimaryPillText}>
                      {t("viewJournal")}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </View>
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
                      {t("dailyDiary")}
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
                    {t("writeTodayDiary")}
                  </Text>
                  <Text
                    style={[
                      FONTS.caption,
                      styles.todayDiarySub,
                      { color: themeColors.inkSoft },
                    ]}
                  >
                    {t("diarySubtitle")}
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
                  {t("writeBtn")}
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
                {t("onThisDay")}
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
              {t("allJourneys").toUpperCase()} ({trips.length})
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
    </BottomSheet>

      {/* Stacked-Card Trip Creation Wizard */}
      <TripCreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreateTrip={handleCreateTripModalSubmit}
      />

      {/* Permission Pre-Prompt Modal */}
      <PermissionPrePrompt
        visible={permissionPromptVisible}
        type={permissionType}
        onAccept={handlePermissionAccepted}
        onDecline={() => setPermissionPromptVisible(false)}
      />
    </View>
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
    fontSize: 23,
    fontFamily: "FrauncesBold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  langToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    gap: 3,
  },
  langToggleText: {
    fontSize: 11,
  },
  syncStatusRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  floatingHeaderArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  syncStatusRowFloating: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: "flex-start",
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  mapTogglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  syncStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    height: 36,
    borderRadius: 18,
    gap: 4,
  },
  newTripBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 12,
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
  heroActionSingleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  heroPrimaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
  },
  heroPrimaryPillText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
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
