import React, { useCallback, useMemo, useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { buildPlatformSearchUrl } from "../config/utils";
import PlatformRow from "../components/PlatformRow";
import { WishlistContext } from "../context/WishlistContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import * as Haptics from "expo-haptics";
import GroqService from "../services/GroqService";

const extractQuantity = (text) => {
  const compact = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const match = compact.match(
    /\b\d+(?:\.\d+)?\s*(?:kg|g|gm|grams?|ml|l|ltr|litre|litres|pcs?|pc|pack|pouch|bottle)\b/i,
  );
  return match ? match[0] : "";
};

const extractRatingInfo = (text) => {
  const compact = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return { rating: 0, ratingCount: 0 };

  const match = compact.match(
    /\b([0-5](?:\.[0-9])?)\b\s*(?:\((\d+(?:\.\d+)?)\s*([kKmM]?)\)|⭐|stars?|\/5)?/i,
  );

  if (!match) return { rating: 0, ratingCount: 0 };

  const rating = parseFloat(match[1] || "0");
  if (!Number.isFinite(rating) || rating <= 0 || rating > 5) {
    return { rating: 0, ratingCount: 0 };
  }

  let ratingCount = 0;
  if (match[2]) {
    const base = parseFloat(match[2]) || 0;
    const unit = String(match[3] || "").toLowerCase();
    ratingCount =
      unit === "k"
        ? Math.round(base * 1000)
        : unit === "m"
          ? Math.round(base * 1000000)
          : Math.round(base);
  }

  return { rating, ratingCount };
};

const cleanDisplayText = (text) => {
  if (!text) return "";

  let cleaned = String(text)
    .replace(/\u00a0/g, " ")
    // Split camelCase words
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Split numbers from letters
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    // Remove clearly transactional or meta-data junk
    .replace(/\b(add|buy\s*now|qty|view\s*more|off)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*[kK]?\s*(?:Ratings?|Reviews?).*$/i, "") // Only strip if it looks like "4.5 1k Ratings"
    .replace(/₹\s*[0-9]+(?:\.[0-9]+)?/gi, " ") // Remove price mentions
    .replace(/\b\d+\s*mins?\b/gi, " ") // Remove "10 min" badges
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Repair common fragmentation like "Go d rej"
  for (let i = 0; i < 2; i += 1) {
    cleaned = cleaned.replace(
      /\b([A-Za-z]{2,})\s([A-Za-z])\s([A-Za-z]{2,})\b/g,
      "$1$2$3",
    );
  }

  return cleaned.replace(/\s+/g, " ").trim();
};

const pickDisplayTitle = (productName, listings = []) => {
  const candidates = [
    cleanDisplayText(productName),
    ...listings.map((l) => cleanDisplayText(l?.productName || "")),
  ].filter(Boolean);

  if (!candidates.length) return "Product";

  const scored = candidates.map((name) => {
    const words = name.split(/\s+/).filter(Boolean);
    const singleCharTokens = words.filter((w) => w.length === 1).length;
    const hasQuantity = extractQuantity(name) ? 1 : 0;
    const noisePenalty = /\b(add|mins?|₹)\b/i.test(name) ? 3 : 0;

    return {
      name,
      score:
        singleCharTokens * 10 +
        noisePenalty * 8 +
        Math.max(0, words.length - 11) * 2 -
        hasQuantity * 4,
    };
  });

  scored.sort((a, b) => a.score - b.score || a.name.length - b.name.length);
  return scored[0].name;
};

const extractLabeledPriceHints = (rawText) => {
  const compact = String(rawText || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) {
    return { price: 0, mrp: 0 };
  }

  const priceMatch = compact.match(
    /\bprice\b\s*:?\s*₹\s*([0-9]+(?:\.[0-9]+)?)/i,
  );
  const mrpMatch = compact.match(/\bmrp\b\s*:?\s*₹\s*([0-9]+(?:\.[0-9]+)?)/i);

  return {
    price: priceMatch?.[1] ? parseFloat(priceMatch[1]) : 0,
    mrp: mrpMatch?.[1] ? parseFloat(mrpMatch[1]) : 0,
  };
};

const normalizeListingPrice = (listing) => {
  let price = Number(listing?.price || 0);
  let mrp = Number(listing?.mrp || 0);
  const discountValue = Number(
    listing?.discount_value || listing?.discountValue || 0,
  );
  const discountPercent = Number(
    listing?.discount_percent || listing?.discountPercent || 0,
  );
  const labeledHints = extractLabeledPriceHints(
    listing?.raw_text || listing?.rawText || "",
  );

  if (labeledHints.price > 0) {
    price = labeledHints.price;
  }

  if (labeledHints.mrp > 0) {
    mrp = labeledHints.mrp;
  }

  // Price validation: reject extreme outliers
  // If price has extreme discount (>90%), it's likely a parsing error
  // Use MRP as fallback in such cases
  if (mrp > 0 && price > 0) {
    const discountRatio = ((mrp - price) / mrp) * 100;
    if (discountRatio > 90) {
      return mrp;
    }
  }

  if (mrp > 0 && discountValue > 0 && Math.abs(price - discountValue) < 0.51) {
    const derived = Math.round((mrp - discountValue) * 100) / 100;
    if (derived > 0) return derived;
  }

  if (mrp > 0 && discountPercent > 0 && discountPercent < 100) {
    const discountAmount =
      Math.round(((mrp * discountPercent) / 100) * 100) / 100;
    if (Math.abs(price - discountAmount) < 0.75) {
      const derived = Math.round((mrp - discountAmount) * 100) / 100;
      if (derived > 0) return derived;
    }
  }

  return price > 0 ? price : 0;
};

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params || {};
  const { toggleWishlist, isLiked } = useContext(WishlistContext);
  const liked = isLiked(product?.id);

  // ── AI Deal Insight ───────────────────────────────────────────────────
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const listings = product?.listings || [];
    const priceList = listings
      .filter((l) => l.price > 0 && l.in_stock !== false)
      .map((l) => ({ platform: l.platform, price: Number(l.price) }));

    if (priceList.length < 2) return; // Need at least 2 platforms to compare

    setLoadingInsight(true);
    GroqService.getDealAnalysis({ name: product?.name || "this product", prices: priceList })
      .then((insight) => setAiInsight(insight))
      .catch((e) => console.log("[AI Deal] Skipped:", e.message))
      .finally(() => setLoadingInsight(false));
  }, [product?.id]);
  // ─────────────────────────────────────────────────────────────

  const rawListings = product?.listings || [];

  const allPlatforms = rawListings.map((listing) => {
    const rawText = String(listing.raw_text || "");
    const productName = cleanDisplayText(
      listing.raw_product_name || listing.product_name || product?.name || "",
    );
    const quantity =
      String(listing.quantity || listing.weight || "").trim() ||
      extractQuantity(rawText) ||
      extractQuantity(productName);

    const explicitRating = Number(listing.rating || 0);
    const explicitRatingCount = Number(listing.rating_count || 0);
    const parsedRating = extractRatingInfo(rawText || productName);

    return {
      name: listing.platform,
      price: normalizeListingPrice(listing),
      mrp: listing.mrp || 0,
      productName,
      quantity,
      rating: explicitRating > 0 ? explicitRating : parsedRating.rating,
      ratingCount:
        explicitRatingCount > 0
          ? explicitRatingCount
          : parsedRating.ratingCount,
      discountPercent: Number(listing.discount_percent || 0),
      discountValue: Number(listing.discount_value || 0),
      rawText,
      deliveryTime: listing.delivery_time || "",
      deliveryCharge: listing.delivery_charge || 0,
      inStock: listing.in_stock !== false && listing.price > 0,
      productUrl: listing.product_url || listing.deep_link || "",
    };
  });

  const available = allPlatforms
    .filter((p) => p.inStock && p.price > 0)
    .sort((a, b) => a.price - b.price);
  const unavailable = allPlatforms.filter((p) => !p.inStock || p.price === 0);
  const sorted = [...available, ...unavailable];

  const displayTitle = React.useMemo(
    () => pickDisplayTitle(product?.name, sorted),
    [product, sorted],
  );

  const referencePrice = React.useMemo(() => {
    return product?.price || available[0]?.price || 0;
  }, [product, available]);

  // Find best (cheapest) price for comparison
  const pricesSorted = [...available].sort((a, b) => a.price - b.price);
  const best = pricesSorted[0]?.price || 0;
  const worst =
    pricesSorted.length > 1 ? pricesSorted[pricesSorted.length - 1].price : 0;
  const saving = worst > best ? worst - best : 0;

  const firstWithQuantity =
    sorted.find((p) => p.quantity)?.quantity ||
    extractQuantity(displayTitle) ||
    sorted.map((p) => extractQuantity(p.rawText)).find(Boolean) ||
    sorted.map((p) => extractQuantity(p.productName)).find(Boolean) ||
    "";
  const firstWithRating = sorted.find((p) => p.rating > 0);
  const displayRating = firstWithRating?.rating || 0;
  const displayRatingCount = firstWithRating?.ratingCount || 0;
  const displayMrp = sorted.reduce(
    (acc, p) => (p.mrp && p.mrp > acc ? p.mrp : acc),
    0,
  );
  const displayDiscountPercent = sorted.reduce(
    (acc, p) =>
      p.discountPercent && p.discountPercent > acc ? p.discountPercent : acc,
    0,
  );
  const displayDiscountValue = sorted.reduce(
    (acc, p) =>
      p.discountValue && p.discountValue > acc ? p.discountValue : acc,
    0,
  );
  const handleOpen = useCallback(
    (p) => {
      const platform = String(p?.name || "").toLowerCase();
      const fallbackWebUrl =
        p?.productUrl || buildPlatformSearchUrl(platform, product?.name || "");

      if (!fallbackWebUrl) {
        console.log(`[ProductDetail] No URL for ${p.name}`);
        Alert.alert("Cannot Open", "No link available for this listing.");
        return;
      }

      console.log(`[ProductDetail] Opening ${p.name}: ${fallbackWebUrl}`);

      // On Android, Linking.openURL with the web URL opens the native app
      // automatically if it's installed (via Android App Links / verified intents).
      // On iOS, the same applies for universal links.
      // This is the simplest and most reliable approach.
      const openInApp = async () => {
        try {
          await Linking.openURL(fallbackWebUrl);
        } catch (err) {
          console.error(`[ProductDetail] Failed to open URL:`, err);
          // If direct URL fails, try Android intent as fallback
          if (Platform.OS === "android") {
            const appPackages = {
              blinkit: "com.grofers.customerapp",
              zepto: "com.zeptoconsumerapp",
              bigbasket: "com.bigbasket.mobileapp",
              amazon: "com.amazon.mShop.android.shopping",
              flipkart: "com.flipkart.android",
            };
            const packageName = appPackages[platform];
            if (packageName) {
              const intentUrl = buildAndroidIntentUrl(
                fallbackWebUrl,
                packageName,
              );
              if (intentUrl) {
                try {
                  await Linking.openURL(intentUrl);
                  return;
                } catch {
                  // Intent also failed
                }
              }
            }
          }
          // Last resort: in-app browser
          navigation.navigate("InAppBrowser", {
            url: fallbackWebUrl,
            title: product?.name || p?.name || "",
            platform: p?.name || "",
          });
        }
      };

      openInApp();
    },
    [product?.name],
  );

  const platformRows = useMemo(
    () =>
      sorted.map((p, i) => (
        <PlatformRow
          key={`${p.name}-${i}`}
          platform={p}
          isCheapest={p.inStock && p.price > 0 && i === 0}
          onOpenStore={() => handleOpen(p)}
        />
      )),
    [handleOpen, sorted],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleWishlist(product);
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? COLORS.primary : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          {product?.image_url ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: product.image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Product summary */}
          <View style={styles.productSection}>
            <Text style={styles.productBrand}>
              {product?.brand || "Product"}
            </Text>
            <Text style={styles.productName}>{displayTitle}</Text>

            <View style={styles.priceRow}>
              {referencePrice > 0 && (
                <Text style={styles.bestPrice}>₹{referencePrice}</Text>
              )}
              {worst > referencePrice && (
                <Text style={styles.worstPrice}>₹{worst}</Text>
              )}
            </View>

            <View style={styles.metaTopRow}>
              <Text style={styles.metaTopItem}>
                Qty: {firstWithQuantity || "—"}
              </Text>
              <Text style={styles.metaTopItem}>
                Rating:{" "}
                {displayRating > 0
                  ? `${displayRating}${displayRatingCount > 0 ? ` (${displayRatingCount})` : ""}`
                  : "—"}
              </Text>
            </View>
          </View>



          {/* Savings */}
          {saving > 0 && (
            <View style={styles.savingsRow}>
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={COLORS.savings}
              />
              <Text style={styles.savingsText}>
                Save ₹{saving} by choosing {pricesSorted[0]?.name}
              </Text>
            </View>
          )}

          {/* AI Deal Insight */}
          {loadingInsight ? (
            <View style={styles.aiInsightCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.aiInsightLoading}>AI analyzing prices...</Text>
            </View>
          ) : aiInsight ? (
            <View style={styles.aiInsightCard}>
              <View style={styles.aiInsightHeader}>
                <Ionicons name="sparkles" size={15} color={COLORS.primary} />
                <Text style={styles.aiInsightTitle}>AI Deal Insight</Text>
              </View>
              <Text style={styles.aiInsightText}>{aiInsight}</Text>
            </View>
          ) : null}



          {/* Platforms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Price across {sorted.length} platforms
            </Text>
            {platformRows}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const buildAndroidIntentUrl = (webUrl, packageName) => {
  if (!webUrl || !packageName) return null;
  try {
    const match = String(webUrl).match(/^https?:\/\/([^/]+)(\/.*)?$/i);
    if (!match) return null;
    const host = match[1];
    const path = match[2] || "/";
    return `intent://${host}${path}#Intent;scheme=https;package=${packageName};end`;
  } catch {
    return null;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  headerTitle: {
    ...FONTS.h3,
    fontWeight: "600",
  },
  productSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg, // Reduced since image is above it now
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  imageContainer: {
    width: "100%",
    height: 250,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  productImage: {
    width: "70%",
    height: "100%",
  },
  productName: {
    ...FONTS.h1,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: SPACING.md,
  },
  productBrand: {
    ...FONTS.eyebrow,
    fontSize: 10,
    marginBottom: SPACING.sm,
  },
  metaTopRow: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  metaTopItem: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  metaInfoRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  metaInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  metaInfoLabel: {
    ...FONTS.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaInfoValue: {
    ...FONTS.bodyBold,
  },
  metaInfoDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
  },
  bestPrice: {
    ...FONTS.price,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  worstPrice: {
    ...FONTS.caption,
    textDecorationLine: "line-through",
    fontSize: 16,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.savingsLight,
    borderRadius: RADIUS.lg,
  },
  savingsText: {
    ...FONTS.captionBold,
    color: COLORS.savings,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.xxl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...FONTS.caption,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.captionBold,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  aiInsightCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardAlt || "#F0F4FF",
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    flexDirection: "column",
    ...SHADOWS.sm,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    gap: 6,
  },
  aiInsightTitle: {
    ...FONTS.captionBold,
    color: COLORS.primary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 5,
  },
  aiInsightText: {
    ...FONTS.body,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  aiInsightLoading: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontSize: 13,
  },
});

export default ProductDetailScreen;
