import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SHADOWS } from "../config/theme";

/**
 * City coordinates lookup table for trips without explicit GPS coordinates
 */
const CITY_COORDINATES = {
  hampi: { lat: 15.3350, lng: 76.4600 },
  kyoto: { lat: 35.0116, lng: 135.7680 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  positano: { lat: 40.6281, lng: 14.4850 },
  amalfi: { lat: 40.6340, lng: 14.6027 },
  italy: { lat: 40.6281, lng: 14.4850 },
  rome: { lat: 41.9028, lng: 12.4964 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  newyork: { lat: 40.7128, lng: -74.0060 },
  bali: { lat: -8.4095, lng: 115.1889 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  santorini: { lat: 36.3932, lng: 25.4615 },
  goa: { lat: 15.2993, lng: 74.1240 },
  manali: { lat: 32.2432, lng: 77.1892 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  leh: { lat: 34.1526, lng: 77.5771 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  kerala: { lat: 9.9312, lng: 76.2673 },
};

/**
 * Detailed Geographic Cartography: Continents, Oceans, Seas, Countries & Landmark Ports
 */
export const GEO_LABELS = [
  // ─── CONTINENTS (Bold Ivory Typography, Angular Size 1.6) ───────────────────
  { lat: 34.0, lng: 100.0, text: "ASIA", size: 1.6, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: 52.0, lng: 20.0, text: "EUROPE", size: 1.4, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: 4.0, lng: 21.0, text: "AFRICA", size: 1.6, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: 46.0, lng: -100.0, text: "NORTH AMERICA", size: 1.5, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: -15.0, lng: -58.0, text: "SOUTH AMERICA", size: 1.5, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: -24.0, lng: 134.0, text: "AUSTRALIA", size: 1.4, color: "rgba(255, 255, 255, 0.95)", altitude: 0.015 },
  { lat: -78.0, lng: 0.0, text: "ANTARCTICA", size: 1.4, color: "rgba(224, 242, 254, 0.85)", altitude: 0.015 },

  // ─── OCEANS (Deep Sky Blue / Aquamarine, Angular Size 1.1 - 1.4) ────────────
  { lat: 20.0, lng: 165.0, text: "PACIFIC OCEAN", size: 1.35, color: "rgba(147, 197, 253, 0.85)", altitude: 0.012 },
  { lat: 32.0, lng: -150.0, text: "NORTH PACIFIC", size: 1.25, color: "rgba(147, 197, 253, 0.80)", altitude: 0.012 },
  { lat: -18.0, lng: -135.0, text: "SOUTH PACIFIC", size: 1.25, color: "rgba(147, 197, 253, 0.80)", altitude: 0.012 },
  { lat: 30.0, lng: -42.0, text: "ATLANTIC OCEAN", size: 1.35, color: "rgba(147, 197, 253, 0.85)", altitude: 0.012 },
  { lat: 42.0, lng: -35.0, text: "NORTH ATLANTIC", size: 1.25, color: "rgba(147, 197, 253, 0.80)", altitude: 0.012 },
  { lat: -25.0, lng: -18.0, text: "SOUTH ATLANTIC", size: 1.25, color: "rgba(147, 197, 253, 0.80)", altitude: 0.012 },
  { lat: -15.0, lng: 78.0, text: "INDIAN OCEAN", size: 1.35, color: "rgba(147, 197, 253, 0.85)", altitude: 0.012 },
  { lat: 82.0, lng: 0.0, text: "ARCTIC OCEAN", size: 1.15, color: "rgba(186, 230, 253, 0.85)", altitude: 0.012 },
  { lat: -60.0, lng: 60.0, text: "SOUTHERN OCEAN", size: 1.15, color: "rgba(186, 230, 253, 0.85)", altitude: 0.012 },

  // ─── SEAS, GULFS, BAYS & CHANNELS (Cyan / Turquoise, Size 0.55 - 0.75) ─────
  { lat: 35.5, lng: 18.0, text: "Mediterranean Sea", size: 0.72, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 40.0, lng: 12.0, text: "Tyrrhenian Sea", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 42.5, lng: 16.0, text: "Adriatic Sea", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 38.0, lng: 25.0, text: "Aegean Sea", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 38.0, lng: 18.5, text: "Ionian Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 40.0, lng: 1.5, text: "Balearic Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 43.5, lng: 9.0, text: "Ligurian Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 15.0, lng: 65.0, text: "Arabian Sea", size: 0.72, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 15.0, lng: 88.0, text: "Bay of Bengal", size: 0.72, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 10.5, lng: 96.0, text: "Andaman Sea", size: 0.62, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 9.0, lng: 74.5, text: "Laccadive Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 12.0, lng: 114.0, text: "South China Sea", size: 0.72, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 29.0, lng: 125.0, text: "East China Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 35.0, lng: 123.0, text: "Yellow Sea", size: 0.62, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 40.0, lng: 134.0, text: "Sea of Japan", size: 0.68, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 18.0, lng: 132.0, text: "Philippine Sea", size: 0.68, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: -5.0, lng: 112.0, text: "Java Sea", size: 0.62, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 8.5, lng: 120.0, text: "Sulu Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 3.5, lng: 122.0, text: "Celebes Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: -4.5, lng: 127.5, text: "Banda Sea", size: 0.58, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: -9.0, lng: 135.0, text: "Arafura Sea", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: -10.5, lng: 126.0, text: "Timor Sea", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 15.0, lng: -75.0, text: "Caribbean Sea", size: 0.72, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 25.0, lng: -90.0, text: "Gulf of Mexico", size: 0.68, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 26.0, lng: -55.0, text: "Sargasso Sea", size: 0.65, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 22.0, lng: 38.0, text: "Red Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 26.5, lng: 52.0, text: "Persian Gulf", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 24.5, lng: 58.5, text: "Gulf of Oman", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 12.5, lng: 48.0, text: "Gulf of Aden", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },
  { lat: 56.5, lng: 3.5, text: "North Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 58.5, lng: 20.0, text: "Baltic Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 67.0, lng: 2.0, text: "Norwegian Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 43.5, lng: 34.5, text: "Black Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 41.5, lng: 51.0, text: "Caspian Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 58.0, lng: -175.0, text: "Bering Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: -18.0, lng: 154.0, text: "Coral Sea", size: 0.68, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: -38.0, lng: 160.0, text: "Tasman Sea", size: 0.68, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 74.0, lng: 40.0, text: "Barents Sea", size: 0.62, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 53.0, lng: 150.0, text: "Sea of Okhotsk", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 56.0, lng: -55.0, text: "Labrador Sea", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: 60.0, lng: -85.0, text: "Hudson Bay", size: 0.65, color: "rgba(125, 211, 252, 0.88)", altitude: 0.01 },
  { lat: -58.0, lng: -65.0, text: "Drake Passage", size: 0.60, color: "rgba(125, 211, 252, 0.85)", altitude: 0.01 },

  // ─── MOUNTAINS & DESERTS (Earthy Gold Accent, Size 0.55 - 0.70) ───────────
  { lat: 28.0, lng: 86.0, text: "Himalayas", size: 0.65, color: "#E0E7FF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 46.5, lng: 10.0, text: "Alps", size: 0.60, color: "#E0E7FF", dotRadius: 0.18, altitude: 0.01 },
  { lat: -20.0, lng: -68.0, text: "Andes", size: 0.65, color: "#E0E7FF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 44.0, lng: -110.0, text: "Rocky Mountains", size: 0.65, color: "#E0E7FF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 23.0, lng: 13.0, text: "Sahara Desert", size: 0.70, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 44.0, lng: 105.0, text: "Gobi Desert", size: 0.65, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },

  // ─── COUNTRIES (Pearl White & Location Dots, Size 0.62 - 0.95) ─────────────
  // Asia & Middle East
  { lat: 22.5, lng: 79.0, text: "India", size: 0.88, color: "#FFFFFF", dotRadius: 0.28, altitude: 0.01 },
  { lat: 36.2, lng: 138.2, text: "Japan", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 35.8, lng: 104.1, text: "China", size: 0.92, color: "#FFFFFF", dotRadius: 0.30, altitude: 0.01 },
  { lat: 36.5, lng: 127.8, text: "South Korea", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 23.7, lng: 121.0, text: "Taiwan", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 15.8, lng: 101.0, text: "Thailand", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 14.0, lng: 108.2, text: "Vietnam", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 12.5, lng: 105.0, text: "Cambodia", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 18.0, lng: 103.0, text: "Laos", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 21.0, lng: 96.0, text: "Myanmar", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: -0.7, lng: 114.0, text: "Indonesia", size: 0.80, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 4.2, lng: 102.0, text: "Malaysia", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 1.35, lng: 103.8, text: "Singapore", size: 0.62, color: "#FDE68A", dotRadius: 0.22, altitude: 0.01 },
  { lat: 12.8, lng: 121.7, text: "Philippines", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 7.8, lng: 80.7, text: "Sri Lanka", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 28.3, lng: 84.1, text: "Nepal", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 27.5, lng: 90.4, text: "Bhutan", size: 0.60, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 23.7, lng: 90.3, text: "Bangladesh", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 30.0, lng: 70.0, text: "Pakistan", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 33.0, lng: 65.0, text: "Afghanistan", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 3.2, lng: 73.2, text: "Maldives", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 24.0, lng: 45.0, text: "Saudi Arabia", size: 0.78, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 23.8, lng: 54.0, text: "UAE", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 21.5, lng: 57.0, text: "Oman", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 25.3, lng: 51.2, text: "Qatar", size: 0.60, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 39.0, lng: 35.2, text: "Turkey", size: 0.76, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 32.4, lng: 53.6, text: "Iran", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 33.0, lng: 44.0, text: "Iraq", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 31.2, lng: 36.5, text: "Jordan", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 31.0, lng: 35.0, text: "Israel", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 48.0, lng: 66.9, text: "Kazakhstan", size: 0.78, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 41.3, lng: 64.5, text: "Uzbekistan", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 46.8, lng: 103.8, text: "Mongolia", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 60.0, lng: 95.0, text: "Russia", size: 0.98, color: "#FFFFFF", dotRadius: 0.32, altitude: 0.01 },

  // Europe
  { lat: 42.5, lng: 12.5, text: "Italy", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 46.5, lng: 2.5, text: "France", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 40.2, lng: -3.7, text: "Spain", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 39.5, lng: -8.0, text: "Portugal", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 51.1, lng: 10.4, text: "Germany", size: 0.75, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 54.5, lng: -3.0, text: "United Kingdom", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 53.4, lng: -8.0, text: "Ireland", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 46.8, lng: 8.2, text: "Switzerland", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 47.5, lng: 14.5, text: "Austria", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 39.0, lng: 22.0, text: "Greece", size: 0.70, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 52.2, lng: 5.3, text: "Netherlands", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 50.8, lng: 4.5, text: "Belgium", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 61.0, lng: 8.5, text: "Norway", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 61.0, lng: 16.0, text: "Sweden", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 63.0, lng: 26.0, text: "Finland", size: 0.70, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 56.0, lng: 9.5, text: "Denmark", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 52.0, lng: 19.0, text: "Poland", size: 0.72, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 49.8, lng: 15.5, text: "Czech Republic", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 47.1, lng: 19.5, text: "Hungary", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 45.1, lng: 15.2, text: "Croatia", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 45.9, lng: 24.9, text: "Romania", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 64.9, lng: -18.5, text: "Iceland", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },

  // Americas
  { lat: 38.0, lng: -97.0, text: "United States", size: 0.92, color: "#FFFFFF", dotRadius: 0.30, altitude: 0.01 },
  { lat: 56.0, lng: -106.0, text: "Canada", size: 0.92, color: "#FFFFFF", dotRadius: 0.30, altitude: 0.01 },
  { lat: 23.6, lng: -102.5, text: "Mexico", size: 0.82, color: "#FFFFFF", dotRadius: 0.28, altitude: 0.01 },
  { lat: 15.0, lng: -90.2, text: "Guatemala", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 9.7, lng: -83.7, text: "Costa Rica", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 8.5, lng: -80.0, text: "Panama", size: 0.62, color: "#FFFFFF", dotRadius: 0.20, altitude: 0.01 },
  { lat: 21.5, lng: -77.7, text: "Cuba", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: -14.2, lng: -51.9, text: "Brazil", size: 0.92, color: "#FFFFFF", dotRadius: 0.30, altitude: 0.01 },
  { lat: -38.4, lng: -63.6, text: "Argentina", size: 0.82, color: "#FFFFFF", dotRadius: 0.28, altitude: 0.01 },
  { lat: -35.6, lng: -71.5, text: "Chile", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -9.1, lng: -75.0, text: "Peru", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 4.5, lng: -74.2, text: "Colombia", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -1.8, lng: -78.1, text: "Ecuador", size: 0.65, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: -16.2, lng: -63.5, text: "Bolivia", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },

  // Africa
  { lat: 26.8, lng: 30.8, text: "Egypt", size: 0.76, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 31.7, lng: -7.0, text: "Morocco", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 28.0, lng: 3.0, text: "Algeria", size: 0.76, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -30.5, lng: 23.0, text: "South Africa", size: 0.80, color: "#FFFFFF", dotRadius: 0.28, altitude: 0.01 },
  { lat: -22.5, lng: 17.0, text: "Namibia", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: 0.0, lng: 37.9, text: "Kenya", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -6.3, lng: 34.8, text: "Tanzania", size: 0.74, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 9.0, lng: 8.6, text: "Nigeria", size: 0.76, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 9.1, lng: 40.4, text: "Ethiopia", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: 7.9, lng: -1.0, text: "Ghana", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: -18.7, lng: 46.8, text: "Madagascar", size: 0.72, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -4.6, lng: 55.4, text: "Seychelles", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: -20.3, lng: 57.5, text: "Mauritius", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },

  // Oceania
  { lat: -25.2, lng: 133.7, text: "Australia", size: 0.90, color: "#FFFFFF", dotRadius: 0.30, altitude: 0.01 },
  { lat: -40.9, lng: 174.8, text: "New Zealand", size: 0.76, color: "#FFFFFF", dotRadius: 0.25, altitude: 0.01 },
  { lat: -6.3, lng: 143.9, text: "Papua New Guinea", size: 0.68, color: "#FFFFFF", dotRadius: 0.22, altitude: 0.01 },
  { lat: -17.7, lng: 178.0, text: "Fiji", size: 0.62, color: "#FDE68A", dotRadius: 0.22, altitude: 0.01 },
  { lat: -17.6, lng: -149.4, text: "Tahiti", size: 0.60, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 20.7, lng: -156.3, text: "Hawaii", size: 0.62, color: "#FDE68A", dotRadius: 0.22, altitude: 0.01 },

  // Landmark Travel Destinations
  { lat: 15.335, lng: 76.460, text: "Hampi", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 35.011, lng: 135.768, text: "Kyoto", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 35.676, lng: 139.650, text: "Tokyo", size: 0.60, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 40.628, lng: 14.485, text: "Amalfi Coast", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 41.902, lng: 12.496, text: "Rome", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 48.856, lng: 2.352, text: "Paris", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 51.507, lng: -0.127, text: "London", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 40.712, lng: -74.006, text: "New York", size: 0.60, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 30.044, lng: 31.235, text: "Cairo", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: -8.409, lng: 115.188, text: "Bali", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: -33.868, lng: 151.209, text: "Sydney", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 36.393, lng: 25.461, text: "Santorini", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: 25.204, lng: 55.270, text: "Dubai", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 },
  { lat: -33.924, lng: 18.424, text: "Cape Town", size: 0.58, color: "#FDE68A", dotRadius: 0.20, altitude: 0.01 }
];

export function getTripCoordinates(trip) {
  if (
    typeof trip?.latitude === "number" &&
    typeof trip?.longitude === "number" &&
    !isNaN(trip.latitude) &&
    !isNaN(trip.longitude)
  ) {
    return { lat: trip.latitude, lng: trip.longitude };
  }
  const cityKey = (trip?.city || "").trim().toLowerCase();
  if (CITY_COORDINATES[cityKey]) {
    return CITY_COORDINATES[cityKey];
  }
  const countryKey = (trip?.country || "").trim().toLowerCase();
  if (CITY_COORDINATES[countryKey]) {
    return CITY_COORDINATES[countryKey];
  }
  // Default to Hampi
  return { lat: 15.3350, lng: 76.4600 };
}

/**
 * InteractiveMap
 * Supports:
 * 1. 3D Interactive Travel Globe (Polarsteps style with Three.js / Globe.GL)
 *    - Real spherical Earth (no world duplication; Asia only appears once!)
 *    - 3D curved flight arcs connecting expeditions
 *    - Bouncing photo pins with pulse rings and title tags
 * 2. 2D Cartographic Map (Leaflet with noWrap)
 *    - For detail route trails and street-level exploration
 */
export const InteractiveMap = ({
  moments = [],
  breadcrumbs = [],
  trips = [],
  mode = "moments", // "moments" | "trips"
  selectedIndex = 0,
  activeTripId = null,
  onSelectMoment,
  onSelectTrip,
  themeColor = "#16845B",
  tileStyle = "voyager",
  flyToLocation = null,
  style,
}) => {
  const { isDark } = useTheme();
  const webViewRef = useRef(null);

  // Default to 3D Globe for trip overview, and 2D Flat Map for moments/route detail
  const [mapType, setMapType] = useState(mode === "trips" ? "globe" : "flat");
  const [globeDetail, setGlobeDetail] = useState("detailed"); // "detailed" | "satellite"

  // Synchronize mapType if mode changes externally
  useEffect(() => {
    if (mode === "moments") {
      setMapType("flat");
    }
  }, [mode]);

  // Synchronize globeDetail theme with WebView
  useEffect(() => {
    if (mapType === "globe") {
      const msg = { type: "SET_GLOBE_THEME", theme: globeDetail };
      if (Platform.OS === "web") {
        const iframe = document.getElementById("travel-map-iframe");
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify(msg), "*");
        }
      } else if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify(msg));
      }
    }
  }, [globeDetail, mapType]);

  const preparedTrips = useMemo(() => {
    return trips.map((t) => {
      const coords = getTripCoordinates(t);
      return {
        id: t.id,
        title: t.title,
        city: t.city,
        country: t.country,
        coverUri: t.coverUri,
        themeColor: t.themeColor || themeColor,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    });
  }, [trips, themeColor]);

  const validMoments = useMemo(() => {
    return moments.filter(
      (m) =>
        typeof m.latitude === "number" &&
        typeof m.longitude === "number" &&
        !isNaN(m.latitude) &&
        !isNaN(m.longitude)
    );
  }, [moments]);

  const validBreadcrumbs = useMemo(() => {
    return breadcrumbs.filter(
      (b) =>
        typeof b.latitude === "number" &&
        typeof b.longitude === "number" &&
        !isNaN(b.latitude) &&
        !isNaN(b.longitude)
    );
  }, [breadcrumbs]);

  // Generate 3D Globe HTML (Three.js / Globe.gl)
  const globeHtml = useMemo(() => {
    const tripsJson = JSON.stringify(preparedTrips);
    const geoLabelsJson = JSON.stringify(GEO_LABELS);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://unpkg.com/globe.gl@2.46.2/dist/globe.gl.min.js"></script>
  <style>
    html, body, #globeViz {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #0B130E;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .globe-pin {
      position: relative;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      pointer-events: auto;
      user-select: none;
    }
    .globe-pin-bubble {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 6px 20px rgba(0,0,0,0.60);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .pin-selected .globe-pin-bubble {
      transform: scale(1.24);
      border-color: #F59E0B;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.7);
    }
    .pulse-ring {
      position: absolute;
      top: -4px;
      left: 50%;
      margin-left: -26px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2.5px solid ${themeColor};
      animation: pulse 2s infinite ease-out;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.85); opacity: 0.95; }
      100% { transform: scale(1.65); opacity: 0; }
    }
    .globe-pin-label {
      margin-top: 6px;
      background: rgba(15, 23, 42, 0.90);
      backdrop-filter: blur(6px);
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 8px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.18);
    }
  </style>
</head>
<body>
  <div id="globeViz"></div>
  <script>
    const trips = ${tripsJson};
    const geoLabels = ${geoLabelsJson};
    let activeTripId = "${activeTripId || ""}";

    // Arcs between consecutive trips
    const arcs = [];
    for (let i = 0; i < trips.length - 1; i++) {
      arcs.push({
        startLat: trips[i].latitude,
        startLng: trips[i].longitude,
        endLat: trips[i+1].latitude,
        endLng: trips[i+1].longitude,
        color: trips[i].themeColor || '#F59E0B'
      });
    }

    const postToApp = (data) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    };

    const globe = Globe()
      .globeImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg')
      .globeTileEngineUrl((x, y, l) => {
        if (Array.isArray(x)) { l = x[2]; y = x[1]; x = x[0]; }
        return 'https://basemaps.cartocdn.com/rastertiles/voyager/' + l + '/' + x + '/' + y + '.png';
      })
      .bumpImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#38BDF8')
      .atmosphereAltitude(0.20)
      .showGraticules(true)
      .arcsData(arcs)
      .arcColor(d => [d.color || '#F59E0B', '#34D399'])
      .arcAltitude(0.24)
      .arcStroke(1.8)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2200)
      .labelsData(geoLabels)
      .labelLat(d => d.lat)
      .labelLng(d => d.lng)
      .labelText(d => d.text)
      .labelSize(d => d.size)
      .labelColor(d => d.color)
      .labelDotRadius(d => d.dotRadius || 0)
      .labelAltitude(d => d.altitude || 0.01)
      .labelResolution(3)
      .htmlElementsData(trips)
      .htmlLat(d => d.latitude)
      .htmlLng(d => d.longitude)
      .htmlElement(d => {
        const isSelected = d.id === activeTripId;
        const el = document.createElement('div');
        el.className = 'globe-pin ' + (isSelected ? 'pin-selected' : '');
        el.id = 'pin-' + d.id;
        
        const pulse = document.createElement('div');
        pulse.className = 'pulse-ring';
        pulse.style.borderColor = d.themeColor || '${themeColor}';
        el.appendChild(pulse);

        const bubble = document.createElement('div');
        bubble.className = 'globe-pin-bubble';
        if (d.coverUri) {
          bubble.style.backgroundImage = 'url(' + d.coverUri + ')';
        }
        bubble.style.borderColor = isSelected ? (d.themeColor || '#F59E0B') : '#FFFFFF';
        el.appendChild(bubble);

        const label = document.createElement('div');
        label.className = 'globe-pin-label';
        label.innerText = d.title;
        el.appendChild(label);

        el.onclick = () => {
          selectPin(d.id, d.latitude, d.longitude);
          postToApp({ type: 'SELECT_TRIP', tripId: d.id });
        };
        return el;
      })
      (document.getElementById('globeViz'));

    // Fetch and render political country boundary polygons
    fetch('https://unpkg.com/three-globe@2.45.6/example/country-polygons/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(countries => {
        globe
          .polygonsData(countries.features)
          .polygonCapColor(() => 'rgba(255, 255, 255, 0.0)')
          .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
          .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.28)')
          .polygonAltitude(0.005)
          .polygonLabel(({ properties: d }) => d.ADMIN || d.NAME || '');
      })
      .catch(err => {
        console.log('Country borders load failed:', err);
      });

    function selectPin(tripId, lat, lng) {
      activeTripId = tripId;
      document.querySelectorAll('.globe-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('pin-' + tripId);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (typeof lat === 'number' && typeof lng === 'number') {
        globe.pointOfView({ lat: lat, lng: lng, altitude: 2.1 }, 1200);
      }
    }

    // Initial camera position centered on active trip or India/Asia
    const initialTrip = trips.find(t => t.id === activeTripId) || trips[0];
    if (initialTrip) {
      globe.pointOfView({ lat: initialTrip.latitude, lng: initialTrip.longitude, altitude: 2.2 }, 0);
    } else {
      globe.pointOfView({ lat: 22.0, lng: 78.0, altitude: 2.4 }, 0);
    }

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'SET_GLOBE_THEME') {
          if (data.theme === 'satellite') {
            globe.globeTileEngineUrl(null);
            globe.globeImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-blue-marble.jpg');
            globe.bumpImageUrl('https://unpkg.com/three-globe@2.45.6/example/img/earth-topology.png');
          } else {
            globe.globeTileEngineUrl((x, y, l) => {
              if (Array.isArray(x)) { l = x[2]; y = x[1]; x = x[0]; }
              return 'https://basemaps.cartocdn.com/rastertiles/voyager/' + l + '/' + x + '/' + y + '.png';
            });
          }
        } else if (data.type === 'FLY_TO_TRIP') {
          const target = trips.find(t => t.id === data.tripId);
          if (target) selectPin(target.id, target.latitude, target.longitude);
        } else if (data.type === 'FLY_TO_COORDS' && data.latitude && data.longitude) {
          globe.pointOfView({ lat: data.latitude, lng: data.longitude, altitude: data.zoom ? (12 / data.zoom) : 2.0 }, 1200);
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [preparedTrips, activeTripId, themeColor, globeDetail]);

  // Generate 2D Flat Map HTML (Leaflet with noWrap)
  const flatHtml = useMemo(() => {
    const momentsJson = JSON.stringify(validMoments);
    const breadcrumbsJson = JSON.stringify(validBreadcrumbs);
    const tripsJson = JSON.stringify(preparedTrips);

    const tileUrls = {
      voyager:
        "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      topo:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      natgeo:
        "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
      satellite:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      osm:
        "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    };

    const tileAttributions = {
      voyager: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> &copy; <a href='https://carto.com/attributions'>CARTO</a>",
      topo: "Tiles &copy; Esri &mdash; Topo Map",
      natgeo: "Tiles &copy; Esri &mdash; NatGeo World Map",
      satellite: "Tiles &copy; Esri &mdash; Satellite Imagery",
      osm: "&copy; OpenStreetMap &copy; CARTO",
    };

    const activeTileUrl = tileUrls[tileStyle] || tileUrls.voyager;
    const activeAttribution =
      tileAttributions[tileStyle] || tileAttributions.voyager;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #E8ECE9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-pin {
      position: relative;
      cursor: pointer;
      animation: pinDrop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }
    @keyframes pinDrop {
      0% { transform: translateY(-28px); opacity: 0; }
      70% { transform: translateY(3px); }
      100% { transform: translateY(0); opacity: 1; }
    }
    .pin-bubble {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    .trip-pin-bubble {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 3px solid #FFFFFF;
      box-shadow: 0 6px 18px rgba(0,0,0,0.40);
      background-size: cover;
      background-position: center;
      background-color: ${themeColor};
    }
    .pin-selected .pin-bubble,
    .pin-selected .trip-pin-bubble {
      transform: scale(1.22);
      border-color: ${themeColor};
      box-shadow: 0 8px 24px rgba(0,0,0,0.50);
    }
    .pulse-ring {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 2px solid ${themeColor};
      opacity: 0;
      pointer-events: none;
    }
    .pin-selected .pulse-ring {
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .pin-label {
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #FFF;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .animated-route-line {
      stroke-dasharray: 10, 10;
      animation: dash 20s linear infinite;
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -1000;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const isTripsMode = "${mode}" === "trips";
    const moments = ${momentsJson};
    const breadcrumbs = ${breadcrumbsJson};
    const trips = ${tripsJson};
    const themeColor = "${themeColor}";
    let initialIndex = ${selectedIndex};
    let activeTripId = "${activeTripId || ""}";

    // Initialize Map with strict world boundaries so Asia never duplicates
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1.0
    });

    L.tileLayer('${activeTileUrl}', {
      maxZoom: 19,
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: '${activeAttribution}'
    }).addTo(map);

    const markers = [];
    const latLngs = [];

    const postToApp = (data) => {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    };

    function selectTripPin(tripId, pos) {
      activeTripId = tripId;
      document.querySelectorAll('.custom-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('trip-pin-' + tripId);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (pos) map.flyTo(pos, 6, { duration: 1.2 });
    }

    function selectMomentPin(idx) {
      document.querySelectorAll('.custom-pin').forEach(p => p.classList.remove('pin-selected'));
      const activeEl = document.getElementById('pin-' + idx);
      if (activeEl) activeEl.classList.add('pin-selected');
      if (latLngs[idx]) map.flyTo(latLngs[idx], 13, { duration: 1.0 });
    }

    if (isTripsMode) {
      trips.forEach((t, idx) => {
        const pos = [t.latitude, t.longitude];
        latLngs.push(pos);

        const isSelected = t.id === activeTripId || (idx === 0 && !activeTripId);
        const bgImg = t.coverUri ? 'background-image: url(' + t.coverUri + ');' : '';
        const pinHtml = '<div class="custom-pin ' + (isSelected ? 'pin-selected' : '') + '" id="trip-pin-' + t.id + '" style="animation-delay: ' + (idx * 0.08) + 's;">' +
          '<div class="pulse-ring" style="border-color: ' + t.themeColor + ';"></div>' +
          '<div class="trip-pin-bubble" style="' + bgImg + '"></div>' +
          '<div class="pin-label">' + t.title + '</div>' +
          '</div>';

        const icon = L.divIcon({
          className: '',
          html: pinHtml,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker(pos, { icon: icon }).addTo(map);
        marker.on('click', () => {
          selectTripPin(t.id, pos);
          postToApp({ type: 'SELECT_TRIP', tripId: t.id });
        });
        markers.push({ id: t.id, marker: marker, pos: pos });
      });

      if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80], maxZoom: 8 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 6);
      } else {
        map.setView([22.0, 78.0], 4);
      }
    } else {
      if (breadcrumbs && breadcrumbs.length > 1) {
        const trailPoints = breadcrumbs.map(b => [b.latitude, b.longitude]);
        L.polyline(trailPoints, {
          color: '#F59E0B',
          weight: 3,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(map);
      }

      moments.forEach((m, idx) => {
        const pos = [m.latitude, m.longitude];
        latLngs.push(pos);

        const bgImg = m.mediaUri ? 'background-image: url(' + m.mediaUri + ');' : '';
        const pinHtml = '<div class="custom-pin ' + (idx === initialIndex ? 'pin-selected' : '') + '" id="pin-' + idx + '" style="animation-delay: ' + (idx * 0.06) + 's;">' +
          '<div class="pulse-ring"></div>' +
          '<div class="pin-bubble" style="' + bgImg + '"></div>' +
          '<div class="pin-label">' + (m.placeName || m.city || 'Stop ' + (idx + 1)) + '</div>' +
          '</div>';

        const icon = L.divIcon({
          className: '',
          html: pinHtml,
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker(pos, { icon: icon }).addTo(map);
        marker.on('click', () => {
          selectMomentPin(idx);
          postToApp({ type: 'SELECT_MOMENT', index: idx });
        });
        markers.push(marker);
      });

      if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], maxZoom: 14 });
      } else if (latLngs.length === 1) {
        map.setView(latLngs[0], 12);
      }
    }

    // Listen for flyTo messages from React
    window.addEventListener('message', (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'FLY_TO_INDEX') {
          if (typeof data.index === 'number') {
            selectMomentPin(data.index);
          }
        } else if (data.type === 'FLY_TO_TRIP') {
          const target = markers.find(m => m.id === data.tripId);
          if (target) selectTripPin(data.tripId, target.pos);
        } else if (data.type === 'FLY_TO_COORDS' && data.latitude && data.longitude) {
          map.flyTo([data.latitude, data.longitude], data.zoom || 8, { duration: 1.2 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
  }, [
    validMoments,
    validBreadcrumbs,
    preparedTrips,
    mode,
    themeColor,
    tileStyle,
    selectedIndex,
    activeTripId,
  ]);

  const activeHtml = mapType === "globe" ? globeHtml : flatHtml;

  // Two-way sync: Notify WebView when selection or flyTo updates
  useEffect(() => {
    const msg =
      mode === "trips"
        ? activeTripId
          ? { type: "FLY_TO_TRIP", tripId: activeTripId }
          : flyToLocation
          ? { type: "FLY_TO_COORDS", ...flyToLocation }
          : null
        : { type: "FLY_TO_INDEX", index: selectedIndex };

    if (!msg) return;

    if (Platform.OS === "web") {
      const iframe = document.getElementById("travel-map-iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify(msg), "*");
      }
    } else if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify(msg));
    }
  }, [selectedIndex, activeTripId, flyToLocation, mode, mapType]);

  // Listen for message on Web
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleWebMessage = (e) => {
        try {
          const data =
            typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (
            data &&
            data.type === "SELECT_MOMENT" &&
            typeof data.index === "number"
          ) {
            onSelectMoment && onSelectMoment(data.index);
          } else if (data && data.type === "SELECT_TRIP" && data.tripId) {
            onSelectTrip && onSelectTrip(data.tripId);
          }
        } catch (err) {}
      };
      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }
  }, [onSelectMoment, onSelectTrip]);

  const handleNativeMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (
        data.type === "SELECT_MOMENT" &&
        typeof data.index === "number"
      ) {
        onSelectMoment && onSelectMoment(data.index);
      } else if (data.type === "SELECT_TRIP" && data.tripId) {
        onSelectTrip && onSelectTrip(data.tripId);
      }
    } catch (err) {
      console.warn("[InteractiveMap] Native message parse error:", err);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === "web" ? (
        <iframe
          id="travel-map-iframe"
          title="Interactive Travel Map"
          srcDoc={activeHtml}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: activeHtml }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          onMessage={handleNativeMessage}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={themeColor} />
            </View>
          )}
          startInLoadingState
        />
      )}

      {/* Floating 3D Globe / 2D Map & Detail Switcher Controls */}
      {mode === "trips" && (
        <View style={styles.togglePillContainer} pointerEvents="box-none">
          <View style={styles.togglePillRow}>
            {/* 3D Globe vs 2D Map Toggle */}
            <TouchableOpacity
              style={[
                styles.togglePill,
                {
                  backgroundColor: isDark
                    ? "rgba(18, 26, 22, 0.92)"
                    : "rgba(255, 255, 255, 0.94)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.08)",
                },
                SHADOWS.md,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMapType((prev) => (prev === "globe" ? "flat" : "globe"));
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={mapType === "globe" ? "globe" : "map"}
                size={14}
                color={themeColor}
              />
              <Text
                style={[
                  FONTS.captionBold,
                  { color: themeColor, fontSize: 11, marginLeft: 5 },
                ]}
              >
                {mapType === "globe" ? "3D Globe" : "2D Map"}
              </Text>
            </TouchableOpacity>

            {/* Detailed Cartography vs Satellite Toggle */}
            {mapType === "globe" && (
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  {
                    marginLeft: 8,
                    backgroundColor: isDark
                      ? "rgba(18, 26, 22, 0.92)"
                      : "rgba(255, 255, 255, 0.94)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                  SHADOWS.md,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGlobeDetail((prev) =>
                    prev === "detailed" ? "satellite" : "detailed"
                  );
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={globeDetail === "detailed" ? "layers" : "planet"}
                  size={14}
                  color={themeColor}
                />
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: themeColor, fontSize: 11, marginLeft: 5 },
                  ]}
                >
                  {globeDetail === "detailed" ? "Detailed" : "Satellite"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0B130E",
    overflow: "hidden",
    zIndex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B130E",
  },
  togglePillContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 116 : 96,
    right: 16,
    zIndex: 40,
  },
  togglePillRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default InteractiveMap;
