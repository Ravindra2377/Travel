import React, { useMemo, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import { SPACING, RADIUS, FONTS, SHADOWS, COLORS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import { WishlistContext } from "../context/WishlistContext";
import * as Haptics from "expo-haptics";

const PLATFORM_COLORS = {
  Blinkit: COLORS.platformBlinkit,
  Zepto: COLORS.platformZepto,
  BigBasket: COLORS.platformBigBasket,
  Amazon: COLORS.platformAmazon,
  Flipkart: COLORS.platformFlipkart,
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0";
  const isInt = Math.round(numeric) === numeric;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInt ? 0 : 2,
  }).format(numeric);
};

const ProductCard = ({ product, onPress }) => {
  const { themeColors, isDark } = useTheme();

  if (!product) return null;

  const {
    name = "Product",
    brand = "",
    price = 0,
    originalPrice,
    platformCount = 0,
    totalPlatforms = 3,
    discount,
    bestPlatform = "",
    image_url: imageURL,
    imageCandidates = [],
    unitPrice,
    unitLabel,
  } = product;

  const { toggleWishlist, isLiked } = useContext(WishlistContext);
  const liked = isLiked(product.id);

  const [imageError, setImageError] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const resolvedImageURL = imageCandidates[imageIndex] || imageURL || "";

  const effectivePrice = Number(price) > 0 ? Number(price) : 0;
  const effectiveOriginalPrice = Number(originalPrice) > 0 ? Number(originalPrice) : 0;
  const hasOriginal = effectiveOriginalPrice > effectivePrice && effectivePrice > 0;
  const savingsValue = hasOriginal ? Math.max(0, effectiveOriginalPrice - effectivePrice) : 0;
  const hasDiscount = discount > 0;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();

  const accentColor = PLATFORM_COLORS[bestPlatform] || themeColors.accent;

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress?.(product)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}
        testID={`productCard_${bestPlatform || "best"}`}
      >
        <GlassCard
          gradientColors={isDark ? themeColors.gradientCard : ["#FFFFFF", "#FFFFFF"]}
          accentColor={accentColor}
          glowColor={accentColor}
          style={!isDark && { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, ...SHADOWS.md }}
        >
          <View style={styles.content}>
            <View style={[styles.imageContainer, { backgroundColor: themeColors.cardAlt }]}>
              {resolvedImageURL && !imageError ? (
                <Image
                  source={{ uri: resolvedImageURL }}
                  style={styles.image}
                  contentFit="contain"
                  transition={150}
                  cachePolicy="disk"
                  placeholder={{ thumbhash: null }}
                  placeholderContentFit="contain"
                  onError={() => {
                    if (imageIndex < imageCandidates.length - 1) {
                      setImageIndex((prev) => prev + 1);
                      return;
                    }
                    setImageError(true);
                  }}
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.cardAlt }]}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={themeColors.textTertiary}
                  />
                </View>
              )}
            </View>

            {/* Like Button Overlay */}
            <TouchableOpacity
              style={[styles.likeBtn, { backgroundColor: themeColors.surface, ...SHADOWS.sm }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleWishlist(product);
              }}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? themeColors.primary : themeColors.textTertiary}
              />
            </TouchableOpacity>

            <View style={styles.info}>
              <Text style={[styles.name, { color: themeColors.textPrimary }]} numberOfLines={2}>
                {name}
              </Text>
              {brand ? (
                <Text style={[styles.brand, { color: themeColors.textTertiary }]}>{brand.toUpperCase()}</Text>
              ) : null}

              <View style={styles.priceRow}>
                <View>
                  <Text style={[styles.priceLabel, { color: themeColors.accent }]}>
                    BEST PRICE
                  </Text>
                  <Text style={[styles.price, { color: themeColors.textPrimary }]}>
                    ₹{formatPrice(effectivePrice)}
                  </Text>
                  {unitPrice ? (
                    <Text style={[styles.unitPriceText, { color: themeColors.textSecondary, ...FONTS.caption }]}>
                      ₹{formatPrice(unitPrice)} {unitLabel}
                    </Text>
                  ) : null}
                </View>

                {hasOriginal ? (
                  <View style={styles.mrpBlock}>
                    <Text style={[styles.mrpLabel, { color: themeColors.textTertiary }]}>MRP</Text>
                    <Text style={[styles.originalPrice, { color: themeColors.textTertiary }]}>
                      ₹{formatPrice(effectiveOriginalPrice)}
                    </Text>
                  </View>
                ) : null}

                {savingsValue > 0 ? (
                  <View
                    style={[
                      styles.savingsChip,
                      {
                        backgroundColor: themeColors.savings,
                        paddingHorizontal: 10,
                      },
                    ]}
                  >
                    <Ionicons name="trending-down" size={11} color="#FFF" />
                    <Text style={[styles.savingsText, { color: "#FFF" }]}>
                      Save ₹{formatPrice(savingsValue)}
                    </Text>
                  </View>
                ) : null}

                {hasDiscount && (
                  <View style={[styles.discountBadge, { backgroundColor: themeColors.warningLight }]}>
                    <Text style={[styles.discountText, { color: themeColors.warning }]}>{discount}% OFF</Text>
                  </View>
                )}
              </View>

              <View style={styles.metaRow}>
                <View style={[styles.platformPill, { backgroundColor: themeColors.cardAlt }]}>
                  <Ionicons
                    name="layers-outline"
                    size={11}
                    color={themeColors.textTertiary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.platformText, { color: themeColors.textSecondary }]}>
                    {platformCount}/{totalPlatforms} Platforms
                  </Text>
                </View>
                {bestPlatform ? (
                  <View
                    style={[
                      styles.platformPill,
                      {
                        backgroundColor: `${accentColor}22`,
                        borderColor: `${accentColor}55`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="star"
                      size={10}
                      color={accentColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.platformText, { color: accentColor }]}>
                      {bestPlatform}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[styles.arrowWrap, { backgroundColor: themeColors.accentLight }]}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={themeColors.primary}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const areEqual = (prev, next) => {
  const p = prev.product || {};
  const n = next.product || {};
  const prevCandidates = (p.imageCandidates || []).join(',');
  const nextCandidates = (n.imageCandidates || []).join(',');
  return (
    p.id === n.id &&
    p.name === n.name &&
    p.brand === n.brand &&
    p.price === n.price &&
    p.originalPrice === n.originalPrice &&
    p.platformCount === n.platformCount &&
    p.discount === n.discount &&
    p.bestPlatform === n.bestPlatform &&
    p.unitPrice === n.unitPrice &&
    p.unitLabel === n.unitLabel &&
    p.image_url === n.image_url &&
    prevCandidates === nextCandidates &&
    prev.onPress === next.onPress
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  imageContainer: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  name: {
    ...FONTS.bodyBold,
    marginBottom: 4,
  },
  brand: {
    ...FONTS.caption,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
    fontSize: 10,
    textTransform: "uppercase",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  priceLabel: {
    ...FONTS.badge,
    marginBottom: 2,
    letterSpacing: 1,
  },
  price: {
    ...FONTS.price,
    fontSize: 24,
    lineHeight: 32,
  },
  mrpBlock: { paddingBottom: 4 },
  mrpLabel: {
    ...FONTS.caption,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  originalPrice: {
    ...FONTS.captionBold,
    textDecorationLine: "line-through",
  },
  savingsChip: {
    paddingHorizontal: SPACING.sm,
    height: 24,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  savingsText: {
    ...FONTS.captionBold,
    fontSize: 12,
    marginTop: 2,
  },
  discountBadge: {
    paddingHorizontal: 7,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  discountText: {
    ...FONTS.badge,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  platformPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    flexDirection: "row",
    alignItems: "center",
  },
  platformText: {
    ...FONTS.caption,
    fontSize: 11,
    fontWeight: "600",
  },
  arrowWrap: {
    marginLeft: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  likeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: RADIUS.full,
    zIndex: 10,
  },
});

export default React.memo(ProductCard, areEqual);
