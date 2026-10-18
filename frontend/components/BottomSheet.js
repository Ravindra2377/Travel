import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { RADIUS, SHADOWS } from "../config/theme";
import { SPRINGS, useReducedMotion } from "../config/motion";

const { height: DEFAULT_SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Spring-driven, gesture-controlled Bottom Sheet Component.
 * Supports configurable snap points (peek, half, full), drag gestures,
 * and reduced-motion accessibility.
 */
export const BottomSheet = ({
  children,
  snapPoints,
  initialSnap = 1, // 0 = peek, 1 = half, 2 = full
  onSnapChange,
  showBackdrop = true,
  renderHeader,
  style,
}) => {
  const { themeColors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const windowDims = useWindowDimensions();
  const screenHeight = windowDims?.height || DEFAULT_SCREEN_HEIGHT;

  const effectiveSnapPoints =
    snapPoints && snapPoints.length > 0
      ? snapPoints
      : [190, screenHeight * 0.52, screenHeight * 0.88];

  // Convert snap points (heights) to translateY offsets from top of screen
  // Higher height = lower translateY (closer to top of screen)
  const getSnapOffsets = () => {
    return effectiveSnapPoints.map((h) => screenHeight - h);
  };

  const snapOffsets = getSnapOffsets();
  const currentSnapIndexRef = useRef(initialSnap);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);

  const initialOffset =
    snapOffsets[initialSnap] ?? snapOffsets[1] ?? (screenHeight - 380);
  const translateY = useRef(new Animated.Value(initialOffset)).current;
  const currentYRef = useRef(initialOffset);

  // Sync current value for PanResponder calculations without depending on internal _value
  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      currentYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  // Adjust position when screen height changes
  useEffect(() => {
    const targetOffset =
      snapOffsets[currentSnapIndexRef.current] ?? snapOffsets[1];
    translateY.setValue(targetOffset);
    currentYRef.current = targetOffset;
  }, [screenHeight]);

  // Animate to snap index with spring physics
  const snapTo = (index) => {
    const clampedIndex = Math.max(
      0,
      Math.min(effectiveSnapPoints.length - 1, index)
    );
    const targetOffset = snapOffsets[clampedIndex];

    if (reducedMotion) {
      Animated.timing(translateY, {
        toValue: targetOffset,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: targetOffset,
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

        // Determine current position
        const currentY = currentYRef.current;
        const velocity = gestureState.vy;

        let targetIndex = currentSnapIndexRef.current;

        // Velocity-based fling detection
        if (velocity < -0.4) {
          // Fling upwards -> expand
          targetIndex = Math.min(
            effectiveSnapPoints.length - 1,
            targetIndex + 1
          );
        } else if (velocity > 0.4) {
          // Fling downwards -> collapse
          targetIndex = Math.max(0, targetIndex - 1);
        } else {
          // Distance-based closest snap
          let closestIndex = 0;
          let minDiff = Infinity;
          snapOffsets.forEach((offset, idx) => {
            const diff = Math.abs(currentY - offset);
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

  // Backdrop opacity interpolator
  const maxOffset = snapOffsets[effectiveSnapPoints.length - 1];
  const minOffset = snapOffsets[0];
  const backdropOpacity = translateY.interpolate({
    inputRange:
      minOffset < maxOffset ? [minOffset, maxOffset] : [maxOffset, minOffset],
    outputRange: [0.45, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.sheetRoot} pointerEvents="box-none">
      {/* Dimming Backdrop (tappable to collapse to peek) */}
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

      {/* Spring Animated Sheet Container */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: isDark ? "#121A16" : themeColors.surface,
            borderColor: isDark
              ? "rgba(255,255,255,0.12)"
              : "rgba(0,0,0,0.06)",
            transform: [{ translateY }],
            height: screenHeight,
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
    top: 0,
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
