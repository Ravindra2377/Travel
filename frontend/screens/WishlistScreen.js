import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WishlistContext } from "../context/WishlistContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
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
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <Image
          source={{ uri: item.image_url || item.image }}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.content}>
          <Text style={styles.brand}>{brand}</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <View style={styles.footer}>
            <Text style={styles.price}>₹{price}</Text>
            <TouchableOpacity
              onPress={() => toggleWishlist(item)}
              style={styles.removeBtn}
            >
              <Ionicons name="heart" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="heart-outline" size={60} color={COLORS.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Save products you like to compare them later.
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => navigation.navigate("Search")}
      >
        <Text style={styles.exploreBtnText}>Explore Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Liked Products</Text>
            <Text style={styles.headerSubtitle}>
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
            </Text>
          </View>
          {wishlist.length >= 2 && (
            <TouchableOpacity
              style={styles.optimizeBtn}
              onPress={handleOptimize}
              disabled={optimizing}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={COLORS.gradientAccent}
                style={styles.optimizeBtnGradient}
              >
                {optimizing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                    <Text style={styles.optimizeBtnText}>Optimize</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Basket Optimizer result card */}
        {optimizing && (
          <View style={styles.optimizerLoadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.optimizerLoadingText}>
              AI calculating cheapest basket split...
            </Text>
          </View>
        )}

        {optimizeError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{optimizeError}</Text>
          </View>
        ) : null}

        {optimization && !optimizing && (
          <View style={styles.resultCard}>
            {/* Savings banner */}
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

            {/* Recommendation */}
            {optimization.recommendation ? (
              <Text style={styles.recommendation}>
                ✨ {optimization.recommendation}
              </Text>
            ) : null}

            {/* Platform splits */}
            {(optimization.splits || []).map((split, i) => (
              <View key={i} style={styles.splitRow}>
                <View
                  style={[
                    styles.platformDot,
                    { backgroundColor: PLATFORM_COLORS[split.platform] || COLORS.primary },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.splitPlatform}>{split.platform}</Text>
                  <Text style={styles.splitItems} numberOfLines={1}>
                    {(split.items || []).join(", ")}
                  </Text>
                </View>
                <View style={styles.splitCosts}>
                  <Text style={styles.splitSubtotal}>₹{Math.round(split.subtotal || 0)}</Text>
                  <Text style={styles.splitDelivery}>+₹{split.deliveryFee || 40} delivery</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => setOptimization(null)}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={wishlist}
          renderItem={renderProductItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  headerTitle: { ...FONTS.h1, fontSize: 28 },
  headerSubtitle: { ...FONTS.caption, marginTop: 4 },
  optimizeBtn: { borderRadius: RADIUS.full, overflow: "hidden" },
  optimizeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 6,
  },
  optimizeBtnText: { ...FONTS.bodyBold, color: "#fff", fontSize: 13 },
  optimizerLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.violetLight,
    borderRadius: RADIUS.lg,
  },
  optimizerLoadingText: { ...FONTS.body, color: COLORS.primary },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
  },
  errorText: { ...FONTS.body, color: COLORS.error, flex: 1 },
  resultCard: {
    margin: SPACING.md,
    backgroundColor: "#fff",
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.md,
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
  recommendation: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  platformDot: { width: 10, height: 10, borderRadius: 5 },
  splitPlatform: { ...FONTS.bodyBold, color: COLORS.textPrimary, fontSize: 14 },
  splitItems: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  splitCosts: { alignItems: "flex-end" },
  splitSubtotal: { ...FONTS.bodyBold, color: COLORS.textPrimary },
  splitDelivery: { ...FONTS.caption, color: COLORS.textTertiary },
  dismissBtn: { padding: SPACING.md, alignItems: "center" },
  dismissText: { ...FONTS.body, color: COLORS.textTertiary, fontSize: 13 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  image: { width: 80, height: 80, borderRadius: RADIUS.md },
  content: { flex: 1, marginLeft: SPACING.md, justifyContent: "center" },
  brand: {
    ...FONTS.captionBold,
    textTransform: "uppercase",
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  name: {
    ...FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { ...FONTS.priceSmall, color: COLORS.primary },
  removeBtn: { padding: 4 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  emptyTitle: { ...FONTS.h2, marginBottom: SPACING.sm },
  emptySubtitle: {
    ...FONTS.body,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: SPACING.xxl,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.colored(COLORS.primary),
  },
  exploreBtnText: { ...FONTS.bodyBold, color: "#FFFFFF" },
});

export default WishlistScreen;
