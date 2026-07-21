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
import { Ionicons } from "../components/Icon";
import { AuthContext } from "../context/AuthContext";
import { SPACING, RADIUS, SHADOWS, FONTS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";
import { WishlistContext } from "../context/WishlistContext";
import GroqService from "../services/GroqService";
import { AppButton, SurfaceCard, SavingsReceiptCard, StatStrip, Chip } from "../components/SharedUI";
import ScreenHeader from "../components/ScreenHeader";
import LocationPickerModal from "../components/LocationPickerModal";
import LocationService from "../services/LocationService";

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
  const { themeColors, isDark } = useTheme();

  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [optimizeError, setOptimizeError] = useState("");
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [currentPincode, setCurrentPincode] = useState("");

  const fadeHero = React.useRef(new Animated.Value(0)).current;
  const fadeContent = React.useRef(new Animated.Value(0)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>


        <ScreenHeader 
          leftAlign={true}
          backgroundColor={themeColors.paper}
          centerComponent={
            <View>
              <Text style={[FONTS.heading, { fontSize: 22, color: themeColors.ink, letterSpacing: -0.5 }]}>CompareZ</Text>
              <TouchableOpacity 
                style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLocationModalVisible(true);
                }}
              >
                <Ionicons name="location" size={12} color={themeColors.inkSoft} />
                <Text style={[FONTS.uiBody, { color: themeColors.inkSoft, fontSize: 13, marginLeft: 4, marginRight: 4 }]}>
                  {currentCity ? `${currentCity} ${currentPincode}` : "Set Location"}
                </Text>
                <Ionicons name="chevron-down" size={12} color={themeColors.inkFaint} />
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* ── Hero Section (Paper Theme) ── */}
          <Animated.View style={slideUp(fadeHero)}>
            <View style={{ paddingBottom: 30 }}>


              {/* Main headline */}
              <View style={{ paddingHorizontal: H_PADDING, marginTop: 14 }}>
                <Text style={[FONTS.monoBold, { color: themeColors.aubergine, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase" }]}>
                  Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user?.name || user?.email?.split("@")[0] || "Explorer"}
                </Text>
                <Text style={[FONTS.heading, { color: themeColors.ink, fontSize: 38, lineHeight: 40, marginVertical: 10 }]}>
                  Save on{"\n"}every cart.
                </Text>
                <Text style={[FONTS.uiBody, { color: themeColors.inkSoft, fontSize: 13.5, lineHeight: 21, maxWidth: 270, marginBottom: 20 }]}>
                  One search checks Blinkit, Zepto, BigBasket & more — Beans finds the best price for you.
                </Text>
                <AppButton
                  label="Start comparing"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate("Search");
                  }}
                  rightIcon="arrow-forward"
                  style={{ alignSelf: "flex-start", minHeight: 48 }}
                  textStyle={{ color: "#fff" }}
                />
              </View>
            </View>

            {/* Savings receipt — signature element */}
            {/*   <View style={{ paddingHorizontal: H_PADDING, marginTop: 10, zIndex: 3 }}>
              <SavingsReceiptCard amount="1,240.50">
                <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: -20 }}>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ backgroundColor: themeColors.corianderSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="trend" size={12} color={themeColors.coriander} />
                      <Text style={[FONTS.uiBodyBold, { fontSize: 11, color: themeColors.coriander, marginLeft: 2 }]}>+18%</Text>
                    </View>
                    <Text style={[FONTS.uiBody, { fontSize: 11, color: themeColors.inkFaint, marginTop: 6 }]}>vs. last month</Text>
                  </View>
                </View>
              </SavingsReceiptCard>
            </View> */}

            {/* Stat strip */}
            <View style={{ paddingHorizontal: H_PADDING, marginTop: SPACING.lg }}>
              <StatStrip 
                stats={[
                  { value: "5-in-1", label: "Search" },
                  { value: "Live", label: "Price sync" },
                  { value: "Best", label: "Price, always" }
                ]} 
              />
            </View>
          </Animated.View>

          {/* ── Content Section ── */}
          <Animated.View style={[styles.lightSection, slideUp(fadeContent)]}>
            {/* ── Browse Directly Section ── */}
            <View style={{ paddingHorizontal: H_PADDING }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={[FONTS.heading, { fontSize: 19, color: themeColors.ink }]}>Browse directly</Text>
                </View>
              <Text style={[FONTS.uiBody, { fontSize: 12.5, color: themeColors.inkSoft, marginBottom: 14 }]}>
                Jump straight into a connected platform
              </Text>
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
    color: "#fff",
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
    color: "#fff",
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

  // ── Light Section ──
  lightSection: {
    paddingTop: SPACING.xxl,
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
    alignItems: "flex-start",
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
    width: 60,
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
