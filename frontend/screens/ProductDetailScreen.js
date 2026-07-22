import React, { useCallback, useMemo, useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "../components/Icon";
import PlatformRow from "../components/PlatformRow";
import { WishlistContext } from "../context/WishlistContext";
import { SPACING, RADIUS, FONTS } from "../config/theme";
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";
import GroqService from "../services/GroqService";
import { AppButton, Badge, PriceTag, RatingRow } from "../components/SharedUI";

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
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\b(add|buy\s*now|qty|view\s*more|off)\b/gi, " ")
    .replace(/\b\d+(?:\.\d+)?\s*[kK]?\s*(?:Ratings?|Reviews?).*$/i, "")
    .replace(/₹\s*[0-9]+(?:\.[0-9]+)?/gi, " ")
    .replace(/\b\d+\s*mins?\b/gi, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

  if (candidates.length === 0) return productName;
  return candidates.reduce((a, b) => (a.length > b.length ? a : b));
};

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { toggleWishlist, isLiked } = useContext(WishlistContext);
  const { themeColors, isDark } = useTheme();
  const [aiInsight, setAiInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const liked = isLiked(product.id);

  const bestListing = useMemo(() => {
    if (!product.listings?.length) return null;
    return product.listings.reduce((a, b) => (a.price < b.price ? a : b));
  }, [product.listings]);

  const worstListing = useMemo(() => {
    if (!product.listings?.length) return null;
    return product.listings.reduce((a, b) => (a.price > b.price ? a : b));
  }, [product.listings]);

  const savings = worstListing ? worstListing.price - bestListing.price : 0;
  const quantity = extractQuantity(product.name || bestListing?.productName);
  const ratingData = extractRatingInfo(
    product.rating_text || bestListing?.rating_text,
  );
  const displayTitle = pickDisplayTitle(product.name, product.listings);

  useEffect(() => {
    const fetchInsight = async () => {
      setInsightLoading(true);
      try {
        const prompt = `Compare this grocery product across platforms: ${product.name}. Listings: ${product.listings.map((l) => `${l.platform}: ₹${l.price}`).join(", ")}. Give a 1-sentence recommendation on which is the best deal considering delivery time vs price.`;
        const insight = await GroqService.chat([{ role: "user", content: prompt }]);
        setAiInsight(insight);
      } catch (e) {
        setAiInsight("Best price currently found on " + bestListing.platform);
      } finally {
        setInsightLoading(false);
      }
    };
    fetchInsight();
  }, [product]);

  const handleBuyNow = useCallback(() => {
    const url = bestListing?.url || bestListing?.product_url;
    if (!url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url).catch(() => {
      navigation.navigate("InAppBrowser", { 
        url: url, 
        platform: bestListing.platform,
        title: displayTitle
      });
    });
  }, [bestListing, displayTitle, navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
        <ScreenHeader
          title="Product Details"
          showBack={true}
          onBackPress={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              style={[styles.wishlistButton, { backgroundColor: themeColors.card, borderColor: themeColors.line, borderWidth: 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleWishlist(product);
              }}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={24}
                color={liked ? themeColors.tomato : themeColors.inkSoft}
              />
            </TouchableOpacity>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={[styles.imageSection, { backgroundColor: themeColors.turmericSoft }]}>
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>

          {/* Info Section */}
          <View style={styles.productSection}>
            <View style={styles.metaTopRow}>
              {product.brand ? (
                <Text style={[styles.productBrand, { color: themeColors.primary }]}>
                  {product.brand}
                </Text>
              ) : null}
              <View style={{ flex: 1 }} />
              {quantity ? (
                <Badge label={quantity} bgColor={themeColors.cardAlt} color={themeColors.textSecondary} />
              ) : null}
            </View>

            <Text style={[FONTS.heading, { fontSize: 21, color: themeColors.ink, marginBottom: 8 }]}>{displayTitle}</Text>

            <View style={styles.priceRow}>
              <PriceTag price={bestListing.price} size="lg" />
              {worstListing && worstListing.price > bestListing.price && (
                <Text style={[styles.worstPrice, { color: themeColors.textTertiary }]}>
                  ₹{worstListing.price}
                </Text>
              )}
            </View>

            {ratingData.rating > 0 && (
              <View style={{ marginBottom: SPACING.lg }}>
                <RatingRow
                  rating={ratingData.rating}
                  reviewCount={ratingData.ratingCount}
                />
              </View>
            )}

            {savings > 0 && (
              <View style={[styles.savingsBanner, { backgroundColor: themeColors.corianderSoft }]}>
                <Ionicons name="trending-down" size={18} color={themeColors.coriander} />
                <Text style={[FONTS.uiBodyBold, { color: themeColors.coriander, flex: 1, fontSize: 13.5 }]}>
                  Save ₹{savings} compared to the highest price!
                </Text>
              </View>
            )}

            {/* AI Insight */}
            <View style={[styles.aiInsightCard, { backgroundColor: themeColors.aubergineSoft, marginTop: SPACING.lg }]}>
              <View style={styles.aiInsightHeader}>
                <Ionicons name="sparkles" size={16} color={themeColors.aubergine} />
                <Text style={[FONTS.monoBold, { fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: themeColors.aubergine }]}>AI Shopping Insight</Text>
              </View>
              {insightLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color={themeColors.aubergine} />
                  <Text style={[FONTS.uiBody, { color: themeColors.inkSoft, marginLeft: 8, fontSize: 13 }]}>Analyzing deals...</Text>
                </View>
              ) : (
                <Text style={[FONTS.uiBody, { color: themeColors.ink, fontSize: 13, lineHeight: 20 }]}>{aiInsight}</Text>
              )}
            </View>
          </View>

          {/* Listings */}
          <View style={styles.section}>
            <Text style={[FONTS.heading, { fontSize: 16.5, color: themeColors.ink, marginBottom: SPACING.sm }]}>Compare all stores</Text>
            {product.listings.map((listing, idx) => (
              <PlatformRow
                key={`${listing.platform}-${idx}`}
                listing={listing}
                isBest={listing.price === bestListing.price}
                onOpenStore={() => {
                  if (listing.url || listing.product_url) {
                    Linking.openURL(listing.url || listing.product_url).catch(() => {
                      navigation.navigate("InAppBrowser", { 
                        url: listing.url || listing.product_url,
                        platform: listing.platform,
                        title: listing.productName || displayTitle
                      });
                    });
                  }
                }}
              />
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <View style={[styles.footer, { backgroundColor: themeColors.paper, borderTopColor: themeColors.line }]}>
          <AppButton
            label={`Buy now at ${bestListing.platform} · ₹${bestListing.price}`}
            onPress={handleBuyNow}
            icon="cart"
            style={{ flex: 1, backgroundColor: themeColors.ink }}
            textStyle={{ color: "#fff" }}
          />
        </View>
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...FONTS.h3,
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.md,
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageSection: {
    width: "100%",
    height: 300,
    padding: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productSection: {
    padding: SPACING.xl,
  },
  productBrand: {
    ...FONTS.captionBold,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  productName: {
    ...FONTS.h2,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  worstPrice: {
    ...FONTS.body,
    textDecorationLine: "line-through",
  },
  metaTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  savingsText: {
    ...FONTS.bodyBold,
    color: "#fff",
  },
  aiInsightCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiInsightTitle: {
    ...FONTS.captionBold,
  },
  aiInsightText: {
    ...FONTS.body,
  },
  aiInsightLoading: {
    ...FONTS.body,
    marginLeft: SPACING.sm,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
  },
});

export default ProductDetailScreen;
