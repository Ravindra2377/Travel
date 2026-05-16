import React from "react";
import { View, StyleSheet } from "react-native";
import { RADIUS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";

/**
 * GlassCard — Premium card with frosted-glass aesthetic.
 * Now theme-aware.
 */
const GlassCard = ({
  children,
  style,
  accentColor,
  noPad = false,
}) => {
  const { themeColors, isDark } = useTheme();

  return (
    <View style={[
      styles.wrapper, 
      SHADOWS.sm, 
      { 
        backgroundColor: themeColors.surface,
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
      },
      style
    ]}>
      {/* Frosted-glass surface overlay */}
      <View style={[
        styles.glassSurface, 
        StyleSheet.absoluteFill,
        { backgroundColor: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.6)" }
      ]} />
      
      <View style={[
        styles.glassBorder, 
        StyleSheet.absoluteFill,
        { borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)" }
      ]} />

      {accentColor && (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      )}
      
      <View style={[styles.innerContainer, noPad && styles.noPad]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
  glassSurface: {
    // Background color is set dynamically based on theme
  },
  glassBorder: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  innerContainer: {
    padding: 16,
  },
  noPad: {
    padding: 0,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 10,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
});

export default React.memo(GlassCard);
