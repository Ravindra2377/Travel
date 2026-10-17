import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  Modal,
  TextInput,
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

const { width } = Dimensions.get("window");

const MomentDetailScreen = ({ route, navigation }) => {
  const { moment: initialMoment } = route.params || {};
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = useTheme();
  const { moments, toggleFavoriteMoment, deleteMoment, updateMoment, trips } = useTrips();

  // Keep moment synced from context
  const moment = moments.find((m) => m.id === initialMoment?.id) || initialMoment;

  const trip = trips.find((t) => t.id === moment?.tripId);
  const primaryTint = trip?.themeColor || themeColors.primary;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedTitle, setEditedTitle] = useState(moment?.title || "");
  const [editedText, setEditedText] = useState(moment?.text || "");

  if (!moment) return null;

  const formattedDate = new Date(moment.takenAt).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(moment.takenAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `"${moment.title}" at ${moment.placeName || moment.city} — from our trip story on Trip Moments!`,
      });
    } catch (e) {}
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Moment",
      "Are you sure you want to delete this captured moment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteMoment(moment.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateMoment(moment.id, {
      title: editedTitle.trim(),
      text: editedText.trim(),
    });
    setEditModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fullscreen Hero Photo */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: moment.mediaUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.50)",
              "transparent",
              "rgba(0,0,0,0.20)",
              "rgba(0,0,0,0.85)",
            ]}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating Top Chrome */}
          <View style={[styles.topChrome, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              style={styles.floatingGlassBtn}
            >
              <LiquidGlass radius={20} intensity={50} style={styles.iconGlass}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </LiquidGlass>
            </TouchableOpacity>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleFavoriteMoment(moment.id);
                }}
                style={styles.floatingGlassBtn}
              >
                <LiquidGlass radius={20} intensity={50} style={styles.iconGlass}>
                  <Ionicons
                    name={moment.isFavorite ? "heart" : "heart-outline"}
                    size={20}
                    color={moment.isFavorite ? "#EF4444" : "#FFFFFF"}
                  />
                </LiquidGlass>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare} style={styles.floatingGlassBtn}>
                <LiquidGlass radius={20} intensity={50} style={styles.iconGlass}>
                  <Ionicons name="share-social" size={19} color="#FFFFFF" />
                </LiquidGlass>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Bottom Overlay Stamps */}
          <View style={styles.imageBottomContent}>
            <View style={styles.ticketStampsRow}>
              <View style={styles.glassTicket}>
                <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                <Text style={styles.glassTicketText}>{formattedTime}</Text>
              </View>

              {moment.weather && (
                <View style={styles.glassTicket}>
                  <Ionicons
                    name={moment.weather.icon || "sunny"}
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.glassTicketText}>
                    {moment.weather.temp}°C
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.heroMomentTitle}>{moment.title}</Text>
          </View>
        </View>

        {/* Content Details */}
        <View style={styles.detailsContainer}>
          {/* Location & Date Badge */}
          <View
            style={[
              styles.metaCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)",
              },
              SHADOWS.sm,
            ]}
          >
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="location" size={16} color={primaryTint} />
                <Text
                  style={[
                    FONTS.monoBold,
                    { color: themeColors.ink, fontSize: 13 },
                  ]}
                >
                  {moment.placeName || moment.city}
                </Text>
              </View>
              <Text
                style={[
                  FONTS.caption,
                  { color: themeColors.inkSoft, marginLeft: 22 },
                ]}
              >
                {formattedDate} · {moment.city}, {moment.country}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.showMapBtn, { backgroundColor: `${primaryTint}18` }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Map", { tripId: moment.tripId });
              }}
            >
              <Ionicons name="map-outline" size={16} color={primaryTint} />
              <Text
                style={[
                  FONTS.captionBold,
                  { color: primaryTint, marginLeft: 4 },
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caption Chronicle */}
          {moment.text ? (
            <View style={styles.storyTextWrapper}>
              <Text style={[FONTS.ticketStamp, { color: primaryTint, marginBottom: 8 }]}>
                TRAVEL STORY
              </Text>
              <Text
                style={[
                  styles.momentStoryBody,
                  { color: themeColors.ink },
                ]}
              >
                {moment.text}
              </Text>
            </View>
          ) : null}

          {/* Tags */}
          {moment.tags && moment.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={[FONTS.ticketStamp, { color: themeColors.inkFaint, marginBottom: 8 }]}>
                TAGGED WITH
              </Text>
              <View style={styles.tagsRow}>
                {moment.tags.map((tag, idx) => (
                  <View
                    key={idx}
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
                        { color: primaryTint, fontSize: 11 },
                      ]}
                    >
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Row: Edit & Delete */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
              onPress={() => {
                setEditedTitle(moment.title);
                setEditedText(moment.text);
                setEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={themeColors.ink} />
              <Text
                style={[
                  FONTS.captionBold,
                  { color: themeColors.ink, marginLeft: 6 },
                ]}
              >
                Edit Caption
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text
                style={[
                  FONTS.captionBold,
                  { color: "#EF4444", marginLeft: 6 },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Moment Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[FONTS.h2, { color: themeColors.ink }]}>
                Edit Moment
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.ink} />
              </TouchableOpacity>
            </View>

            <Text style={[FONTS.captionBold, styles.editLabel, { color: themeColors.ink }]}>
              TITLE
            </Text>
            <TextInput
              style={[
                styles.editInput,
                {
                  color: themeColors.ink,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                },
              ]}
              value={editedTitle}
              onChangeText={setEditedTitle}
            />

            <Text style={[FONTS.captionBold, styles.editLabel, { color: themeColors.ink }]}>
              CAPTION / NOTES
            </Text>
            <TextInput
              style={[
                styles.editInput,
                {
                  height: 100,
                  textAlignVertical: "top",
                  color: themeColors.ink,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                },
              ]}
              multiline
              value={editedText}
              onChangeText={setEditedText}
            />

            <TouchableOpacity
              style={[styles.saveEditBtn, { backgroundColor: primaryTint }]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveEditBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  imageContainer: {
    height: 440,
    width: "100%",
    justifyContent: "space-between",
    position: "relative",
  },
  topChrome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topRightActions: {
    flexDirection: "row",
    gap: 10,
  },
  floatingGlassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  iconGlass: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBottomContent: {
    padding: 24,
    gap: 8,
  },
  ticketStampsRow: {
    flexDirection: "row",
    gap: 8,
  },
  glassTicket: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  glassTicketText: {
    color: "#FFFFFF",
    fontFamily: "IBMPlexMono",
    fontSize: 11,
  },
  heroMomentTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 28,
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  showMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  storyTextWrapper: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  momentStoryBody: {
    fontFamily: "Inter",
    fontSize: 15,
    lineHeight: 24,
  },
  tagsContainer: {
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  editInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter",
  },
  saveEditBtn: {
    marginTop: 24,
    marginBottom: 20,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveEditBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 15,
  },
});

export default MomentDetailScreen;
