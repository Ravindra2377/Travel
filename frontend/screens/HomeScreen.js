import React, { useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "../components/Icon";
import { AuthContext } from "../context/AuthContext";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { WishlistContext } from "../context/WishlistContext";
import GroqService from "../services/GroqService";
import { AppButton, SurfaceCard } from "../components/SharedUI";
import BrandHeader from "../components/BrandHeader";
import LocationPickerModal from "../components/LocationPickerModal";
import LocationService from "../services/LocationService";

const H_PADDING = SPACING.xl;

const QUICK_CATEGORIES = [
  { name: "Milk", emoji: "🥛", color: "#E8F4FA" },
  { name: "Vegetables", emoji: "🥬", color: "#E5F4E9" },
  { name: "Rice", emoji: "🍚", color: "#FFF3D8" },
  { name: "Snacks", emoji: "🍿", color: "#FCE8DD" },
  { name: "Chicken", emoji: "🍗", color: "#F9E5E1" },
  { name: "Fruits", emoji: "🍎", color: "#FBE7E7" },
];

const DIRECT_PLATFORMS = [
  {
    id: "1",
    name: "Amazon",
    source: {
      uri: "https://www.google.com/s2/favicons?sz=256&domain=amazon.in",
    },
    url: "https://www.amazon.in/",
  },
  {
    id: "2",
    name: "Flipkart",
    source: {
      uri: "https://www.google.com/s2/favicons?sz=256&domain=flipkart.com",
    },
    url: "https://www.flipkart.com/",
  },
  {
    id: "3",
    name: "Blinkit",
    source: {
      uri: "https://www.google.com/s2/favicons?sz=256&domain=blinkit.com",
    },
    url: "https://blinkit.com/",
  },
  {
    id: "4",
    name: "Zepto",
    source: require("../assets/zepto-logo.png"),
    url: "https://www.zepto.com/",
  },
  {
    id: "5",
    name: "BigBasket",
    source: require("../assets/bigbasket-logo.png"),
    url: "https://www.bigbasket.com/",
  },
];

const BrowseCard = ({ item, navigation, themeColors }) => (
  <TouchableOpacity
    style={styles.browseCardWrapper}
    activeOpacity={0.8}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(item.url).catch((err) => {
        console.log("App link failed, falling back to internal browser:", err);
        navigation.navigate("InAppBrowser", {
          url: item.url,
          title: item.name,
          platform: item.name,
        });
      });
    }}
  >
    <View style={styles.browseIconWrap}>
      <Image
        source={item.source}
        style={styles.browseLogoImg}
        resizeMode="contain"
      />
    </View>
    <Text style={[styles.browseName, { color: themeColors.ink }]}>{item.name}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { wishlist } = useContext(WishlistContext);
  const { themeColors } = useTheme();
  const homePaper = themeColors.paper === "#F7F8F6" ? "#FBFAF6" : themeColors.paper;

  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [optimizeError, setOptimizeError] = useState("");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [currentPincode, setCurrentPincode] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  const fadeHero = React.useRef(new Animated.Value(0)).current;
  const fadeContent = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("comparex_search_history")
        .then((stored) => {
          try {
            setRecentSearches((JSON.parse(stored) || []).slice(0, 6));
          } catch {
            setRecentSearches([]);
          }
        })
        .catch(() => setRecentSearches([]));
    }, []),
  );

  React.useEffect(() => {
    LocationService.init().then((loc) => {
      if (!LocationService.hasLocationSet()) {
        setLocationModalVisible(true);
      } else if (loc) {
        setCurrentCity(loc.city || "");
        setCurrentPincode(loc.pincode || "");
      }
    });

    Animated.stagger(200, [
      Animated.timing(fadeHero, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeContent, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleOptimize = async () => {
    if (wishlist.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setOptimizing(true);
    setOptimization(null);
    setOptimizeError("");
    try {
      const result = await GroqService.optimizeBasket(wishlist);
      setOptimization(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setOptimizeError("Couldn't optimize right now. Try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOptimizing(false);
    }
  };

  const slideUp = (anim) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: homePaper }]}>
      <View style={[styles.container, { backgroundColor: homePaper }]}>


        <BrandHeader
          city={currentCity}
          pincode={currentPincode}
          onLocationPress={() => setLocationModalVisible(true)}
          editorial
          backgroundColor={homePaper}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* ── Live dashboard entry ── */}
          <Animated.View style={slideUp(fadeHero)}>
            <View style={styles.dashboardTop}>
              <Text style={[FONTS.editorial, styles.greeting, { color: themeColors.primary }]}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name || user?.email?.split("@")[0] || "Explorer"}
              </Text>
              <Text style={[FONTS.editorialBold, styles.dashboardTitle, { color: themeColors.aubergineDeep }]}>
                What are you comparing today?
              </Text>

              <TouchableOpacity
                style={[styles.searchLauncher, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
                onPress={() => navigation.navigate("Search")}
                activeOpacity={0.88}
              >
                <Ionicons name="search" size={22} color={themeColors.ink} />
                <Text style={[FONTS.uiBody, styles.searchLauncherText, { color: themeColors.inkSoft }]}>
                  Search milk, rice, snacks...
                </Text>
                <View style={[styles.searchAction, { backgroundColor: themeColors.aubergineSoft }]}>
                  <Ionicons name="options-outline" size={17} color={themeColors.primary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Text style={[FONTS.editorial, styles.sectionTitle, { color: themeColors.ink }]}>Quick compare</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {QUICK_CATEGORIES.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.categoryItem}
                    onPress={() => navigation.navigate("Search", { query: item.name })}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={[FONTS.uiBodyMedium, styles.categoryLabel, { color: themeColors.ink }]}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Animated.View>

          {recentSearches.length > 0 ? (
            <Animated.View style={[styles.sectionBlock, slideUp(fadeContent)]}>
              <View style={styles.sectionTitleRow}>
                <View>
                  <Text style={[FONTS.editorial, styles.sectionTitle, { color: themeColors.ink }]}>Compare again</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                  <Text style={[FONTS.uiBodyBold, styles.sectionAction, { color: themeColors.primary }]}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
                {recentSearches.map((query, index) => (
                  <TouchableOpacity
                    key={`${query}-${index}`}
                    style={[styles.recentCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
                    onPress={() => navigation.navigate("Search", { query })}
                    activeOpacity={0.82}
                  >
                    <View style={styles.recentCardTop}>
                      <View style={[styles.recentClockWrap, { backgroundColor: themeColors.aubergineSoft }]}>
                        <Ionicons name="time-outline" size={15} color={themeColors.primary} />
                      </View>
                      <Text style={[FONTS.uiBodyMedium, styles.recentLabel, { color: themeColors.inkSoft }]}>
                        Recent search
                      </Text>
                    </View>
                    <Text style={[FONTS.editorial, styles.recentQuery, { color: themeColors.aubergineDeep }]} numberOfLines={1}>
                      {query}
                    </Text>
                    <View style={styles.recentCardBottom}>
                      <Text style={[FONTS.uiBodyMedium, styles.recentActionText, { color: themeColors.inkSoft }]}>
                        Compare again
                      </Text>
                      <View style={[styles.recentArrow, { backgroundColor: themeColors.primary }]}>
                        <Ionicons name="arrow-forward" size={14} color="#fff" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.sectionBlock, slideUp(fadeContent)]}>
              <TouchableOpacity
                style={[styles.firstCompareCard, { backgroundColor: themeColors.headerSurface, borderColor: themeColors.line }]}
                onPress={() => navigation.navigate("Search")}
                activeOpacity={0.85}
              >
                <View style={[styles.firstCompareIcon, { backgroundColor: themeColors.primary }]}>
                  <Ionicons name="trending-down" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[FONTS.uiBodyBold, { fontSize: 15, color: themeColors.ink }]}>Run your first comparison</Text>
                  <Text style={[FONTS.uiBody, { fontSize: 12, lineHeight: 17, color: themeColors.inkSoft, marginTop: 2 }]}>Your recent products will appear here.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.View style={[styles.sectionBlock, slideUp(fadeContent)]}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={[FONTS.editorial, styles.sectionTitle, { color: themeColors.ink }]}>Shop by platform</Text>
                <Text style={[FONTS.uiBody, styles.sectionSubtitle, { color: themeColors.inkSoft }]}>Open a connected store directly</Text>
              </View>
            </View>
            <View style={styles.browseGrid}>
              {DIRECT_PLATFORMS.map((item) => (
                <BrowseCard key={item.id} item={item} navigation={navigation} themeColors={themeColors} />
              ))}
            </View>
          </Animated.View>

          {/* ── AI Basket Optimizer Card ── */}
          <Animated.View style={[{ paddingHorizontal: H_PADDING, marginTop: SPACING.xl }, slideUp(fadeContent)]}>
            <SurfaceCard style={{ padding: SPACING.lg }}>
              <TouchableOpacity 
                style={styles.optimizerHeaderRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Likes");
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="basket" size={24} color={themeColors.ink} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.optimizerTitle, { color: themeColors.textPrimary }]}>Smart Basket Optimizer</Text>
                  <Text style={[styles.optimizerSubtitle, { color: themeColors.textSecondary }]}>
                    {wishlist.length} {wishlist.length === 1 ? "item" : "items"} liked
                  </Text>
                </View>
                {wishlist.length >= 2 && !optimization && !optimizing && (
                  <AppButton
                    label="Optimize"
                    onPress={handleOptimize}
                    variant="gradient"
                    icon="sparkles"
                    style={{ minHeight: 40, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full }}
                    textStyle={{ fontSize: 13 }}
                  />
                )}
              </TouchableOpacity>

              {wishlist.length < 2 && (
                <Text style={[styles.optimizerHint, { color: themeColors.textTertiary }]}>
                  Add at least 2 items to your Likes to find the cheapest way to buy them across platforms.
                </Text>
              )}

              {optimizing && (
                <View style={[styles.optimizerLoadingCard, { backgroundColor: themeColors.violetLight }]}>
                  <ActivityIndicator color={themeColors.ink} />
                  <Text style={[styles.optimizerLoadingText, { color: themeColors.ink }]}>
                    AI calculating cheapest split...
                  </Text>
                </View>
              )}

              {optimizeError ? (
                <View style={[styles.optimizerErrorCard, { backgroundColor: themeColors.errorLight }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={themeColors.error} />
                  <Text style={[styles.optimizerErrorText, { color: themeColors.error }]}>{optimizeError}</Text>
                </View>
              ) : null}

              {optimization && !optimizing && (
                <View style={[styles.optimizerResultCard, { borderColor: themeColors.border }]}>
                  {optimization.savings > 0 ? (
                    <LinearGradient
                      colors={themeColors.gradientSavings}
                      style={styles.savingsBanner}
                    >
                      <Ionicons name="trending-down" size={20} color="#fff" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savingsAmount}>
                          Save ₹{Math.round(optimization.savings)}
                        </Text>
                        <Text style={styles.savingsCompare}>
                          ₹{Math.round(optimization.totalOptimized)} optimized vs ₹{Math.round(optimization.totalSingleBest)} from one platform
                        </Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.noSavingsBanner, { backgroundColor: themeColors.savingsLight }]}>
                      <Ionicons name="checkmark-circle" size={18} color={themeColors.savings} />
                      <Text style={[styles.noSavingsText, { color: themeColors.savings }]}>Your basket is already optimized!</Text>
                    </View>
                  )}

                  {optimization.recommendation ? (
                    <Text style={[styles.optimizerRecommendation, { color: themeColors.textSecondary, borderBottomColor: themeColors.border }]}>
                      ✨ {optimization.recommendation}
                    </Text>
                  ) : null}

                  {(optimization.splits || []).map((split, i) => (
                    <View key={i} style={[styles.optimizerSplitRow, { borderBottomColor: themeColors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optimizerSplitPlatform, { color: themeColors.textPrimary }]}>{split.platform}</Text>
                        <Text style={[styles.optimizerSplitItems, { color: themeColors.textSecondary }]} numberOfLines={1}>
                          {(split.items || []).join(", ")}
                        </Text>
                      </View>
                      <View style={styles.optimizerSplitCosts}>
                        <Text style={[styles.optimizerSplitSubtotal, { color: themeColors.textPrimary }]}>₹{Math.round(split.subtotal || 0)}</Text>
                        <Text style={[styles.optimizerSplitDelivery, { color: themeColors.textTertiary }]}>+₹{split.deliveryFee || 40} delivery</Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.optimizerDismissBtn}
                    onPress={() => setOptimization(null)}
                  >
                    <Text style={[styles.optimizerDismissText, { color: themeColors.textTertiary }]}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SurfaceCard>
          </Animated.View>

          {/* Extra space to ensure last cards are fully visible above floating navbar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSave={({ city, pincode }) => {
          setCurrentCity(city);
          setCurrentPincode(pincode);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  dashboardTop: {
    paddingHorizontal: H_PADDING,
    paddingTop: 22,
  },
  greeting: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  dashboardTitle: {
    maxWidth: 310,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 24,
  },
  searchLauncher: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 17,
    paddingRight: 10,
    ...SHADOWS.md,
  },
  searchLauncherText: {
    flex: 1,
    fontSize: 14.5,
    marginLeft: 11,
  },
  searchAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBlock: {
    marginTop: 28,
  },
  sectionTitleRow: {
    paddingHorizontal: H_PADDING,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
  },
  sectionMeta: {
    fontSize: 11.5,
  },
  sectionAction: {
    fontSize: 12.5,
  },
  categoryRow: {
    paddingHorizontal: H_PADDING,
    gap: 12,
  },
  categoryItem: {
    width: 60,
    alignItems: "center",
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  categoryEmoji: {
    fontSize: 29,
  },
  categoryLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  recentRow: {
    paddingHorizontal: H_PADDING,
    gap: 12,
    paddingBottom: 5,
  },
  recentCard: {
    width: 174,
    minHeight: 126,
    padding: 14,
    borderWidth: 1,
    borderRadius: 20,
    ...SHADOWS.md,
  },
  recentCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentClockWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  recentLabel: {
    marginLeft: 8,
    fontSize: 10.5,
  },
  recentQuery: {
    fontSize: 20,
    lineHeight: 25,
    textTransform: "capitalize",
    marginTop: 11,
  },
  recentCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  recentActionText: {
    fontSize: 11,
  },
  recentArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  firstCompareCard: {
    marginHorizontal: H_PADDING,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  firstCompareIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  browseGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
  },
  browseCardWrapper: {
    width: "19%",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  browseIconWrap: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  browseLogoImg: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  browseName: {
    ...FONTS.caption,
    fontSize: 12,
    fontWeight: "600",
    width: 68,
    textAlign: "center",
  },
  optimizerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optimizerTitle: {
    ...FONTS.h3,
    fontSize: 18,
  },
  optimizerSubtitle: {
    ...FONTS.caption,
    marginTop: 2,
  },
  optimizerHint: {
    ...FONTS.caption,
    marginTop: SPACING.md,
    fontStyle: "italic",
  },
  optimizerLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  optimizerLoadingText: { ...FONTS.body },
  optimizerErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  optimizerErrorText: { ...FONTS.body, flex: 1 },
  optimizerResultCard: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: SPACING.lg,
  },
  savingsAmount: { fontSize: 20, fontWeight: "800", color: "#fff" },
  savingsCompare: { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  noSavingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: SPACING.lg,
  },
  noSavingsText: { ...FONTS.bodyBold },
  optimizerRecommendation: {
    ...FONTS.body,
    fontSize: 13,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  optimizerSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  optimizerSplitPlatform: { ...FONTS.bodyBold, fontSize: 14 },
  optimizerSplitItems: { ...FONTS.caption, marginTop: 2 },
  optimizerSplitCosts: { alignItems: "flex-end" },
  optimizerSplitSubtotal: { ...FONTS.bodyBold },
  optimizerSplitDelivery: { ...FONTS.caption },
  optimizerDismissBtn: { padding: SPACING.md, alignItems: "center" },
  optimizerDismissText: { ...FONTS.body, fontSize: 13 },
});

export default HomeScreen;
