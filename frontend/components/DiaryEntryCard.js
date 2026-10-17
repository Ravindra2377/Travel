import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "./Icon";
import { DIARY_MOODS, DIARY_STARTER_PROMPTS } from "../services/tripStorage";

export const DiaryEntryCard = ({
  entry,
  dayIndex = 0,
  dateKey,
  dateObj,
  city,
  weather,
  moments = [],
  primaryTint,
  onWritePress,
  onEditPress,
}) => {
  const { themeColors, isDark } = useTheme();

  const currentMood = DIARY_MOODS.find((m) => m.id === entry?.mood) || DIARY_MOODS[0];

  // Linked moments images
  const linkedMoments = React.useMemo(() => {
    if (!entry || !entry.linkedMomentIds || entry.linkedMomentIds.length === 0) {
      return [];
    }
    return moments.filter((m) => entry.linkedMomentIds.includes(m.id));
  }, [entry, moments]);

  // If an entry exists for this day, render the rich daily entry card
  if (entry && entry.text) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.surface,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(0, 0, 0, 0.06)",
          },
          SHADOWS.sm,
        ]}
      >
        {/* Header strip */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <View
              style={[
                styles.diaryStampBadge,
                { backgroundColor: `${primaryTint || themeColors.primary}18` },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={12}
                color={primaryTint || themeColors.primary}
              />
              <Text
                style={[
                  FONTS.ticketStamp,
                  styles.stampText,
                  { color: primaryTint || themeColors.primary },
                ]}
              >
                DAY'S DIARY
              </Text>
            </View>

            {/* Mood chip */}
            <View
              style={[
                styles.moodChip,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : `${currentMood.color}15`,
                  borderColor: `${currentMood.color}40`,
                },
              ]}
            >
              <Text style={styles.moodEmoji}>{currentMood.emoji}</Text>
              <Text
                style={[
                  FONTS.captionBold,
                  styles.moodLabel,
                  { color: isDark ? "#FFFFFF" : currentMood.color },
                ]}
              >
                {currentMood.label}
              </Text>
            </View>
          </View>

          <View style={styles.topRight}>
            {/* Private lock badge */}
            <View
              style={[
                styles.privacyBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <Ionicons
                name={entry.isPrivate ? "lock-closed" : "globe-outline"}
                size={11}
                color={entry.isPrivate ? themeColors.inkSoft : primaryTint}
              />
              <Text
                style={[
                  FONTS.mono,
                  styles.privacyText,
                  { color: themeColors.inkSoft },
                ]}
              >
                {entry.isPrivate ? "Private" : "Public"}
              </Text>
            </View>

            {/* Edit button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEditPress && onEditPress(entry);
              }}
              style={[
                styles.editBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={13} color={themeColors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Skeleton Day Facts strip */}
        {entry.factsSkeleton ? (
          <View
            style={[
              styles.factsBanner,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.025)",
                borderColor: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={12}
              color={primaryTint || themeColors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                FONTS.mono,
                styles.factsText,
                { color: themeColors.inkSoft },
              ]}
              numberOfLines={2}
            >
              {entry.factsSkeleton}
            </Text>
          </View>
        ) : null}

        {/* Diary Narrative text */}
        <Text
          style={[
            FONTS.uiBody,
            styles.entryText,
            { color: themeColors.ink },
          ]}
        >
          {entry.text}
        </Text>

        {/* Linked Moments Photo Row */}
        {linkedMoments.length > 0 && (
          <View style={styles.linkedRow}>
            <View style={styles.linkedHeaderRow}>
              <Ionicons
                name="images-outline"
                size={12}
                color={themeColors.inkSoft}
              />
              <Text
                style={[
                  FONTS.ticketStamp,
                  styles.linkedTitle,
                  { color: themeColors.inkSoft },
                ]}
              >
                LINKED MOMENTS ({linkedMoments.length})
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.linkedPhotosScroll}
            >
              {linkedMoments.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.linkedPhotoWrapper,
                    {
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)",
                    },
                  ]}
                >
                  <Image
                    source={{ uri: m.mediaUri }}
                    style={styles.linkedPhoto}
                    contentFit="cover"
                    transition={200}
                  />
                  {m.title ? (
                    <View style={styles.linkedPhotoCaption}>
                      <Text
                        style={styles.linkedPhotoCaptionText}
                        numberOfLines={1}
                      >
                        {m.title}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // If no entry exists yet, render an inviting dashed card with starter prompts
  return (
    <View
      style={[
        styles.unwrittenCard,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.015)",
          borderColor: isDark
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.10)",
        },
      ]}
    >
      <View style={styles.unwrittenHeader}>
        <View style={styles.unwrittenLeft}>
          <View
            style={[
              styles.unwrittenIconBox,
              { backgroundColor: `${primaryTint || themeColors.primary}18` },
            ]}
          >
            <Ionicons
              name="book"
              size={16}
              color={primaryTint || themeColors.primary}
            />
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={[
                FONTS.ticketStamp,
                { color: primaryTint || themeColors.primary, fontSize: 10 },
              ]}
            >
              DAY {String(dayIndex + 1).padStart(2, "0")} DIARY
            </Text>
            <Text
              style={[
                FONTS.h3,
                styles.unwrittenTitle,
                { color: themeColors.ink },
              ]}
            >
              Write today's story
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onWritePress && onWritePress(null);
          }}
          style={[
            styles.writeActionBtn,
            { backgroundColor: primaryTint || themeColors.primary },
          ]}
        >
          <Ionicons name="add" size={15} color="#FFFFFF" />
          <Text style={styles.writeActionBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      <Text
        style={[
          FONTS.caption,
          styles.unwrittenDesc,
          { color: themeColors.inkSoft },
        ]}
      >
        Drop in your reflections around today's {moments.length} photo
        {moments.length === 1 ? "" : "s"} and route.
      </Text>

      {/* Starter Prompts Pills */}
      <View style={styles.quickPromptsRow}>
        {DIARY_STARTER_PROMPTS.slice(0, 3).map((prompt, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onWritePress && onWritePress(prompt);
            }}
            style={[
              styles.quickPromptChip,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.03)",
                borderColor: isDark
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <Text
              style={[
                FONTS.captionBold,
                styles.quickPromptText,
                { color: themeColors.ink },
              ]}
              numberOfLines={1}
            >
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  diaryStampBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  stampText: {
    fontSize: 10,
    marginLeft: 4,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  moodLabel: {
    fontSize: 11,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  privacyText: {
    fontSize: 10,
    marginLeft: 4,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  factsBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  factsText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  entryText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkedRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  linkedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  linkedTitle: {
    fontSize: 9,
    marginLeft: 4,
  },
  linkedPhotosScroll: {
    paddingVertical: 2,
  },
  linkedPhotoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  linkedPhoto: {
    width: "100%",
    height: "100%",
  },
  linkedPhotoCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  linkedPhotoCaptionText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "InterMedium",
  },
  // Unwritten State
  unwrittenCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  unwrittenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unwrittenLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  unwrittenIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  unwrittenTitle: {
    fontSize: 15,
    marginTop: 1,
  },
  writeActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  writeActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "InterSemiBold",
    marginLeft: 3,
  },
  unwrittenDesc: {
    marginTop: 8,
    marginBottom: 10,
    lineHeight: 16,
  },
  quickPromptsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickPromptChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    maxWidth: "100%",
  },
  quickPromptText: {
    fontSize: 11,
  },
});

export default DiaryEntryCard;
