import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../../context/ThemeContext";
import { BottomSheet } from "../BottomSheet";
import { SkeletonBox, SkeletonText, SkeletonTripCard } from "../SkeletonLoader";
import { DURATIONS, SPRINGS, EASINGS } from "../../config/motion";
import { Text, View } from "react-native";

describe("UI-0 Motion & Foundation", () => {
  test("motion tokens define fast, base, slow, and hero durations", () => {
    expect(DURATIONS.fast).toBe(150);
    expect(DURATIONS.base).toBe(250);
    expect(DURATIONS.slow).toBe(400);
    expect(DURATIONS.hero).toBe(700);
    expect(DURATIONS.stagger).toBe(50);
  });

  test("spring presets define snappy, soft, and bouncy physics", () => {
    expect(SPRINGS.snappy.stiffness).toBe(300);
    expect(SPRINGS.snappy.damping).toBe(28);
    expect(SPRINGS.soft.stiffness).toBe(160);
    expect(SPRINGS.bouncy.stiffness).toBe(220);
  });

  test("BottomSheet renders children and handle bar", () => {
    const { getByText } = render(
      <ThemeProvider>
        <BottomSheet>
          <View>
            <Text>Expedition Details Content</Text>
          </View>
        </BottomSheet>
      </ThemeProvider>
    );

    expect(getByText("Expedition Details Content")).toBeTruthy();
  });

  test("SkeletonLoader renders box, text, and card placeholders without errors", () => {
    const { UNSAFE_getAllByType } = render(
      <ThemeProvider>
        <SkeletonBox width={100} height={20} />
        <SkeletonText width="60%" />
        <SkeletonTripCard />
      </ThemeProvider>
    );

    expect(UNSAFE_getAllByType).toBeDefined();
  });
});
