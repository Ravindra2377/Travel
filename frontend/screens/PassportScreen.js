import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";

const { width } = Dimensions.get("window");

const PassportScreen = ({ navigation }) => {
  const { themeColors, isDark, toggleTheme } = useTheme();
  const { passportStats, exportBackup, resetAllData } = useTrips();

  const handleExportBackup = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const json = await exportBackup();
      await Share.share({
        title: "Trip Moments Backup",
        message: json,
      });
    } catch (e) {
      Alert.alert("Export Error", "Could not export backup.");
    }
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset All Trip Data",
      "This will reset all trips, moments, and stamps back to initial defaults. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset to Defaults",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetAllData();
            Alert.alert("Reset Done", "Trip data has been restored to default stories.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[FONTS.ticketStamp, { color: themeColors.primary }]}>
            TRAVEL CHRONICLES
          </Text>
          <Text style={[FONTS.h1, styles.headerTitle, { color: themeColors.ink }]}>
            My Passport
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.themeBtn,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleTheme();
          }}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={20}
            color={themeColors.ink}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Passport Booklet Card */}
        <View
          style={[
            styles.passportCard,
            {
              backgroundColor: isDark ? "#14221B" : "#0D4F3C",
            },
            SHADOWS.lg,
          ]}
        >
          {/* Gold Foil Crest Header */}
          <View style={styles.passportTop}>
            <View style={styles.crestCircle}>
              <Ionicons name="earth" size={28} color="#F59E0B" />
            </View>
            <View style={styles.passportTitles}>
              <Text style={styles.passportBookletText}>OFFICIAL TRAVEL LOG</Text>
              <Text style={styles.passportHolderName}>Global Wanderer</Text>
            </View>
          </View>

          <View style={styles.passportDivider} />

          {/* Totals Grid */}
          <View style={styles.totalsGrid}>
            <View style={styles.totalBlock}>
              <Text style={styles.totalNumber}>
                {passportStats?.countriesCount || 2}
              </Text>
              <Text style={styles.totalLabel}>COUNTRIES</Text>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalNumber}>
                {passportStats?.citiesCount || 4}
              </Text>
              <Text style={styles.totalLabel}>CITIES</Text>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalNumber}>
                {passportStats?.totalMoments || 8}
              </Text>
              <Text style={styles.totalLabel}>MOMENTS</Text>
            </View>

            <View style={styles.totalBlock}>
              <Text style={styles.totalNumber}>
                {passportStats?.totalDistanceKm || 360}
              </Text>
              <Text style={styles.totalLabel}>KILOMETERS</Text>
            </View>
          </View>
        </View>

        {/* Passport Stamps Section */}
        <View style={styles.section}>
          <Text style={[FONTS.ticketStamp, { color: themeColors.inkSoft, marginBottom: 12 }]}>
            OFFICIAL EXPEDITION STAMPS
          </Text>

          <View style={styles.stampsGrid}>
            {passportStats?.stamps?.map((stamp) => (
              <View
                key={stamp.id}
                style={[
                  styles.stampCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: stamp.earned
                      ? themeColors.primary
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                    borderWidth: stamp.earned ? 1.5 : 1,
                  },
                  SHADOWS.sm,
                ]}
              >
                <View
                  style={[
                    styles.stampSeal,
                    {
                      borderColor: stamp.earned
                        ? themeColors.primary
                        : themeColors.inkFaint,
                    },
                  ]}
                >
                  <Ionicons
                    name={stamp.earned ? "ribbon-outline" : "lock-closed-outline"}
                    size={22}
                    color={stamp.earned ? themeColors.primary : themeColors.inkFaint}
                  />
                  <Text
                    style={[
                      styles.stampSealText,
                      {
                        color: stamp.earned
                          ? themeColors.primary
                          : themeColors.inkFaint,
                      },
                    ]}
                  >
                    {stamp.earned ? stamp.date : "LOCKED"}
                  </Text>
                </View>

                <Text
                  style={[
                    FONTS.h3,
                    styles.stampTitle,
                    { color: themeColors.ink },
                  ]}
                  numberOfLines={1}
                >
                  {stamp.title}
                </Text>

                <Text
                  style={[
                    FONTS.caption,
                    { color: themeColors.inkSoft, fontSize: 11 },
                  ]}
                >
                  {stamp.city} · {stamp.category}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Visited Places Tags */}
        <View style={styles.section}>
          <Text style={[FONTS.ticketStamp, { color: themeColors.inkSoft, marginBottom: 12 }]}>
            DISCOVERED CITIES
          </Text>
          <View style={styles.placesChipsRow}>
            {passportStats?.citiesList?.map((cityName, idx) => (
              <View
                key={idx}
                style={[
                  styles.placeChip,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Ionicons name="location" size={13} color={themeColors.primary} />
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: themeColors.ink, marginLeft: 6 },
                  ]}
                >
                  {cityName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings & Data Storage */}
        <View style={styles.section}>
          <Text style={[FONTS.ticketStamp, { color: themeColors.inkSoft, marginBottom: 12 }]}>
            DATA & BACKUP ARCHIVE
          </Text>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              },
              SHADOWS.sm,
            ]}
          >
            {/* Export JSON */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleExportBackup}
            >
              <View style={styles.settingsRowLeft}>
                <View
                  style={[
                    styles.settingsIconCircle,
                    { backgroundColor: `${themeColors.primary}18` },
                  ]}
                >
                  <Ionicons
                    name="share-outline"
                    size={18}
                    color={themeColors.primary}
                  />
                </View>
                <View>
                  <Text style={[FONTS.h3, { color: themeColors.ink }]}>
                    Export Data Backup
                  </Text>
                  <Text style={[FONTS.caption, { color: themeColors.inkSoft }]}>
                    Save all trips and moments as a portable JSON archive
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.inkFaint}
              />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* Dark Theme Toggle */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={toggleTheme}
            >
              <View style={styles.settingsRowLeft}>
                <View
                  style={[
                    styles.settingsIconCircle,
                    { backgroundColor: "rgba(0,0,0,0.05)" },
                  ]}
                >
                  <Ionicons
                    name={isDark ? "sunny" : "moon"}
                    size={18}
                    color={themeColors.ink}
                  />
                </View>
                <View>
                  <Text style={[FONTS.h3, { color: themeColors.ink }]}>
                    Theme: {isDark ? "Dark Emerald" : "Light Paper"}
                  </Text>
                  <Text style={[FONTS.caption, { color: themeColors.inkSoft }]}>
                    Switch between night and day color modes
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.inkFaint}
              />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            {/* Reset Data */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleResetData}
            >
              <View style={styles.settingsRowLeft}>
                <View
                  style={[
                    styles.settingsIconCircle,
                    { backgroundColor: "rgba(239,68,68,0.12)" },
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[FONTS.h3, { color: "#EF4444" }]}>
                    Reset All Data
                  </Text>
                  <Text style={[FONTS.caption, { color: themeColors.inkSoft }]}>
                    Restore sample trips and initial passport state
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.inkFaint}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "FrauncesBold",
    marginTop: 2,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  passportCard: {
    borderRadius: 26,
    padding: 22,
    marginTop: 8,
  },
  passportTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  crestCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  passportTitles: {
    gap: 2,
  },
  passportBookletText: {
    color: "#F59E0B",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 10,
    letterSpacing: 2,
  },
  passportHolderName: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 22,
  },
  passportDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 18,
  },
  totalsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalBlock: {
    alignItems: "center",
  },
  totalNumber: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 24,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.65)",
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 3,
  },
  section: {
    marginTop: 26,
  },
  stampsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stampCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  stampSeal: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    gap: 2,
  },
  stampSealText: {
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 8,
    letterSpacing: 0.5,
  },
  stampTitle: {
    fontSize: 14,
    fontFamily: "FrauncesSemiBold",
    textAlign: "center",
  },
  placesChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  placeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  settingsCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 4,
  },
});

export default PassportScreen;
