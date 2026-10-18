import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "../../context/ThemeContext";
import { TripProvider } from "../../context/TripContext";
import { I18nProvider } from "../../config/i18n";
import HomeScreen from "../HomeScreen";
import TripCoverScreen from "../TripCoverScreen";
import TripJournalScreen from "../TripJournalScreen";
import RouteMapScreen from "../RouteMapScreen";
import PassportScreen from "../PassportScreen";
import SearchScreen from "../SearchScreen";
import PublicTripViewerScreen from "../PublicTripViewerScreen";

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  emit: jest.fn(),
};

const renderWithProviders = (Component, props = {}) => {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <TripProvider>
          <Component navigation={mockNavigation} route={{ params: {} }} {...props} />
        </TripProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

describe("Trip Moments Screens Smoke Tests", () => {
  test("HomeScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(HomeScreen);
    expect(getByText("Trip Moments")).toBeTruthy();
    expect(getByText("JOURNAL & DISCOVERY")).toBeTruthy();
  });

  test("TripCoverScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(TripCoverScreen);
    expect(getByText("Open Day Journal")).toBeTruthy();
    expect(getByText("Route Map")).toBeTruthy();
  });

  test("TripJournalScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(TripJournalScreen);
    expect(getByText("DAY-BY-DAY JOURNAL")).toBeTruthy();
  });

  test("RouteMapScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(RouteMapScreen);
    expect(getByText("ROUTE MAP & PINS")).toBeTruthy();
  });

  test("PassportScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(PassportScreen);
    expect(getByText("My Passport")).toBeTruthy();
    expect(getByText("OFFICIAL TRAVEL LOG")).toBeTruthy();
  });

  test("SearchScreen renders without crashing", () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(SearchScreen);
    expect(getByPlaceholderText("Search moments, places, tags...")).toBeTruthy();
    expect(getByText("All Moments")).toBeTruthy();
  });

  test("PublicTripViewerScreen renders without crashing", () => {
    const { getByText } = renderWithProviders(PublicTripViewerScreen);
    expect(getByText("PUBLIC WEB VIEWER")).toBeTruthy();
    expect(getByText("DAY-BY-DAY STORY")).toBeTruthy();
  });
});
