import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../../context/ThemeContext";
import { TripProvider } from "../../context/TripContext";
import PermissionPrePrompt from "../PermissionPrePrompt";
import TripCreateModal, {
  PRESET_DESTINATIONS,
  PRESET_COVERS,
  PRESET_COLORS,
} from "../TripCreateModal";
import TripRecapScreen from "../../screens/TripRecapScreen";

describe("UI-2 & UI-3: Permissions, Creation Flow, & Story Replay", () => {
  test("PermissionPrePrompt renders location benefits and triggers callback", () => {
    const onAccept = jest.fn();
    const onDecline = jest.fn();

    const { getByText } = render(
      <ThemeProvider>
        <PermissionPrePrompt
          visible={true}
          type="location"
          onAccept={onAccept}
          onDecline={onDecline}
        />
      </ThemeProvider>
    );

    expect(getByText("Automatic Journey Trail")).toBeTruthy();
    expect(getByText("Battery Friendly")).toBeTruthy();
    expect(getByText("Works Fully Offline")).toBeTruthy();

    const acceptBtn = getByText("Enable Route Tracking");
    fireEvent.press(acceptBtn);
    expect(onAccept).toHaveBeenCalledTimes(1);

    const declineBtn = getByText("Maybe Later");
    fireEvent.press(declineBtn);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  test("PermissionPrePrompt renders camera benefits correctly", () => {
    const { getByText } = render(
      <ThemeProvider>
        <PermissionPrePrompt visible={true} type="camera" />
      </ThemeProvider>
    );

    expect(getByText("Capture & Geotag Moments")).toBeTruthy();
    expect(getByText("Automatic Geotagging")).toBeTruthy();
    expect(getByText("Grant Camera Access")).toBeTruthy();
  });

  test("TripCreateModal renders step 1 presets and advances through steps", () => {
    const onClose = jest.fn();
    const onCreateTrip = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <TripCreateModal
          visible={true}
          onClose={onClose}
          onCreateTrip={onCreateTrip}
        />
      </ThemeProvider>
    );

    expect(getByText("STEP 1 OF 3")).toBeTruthy();
    expect(getByText("Where to Next?")).toBeTruthy();
    expect(PRESET_DESTINATIONS.length).toBeGreaterThan(0);
    expect(PRESET_COVERS.length).toBeGreaterThan(0);
    expect(PRESET_COLORS.length).toBeGreaterThan(0);

    // Pick an iconic preset
    const preset = getByText(PRESET_DESTINATIONS[0].title);
    fireEvent.press(preset);

    // Continue to step 2
    const nextBtn = getByText("Continue to Dates & Privacy");
    fireEvent.press(nextBtn);

    expect(getByText("STEP 2 OF 3")).toBeTruthy();
    expect(getByText("Dates & Privacy")).toBeTruthy();
  });

  test("TripRecapScreen renders story controls and moment title", () => {
    const navigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };
    const route = { params: { tripId: "trip-1" } };

    const { getByText } = render(
      <ThemeProvider>
        <TripProvider>
          <TripRecapScreen route={route} navigation={navigation} />
        </TripProvider>
      </ThemeProvider>
    );

    // Verify it renders the story controls
    expect(getByText("Share Moment Card")).toBeTruthy();
  });
});
