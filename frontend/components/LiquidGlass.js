

import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

const LiquidGlass = ({
  children,
  style,
  contentStyle,
  radius = 24,
  intensity = 62,
  tintColor,
  prominent = false,
  neutral = false,
}) => {
  const { isDark, themeColors } = useTheme();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(
      setReduceTransparency,
    );
    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );
    return () => subscription?.remove?.();
  }, []);

  const fallback = prominent
    ? tintColor || themeColors.primary
    : neutral
      ? isDark
        ? "rgba(24,27,26,0.66)"
        : "rgba(255,255,255,0.08)"
      : isDark
        ? "rgba(18,31,25,0.58)"
        : "rgba(247,252,249,0.42)";

  return (
    <View
      style={[
        styles.root,
        {
          borderRadius: radius,
          borderColor: isDark
            ? "rgba(255,255,255,0.20)"
            : neutral
              ? "rgba(255,255,255,0.78)"
              : "rgba(19,139,96,0.18)",
          shadowColor: isDark ? "#000" : themeColors.ink,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, overflow: "hidden" },
        ]}
      >
        {!reduceTransparency && !prominent ? (
          <BlurView
            intensity={intensity}
            tint={isDark ? "dark" : "light"}
            blurReductionFactor={
              Platform.OS === "android" ? (neutral ? 1.5 : 2) : undefined
            }
            experimentalBlurMethod={
              Platform.OS === "android" ? "dimezisBlurView" : undefined
            }
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: fallback },
          ]}
        />
        <LinearGradient
          colors={
            prominent
              ? [
                  "rgba(255,255,255,0.24)",
                  "rgba(255,255,255,0.04)",
                  "rgba(0,0,0,0.08)",
                ]
              : isDark
                ? [
                    "rgba(255,255,255,0.12)",
                    "rgba(255,255,255,0.03)",
                    "rgba(0,0,0,0.10)",
                  ]
                : neutral
                  ? [
                      "rgba(255,255,255,0.28)",
                      "rgba(255,255,255,0.05)",
                      "rgba(210,217,213,0.12)",
                    ]
                : [
                    "rgba(255,255,255,0.74)",
                    "rgba(221,245,235,0.40)",
                    "rgba(255,255,255,0.18)",
                  ]
          }
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.specular,
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
            },
          ]}
        />
        <View
          style={[
            styles.innerRim,
            {
              borderRadius: Math.max(radius - 2, 0),
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : neutral
                  ? "rgba(255,255,255,0.88)"
                  : "rgba(255,255,255,0.68)",
            },
          ]}
        />
      </View>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 9,
  },
  content: {
    flex: 1,
  },
  specular: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
    borderWidth: 1,
  },
});

export default LiquidGlass;
