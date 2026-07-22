import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "../components/Icon";
import { WishlistContext } from "../context/WishlistContext";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import ScreenHeader from "../components/ScreenHeader";
import { useNavigation } from "@react-navigation/native";
import GroqService from "../services/GroqService";
import * as Haptics from "expo-haptics";

const PLATFORM_COLORS = {
  Blinkit: "#F8CB46",
  Zepto: "#7C3AED",
  BigBasket: "#84C225",
  Amazon: "#FF9900",
  Flipkart: "#2874F0",
};

const WishlistScreen = () => {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const navigation = useNavigation();
  const { themeColors, isDark } = useTheme();
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [optimizeError, setOptimizeError] = useState("");

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

  const renderProductItem = ({ item }) => {
    const price = item.price || (item.listings && item.listings[0]?.price);
    const brand = item.brand || "Product";
    const name = item.name || item.title;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <Image
          source={{ uri: item.image_url || item.image }}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.content}>
          <Text style={[FONTS.monoBold, { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: themeColors.aubergine, marginBottom: 2 }]}>{brand}</Text>
          <Text style={[FONTS.uiBodyBold, { fontSize: 14, color: themeColors.ink, lineHeight: 20 }]} numberOfLines={2}>{name}</Text>
          <View style={styles.footer}>
            <Text style={[FONTS.monoBold, { fontSize: 17, color: themeColors.coriander }]}>₹{price}</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleWishlist(item);
              }}
              style={styles.removeBtn}
            >
              <Ionicons name="heart" size={24} color={themeColors.tomato} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: themeColors.tomatoSoft, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Ionicons name="heart" size={30} color={themeColors.tomato} />
      </View>
      <Text style={[FONTS.heading, { fontSize: 19, color: themeColors.ink, marginBottom: 8 }]}>Nothing saved yet</Text>
      <Text style={[FONTS.uiBody, { fontSize: 13, color: themeColors.inkSoft, textAlign: "center", lineHeight: 20, marginBottom: 22 }]}>
        Tap the heart on any product to keep it here and compare later.
      </Text>
      <TouchableOpacity
        style={[styles.exploreBtn, { backgroundColor: themeColors.ink }]}
        onPress={() => navigation.navigate("Search")}
      >
        <Text style={[FONTS.uiBodyBold, { color: "#fff", fontSize: 15 }]}>Explore products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>

        <ScreenHeader
          title="Liked products"
          subtitle={`${wishlist.length} ${wishlist.length === 1 ? "item" : "items"} saved`}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          leftAlign={true}
          rightComponent={
            wishlist.length >= 2 ? (
              <TouchableOpacity
                style={[styles.optimizeBtn, { backgroundColor: themeColors.ink, borderRadius: 99, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 }]}
                onPress={handleOptimize}
                disabled={optimizing}
                activeOpacity={0.85}
              >
                {optimizing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                    <Text style={[FONTS.uiBodyBold, { color: "#fff", fontSize: 13 }]}>Optimize</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Basket Optimizer result card */}
        {optimizing && (
          <View style={[styles.optimizerLoadingCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <ActivityIndicator color={themeColors.primary} />
            <Text style={[styles.optimizerLoadingText, { color: themeColors.textPrimary }]}>
              AI calculating cheapest basket split...
            </Text>
          </View>
        )}

        {optimizeError ? (
          <View style={[styles.errorCard, { backgroundColor: themeColors.errorLight, borderColor: themeColors.error }]}>
            <Ionicons name="alert-circle-outline" size={16} color={themeColors.error} />
            <Text style={[styles.errorText, { color: themeColors.error }]}>{optimizeError}</Text>
          </View>
        ) : null}

        {optimization && !optimizing && (
          <View style={[styles.resultCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            {/* Savings banner */}
            {optimization.savings > 0 ? (
              <View style={[styles.savingsBanner, { backgroundColor: themeColors.corianderSoft }]}>
                <Ionicons name="trending-down" size={20} color={themeColors.coriander} />
                <View style={{ flex: 1 }}>
                  <Text style={[FONTS.monoBold, { fontSize: 18, color: themeColors.coriander }]}>
                    ₹{Math.round(optimization.savings)}
                  </Text>
                  <Text style={[FONTS.uiBody, { fontSize: 11.5, color: themeColors.coriander }]}>
                    ₹{Math.round(optimization.totalOptimized)} optimized vs ₹{Math.round(optimization.totalSingleBest)} from one platform
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.noSavingsBanner, { backgroundColor: themeColors.corianderSoft }]}>
                <Ionicons name="checkmark-circle" size={18} color={themeColors.coriander} />
                <Text style={[FONTS.uiBodyBold, { color: themeColors.coriander }]}>Your basket is already optimized!</Text>
              </View>
            )}

            {/* Recommendation */}
            {optimization.recommendation ? (
              <Text style={[styles.recommendation, { color: themeColors.textPrimary }]}>
                ✨ {optimization.recommendation}
              </Text>
            ) : null}

            {/* Platform splits */}
            {(optimization.splits || []).map((split, i) => (
              <View key={i} style={[styles.splitRow, { borderBottomColor: themeColors.border }]}>
                <View
                  style={[
                    styles.platformDot,
                    { backgroundColor: PLATFORM_COLORS[split.platform] || themeColors.primary },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.splitPlatform, { color: themeColors.textPrimary }]}>{split.platform}</Text>
                  <Text style={[styles.splitItems, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {(split.items || []).join(", ")}
                  </Text>
                </View>
                <View style={styles.splitCosts}>
                  <Text style={[styles.splitSubtotal, { color: themeColors.textPrimary }]}>₹{Math.round(split.subtotal || 0)}</Text>
                  <Text style={[styles.splitDelivery, { color: themeColors.textTertiary }]}>+₹{split.deliveryFee || 40} delivery</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setOptimization(null)}
            >
              <Text style={[styles.dismissText, { color: themeColors.primary }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={wishlist}
          renderItem={renderProductItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  headerTitle: {
    ...FONTS.h1,
    fontSize: 24,
  },
  headerSubtitle: {
    ...FONTS.caption,
    marginTop: 2,
  },
  optimizeBtn: {
    borderRadius: RADIUS.full,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  optimizeBtnGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optimizeBtnText: {
    ...FONTS.bodyBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "space-between",
  },
  brand: {
    ...FONTS.eyebrow,
    fontSize: 10,
  },
  name: {
    ...FONTS.bodyBold,
    fontSize: 15,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    ...FONTS.h3,
    fontSize: 18,
  },
  removeBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    ...FONTS.h2,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...FONTS.body,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  exploreBtn: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  exploreBtnText: {
    ...FONTS.bodyBold,
    color: "#FFFFFF",
  },
  optimizerLoadingCard: {
    margin: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    ...SHADOWS.sm,
  },
  optimizerLoadingText: {
    ...FONTS.bodyBold,
    textAlign: "center",
  },
  resultCard: {
    margin: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: 12,
  },
  savingsAmount: {
    ...FONTS.h2,
    color: "#FFFFFF",
    fontSize: 22,
  },
  savingsCompare: {
    ...FONTS.caption,
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    marginTop: 1,
  },
  noSavingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: 10,
  },
  noSavingsText: {
    ...FONTS.bodyBold,
    fontSize: 14,
  },
  recommendation: {
    ...FONTS.body,
    padding: SPACING.lg,
    lineHeight: 22,
    fontSize: 14,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: 12,
  },
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  splitPlatform: {
    ...FONTS.bodyBold,
    fontSize: 14,
  },
  splitItems: {
    ...FONTS.caption,
    fontSize: 12,
    marginTop: 1,
  },
  splitCosts: {
    alignItems: "flex-end",
  },
  splitSubtotal: {
    ...FONTS.bodyBold,
    fontSize: 14,
  },
  splitDelivery: {
    ...FONTS.caption,
    fontSize: 10,
  },
  dismissBtn: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  dismissText: {
    ...FONTS.bodyBold,
  },
  errorCard: {
    margin: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    ...FONTS.captionBold,
  },
});

export default WishlistScreen;
