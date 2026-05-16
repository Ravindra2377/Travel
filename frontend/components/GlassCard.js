import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { COLORS, RADIUS, SHADOWS } from "../config/theme";

/**
 * GlassCard — Premium card with frosted-glass aesthetic.
 *
 * On Android, BlurView is extremely expensive inside scrolling lists
 * (each card spins up a separate blur pass on the GPU).  We use a
 * lightweight semi-transparent overlay that looks nearly identical
 * but scrolls at 60 fps.
 *
 * Props:
 *   - style        : extra wrapper styles
 *   - accentColor  : optional left accent bar colour
 *   - noPad        : if true, removes inner padding
 */
const GlassCard = ({
  children,
  style,
  accentColor,
  noPad = false,
}) => {
  return (
    <View style={[styles.wrapper, SHADOWS.sm, style]}>
      {/* Frosted-glass surface — lightweight overlay instead of BlurView */}
      <View style={[styles.glassSurface, StyleSheet.absoluteFill]} />
      <View style={[styles.glassBorder, StyleSheet.absoluteFill]} />
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
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  glassSurface: {
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
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
