import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useTrips } from "../context/TripContext";
import { FONTS, SPACING, RADIUS, SHADOWS } from "../config/theme";
import { Ionicons } from "../components/Icon";

const { width } = Dimensions.get("window");

const SearchScreen = ({ navigation }) => {
  const { themeColors, isDark } = useTheme();
  const { moments, trips } = useTrips();

  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // "all" | "favorites" | tripId

  const filteredMoments = useMemo(() => {
    let list = [...moments];

    // Filter by type or trip
    if (selectedFilter === "favorites") {
      list = list.filter((m) => m.isFavorite);
    } else if (selectedFilter !== "all") {
      list = list.filter((m) => m.tripId === selectedFilter);
    }

    // Filter by text query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.text?.toLowerCase().includes(q) ||
          m.placeName?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.country?.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [moments, query, selectedFilter]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.paper }]}
      edges={["top"]}
    >
      {/* Search Header */}
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
          <Ionicons name="arrow-back" size={20} color={themeColors.ink} />
        </TouchableOpacity>

        <View
          style={[
            styles.searchBarWrapper,
            {
              backgroundColor: themeColors.surface,
              borderColor: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons name="search" size={18} color={themeColors.inkSoft} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.ink }]}
            placeholder="Search moments, places, tags..."
            placeholderTextColor={themeColors.inkFaint}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={themeColors.inkSoft}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Row */}
      <View style={styles.chipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsList}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedFilter("all");
            }}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedFilter === "all"
                    ? themeColors.primary
                    : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <Text
              style={[
                FONTS.captionBold,
                {
                  color:
                    selectedFilter === "all" ? "#FFFFFF" : themeColors.ink,
                },
              ]}
            >
              All Moments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedFilter("favorites");
            }}
            style={[
              styles.chip,
              {
                backgroundColor:
                  selectedFilter === "favorites"
                    ? "#EF4444"
                    : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <Text
              style={[
                FONTS.captionBold,
                {
                  color:
                    selectedFilter === "favorites"
                      ? "#FFFFFF"
                      : themeColors.ink,
                },
              ]}
            >
              Favorites ❤️
            </Text>
          </TouchableOpacity>

          {trips.map((t) => {
            const isSelected = selectedFilter === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(t.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? t.themeColor || themeColors.primary
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                  },
                ]}
              >
                <Text
                  style={[
                    FONTS.captionBold,
                    {
                      color: isSelected ? "#FFFFFF" : themeColors.ink,
                    },
                  ]}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            FONTS.ticketStamp,
            { color: themeColors.inkSoft, marginBottom: 12 },
          ]}
        >
          FOUND {filteredMoments.length} MOMENTS
        </Text>

        {filteredMoments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={40} color={themeColors.inkFaint} />
            <Text style={[FONTS.h3, { color: themeColors.ink, marginTop: 12 }]}>
              No moments match your search
            </Text>
            <Text
              style={[
                FONTS.caption,
                { color: themeColors.inkSoft, textAlign: "center", marginTop: 4 },
              ]}
            >
              Try searching by another keyword, city name, or clear filters.
            </Text>
          </View>
        ) : (
          filteredMoments.map((moment) => (
            <TouchableOpacity
              key={moment.id}
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("MomentDetail", { moment });
              }}
              style={[
                styles.resultCard,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.06)",
                },
                SHADOWS.sm,
              ]}
            >
              <Image
                source={{ uri: moment.mediaUri }}
                style={styles.resultImage}
                contentFit="cover"
                transition={200}
              />

              <View style={styles.resultDetails}>
                <View style={styles.resultTopRow}>
                  <Text
                    style={[
                      FONTS.ticketStamp,
                      { color: themeColors.primary },
                    ]}
                  >
                    {moment.city} ·{" "}
                    {new Date(moment.takenAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  {moment.isFavorite && (
                    <Ionicons name="heart" size={14} color="#EF4444" />
                  )}
                </View>

                <Text
                  style={[
                    FONTS.h3,
                    styles.resultTitle,
                    { color: themeColors.ink },
                  ]}
                  numberOfLines={1}
                >
                  {moment.title}
                </Text>

                <Text
                  style={[
                    FONTS.caption,
                    styles.resultPlace,
                    { color: themeColors.inkSoft },
                  ]}
                  numberOfLines={1}
                >
                  📍 {moment.placeName || moment.city}
                </Text>

                {moment.tags && moment.tags.length > 0 && (
                  <Text
                    style={[
                      FONTS.caption,
                      { color: themeColors.primary, fontSize: 11, marginTop: 2 },
                    ]}
                    numberOfLines={1}
                  >
                    {moment.tags.map((t) => `#${t}`).join(" ")}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter",
  },
  chipsContainer: {
    paddingVertical: 8,
  },
  chipsList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  resultCard: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    gap: 14,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  resultDetails: {
    flex: 1,
    gap: 2,
  },
  resultTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: "FrauncesSemiBold",
  },
  resultPlace: {
    fontSize: 12,
  },
});

export default SearchScreen;
