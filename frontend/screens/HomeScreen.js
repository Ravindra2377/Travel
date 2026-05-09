import React, { useContext } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from "../config/theme";
import * as Haptics from "expo-haptics";

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
});

export default HomeScreen;
