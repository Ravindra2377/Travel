import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import LiquidGlass from "../components/LiquidGlass";
import { Ionicons } from "../components/Icon";
import photoStorage from "../services/photoStorage";

const { width } = Dimensions.get("window");

const SAMPLE_CAPTURES = [
  {
    uri: "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?q=80&w=1000&auto=format&fit=crop",
    place: "Bouldering Rapids, Tungabhadra",
    city: "Hampi",
    country: "India",
    lat: 15.339,
    lng: 76.464,
  },
  {
    uri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
    place: "Emerald Sunset Cove",
    city: "Goa",
    country: "India",
    lat: 15.2993,
    lng: 74.124,
  },
  {
    uri: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1000&auto=format&fit=crop",
    place: "Misty Bamboo Forest",
    city: "Kyoto",
    country: "Japan",
    lat: 35.0165,
    lng: 135.6713,
  },
  {
    uri: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1000&auto=format&fit=crop",
    place: "Cliffside Lemon Vista",
    city: "Positano",
    country: "Italy",
    lat: 40.6281,
    lng: 14.485,
  },
];

const MomentCaptureScreen = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const { themeColors, isDark } = useTheme();
  const { trips, activeTrip, addMoment } = useTrips();

  const [selectedTripId, setSelectedTripId] = useState(
    tripId || activeTrip?.id || (trips[0] && trips[0].id)
  );

  const [photoUri, setPhotoUri] = useState(SAMPLE_CAPTURES[0].uri);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [placeName, setPlaceName] = useState(SAMPLE_CAPTURES[0].place);
  const [city, setCity] = useState(SAMPLE_CAPTURES[0].city);
  const [country, setCountry] = useState(SAMPLE_CAPTURES[0].country);
  const [latitude, setLatitude] = useState(SAMPLE_CAPTURES[0].lat);
  const [longitude, setLongitude] = useState(SAMPLE_CAPTURES[0].lng);
  const [weather, setWeather] = useState({
    temp: 27,
    condition: "Golden Hour",
    icon: "sunny",
  });
  const [tagsInput, setTagsInput] = useState("travel, sunset, story");
  const [isFavorite, setIsFavorite] = useState(false);
  const [tripMode, setTripMode] = useState(true);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const targetTrip = trips.find((t) => t.id === selectedTripId) || activeTrip || trips[0];
  const primaryTint = targetTrip?.themeColor || themeColors.primary;

  // Auto fetch location on mount if tripMode is active
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (loc && loc.coords) {
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);

        // Reverse geocode
        const geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const g = geocode[0];
          const guessedPlace = [g.name, g.street].filter(Boolean).join(", ");
          if (guessedPlace) setPlaceName(guessedPlace);
          if (g.city || g.subregion) setCity(g.city || g.subregion);
          if (g.country) setCountry(g.country);
        }

        // Fetch real weather from Open-Meteo
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&current=temperature_2m,weather_code`
          );
          const data = await res.json();
          if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            setWeather({
              temp,
              condition: temp > 22 ? "Clear & Warm" : "Breezy",
              icon: "sunny",
            });
          }
        } catch (weaErr) {
          // offline fallback
        }
      }
    } catch (e) {
      console.log("[MomentCapture] Location check completed with fallback");
    } finally {
      setLocating(false);
    }
  };

  const pickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Picker Error", "Could not open gallery.");
    }
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera Permission", "Camera access is needed to capture moments.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Camera Error", "Could not open camera.");
    }
  };

  const handleSaveMoment = async () => {
    if (!title.trim() && !placeName.trim()) {
      Alert.alert("Moment Title", "Please provide a title or place name for this moment.");
      return;
    }

    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      // Persist photo to permanent document directory
      const permanentUri = await photoStorage.persistPhoto(photoUri);

      await addMoment({
        tripId: selectedTripId,
        title: title.trim() || placeName || "Trip Moment",
        text: caption.trim(),
        placeName: placeName.trim(),
        city: city.trim() || targetTrip?.city || "Wander",
        country: country.trim() || targetTrip?.country || "Earth",
        latitude: Number(latitude) || 15.335,
        longitude: Number(longitude) || 76.46,
        weather,
        mediaUri: permanentUri || photoUri,
        mediaType: "photo",
        tags,
        isFavorite,
        takenAt: new Date().toISOString(),
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Could not save moment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <Ionicons name="close" size={22} color={themeColors.ink} />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
            FAST CAPTURE
          </Text>
          <Text style={[FONTS.h2, styles.headerTitle, { color: themeColors.ink }]}>
            Capture Moment
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setTripMode(!tripMode)}
          style={[
            styles.tripModeBadge,
            {
              backgroundColor: tripMode ? `${primaryTint}20` : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <Text
            style={[
              FONTS.ticketStamp,
              { color: tripMode ? primaryTint : themeColors.inkFaint, fontSize: 10 },
            ]}
          >
            {tripMode ? "TRIP MODE ON" : "MANUAL"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Photo Preview */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photoUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.photoActionButtons}>
            <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
              <Text style={styles.photoActionText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoActionBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={18} color="#FFFFFF" />
              <Text style={styles.photoActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Sample Presets */}
        <View style={styles.samplePresetsRow}>
          <Text style={[FONTS.captionBold, { color: themeColors.inkSoft, marginBottom: 8 }]}>
            OR CHOOSE TRAVEL SNAPSHOT
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
            {SAMPLE_CAPTURES.map((sample, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPhotoUri(sample.uri);
                  setPlaceName(sample.place);
                  setCity(sample.city);
                  setCountry(sample.country);
                  setLatitude(sample.lat);
                  setLongitude(sample.lng);
                }}
                style={[
                  styles.sampleChoice,
                  photoUri === sample.uri && {
                    borderColor: primaryTint,
                    borderWidth: 2.5,
                  },
                ]}
              >
                <Image
                  source={{ uri: sample.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trip Selector */}
        <Text style={[FONTS.captionBold, styles.fieldLabel, { color: themeColors.ink }]}>
          TRIP STORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripsPickerRow}>
          {trips.map((t) => {
            const isSelected = t.id === selectedTripId;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTripId(t.id);
                }}
                style={[
                  styles.tripChip,
                  {
                    backgroundColor: isSelected
                      ? t.themeColor || primaryTint
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                  },
                ]}
              >
                <Text
                  style={[
                    FONTS.captionBold,
                    { color: isSelected ? "#FFFFFF" : themeColors.ink },
                  ]}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Form Inputs */}
        <Text style={[FONTS.captionBold, styles.fieldLabel, { color: themeColors.ink }]}>
          MOMENT TITLE
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.ink,
              backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            },
          ]}
          placeholder="e.g. Dawn Chorus on the River Ghats"
          placeholderTextColor={themeColors.inkFaint}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[FONTS.captionBold, styles.fieldLabel, { color: themeColors.ink }]}>
          CAPTION / MEMORY NOTES
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              height: 80,
              textAlignVertical: "top",
              color: themeColors.ink,
              backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
            },
          ]}
          placeholder="What made this moment unforgettable?"
          placeholderTextColor={themeColors.inkFaint}
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        {/* Auto Location & Weather Row */}
        <View style={styles.autoDataCard}>
          <View style={styles.autoDataRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="location" size={14} color={primaryTint} />
                <Text style={[FONTS.ticketStamp, { color: primaryTint }]}>
                  AUTO LOCATION
                </Text>
                {locating && <ActivityIndicator size="small" color={primaryTint} />}
              </View>
              <TextInput
                style={[
                  styles.miniInput,
                  { color: themeColors.ink },
                ]}
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="Place name"
                placeholderTextColor={themeColors.inkFaint}
              />
            </View>

            <TouchableOpacity
              onPress={fetchCurrentLocation}
              style={[styles.refreshLocBtn, { backgroundColor: `${primaryTint}18` }]}
            >
              <Ionicons name="refresh" size={15} color={primaryTint} />
            </TouchableOpacity>
          </View>

          <View style={styles.weatherStatusRow}>
            <Ionicons name={weather.icon || "sunny"} size={16} color={primaryTint} />
            <Text style={[FONTS.monoBold, { color: themeColors.ink, fontSize: 13 }]}>
              {weather.temp}°C · {weather.condition}
            </Text>
          </View>
        </View>

        {/* Tags & Favorite */}
        <View style={styles.bottomSettingsRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[FONTS.captionBold, styles.fieldLabel, { color: themeColors.ink }]}>
              TAGS (COMMA SEPARATED)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: themeColors.ink,
                  backgroundColor: isDark ? "#1E293B" : "#F8FAF8",
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                },
              ]}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="heritage, dawn, river"
              placeholderTextColor={themeColors.inkFaint}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFavorite(!isFavorite);
            }}
            style={[
              styles.favoriteToggleBtn,
              {
                backgroundColor: isFavorite ? "#FEE2E2" : isDark ? "#1E293B" : "#F8FAF8",
                borderColor: isFavorite ? "#EF4444" : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? "#EF4444" : themeColors.inkSoft}
            />
            <Text
              style={[
                FONTS.captionBold,
                { color: isFavorite ? "#EF4444" : themeColors.inkSoft, marginTop: 4 },
              ]}
            >
              Hero
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: primaryTint }]}
          onPress={handleSaveMoment}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Moment to Story</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "FrauncesBold",
  },
  tripModeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoContainer: {
    width: "100%",
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    padding: 14,
    marginTop: 6,
  },
  photoActionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  photoActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.60)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  photoActionText: {
    color: "#FFFFFF",
    fontFamily: "InterMedium",
    fontSize: 12,
  },
  samplePresetsRow: {
    marginTop: 14,
  },
  sampleChoice: {
    width: 70,
    height: 50,
    borderRadius: 12,
    marginRight: 8,
    overflow: "hidden",
  },
  tripsPickerRow: {
    marginVertical: 4,
  },
  tripChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter",
  },
  autoDataCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 14,
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.02)",
    gap: 8,
  },
  autoDataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniInput: {
    fontSize: 14,
    fontFamily: "InterSemiBold",
    marginTop: 2,
    padding: 0,
  },
  refreshLocBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  weatherStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  bottomSettingsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  favoriteToggleBtn: {
    width: 64,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 15,
    marginTop: 24,
    gap: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontFamily: "InterSemiBold",
    fontSize: 15,
  },
});

export default MomentCaptureScreen;
