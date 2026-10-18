import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Linking,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../config/i18n";
import { FONTS, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "./Icon";

export const WhatsAppShareModal = ({
  visible,
  onClose,
  trip,
  moments = [],
  onUpdatePrivacy,
  onOpenWebViewer,
}) => {
  const { themeColors, isDark } = useTheme();
  const { t } = useI18n();

  const [privacy, setPrivacy] = useState(trip?.privacy || "link_only");
  const [copied, setCopied] = useState(false);

  const shareSlug = trip?.shareSlug || `trip-${trip?.id || "share"}`;
  const isLocalEnv =
    typeof window !== "undefined" &&
    (window.location?.hostname === "localhost" ||
      window.location?.hostname === "127.0.0.1");
  const shareBaseUrl = isLocalEnv
    ? "http://localhost:3001"
    : "https://tripmoments.app";
  const shareUrl = `${shareBaseUrl}/share/${shareSlug}`;

  const momentsCount = moments.length;
  const primaryTint = trip?.themeColor || themeColors.primary;

  const handleSelectPrivacy = (newPrivacy) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrivacy(newPrivacy);
    onUpdatePrivacy && onUpdatePrivacy(newPrivacy);
  };

  const shareText = `🧭 Follow my journey on Trip Moments: *${trip?.title || "My Trip"}* (${trip?.city || "Travel"}, ${trip?.country || "World"})\n📸 ${momentsCount} moments captured\n\n👉 View live route & stories: ${shareUrl}`;

  const handleShareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const waUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;

    const supported = await Linking.canOpenURL(waUrl);
    if (supported) {
      await Linking.openURL(waUrl);
    } else {
      // Fallback to system Share sheet
      await Share.share({
        title: trip?.title,
        message: shareText,
        url: shareUrl,
      });
    }
  };

  const handleCopyLink = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: themeColors.surface },
            SHADOWS.lg,
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.waIconCircle,
                  { backgroundColor: "#25D366" },
                ]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text
                  style={[
                    FONTS.ticketStamp,
                    { color: primaryTint, fontSize: 10 },
                  ]}
                >
                  WHATSAPP GROWTH LOOP
                </Text>
                <Text
                  style={[
                    FONTS.h3,
                    styles.sheetTitle,
                    { color: themeColors.ink },
                  ]}
                >
                  Share Trip Link
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <Ionicons name="close" size={18} color={themeColors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* WhatsApp Open Graph Preview Box */}
            <Text
              style={[
                FONTS.ticketStamp,
                styles.sectionLabel,
                { color: themeColors.inkSoft },
              ]}
            >
              WHATSAPP LINK PREVIEW
            </Text>

            <View
              style={[
                styles.waPreviewBubble,
                {
                  backgroundColor: isDark ? "#0A1F16" : "#E7F8EE",
                  borderColor: isDark ? "#124B30" : "#C4EFD5",
                },
              ]}
            >
              {/* Simulated Chat Message */}
              <View style={styles.waChatHeader}>
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: isDark ? "#A7F3D0" : "#0D6832", fontSize: 11 },
                  ]}
                >
                  🧭 Follow my travel story live!
                </Text>
              </View>

              {/* OG Card inside WhatsApp */}
              <View
                style={[
                  styles.ogCard,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                <Image
                  source={{ uri: trip?.coverUri }}
                  style={styles.ogImage}
                  contentFit="cover"
                  transition={200}
                />

                <View style={styles.ogContent}>
                  <Text style={[FONTS.mono, styles.ogDomain]}>
                    TRIPMOMENTS.APP · VERIFIED EXPEDITION
                  </Text>
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.ogTitle,
                      { color: themeColors.ink },
                    ]}
                    numberOfLines={1}
                  >
                    {trip?.title || "My Journey"}
                  </Text>
                  <Text
                    style={[
                      FONTS.caption,
                      styles.ogDesc,
                      { color: themeColors.inkSoft },
                    ]}
                    numberOfLines={2}
                  >
                    {trip?.city ? `${trip.city}, ` : ""}
                    {trip?.country || "Earth"} · {momentsCount} moments · Tap to view day-by-day story
                  </Text>
                </View>
              </View>
            </View>

            {/* Privacy Setting Selector */}
            <Text
              style={[
                FONTS.ticketStamp,
                styles.sectionLabel,
                { color: themeColors.inkSoft, marginTop: 16 },
              ]}
            >
              WHO CAN ACCESS THIS TRIP?
            </Text>

            <View style={styles.privacyRow}>
              {[
                {
                  id: "link_only",
                  label: "Link-Only",
                  icon: "link",
                  sub: "Best for WhatsApp",
                },
                {
                  id: "followers",
                  label: "Followers",
                  icon: "people",
                  sub: "Approved friends",
                },
                {
                  id: "private",
                  label: "Private",
                  icon: "lock-closed",
                  sub: "Only you",
                },
              ].map((tier) => {
                const isSelected = privacy === tier.id;
                return (
                  <TouchableOpacity
                    key={tier.id}
                    onPress={() => handleSelectPrivacy(tier.id)}
                    style={[
                      styles.privacyChip,
                      {
                        backgroundColor: isSelected
                          ? `${primaryTint}18`
                          : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.03)",
                        borderColor: isSelected
                          ? primaryTint
                          : isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={tier.icon}
                      size={15}
                      color={isSelected ? primaryTint : themeColors.inkSoft}
                    />
                    <Text
                      style={[
                        FONTS.captionBold,
                        styles.privacyChipText,
                        {
                          color: isSelected
                            ? primaryTint
                            : themeColors.ink,
                        },
                      ]}
                    >
                      {tier.label}
                    </Text>
                    <Text
                      style={[
                        FONTS.caption,
                        styles.privacyChipSub,
                        { color: themeColors.inkSoft },
                      ]}
                    >
                      {tier.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={handleShareWhatsApp}
                activeOpacity={0.9}
                style={[styles.primaryShareBtn, { backgroundColor: "#25D366" }]}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.primaryShareBtnText}>
                  Send on WhatsApp
                </Text>
              </TouchableOpacity>

              <View style={styles.secondaryActionsRow}>
                <TouchableOpacity
                  onPress={handleCopyLink}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Ionicons
                    name={copied ? "checkmark-circle" : "copy-outline"}
                    size={16}
                    color={copied ? primaryTint : themeColors.ink}
                  />
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.secondaryActionText,
                      { color: copied ? primaryTint : themeColors.ink },
                    ]}
                  >
                    {copied ? "Link Copied!" : "Copy Link"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    if (typeof window !== "undefined" && window.open) {
                      window.open(shareUrl, "_blank");
                    } else if (onOpenWebViewer) {
                      onOpenWebViewer(trip);
                    }
                  }}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={themeColors.ink}
                  />
                  <Text
                    style={[
                      FONTS.captionBold,
                      styles.secondaryActionText,
                      { color: themeColors.ink },
                    ]}
                  >
                    Open Web View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  waIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 10,
    marginBottom: 8,
  },
  waPreviewBubble: {
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
  },
  waChatHeader: {
    marginBottom: 8,
  },
  ogCard: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  ogImage: {
    width: "100%",
    height: 120,
  },
  ogContent: {
    padding: 10,
  },
  ogDomain: {
    fontSize: 9,
    color: "#16845B",
    marginBottom: 3,
  },
  ogTitle: {
    fontSize: 13,
  },
  ogDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  privacyRow: {
    flexDirection: "row",
    gap: 8,
  },
  privacyChip: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1.5,
  },
  privacyChipText: {
    fontSize: 11,
    marginTop: 4,
  },
  privacyChipSub: {
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },
  actionsContainer: {
    marginTop: 20,
    gap: 10,
  },
  primaryShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    gap: 8,
  },
  primaryShareBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 15,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 12,
  },
});

export default WhatsAppShareModal;
