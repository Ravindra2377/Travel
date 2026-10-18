import React from "react";
import { render, act, fireEvent } from "@testing-library/react-native";
import { Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nProvider, useI18n, translations } from "../i18n";

const TestComponent = () => {
  const { t, language, setLanguage } = useI18n();
  return (
    <>
      <Text testID="app-title">{t("appTitle")}</Text>
      <Text testID="new-trip">{t("newTrip")}</Text>
      <Text testID="lang">{language}</Text>
      <TouchableOpacity
        testID="switch-btn"
        onPress={() => setLanguage(language === "en" ? "hi" : "en")}
      />
    </>
  );
};

describe("i18n localization", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("translations dictionary contains required keys for both en and hi", () => {
    const requiredKeys = [
      "appTitle",
      "journalDiscovery",
      "activeExpedition",
      "allJourneys",
      "newTrip",
      "viewJournal",
      "routeMap",
      "capture",
      "passport",
      "dailyDiary",
      "writeTodayDiary",
      "shareTrip",
      "shareToWhatsApp",
      "allSynced",
    ];

    for (const key of requiredKeys) {
      expect(translations.en[key]).toBeDefined();
      expect(translations.hi[key]).toBeDefined();
    }
  });

  test("I18nProvider defaults to English and translates keys", () => {
    const { getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(getByTestId("app-title").props.children).toBe("Trip Moments");
    expect(getByTestId("new-trip").props.children).toBe("New Trip");
    expect(getByTestId("lang").props.children).toBe("en");
  });

  test("can toggle language to Hindi", async () => {
    const { getByTestId } = render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId("switch-btn"));
    });

    expect(getByTestId("app-title").props.children).toBe("ट्रिप मोमेंट्स");
    expect(getByTestId("new-trip").props.children).toBe("नई यात्रा");
    expect(getByTestId("lang").props.children).toBe("hi");
  });
});
