import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_STORAGE_KEY = "@trip_moments_language_v1";

export const translations = {
  en: {
    appTitle: "Trip Moments",
    journalDiscovery: "JOURNAL & DISCOVERY",
    activeExpedition: "ACTIVE EXPEDITION",
    allJourneys: "ALL JOURNEYS",
    newTrip: "New Trip",
    viewJournal: "View Journal",
    routeMap: "Route Map",
    capture: "Capture",
    passport: "My Passport",
    dailyDiary: "DAILY DIARY",
    writeTodayDiary: "Write today's diary entry",
    diarySubtitle: "Capture your mood, food discoveries, and reflections",
    writeBtn: "Write",
    onThisDay: "ON THIS DAY · PAST MEMORIES",
    noMomentsYet: "No moments yet",
    startCapturing: "Start capturing your trip moments. Your photos, time, place, and weather will automatically shape this day-by-day story.",
    captureFirstMoment: "Capture First Moment",
    shareTrip: "Share Trip",
    shareToWhatsApp: "Share to WhatsApp",
    privacyPrivate: "Private",
    privacyLinkOnly: "Link-Only",
    privacyFollowers: "Followers",
    privacyPrivateDesc: "Visible only to you",
    privacyLinkOnlyDesc: "Anyone with the link can view (WhatsApp)",
    privacyFollowersDesc: "Visible to approved followers",
    officialTravelLog: "OFFICIAL TRAVEL LOG",
    countries: "Countries",
    cities: "Cities",
    momentsCount: "Moments",
    distanceKm: "Kilometers",
    expeditionStamps: "EXPEDITION STAMPS",
    exportBackup: "Export Backup",
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
    offlineMode: "Offline Mode",
    allSynced: "All Synced",
    syncingChanges: "Syncing changes...",
    queuedOffline: "Queued offline",
  },
  hi: {
    appTitle: "ट्रिप मोमेंट्स",
    journalDiscovery: "यात्रा और यादें",
    activeExpedition: "सक्रिय यात्रा",
    allJourneys: "सभी यात्राएं",
    newTrip: "नई यात्रा",
    viewJournal: "डायरी देखें",
    routeMap: "रूट मैप",
    capture: "कैप्चर",
    passport: "मेरा पासपोर्ट",
    dailyDiary: "दैनिक डायरी",
    writeTodayDiary: "आज की डायरी लिखें",
    diarySubtitle: "आज का मूड, भोजन और यादें दर्ज करें",
    writeBtn: "लिखें",
    onThisDay: "आज के दिन · पुरानी यादें",
    noMomentsYet: "अभी कोई यादें नहीं हैं",
    startCapturing: "अपनी यात्रा के पलों को संजोना शुरू करें। आपके फ़ोटो, समय और स्थान से यह कहानी बनेगी।",
    captureFirstMoment: "पहला पल कैप्चर करें",
    shareTrip: "यात्रा साझा करें",
    shareToWhatsApp: "व्हाट्सएप पर साझा करें",
    privacyPrivate: "निजी",
    privacyLinkOnly: "सिर्फ लिंक वाले",
    privacyFollowers: "फॉलोअर्स",
    privacyPrivateDesc: "केवल आपके लिए दृश्यमान",
    privacyLinkOnlyDesc: "जिसके पास लिंक है वह देख सकता है (व्हाट्सएप)",
    privacyFollowersDesc: "केवल स्वीकृत फॉलोअर्स के लिए",
    officialTravelLog: "आधिकारिक यात्रा लॉग",
    countries: "देश",
    cities: "शहर",
    momentsCount: "पल",
    distanceKm: "किलोमीटर",
    expeditionStamps: "यात्रा स्टैम्प्स",
    exportBackup: "बैकअप निर्यात करें",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    offlineMode: "ऑफ़लाइन मोड",
    allSynced: "सब सिंक हो गया",
    syncingChanges: "बदलाव सिंक हो रहे हैं...",
    queuedOffline: "ऑफ़लाइन सुरक्षित",
  },
};

const I18nContext = createContext({
  language: "en",
  t: (key) => key,
  setLanguage: () => {},
  isHindi: false,
});

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === "hi" || stored === "en") {
          setLanguageState(stored);
        }
      } catch (e) {
        // Fallback to default English
      }
    })();
  }, []);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error("[i18n] Error saving language:", e);
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isHindi: language === "hi",
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
