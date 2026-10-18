import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { RADIUS, SHADOWS } from "../config/theme";
import { SPRINGS, useReducedMotion } from "../config/motion";

const { height: DEFAULT_SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Spring-driven, gesture-controlled Bottom Sheet Component.
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

  // Maximum sheet height corresponds to the largest snap point
  const sheetMaxHeight = effectiveSnapPoints[effectiveSnapPoints.length - 1];

  // For any visible height H from the bottom, translateY is: sheetMaxHeight - H
  const getSnapTranslateY = (snapIndex) => {
    const visibleH =
      effectiveSnapPoints[snapIndex] ?? effectiveSnapPoints[1];
    return Math.max(0, sheetMaxHeight - visibleH);
  };

  const currentSnapIndexRef = useRef(initialSnap);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);

  const initialTranslateY = getSnapTranslateY(initialSnap);
  const translateY = useRef(new Animated.Value(initialTranslateY)).current;
  const currentYRef = useRef(initialTranslateY);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      currentYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  // Animate to snap index with spring physics
  const snapTo = (index) => {
    const clampedIndex = Math.max(
      0,
      Math.min(effectiveSnapPoints.length - 1, index)
    );
    const targetTranslateY = getSnapTranslateY(clampedIndex);

    if (reducedMotion) {
      Animated.timing(translateY, {
        toValue: targetTranslateY,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: targetTranslateY,
        damping: SPRINGS.snappy.damping,
        mass: SPRINGS.snappy.mass,
        stiffness: SPRINGS.snappy.stiffness,
        useNativeDriver: false,
      }).start();
    }

    currentSnapIndexRef.current = clampedIndex;
    setCurrentSnapIndex(clampedIndex);
    if (onSnapChange) onSnapChange(clampedIndex);
  };

  // Pan gesture tracking
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const currentY = currentYRef.current;
        const velocity = gestureState.vy;

        let targetIndex = currentSnapIndexRef.current;

        // Fling upwards (negative dy/vy) -> expand (higher index)
        if (velocity < -0.35) {
          targetIndex = Math.min(
            effectiveSnapPoints.length - 1,
            targetIndex + 1
          );
        } else if (velocity > 0.35) {
          // Fling downwards (positive dy/vy) -> collapse (lower index)
          targetIndex = Math.max(0, targetIndex - 1);
        } else {
          // Snap to closest target height
          let closestIndex = 0;
          let minDiff = Infinity;
          effectiveSnapPoints.forEach((_, idx) => {
            const snapY = getSnapTranslateY(idx);
            const diff = Math.abs(currentY - snapY);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = idx;
            }
          });
          targetIndex = closestIndex;
        }

        snapTo(targetIndex);
      },
    })
  ).current;

  // Backdrop opacity: 0 at peek, 0.45 at full expansion
  const peekY = getSnapTranslateY(0);
  const fullY = getSnapTranslateY(effectiveSnapPoints.length - 1);
  const backdropOpacity = translateY.interpolate({
    inputRange: fullY < peekY ? [fullY, peekY] : [peekY, fullY],
    outputRange: [0.45, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.sheetRoot} pointerEvents="box-none">
      {/* Dimming Backdrop */}
      {showBackdrop && currentSnapIndex > 0 && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
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
            transform: [{ translateY }],
          },
          SHADOWS.lg,
          style,
        ]}
      >
        {/* Drag Handle Bar */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
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
