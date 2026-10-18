import React, { useMemo, useState } from "react";
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
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import GlassCard from "../components/GlassCard";
import { Ionicons } from "../components/Icon";
import DiaryEntryCard from "../components/DiaryEntryCard";
import DiaryEditorModal from "../components/DiaryEditorModal";
import WhatsAppShareModal from "../components/WhatsAppShareModal";

const { width } = Dimensions.get("window");

const TripJournalScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const { themeColors, isDark } = useTheme();
  const {
    trips,
    activeTrip,
    setActiveTrip,
    moments,
    diaryEntries,
    getDiaryEntryForDay,
    saveDiaryEntry,
    deleteDiaryEntry,
    toggleFavoriteMoment,
    updateTrip,
  } = useTrips();

  const [editorVisible, setEditorVisible] = useState(false);
  const [activeEditorTarget, setActiveEditorTarget] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const currentTrip = useMemo(() => {
    if (tripId) {
      return trips.find((t) => t.id === tripId) || activeTrip || trips[0];
    }
    return activeTrip || trips[0];
  }, [tripId, activeTrip, trips]);

  const primaryTint = currentTrip?.themeColor || themeColors.primary;

  // Group moments and diary entries by day (date key: YYYY-MM-DD)
  const groupedDays = useMemo(() => {
    if (!currentTrip) return [];

    const tripMoments = moments
      .filter((m) => m.tripId === currentTrip.id)
      .sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

    const dayMap = {};

    tripMoments.forEach((moment) => {
      const dateKey = new Date(moment.takenAt).toISOString().split("T")[0];
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateKey,
          dateObj: new Date(moment.takenAt),
          city: moment.city || currentTrip.city || "Destination",
          weather: moment.weather || { temp: 26, condition: "Sunny", icon: "sunny" },
          moments: [],
        };
      }
      dayMap[dateKey].moments.push(moment);
    });

    // Also include any day with a diary entry for this trip
    if (diaryEntries) {
      const tripDiaries = diaryEntries.filter(
        (d) => d.tripId === currentTrip.id && !d.deletedAt
      );
      tripDiaries.forEach((diary) => {
        if (!dayMap[diary.dateKey]) {
          dayMap[diary.dateKey] = {
            dateKey: diary.dateKey,
            dateObj: new Date(diary.dateKey),
            city: currentTrip.city || "Destination",
            weather: { temp: 26, condition: "Sunny", icon: "sunny" },
            moments: [],
          };
        }
      });
    }

    return Object.values(dayMap).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );
  }, [currentTrip, moments, diaryEntries]);

  // Handle direct navigation to write today's diary
  React.useEffect(() => {
    if (route.params?.openDiaryForToday && groupedDays.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const matchDay =
        groupedDays.find((d) => d.dateKey === todayStr) ||
        groupedDays[groupedDays.length - 1];
      if (matchDay) {
        const existing = getDiaryEntryForDay(currentTrip?.id, matchDay.dateKey);
        const dayIdx = groupedDays.findIndex(
          (d) => d.dateKey === matchDay.dateKey
        );
        setActiveEditorTarget({
          dayIndex: dayIdx >= 0 ? dayIdx : 0,
          dateKey: matchDay.dateKey,
          dateObj: matchDay.dateObj,
          city: matchDay.city,
          weather: matchDay.weather,
          moments: matchDay.moments,
          existingEntry: existing,
          initialPrompt: null,
        });
        setEditorVisible(true);
      }
    }
  }, [route.params?.openDiaryForToday, groupedDays]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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

          <View style={{ marginLeft: 10 }}>
            <Text
              style={[
                FONTS.ticketStamp,
                { color: primaryTint },
              ]}
            >
              DAY-BY-DAY JOURNAL
            </Text>
            <Text
              style={[
                FONTS.h2,
                styles.tripTitleText,
                { color: themeColors.ink },
              ]}
              numberOfLines={1}
            >
              {currentTrip?.title || "My Trip"}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.shareIconBtn,
              {
                backgroundColor: isDark ? "#0A2618" : "#E8F8F0",
                borderColor: "#25D36640",
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShareModalVisible(true);
            }}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: primaryTint }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("Capture", { tripId: currentTrip?.id });
            }}
          >
            <Ionicons name="camera" size={17} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Capture</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedDays.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: `${primaryTint}18` },
              ]}
            >
              <Ionicons name="camera-outline" size={36} color={primaryTint} />
            </View>
            <Text
              style={[
                FONTS.h2,
                styles.emptyTitle,
                { color: themeColors.ink },
              ]}
            >
              No moments yet
            </Text>
            <Text
              style={[
                FONTS.body,
                styles.emptyDesc,
                { color: themeColors.inkSoft },
              ]}
            >
              Start capturing your trip moments. Your photos, time, place, and
              weather will automatically shape this day-by-day story.
            </Text>
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: primaryTint }]}
              onPress={() =>
                navigation.navigate("Capture", { tripId: currentTrip?.id })
              }
            >
              <Text style={styles.emptyAddBtnText}>Capture First Moment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedDays.map((day, dayIndex) => {
            const formattedDate = day.dateObj.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <View key={day.dateKey} style={styles.daySection}>
                {/* Day Sticky Frosted Header */}
                <View
                  style={[
                    styles.dayHeaderCard,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(0,0,0,0.06)",
                    },
                    SHADOWS.sm,
                  ]}
                >
                  <View style={styles.dayHeaderLeft}>
                    <View
                      style={[
                        styles.dayBadge,
                        { backgroundColor: `${primaryTint}20` },
                      ]}
                    >
                      <Text
                        style={[
                          FONTS.ticketStamp,
                          { color: primaryTint, fontSize: 10 },
                        ]}
                      >
                        DAY {String(dayIndex + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    <View style={{ marginLeft: 8 }}>
                      <Text
                        style={[
                          FONTS.ticketStamp,
                          { color: themeColors.ink, fontSize: 13 },
                        ]}
                      >
                        {formattedDate.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          FONTS.caption,
                          { color: themeColors.inkSoft, marginTop: 1 },
                        ]}
                      >
                        {day.city}
                      </Text>
                    </View>
                  </View>

                  {/* Weather Tag */}
                  {day.weather && (
                    <View
                      style={[
                        styles.weatherBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={day.weather.icon || "sunny"}
                        size={15}
                        color={primaryTint}
                      />
                      <Text
                        style={[
                          FONTS.monoBold,
                          styles.weatherText,
                          { color: themeColors.ink },
                        ]}
                      >
                        {day.weather.temp}°C
                      </Text>
                    </View>
                  )}
                </View>

                {/* Day's Diary Entry Card (Top of day timeline above moments) */}
                <DiaryEntryCard
                  entry={getDiaryEntryForDay(currentTrip?.id, day.dateKey)}
                  dayIndex={dayIndex}
                  dateKey={day.dateKey}
                  dateObj={day.dateObj}
                  city={day.city}
                  weather={day.weather}
                  moments={day.moments}
                  primaryTint={primaryTint}
                  onWritePress={(starterPrompt) => {
                    setActiveEditorTarget({
                      dayIndex,
                      dateKey: day.dateKey,
                      dateObj: day.dateObj,
                      city: day.city,
                      weather: day.weather,
                      moments: day.moments,
                      existingEntry: null,
                      initialPrompt:
                        typeof starterPrompt === "string" ? starterPrompt : null,
                    });
                    setEditorVisible(true);
                  }}
                  onEditPress={(existing) => {
                    setActiveEditorTarget({
                      dayIndex,
                      dateKey: day.dateKey,
                      dateObj: day.dateObj,
                      city: day.city,
                      weather: day.weather,
                      moments: day.moments,
                      existingEntry: existing,
                      initialPrompt: null,
                    });
                    setEditorVisible(true);
                  }}
                />

                {/* Moments under this Day */}
                <View style={styles.momentsList}>
                  {day.moments.map((moment, mIndex) => {
                    const isHero = mIndex === 0;
                    const timeString = new Date(
                      moment.takenAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TouchableOpacity
                        key={moment.id}
                        activeOpacity={0.92}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate("MomentDetail", { moment });
                        }}
                        style={[
                          styles.momentCard,
                          isHero && styles.heroMomentCard,
                          {
                            backgroundColor: themeColors.surface,
                            borderColor: isDark
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.05)",
                          },
                          SHADOWS.md,
                        ]}
                      >
                        {/* Photo Container */}
                        <View
                          style={[
                            styles.momentImageWrapper,
                            isHero
                              ? styles.heroImageWrapper
                              : styles.standardImageWrapper,
                          ]}
                        >
                          <Image
                            source={{ uri: moment.mediaUri }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={200}
                          />
                          <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.60)"]}
                            style={StyleSheet.absoluteFill}
                          />

                          {/* Floating Stamps */}
                          <View style={styles.momentStampsRow}>
                            <View style={styles.timeTag}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color="#FFFFFF"
                              />
                              <Text style={styles.timeTagText}>
                                {timeString}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                toggleFavoriteMoment(moment.id);
                              }}
                              style={styles.favBtn}
                            >
                              <Ionicons
                                name={moment.isFavorite ? "heart" : "heart-outline"}
                                size={17}
                                color={moment.isFavorite ? "#EF4444" : "#FFFFFF"}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* Location Pin Bottom Left on Photo */}
                          <View style={styles.momentPhotoBottom}>
                            <View style={styles.placeBadge}>
                              <Ionicons
                                name="pin-outline"
                                size={12}
                                color="#FFFFFF"
                              />
                              <Text
                                style={styles.placeBadgeText}
                                numberOfLines={1}
                              >
                                {moment.placeName || moment.city}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Caption & Details */}
                        <View style={styles.momentContent}>
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
                                styles.momentCaption,
                                { color: themeColors.inkSoft },
                              ]}
                              numberOfLines={3}
                            >
                              {moment.text}
                            </Text>
                          ) : null}

                          {/* Tags */}
                          {moment.tags && moment.tags.length > 0 && (
                            <View style={styles.tagsRow}>
                              {moment.tags.map((tag, tIdx) => (
                                <View
                                  key={tIdx}
                                  style={[
                                    styles.tagChip,
                                    {
                                      backgroundColor: isDark
                                        ? "rgba(255,255,255,0.08)"
                                        : `${primaryTint}12`,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      FONTS.captionBold,
                                      { color: primaryTint, fontSize: 10 },
                                    ]}
                                  >
                                    #{tag}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Diary Editor Modal */}
      {activeEditorTarget && (
        <DiaryEditorModal
          visible={editorVisible}
          onClose={() => {
            setEditorVisible(false);
            setActiveEditorTarget(null);
          }}
          tripId={currentTrip?.id}
          dayIndex={activeEditorTarget.dayIndex}
          dateKey={activeEditorTarget.dateKey}
          dateObj={activeEditorTarget.dateObj}
          city={activeEditorTarget.city}
          weather={activeEditorTarget.weather}
          moments={activeEditorTarget.moments}
          existingEntry={activeEditorTarget.existingEntry}
          initialPrompt={activeEditorTarget.initialPrompt}
          onSave={async (entryData) => {
            await saveDiaryEntry(entryData);
          }}
          onDelete={async (entryId) => {
            await deleteDiaryEntry(entryId);
          }}
          primaryTint={primaryTint}
        />
      )}

      {/* WhatsApp Share Modal */}
      <WhatsAppShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        trip={currentTrip}
        moments={moments.filter((m) => m.tripId === currentTrip?.id)}
        onUpdatePrivacy={(newPrivacy) => {
          updateTrip && updateTrip(currentTrip.id, { privacy: newPrivacy });
        }}
        onOpenWebViewer={(targetTrip) => {
          navigation.navigate("PublicTripViewer", {
            tripId: targetTrip.id,
            trip: targetTrip,
          });
        }}
      />
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shareIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  tripTitleText: {
    fontSize: 20,
    fontFamily: "FrauncesBold",
    maxWidth: width * 0.52,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "FrauncesBold",
    marginBottom: 8,
  },
  emptyDesc: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyAddBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 14,
  },
  daySection: {
    marginBottom: 28,
  },
  dayHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  dayHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weatherBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  weatherText: {
    fontSize: 12,
  },
  momentsList: {
    gap: 16,
  },
  momentCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroMomentCard: {},
  momentImageWrapper: {
    width: "100%",
    justifyContent: "space-between",
    padding: 12,
  },
  heroImageWrapper: {
    height: 240,
  },
  standardImageWrapper: {
    height: 180,
  },
  momentStampsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  timeTagText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMono",
    fontSize: 11,
  },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  momentPhotoBottom: {
    flexDirection: "row",
  },
  placeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    maxWidth: "85%",
  },
  placeBadgeText: {
    color: "#FFFFFF",
    fontFamily: "InterMedium",
    fontSize: 11,
  },
  momentContent: {
    padding: 16,
    gap: 6,
  },
  momentTitle: {
    fontSize: 17,
    fontFamily: "FrauncesSemiBold",
  },
  momentCaption: {
    fontSize: 13,
    lineHeight: 19,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});

export default TripJournalScreen;
