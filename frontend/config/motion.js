import { useState, useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Trip Moments Centralized Motion Design System
 * Tuned for 60fps on mid-range devices with full reduced-motion accessibility.
 */

export const DURATIONS = {
  instant: 0,
  fast: 150,    // Press feedback, chip selections, small state changes
  base: 250,    // Standard modal/card transitions, tab switches
  slow: 400,    // Bottom sheets, page slides, dialog entrances
  hero: 700,    // Splash route draw, celebration reels, milestone counters
  stagger: 50,  // Interval delay between staggered list items
};

export const SPRINGS = {
  // Snappy spring: For responsive drag-driven sheets and cards
  snappy: {
    damping: 28,
    mass: 1,
    stiffness: 300,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  // Soft spring: For playful pins, stamps, and floating badges
  soft: {
    damping: 20,
    mass: 1,
    stiffness: 160,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
  // Bouncy spring: For affirmative checks, bookmark stars, mood buttons
  bouncy: {
    damping: 14,
    mass: 0.8,
    stiffness: 220,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
  },
};

export const EASINGS = {
  standard: "cubic-bezier(0.2, 0.0, 0, 1.0)",
  decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1.0)",
  accelerate: "cubic-bezier(0.4, 0.0, 1.0, 1.0)",
};

/**
 * Hook to respect user system accessibility setting for Reduced Motion.
 * Degrades spring/spatial movement to quiet opacity fades.
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check system preference
    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        if (mounted) setReducedMotion(enabled);
      });
    }

    // Subscribe to runtime changes
    const subscription = AccessibilityInfo?.addEventListener?.(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) setReducedMotion(enabled);
      }
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reducedMotion;
}

export const MOTION = {
  durations: DURATIONS,
  springs: SPRINGS,
  easings: EASINGS,
};

export default MOTION;
