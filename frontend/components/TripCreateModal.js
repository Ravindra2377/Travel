import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "./Icon";
import LiquidGlass from "./LiquidGlass";

const { width, height } = Dimensions.get("window");

export const PRESET_DESTINATIONS = [
  {
    title: "Leh & Nubra Valley Roadtrip",
    city: "Leh, Ladakh",
    country: "India",
    coverUri:
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1000&auto=format&fit=crop",
    notes: "High passes, prayer flags, and dramatic cold desert landscapes.",
  },
  {
    title: "Varanasi Ghats & Ganga Aarti",
    city: "Varanasi",
    country: "India",
    coverUri:
      "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000&auto=format&fit=crop",
    notes: "Ancient sunrise boat rides, temple bells, and spiritual resonance.",
  },
  {
    title: "Goa Coastal Drift",
    city: "South Goa",
    country: "India",
    coverUri:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop",
    notes: "Palm fringed bays, susegad afternoons, and seaside seafood shacks.",
  },
  {
    title: "Munnar Cloud Tea Hills",
    city: "Munnar, Kerala",
    country: "India",
    coverUri:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1000&auto=format&fit=crop",
    notes: "Rolling emerald tea carpet, mist trails, and mountain serenity.",
  },
  {
    title: "Kyoto & Nara Temple Path",
    city: "Kyoto",
    country: "Japan",
    coverUri:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
    notes: "Bamboo groves, Zen gardens, and quiet stone pathways.",
  },
  {
    title: "Amalfi Cliffside Odyssey",
    city: "Positano",
    country: "Italy",
    coverUri:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1000&auto=format&fit=crop",
    notes: "Cobblestone alleys, azure Mediterranean water, and cliffside villas.",
  },
];

export const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop", // Yosemite river
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop", // Snowy peak
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop", // Tropical beach
  "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1000&auto=format&fit=crop", // Ladakh pass
  "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000&auto=format&fit=crop", // Varanasi
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1000&auto=format&fit=crop", // Kyoto
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop", // Goa
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1000&auto=format&fit=crop", // Amalfi
];

export const PRESET_COLORS = [
  { name: "Emerald", primary: "#10B981", secondary: "#059669" },
  { name: "Turmeric", primary: "#F59E0B", secondary: "#D97706" },
  { name: "Terracotta", primary: "#E76F51", secondary: "#C85A3E" },
  { name: "Indigo", primary: "#3B82F6", secondary: "#1D4ED8" },
  { name: "Saffron", primary: "#FF6F00", secondary: "#E65100" },
  { name: "Rosewood", primary: "#8B5CF6", secondary: "#6D28D9" },
];

export default function TripCreateModal({
  visible,
  onClose,
  onCreateTrip,
}) {
  const { themeColors, isDark } = useTheme();

  const [step, setStep] = useState(1); // 1: Destination, 2: Dates & Privacy, 3: Style & Theme

  // Form State
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("active"); // "active" | "planned"
  const [privacy, setPrivacy] = useState("link_only"); // "link_only" | "private" | "public"
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleSelectPresetDestination = (dest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTitle(dest.title);
    setCity(dest.city);
    setCountry(dest.country);
    setSelectedCover(dest.coverUri);
    setNotes(dest.notes);
  };

  const handlePickCustomCover = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedCover(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Picker Error", "Could not open photo gallery.");
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert("Trip Name Required", "Please name your adventure.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleCompleteCreation = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please provide a title for your trip.");
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const colorPreset = PRESET_COLORS[selectedColorIndex];

      await onCreateTrip({
        title: title.trim(),
        city: city.trim() || "Wanderland",
        country: country.trim() || "Earth",
        startDate,
        endDate,
        status,
        privacy,
        coverUri: selectedCover,
        themeColor: colorPreset.primary,
        secondaryColor: colorPreset.secondary,
        notes: notes.trim(),
      });

      // Reset and close
      setStep(1);
      setTitle("");
      setCity("");
      setCountry("");
      setNotes("");
      onClose();
    } catch (err) {
      Alert.alert("Creation Failed", "Could not create your expedition.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeColor = PRESET_COLORS[selectedColorIndex].primary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? "#121C18" : "#FBFDFB",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          {/* Top Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              {step > 1 ? (
                <TouchableOpacity
                  onPress={handlePrevStep}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color={themeColors.ink}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                  <Ionicons name="close" size={24} color={themeColors.ink} />
                </TouchableOpacity>
              )}
              <View>
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.stepBadge,
                    { color: activeColor },
                  ]}
                >
                  STEP {step} OF 3
                </Text>
                <Text
                  style={[
                    FONTS.h2,
                    styles.headerTitle,
                    { color: themeColors.ink },
                  ]}
                >
                  {step === 1 && "Where to Next?"}
                  {step === 2 && "Dates & Privacy"}
                  {step === 3 && "Cover & Aesthetics"}
                </Text>
              </View>
            </View>

            {/* Step Indicators */}
            <View style={styles.stepDots}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        s <= step
                          ? activeColor
                          : isDark
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.10)",
                      width: s === step ? 22 : 7,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Modal Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ──────── STEP 1: DESTINATION & NAME ──────── */}
            {step === 1 && (
              <View style={styles.stepSection}>
                <Text
                  style={[
                    FONTS.caption,
                    styles.fieldLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  EXPEDITION TITLE
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.03)",
                      color: themeColors.ink,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                    },
                  ]}
                  placeholder="e.g. Spiti Valley Circuit or Coastal Roadtrip"
                  placeholderTextColor={themeColors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        FONTS.caption,
                        styles.fieldLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      CITY / REGION
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                          color: themeColors.ink,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                      placeholder="e.g. Leh or Manali"
                      placeholderTextColor={themeColors.textTertiary}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        FONTS.caption,
                        styles.fieldLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      COUNTRY
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                          color: themeColors.ink,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                      placeholder="e.g. India"
                      placeholderTextColor={themeColors.textTertiary}
                      value={country}
                      onChangeText={setCountry}
                    />
                  </View>
                </View>

                {/* Popular Inspiration Presets */}
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.sectionHeaderLabel,
                    { color: themeColors.ink },
                  ]}
                >
                  OR CHOOSE AN ICONIC ITINERARY
                </Text>

                <View style={styles.presetsGrid}>
                  {PRESET_DESTINATIONS.map((dest, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetCard,
                        {
                          borderColor:
                            title === dest.title
                              ? activeColor
                              : isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.06)",
                          borderWidth: title === dest.title ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectPresetDestination(dest)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: dest.coverUri }}
                        style={styles.presetImage}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.85)"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.presetContent}>
                        <Text style={styles.presetTitle} numberOfLines={1}>
                          {dest.title}
                        </Text>
                        <Text style={styles.presetSubtitle}>
                          {dest.city}, {dest.country}
                        </Text>
                      </View>
                      {title === dest.title && (
                        <View
                          style={[
                            styles.presetCheck,
                            { backgroundColor: activeColor },
                          ]}
                        >
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ──────── STEP 2: DATES & PRIVACY ──────── */}
            {step === 2 && (
              <View style={styles.stepSection}>
                {/* Status Toggle */}
                <Text
                  style={[
                    FONTS.caption,
                    styles.fieldLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  TRIP STATUS
                </Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      status === "active" && {
                        backgroundColor: activeColor,
                      },
                      status !== "active" && {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStatus("active");
                    }}
                  >
                    <Ionicons
                      name="navigate"
                      size={16}
                      color={status === "active" ? "#FFF" : themeColors.ink}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: status === "active" ? "#FFF" : themeColors.ink },
                      ]}
                    >
                      Currently Active (Live Tracking)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      status === "planned" && {
                        backgroundColor: activeColor,
                      },
                      status !== "planned" && {
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStatus("planned");
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={status === "planned" ? "#FFF" : themeColors.ink}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        { color: status === "planned" ? "#FFF" : themeColors.ink },
                      ]}
                    >
                      Planning Ahead
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Dates */}
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        FONTS.caption,
                        styles.fieldLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      START DATE (YYYY-MM-DD)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                          color: themeColors.ink,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={themeColors.textTertiary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        FONTS.caption,
                        styles.fieldLabel,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      END DATE (YYYY-MM-DD)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                          color: themeColors.ink,
                          borderColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={themeColors.textTertiary}
                    />
                  </View>
                </View>

                {/* Privacy Model */}
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.sectionHeaderLabel,
                    { color: themeColors.ink, marginTop: 18 },
                  ]}
                >
                  PRIVACY & TRIP ACCESS
                </Text>

                {[
                  {
                    id: "link_only",
                    icon: "link-outline",
                    title: "Secret Link Only (Recommended)",
                    desc: "Only family & friends you share your secret WhatsApp link with can view.",
                  },
                  {
                    id: "private",
                    icon: "lock-closed-outline",
                    title: "Strictly Private",
                    desc: "Stored securely on your device. Never visible to the public internet.",
                  },
                  {
                    id: "public",
                    icon: "globe-outline",
                    title: "Public Explorer",
                    desc: "Discoverable on the world map for fellow travelers seeking inspiration.",
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.privacyOptionCard,
                      {
                        backgroundColor:
                          privacy === item.id
                            ? isDark
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(16,185,129,0.08)"
                            : isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.02)",
                        borderColor:
                          privacy === item.id
                            ? activeColor
                            : isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        borderWidth: privacy === item.id ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPrivacy(item.id);
                    }}
                  >
                    <View
                      style={[
                        styles.privacyIconCircle,
                        {
                          backgroundColor:
                            privacy === item.id
                              ? activeColor
                              : isDark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.05)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={privacy === item.id ? "#FFF" : themeColors.ink}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          FONTS.bodyBold,
                          { color: themeColors.ink, fontSize: 14 },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          FONTS.caption,
                          {
                            color: themeColors.textSecondary,
                            fontSize: 12,
                            marginTop: 2,
                            lineHeight: 16,
                          },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </View>
                    {privacy === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={activeColor}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ──────── STEP 3: COVER & ACCENTS ──────── */}
            {step === 3 && (
              <View style={styles.stepSection}>
                {/* Live Card Preview */}
                <Text
                  style={[
                    FONTS.caption,
                    styles.fieldLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  LIVE EXPEDITION CARD PREVIEW
                </Text>
                <View style={[styles.previewCard, SHADOWS.md]}>
                  <Image
                    source={{ uri: selectedCover }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.previewContent}>
                    <View style={styles.previewTopRow}>
                      <View
                        style={[
                          styles.previewBadge,
                          { backgroundColor: activeColor },
                        ]}
                      >
                        <Text style={styles.previewBadgeText}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.previewPrivacyPill}>
                        <Ionicons
                          name={
                            privacy === "private"
                              ? "lock-closed"
                              : privacy === "public"
                              ? "globe"
                              : "link"
                          }
                          size={12}
                          color="#FFF"
                        />
                        <Text style={styles.previewPrivacyText}>
                          {privacy === "link_only"
                            ? "Link Only"
                            : privacy === "private"
                            ? "Private"
                            : "Public"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {title || "Expedition Title"}
                    </Text>
                    <Text style={styles.previewLocation}>
                      📍 {city || "Destination"}, {country || "Earth"}
                    </Text>
                  </View>
                </View>

                {/* Choose Custom Cover Photo */}
                <TouchableOpacity
                  style={[
                    styles.customCoverBtn,
                    {
                      borderColor: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.12)",
                    },
                  ]}
                  onPress={handlePickCustomCover}
                >
                  <Ionicons
                    name="image-outline"
                    size={18}
                    color={activeColor}
                  />
                  <Text style={[styles.customCoverBtnText, { color: activeColor }]}>
                    Upload Custom Photo From Gallery
                  </Text>
                </TouchableOpacity>

                {/* Cover Presets */}
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.sectionHeaderLabel,
                    { color: themeColors.ink, marginTop: 16 },
                  ]}
                >
                  OR SELECT A HANDCRAFTED COVER
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.coversScroll}
                >
                  {PRESET_COVERS.map((uri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.coverThumb,
                        {
                          borderColor:
                            selectedCover === uri
                              ? activeColor
                              : "transparent",
                          borderWidth: selectedCover === uri ? 2.5 : 0,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCover(uri);
                      }}
                    >
                      <Image
                        source={{ uri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Accent Color Palette */}
                <Text
                  style={[
                    FONTS.captionBold,
                    styles.sectionHeaderLabel,
                    { color: themeColors.ink, marginTop: 18 },
                  ]}
                >
                  ACCENT THEME PALETTE
                </Text>
                <View style={styles.colorPaletteRow}>
                  {PRESET_COLORS.map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedColorIndex(idx);
                      }}
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

                {/* Bio / Notes */}
                <Text
                  style={[
                    FONTS.caption,
                    styles.fieldLabel,
                    { color: themeColors.textSecondary, marginTop: 16 },
                  ]}
                >
                  EXPEDITION NOTES (OPTIONAL)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.notesInput,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.03)",
                      color: themeColors.ink,
                      borderColor: isDark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                    },
                  ]}
                  placeholder="What makes this journey special? Notes for your travelers..."
                  placeholderTextColor={themeColors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Footer */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            {step < 3 ? (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: activeColor },
                ]}
                onPress={handleNextStep}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  Continue to {step === 1 ? "Dates & Privacy" : "Cover Style"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: activeColor },
                ]}
                onPress={handleCompleteCreation}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.nextButtonText}>
                  {isSubmitting ? "Crafting Journey..." : "Launch Expedition"}
                </Text>
                <Ionicons name="sparkles" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: Math.min(height * 0.90, 760),
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 6,
  },
  stepBadge: {
    letterSpacing: 1.2,
    fontSize: 10,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 19,
  },
  stepDots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepSection: {
    gap: 12,
  },
  fieldLabel: {
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionHeaderLabel: {
    letterSpacing: 0.6,
    fontSize: 12,
    marginBottom: 4,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "InterMedium",
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  presetCard: {
    width: (width - 40 - 10) / 2,
    height: 110,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    position: "relative",
  },
  presetImage: {
    ...StyleSheet.absoluteFillObject,
  },
  presetContent: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
  },
  presetTitle: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
    fontSize: 12,
  },
  presetSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "InterMedium",
    fontSize: 10,
    marginTop: 1,
  },
  presetCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  toggleText: {
    fontFamily: "InterBold",
    fontSize: 12,
  },
  privacyOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: RADIUS.lg,
    gap: 12,
  },
  privacyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  previewCard: {
    height: 160,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    padding: 16,
  },
  previewContent: {
    zIndex: 2,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  previewBadgeText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  previewPrivacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  previewPrivacyText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  previewTitle: {
    color: "#FFFFFF",
    fontFamily: "FrauncesBold",
    fontSize: 19,
  },
  previewLocation: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "InterMedium",
    fontSize: 12,
    marginTop: 2,
  },
  customCoverBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 10,
  },
  customCoverBtnText: {
    fontFamily: "InterBold",
    fontSize: 13,
  },
  coversScroll: {
    gap: 10,
    paddingVertical: 6,
  },
  coverThumb: {
    width: 90,
    height: 65,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  colorPaletteRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontFamily: "InterBold",
    fontSize: 15,
  },
});
