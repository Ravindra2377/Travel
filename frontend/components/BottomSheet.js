import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { RADIUS, SHADOWS } from "../config/theme";
import { SPRINGS, useReducedMotion } from "../config/motion";

const { height: DEFAULT_SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Spring-driven, native gesture-controlled Bottom Sheet Component.
 * Powered by React Native Reanimated 4 & Gesture Handler on the UI thread (60/120fps).
 * Anchored to the bottom of the viewport with calibrated snap points.
 */
export const BottomSheet = ({
  children,
  snapPoints, // Array of visible heights from bottom: [peek, half, full]
  initialSnap = 1, // 0 = peek, 1 = half, 2 = full
  onSnapChange,
  showBackdrop = true,
  renderHeader,
  style,
}) => {
  const { themeColors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = windowHeight || DEFAULT_SCREEN_HEIGHT;

  const effectiveSnapPoints =
    snapPoints && snapPoints.length > 0
      ? snapPoints
      : [220, Math.round(screenHeight * 0.52), Math.round(screenHeight * 0.85)];

  const sheetMaxHeight = effectiveSnapPoints[effectiveSnapPoints.length - 1];

  const getSnapTranslateY = useCallback(
    (snapIndex) => {
      "worklet";
      const visibleH =
        effectiveSnapPoints[snapIndex] ?? effectiveSnapPoints[1];
      return Math.max(0, sheetMaxHeight - visibleH);
    },
    [effectiveSnapPoints, sheetMaxHeight]
  );

  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);
  const translateY = useSharedValue(getSnapTranslateY(initialSnap));
  const startY = useSharedValue(getSnapTranslateY(initialSnap));

  const notifySnapChange = useCallback(
    (index) => {
      setCurrentSnapIndex(index);
      if (onSnapChange) onSnapChange(index);
    },
    [onSnapChange]
  );

  const snapTo = useCallback(
    (index) => {
      const clampedIndex = Math.max(
        0,
        Math.min(effectiveSnapPoints.length - 1, index)
      );
      const targetTranslateY = getSnapTranslateY(clampedIndex);

      if (reducedMotion) {
        translateY.value = withTiming(
          targetTranslateY,
          { duration: 200 },
          () => {
            runOnJS(notifySnapChange)(clampedIndex);
          }
        );
      } else {
        translateY.value = withSpring(
          targetTranslateY,
          {
            damping: SPRINGS.snappy.damping,
            mass: SPRINGS.snappy.mass,
            stiffness: SPRINGS.snappy.stiffness,
            overshootClamping: false,
          },
          () => {
            runOnJS(notifySnapChange)(clampedIndex);
          }
        );
      }
    },
    [effectiveSnapPoints, getSnapTranslateY, reducedMotion, translateY, notifySnapChange]
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextY = startY.value + event.translationY;
      const minY = getSnapTranslateY(effectiveSnapPoints.length - 1);
      const maxY = getSnapTranslateY(0);
      translateY.value = Math.max(minY - 20, Math.min(maxY + 30, nextY));
    })
    .onEnd((event) => {
      const currentY = translateY.value;
      const velocity = event.velocityY;
      let targetIndex = currentSnapIndex;

      if (velocity < -400) {
        // Fast fling upwards -> expand
        targetIndex = Math.min(effectiveSnapPoints.length - 1, targetIndex + 1);
      } else if (velocity > 400) {
        // Fast fling downwards -> collapse
        targetIndex = Math.max(0, targetIndex - 1);
      } else {
        // Snap to closest target height
        let closestIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < effectiveSnapPoints.length; i++) {
          const snapY = getSnapTranslateY(i);
          const diff = Math.abs(currentY - snapY);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        targetIndex = closestIndex;
      }

      const targetTranslateY = getSnapTranslateY(targetIndex);

      if (reducedMotion) {
        translateY.value = withTiming(
          targetTranslateY,
          { duration: 200 },
          () => {
            runOnJS(notifySnapChange)(targetIndex);
          }
        );
      } else {
        translateY.value = withSpring(
          targetTranslateY,
          {
            damping: SPRINGS.snappy.damping,
            mass: SPRINGS.snappy.mass,
            stiffness: SPRINGS.snappy.stiffness,
          },
          () => {
            runOnJS(notifySnapChange)(targetIndex);
          }
        );
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const peekY = getSnapTranslateY(0);
  const fullY = getSnapTranslateY(effectiveSnapPoints.length - 1);

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      fullY < peekY ? [fullY, peekY] : [peekY, fullY],
      [0.45, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={styles.sheetRoot} pointerEvents="box-none">
      {/* Dimming Backdrop */}
      {showBackdrop && currentSnapIndex > 0 && (
        <Animated.View
          style={[styles.backdrop, animatedBackdropStyle]}
          pointerEvents={
            currentSnapIndex === effectiveSnapPoints.length - 1
              ? "auto"
              : "none"
          }
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => snapTo(0)}
          />
        </Animated.View>
      )}

      {/* Bottom-Anchored Spring Animated Sheet Container */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: isDark ? "#121A16" : themeColors.surface,
            borderColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.06)",
            height: sheetMaxHeight,
          },
          SHADOWS.lg,
          style,
          animatedSheetStyle,
        ]}
      >
        {/* Native Gesture Detector strictly on handle area (leaves map and body scroll gestures free) */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleArea}>
            <View
              style={[
                styles.handlePill,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(0,0,0,0.18)",
                },
              ]}
            />
            {renderHeader &&
              renderHeader({ snapIndex: currentSnapIndex, snapTo })}
          </View>
        </GestureDetector>

        {/* Content Body */}
        <View style={styles.contentBody}>{children}</View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 22,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 25,
    elevation: 25,
  },
  handleArea: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  handlePill: {
    width: 44,
    height: 5,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  contentBody: {
    flex: 1,
  },
});

export default BottomSheet;
