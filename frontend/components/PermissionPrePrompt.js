import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "./Icon";
import LiquidGlass from "./LiquidGlass";

const { width } = Dimensions.get("window");

export default function PermissionPrePrompt({
  visible,
  type = "location", // "location" | "camera"
  onAccept,
  onDecline,
}) {
  const { themeColors, isDark } = useTheme();

  if (!visible) return null;

  const isLocation = type === "location";

  const title = isLocation
    ? "Automatic Journey Trail"
    : "Capture & Geotag Moments";

  const subtitle = isLocation
    ? "Record your route seamlessly in your pocket without draining battery."
    : "Save high-resolution travel photos directly to your offline journal.";

  const iconName = isLocation ? "navigate-circle" : "camera-reverse";
  const iconColor = isLocation ? "#10B981" : "#F59E0B";

  const benefits = isLocation
    ? [
        {
          icon: "battery-charging-outline",
          title: "Battery Friendly",
          desc: "Smart sensor fusion sleeps when you're stationary and activates only on movement.",
        },
        {
          icon: "airplane-outline",
          title: "Works Fully Offline",
          desc: "Records your GPS waypoints even through remote mountain passes with zero cellular signal.",
        },
        {
          icon: "shield-checkmark-outline",
          title: "Private & Local First",
          desc: "Your breadcrumbs live securely on your device until you decide to publish or sync.",
        },
      ]
    : [
        {
          icon: "location-outline",
          title: "Automatic Geotagging",
          desc: "Pins each memory exactly where it happened on your 3D expedition map.",
        },
        {
          icon: "cloud-offline-outline",
          title: "Permanent Offline Storage",
          desc: "Photos are safely archived in your app vault, unaffected by gallery cleanups.",
        },
        {
          icon: "sparkles-outline",
          title: "Weather & Time Stamp",
          desc: "Captures ambient temperature and golden-hour conditions at the exact moment.",
        },
      ];

  const handleAccept = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onAccept) onAccept();
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDecline) onDecline();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#17231E" : "#FFFFFF",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            },
            SHADOWS.lg,
          ]}
        >
          {/* Header Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(16,185,129,0.10)",
              },
            ]}
          >
            <Ionicons name={iconName} size={42} color={iconColor} />
          </View>

          <Text
            style={[
              FONTS.h2,
              styles.titleText,
              { color: themeColors.ink },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              FONTS.body,
              styles.subtitleText,
              { color: themeColors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            {benefits.map((item, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View
                  style={[
                    styles.benefitIconBox,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={themeColors.primary}
                  />
                </View>
                <View style={styles.benefitTextCol}>
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
                        color: themeColors.textTertiary,
                        fontSize: 12,
                        marginTop: 2,
                        lineHeight: 16,
                      },
                    ]}
                  >
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: themeColors.primary },
              ]}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {isLocation ? "Enable Route Tracking" : "Grant Camera Access"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleDecline}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  FONTS.bodyMedium,
                  { color: themeColors.textTertiary, fontSize: 13 },
                ]}
              >
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width - 48, 420),
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titleText: {
    textAlign: "center",
    fontSize: 21,
    marginBottom: 6,
  },
  subtitleText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  benefitsList: {
    width: "100%",
    marginBottom: 24,
    gap: 14,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  benefitTextCol: {
    flex: 1,
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
    gap: 10,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "InterBold",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
