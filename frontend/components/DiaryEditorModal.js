import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "./Icon";
import {
  DIARY_MOODS,
  DIARY_STARTER_PROMPTS,
  calculateDistanceKm,
} from "../services/tripStorage";

export const DiaryEditorModal = ({
  visible,
  onClose,
  tripId,
  dayIndex = 0,
  dateKey,
  dateObj,
  city = "Destination",
  weather,
  moments = [],
  existingEntry = null,
  initialPrompt = null,
  onSave,
  onDelete,
  primaryTint = "#16845B",
}) => {
  const { themeColors, isDark } = useTheme();

  const [text, setText] = useState("");
  const [mood, setMood] = useState("adventurous");
  const [linkedMomentIds, setLinkedMomentIds] = useState([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  // Compute day facts automatically
  const dayFactsSkeleton = useMemo(() => {
    const places = Array.from(
      new Set(moments.map((m) => m.placeName || m.city).filter(Boolean))
    );
    const placeSummary =
      places.length > 0 ? places.slice(0, 2).join(" & ") : city;

    let dist = 0;
    for (let i = 1; i < moments.length; i++) {
      if (moments[i - 1].latitude && moments[i].latitude) {
        dist += calculateDistanceKm(
          moments[i - 1].latitude,
          moments[i - 1].longitude,
          moments[i].latitude,
          moments[i].longitude
        );
      }
    }
    const distText = dist > 0 ? ` · 🚶 ~${dist.toFixed(1)} km` : "";
    const weatherText = weather?.temp
      ? ` · 🌤️ ${weather.temp}°C ${weather.condition || ""}`
      : "";
    const momentsCount = `${moments.length} moment${
      moments.length === 1 ? "" : "s"
    }`;

    return `📍 ${placeSummary}${weatherText} · 📸 ${momentsCount}${distText}`;
  }, [moments, city, weather]);

  // Sync state whenever modal opens or entry changes
  useEffect(() => {
    if (visible) {
      if (existingEntry) {
        setText(existingEntry.text || "");
        setMood(existingEntry.mood || "adventurous");
        setLinkedMomentIds(existingEntry.linkedMomentIds || []);
        setIsPrivate(
          existingEntry.isPrivate !== undefined ? existingEntry.isPrivate : true
        );
      } else {
        // New entry: if initialPrompt passed, pre-fill it
        setText(initialPrompt ? `${initialPrompt} ` : "");
        setMood("adventurous");
        // Link all moments from that day by default
        setLinkedMomentIds(moments.map((m) => m.id));
        setIsPrivate(true);
      }
    }
  }, [visible, existingEntry, initialPrompt, moments]);

  const handleInsertFacts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!text.includes(dayFactsSkeleton)) {
      setText((prev) =>
        prev.trim() ? `${dayFactsSkeleton}\n\n${prev}` : `${dayFactsSkeleton}\n\n`
      );
    }
  };

  const handleAddPrompt = (prompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${prompt} ` : `${prompt} `;
    });
  };

  const toggleMomentLink = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLinkedMomentIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert("Empty Entry", "Please write a few thoughts about your day.");
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await onSave({
        id: existingEntry?.id,
        tripId,
        dateKey,
        text: text.trim(),
        mood,
        linkedMomentIds,
        isPrivate,
        factsSkeleton: dayFactsSkeleton,
        tags: existingEntry?.tags || [],
      });

      onClose();
    } catch (e) {
      Alert.alert("Error", "Could not save diary entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this diary entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (existingEntry?.id && onDelete) {
              await onDelete(existingEntry.id);
            }
            onClose();
          },
        },
      ]
    );
  };

  const formattedDate = dateObj
    ? dateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : dateKey;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalRoot, { backgroundColor: themeColors.paper }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top Navbar */}
        <View
          style={[
            styles.navbar,
            {
              backgroundColor: themeColors.surface,
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[FONTS.body, { color: themeColors.inkSoft }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text
              style={[
                FONTS.ticketStamp,
                { color: primaryTint, fontSize: 10 },
              ]}
            >
              DAY {String(dayIndex + 1).padStart(2, "0")} · {formattedDate.toUpperCase()}
            </Text>
            <Text
              style={[
                FONTS.h3,
                styles.navTitle,
                { color: themeColors.ink },
              ]}
            >
              {existingEntry ? "Edit Daily Entry" : "Daily Diary"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: primaryTint },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Skeleton Day Facts card */}
          <View
            style={[
              styles.factsCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              },
              SHADOWS.sm,
            ]}
          >
            <View style={styles.factsHeader}>
              <View style={styles.factsTitleRow}>
                <Ionicons name="sparkles" size={14} color={primaryTint} />
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.factsHeaderTitle,
                    { color: themeColors.ink },
                  ]}
                >
                  Day's Facts (No AI)
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleInsertFacts}
                style={[
                  styles.insertFactsBtn,
                  { backgroundColor: `${primaryTint}18` },
                ]}
              >
                <Ionicons name="document-text" size={13} color={primaryTint} />
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.insertFactsBtnText,
                    { color: primaryTint },
                  ]}
                >
                  Insert Facts
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                FONTS.mono,
                styles.factsBodyText,
                { color: themeColors.inkSoft },
              ]}
            >
              {dayFactsSkeleton}
            </Text>
          </View>

          {/* Mood Selector Section */}
          <View style={styles.section}>
            <Text
              style={[
                FONTS.ticketStamp,
                styles.sectionLabel,
                { color: themeColors.inkSoft },
              ]}
            >
              HOW DID TODAY FEEL? · MOOD
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodScroll}
            >
              {DIARY_MOODS.map((m) => {
                const isSelected = mood === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMood(m.id);
                    }}
                    style={[
                      styles.moodOption,
                      {
                        backgroundColor: isSelected
                          ? `${m.color}20`
                          : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.03)",
                        borderColor: isSelected
                          ? m.color
                          : isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                    <Text
                      style={[
                        FONTS.captionBold,
                        styles.moodOptionLabel,
                        {
                          color: isSelected
                            ? m.color
                            : isDark
                            ? "#FFFFFF"
                            : themeColors.ink,
                        },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Fixed Starter Prompts */}
          <View style={styles.section}>
            <Text
              style={[
                FONTS.ticketStamp,
                styles.sectionLabel,
                { color: themeColors.inkSoft },
              ]}
            >
              NEED INSPIRATION? · TAP A PROMPT
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptsScroll}
            >
              {DIARY_STARTER_PROMPTS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleAddPrompt(p)}
                  style={[
                    styles.promptChip,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.03)",
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      FONTS.caption,
                      styles.promptChipText,
                      { color: themeColors.ink },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Diary Editor Text Input */}
          <View style={styles.section}>
            <Text
              style={[
                FONTS.ticketStamp,
                styles.sectionLabel,
                { color: themeColors.inkSoft },
              ]}
            >
              YOUR WORDS & REFLECTIONS
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                },
                SHADOWS.sm,
              ]}
            >
              <TextInput
                style={[
                  styles.textArea,
                  FONTS.uiBody,
                  { color: themeColors.ink },
                ]}
                placeholder="What happened today? How did this place make you feel? Describe the light, scents, tastes, or conversations..."
                placeholderTextColor={
                  isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"
                }
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
              />
            </View>
          </View>

          {/* Linked Moments Photo Picker */}
          {moments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    FONTS.ticketStamp,
                    styles.sectionLabel,
                    { color: themeColors.inkSoft },
                  ]}
                >
                  LINKED PHOTOS FROM TODAY ({linkedMomentIds.length}/{moments.length})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.momentsPickerScroll}
              >
                {moments.map((m) => {
                  const isLinked = linkedMomentIds.includes(m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.85}
                      onPress={() => toggleMomentLink(m.id)}
                      style={[
                        styles.momentThumbCard,
                        {
                          borderColor: isLinked
                            ? primaryTint
                            : isDark
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.08)",
                          borderWidth: isLinked ? 2 : 1,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: m.mediaUri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                      />
                      <View
                        style={[
                          styles.checkBadge,
                          {
                            backgroundColor: isLinked
                              ? primaryTint
                              : "rgba(0,0,0,0.45)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={isLinked ? "checkmark" : "add"}
                          size={12}
                          color="#FFFFFF"
                        />
                      </View>
                      {m.title ? (
                        <View style={styles.thumbTitleBar}>
                          <Text
                            style={styles.thumbTitleText}
                            numberOfLines={1}
                          >
                            {m.title}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Privacy Toggle Card */}
          <View
            style={[
              styles.privacyCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              },
              SHADOWS.sm,
            ]}
          >
            <View style={styles.privacyLeft}>
              <View
                style={[
                  styles.privacyIconWrap,
                  { backgroundColor: `${primaryTint}18` },
                ]}
              >
                <Ionicons
                  name={isPrivate ? "lock-closed" : "globe-outline"}
                  size={18}
                  color={primaryTint}
                />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.privacyTitle,
                    { color: themeColors.ink },
                  ]}
                >
                  Private by Default
                </Text>
                <Text
                  style={[
                    FONTS.caption,
                    styles.privacyDesc,
                    { color: themeColors.inkSoft },
                  ]}
                >
                  {isPrivate
                    ? "Kept personal. Excluded from public share cards & story reels."
                    : "Public entry. Will appear in exported share stories."}
                </Text>
              </View>
            </View>

            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: "#767577", true: primaryTint }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Delete Action if editing */}
          {existingEntry?.id && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.deleteBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(239, 68, 68, 0.12)"
                    : "#FEE2E2",
                },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete Diary Entry</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  navBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  navCenter: {
    alignItems: "center",
  },
  navTitle: {
    fontSize: 16,
    marginTop: 2,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  factsCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  factsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  factsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  factsHeaderTitle: {
    fontSize: 13,
    marginLeft: 6,
  },
  insertFactsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  insertFactsBtnText: {
    fontSize: 11,
    marginLeft: 4,
  },
  factsBodyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    marginBottom: 8,
  },
  moodScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  moodOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    marginRight: 8,
  },
  moodOptionEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  moodOptionLabel: {
    fontSize: 12,
  },
  promptsScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 12,
  },
  inputWrapper: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 14,
    minHeight: 180,
  },
  textArea: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 150,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  momentsPickerScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  momentThumbCard: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginRight: 10,
    position: "relative",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbTitleBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  thumbTitleText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "InterMedium",
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  privacyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  privacyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyTitle: {
    fontSize: 14,
  },
  privacyDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "InterSemiBold",
  },
});

export default DiaryEditorModal;
