import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from "../config/theme";
import * as Haptics from "expo-haptics";
import { WishlistContext } from "../context/WishlistContext";
import GroqService from "../services/GroqService";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const H_PADDING = SPACING.xl;

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
    source: {
      uri: "https://www.google.com/s2/favicons?sz=256&domain=zeptonow.com",
    },
    url: "https://www.zepto.com/",
  },
  {
    id: "5",
    name: "BigBasket",
    source: require("../assets/bigbasket-logo.png"),
    url: "https://www.bigbasket.com/",
  },
];

// --- Sub-components ---

const BrowseCard = ({ item, navigation }) => (
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
    <Text style={styles.browseName}>{item.name}</Text>
  </TouchableOpacity>
);

// --- Main Screen ---

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { wishlist } = useContext(WishlistContext);

  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [optimizeError, setOptimizeError] = useState("");

  const fadeHero = React.useRef(new Animated.Value(0)).current;
  const fadeContent = React.useRef(new Animated.Value(0)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
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
    opacity: 1, // Fix Detox visibility issue
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* ── Dark Hero Section (inspired by luxury splash) ── */}
          <Animated.View style={slideUp(fadeHero)}>
            <LinearGradient
              colors={COLORS.gradientHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.3, y: 1 }}
              style={styles.hero}
            >
              {/* Top bar */}
              <View style={styles.heroTop}>
                <Text style={styles.heroEyebrow}>CompareZ</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={COLORS.textOnDarkSec}
                  />
                </TouchableOpacity>
              </View>

              {/* Main headline */}
              <View style={styles.heroContent}>
                <Text style={styles.heroGreeting}>
                  {new Date().getHours() < 12
                    ? "Good Morning"
                    : new Date().getHours() < 17
                    ? "Good Afternoon"
                    : "Good Evening"}
                  , {user?.name || user?.email?.split("@")[0] || "Explorer"}!
                </Text>
                <Text style={styles.heroTitle}>Save on{"\n"}Every Cart</Text>
                <Text style={styles.heroSubtitle}>
                  Compare prices across Blinkit, Zepto, BigBasket{"\n"}and more
                  — all in one search.
                </Text>
              </View>

              {/* Stats row */}
              <Animated.View
                style={[
                  styles.statsRow,
                  {
                    transform: [
                      {
                        translateY: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-4, 4],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("Accounts");
                  }}
                >
                  <Ionicons
                    name="apps-outline"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.statValue}>5-in-1</Text>
                  <Text style={styles.statLabel}>Search</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons
                    name="sync-outline"
                    size={16}
                    color="rgba(255,255,255,0.6)"
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.statValue}>Live</Text>
                  <Text style={styles.statLabel}>Sync</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons
                    name="wallet-outline"
                    size={16}
                    color={COLORS.secondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.statValue, { color: COLORS.secondary }]}>
                    Best
                  </Text>
                  <Text style={styles.statLabel}>Price</Text>
                </View>
              </Animated.View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate("Search");
                }}
                testID="homeSearchCta"
              >
                <Text style={styles.ctaText}>Start Comparing</Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.textPrimary}
                />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* ── Light Collection Section ── */}
          <Animated.View style={[styles.lightSection, slideUp(fadeContent)]}>
            {/* ── Browse Directly Section ── */}
            <View
              style={[
                styles.sectionHeader,
                { marginTop: SPACING.xl, marginBottom: SPACING.md },
              ]}
            >
              <View>
                <Text style={styles.sectionTitle}>
                  Browse Directly: All in One
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Browse directly on top platforms without installing the app
                </Text>
              </View>
            </View>

            <View style={styles.browseGrid}>
              {DIRECT_PLATFORMS.map((item) => (
                <BrowseCard key={item.id} item={item} navigation={navigation} />
              ))}
            </View>
          </Animated.View>

          {/* ── AI Basket Optimizer Card ── */}
          <Animated.View style={[{ paddingHorizontal: H_PADDING, marginTop: SPACING.xl }, slideUp(fadeContent)]}>
            <View style={styles.optimizerContainer}>
              <View style={styles.optimizerHeaderRow}>
                <Ionicons name="basket" size={24} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.optimizerTitle}>Smart Basket Optimizer</Text>
                  <Text style={styles.optimizerSubtitle}>
                    {wishlist.length} {wishlist.length === 1 ? "item" : "items"} liked
                  </Text>
                </View>
                {wishlist.length >= 2 && !optimization && !optimizing && (
                  <TouchableOpacity
                    style={styles.optimizeBtn}
                    onPress={handleOptimize}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={COLORS.gradientAccent}
                      style={styles.optimizeBtnGradient}
                    >
                      <Ionicons name="sparkles" size={14} color="#fff" />
                      <Text style={styles.optimizeBtnText}>Optimize</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {wishlist.length < 2 && (
                <Text style={styles.optimizerHint}>
                  Add at least 2 items to your Likes to find the cheapest way to buy them across platforms.
                </Text>
              )}

              {optimizing && (
                <View style={styles.optimizerLoadingCard}>
                  <ActivityIndicator color={COLORS.primary} />
                  <Text style={styles.optimizerLoadingText}>
                    AI calculating cheapest split...
                  </Text>
                </View>
              )}

              {optimizeError ? (
                <View style={styles.optimizerErrorCard}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                  <Text style={styles.optimizerErrorText}>{optimizeError}</Text>
                </View>
              ) : null}

              {optimization && !optimizing && (
                <View style={styles.optimizerResultCard}>
                  {optimization.savings > 0 ? (
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
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
                    <View style={styles.noSavingsBanner}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.savings} />
                      <Text style={styles.noSavingsText}>Your basket is already optimized!</Text>
                    </View>
                  )}

                  {optimization.recommendation ? (
                    <Text style={styles.optimizerRecommendation}>
                      ✨ {optimization.recommendation}
                    </Text>
                  ) : null}

                  {(optimization.splits || []).map((split, i) => (
                    <View key={i} style={styles.optimizerSplitRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optimizerSplitPlatform}>{split.platform}</Text>
                        <Text style={styles.optimizerSplitItems} numberOfLines={1}>
                          {(split.items || []).join(", ")}
                        </Text>
                      </View>
                      <View style={styles.optimizerSplitCosts}>
                        <Text style={styles.optimizerSplitSubtotal}>₹{Math.round(split.subtotal || 0)}</Text>
                        <Text style={styles.optimizerSplitDelivery}>+₹{split.deliveryFee || 40} delivery</Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.optimizerDismissBtn}
                    onPress={() => setOptimization(null)}
                  >
                    <Text style={styles.optimizerDismissText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Extra space to ensure last cards are fully visible above floating navbar */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ── Hero (Vibrant gradient section) ──
  hero: {
    minHeight: SCREEN_H * 0.52,
    paddingTop: SPACING.xl,
    paddingHorizontal: H_PADDING,
    paddingBottom: SPACING.xxxl,
    justifyContent: "space-between",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  heroEyebrow: {
    ...FONTS.eyebrow,
    fontSize: 10,
    opacity: 0.8,
  },

  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    marginBottom: SPACING.xxxl,
  },
  heroGreeting: {
    fontFamily: "AvenirNext-Bold",
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  heroTitle: {
    ...FONTS.luxury,
    fontSize: 34,
    lineHeight: 40,
    marginBottom: 16,
  },
  heroSubtitle: {
    ...FONTS.luxurySub,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...FONTS.h2Dark,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...FONTS.captionDark,
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: SPACING.xs,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    height: 56,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },

  // ── Light Section ──
  lightSection: {
    paddingTop: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PADDING,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h3,
  },
  seeAll: {
    ...FONTS.captionBold,
    color: COLORS.textAccent,
  },

  sectionSubtitle: {
    ...FONTS.caption,
    marginTop: 2,
  },

  // ── Search CTA ──
  searchCta: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PADDING,
    height: 56, // Standardized with search bar
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchCtaText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    flex: 1,
  },

  // ── Browse Directly ──
  browseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: H_PADDING,
    marginTop: SPACING.sm,
  },
  browseCardWrapper: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  browseIconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  browseLogoImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  browseName: {
    ...FONTS.caption,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  optimizerContainer: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  optimizerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optimizerTitle: {
    ...FONTS.h3,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  optimizerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  optimizeBtn: { borderRadius: RADIUS.full, overflow: "hidden" },
  optimizeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 6,
  },
  optimizeBtnText: { ...FONTS.bodyBold, color: "#fff", fontSize: 13 },
  optimizerHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
    fontStyle: "italic",
  },
  optimizerLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.violetLight,
    borderRadius: RADIUS.lg,
  },
  optimizerLoadingText: { ...FONTS.body, color: COLORS.primary },
  optimizerErrorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
  },
  optimizerErrorText: { ...FONTS.body, color: COLORS.error, flex: 1 },
  optimizerResultCard: {
    marginTop: SPACING.lg,
    backgroundColor: "#fff",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.savingsLight,
  },
  noSavingsText: { ...FONTS.bodyBold, color: COLORS.savings },
  optimizerRecommendation: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optimizerSplitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optimizerSplitPlatform: { ...FONTS.bodyBold, color: COLORS.textPrimary, fontSize: 14 },
  optimizerSplitItems: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  optimizerSplitCosts: { alignItems: "flex-end" },
  optimizerSplitSubtotal: { ...FONTS.bodyBold, color: COLORS.textPrimary },
  optimizerSplitDelivery: { ...FONTS.caption, color: COLORS.textTertiary },
  optimizerDismissBtn: { padding: SPACING.md, alignItems: "center" },
  optimizerDismissText: { ...FONTS.body, color: COLORS.textTertiary, fontSize: 13 },
});

export default HomeScreen;
