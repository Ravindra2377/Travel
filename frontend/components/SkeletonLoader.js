import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { RADIUS } from "../config/theme";
import { useReducedMotion } from "../config/motion";

/**
 * Shimmering / pulsing Skeleton Loader component.
 * Replaces jarring spinners with smooth placeholder skeletons.
 * Automatically halts animation when system reduced-motion is enabled.
 */
export const SkeletonBox = ({
  width = "100%",
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reducedMotion) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [reducedMotion]);

  const baseBg = isDark ? "#28342E" : "#E2E8E4";

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          opacity: reducedMotion ? 0.5 : pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText = ({
  width = "80%",
  height = 14,
  style,
  borderRadius = 4,
}) => {
  return (
    <SkeletonBox
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

export const SkeletonAvatar = ({ size = 44, style }) => {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

export const SkeletonTripCard = ({ style }) => {
  const { themeColors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: themeColors.surface,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
        style,
      ]}
    >
      <SkeletonBox width="100%" height={180} borderRadius={RADIUS.md} />
      <View style={styles.cardBody}>
        <SkeletonText width="40%" height={10} style={{ marginBottom: 8 }} />
        <SkeletonText width="85%" height={18} style={{ marginBottom: 6 }} />
        <SkeletonText width="60%" height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  cardBody: {
    paddingTop: 12,
  },
});

export default SkeletonBox;
