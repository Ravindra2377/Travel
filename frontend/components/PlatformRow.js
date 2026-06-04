import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "../components/Icon";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";

const PLATFORM_ICONS = {
  blinkit: "flash-outline",
  zepto: "rocket-outline",
  bigbasket: "basket-outline",
  swiggy: "fast-food-outline",
  zomato: "restaurant-outline",
};

const PlatformRow = ({ listing, isBest = false, onOpenStore }) => {
  const { themeColors, isDark } = useTheme();
  
  if (!listing) return null;
  
  const {
    platform: name = "Platform",
    price = 0,
    deliveryTime = "",
    deliveryCharge = 0,
    inStock = true,
    image_url: imageURL,
  } = listing;

  const [imageError, setImageError] = useState(false);

  const isAvailable = inStock && price > 0;
  const iconName = PLATFORM_ICONS[name.toLowerCase()] || "storefront-outline";

  if (!isAvailable) {
    return (
      <View style={[styles.row, { backgroundColor: themeColors.cardAlt, opacity: 0.5 }]}>
        <Ionicons name={iconName} size={18} color={themeColors.textTertiary} />
        <Text style={[styles.name, { color: themeColors.textTertiary }]}>
          {name}
        </Text>
        <Text style={[styles.naText, { color: themeColors.textTertiary }]}>Out of Stock</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: themeColors.surface, ...SHADOWS.sm },
        isBest && [
          styles.cheapest,
          { backgroundColor: isDark ? "rgba(124, 58, 237, 0.15)" : "#F4EDFD", borderColor: "rgba(124, 58, 237, 0.3)" }
        ]
      ]}
      onPress={onOpenStore}
      activeOpacity={0.6}
    >
      <View style={styles.imageIconContainer}>
        {imageURL && !imageError ? (
          <Image
            source={{
              uri: imageURL,
              headers: { 'Referer': 'https://www.google.com/' },
            }}
            style={styles.platformImage}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons
            name={iconName}
            size={20}
            color={themeColors.textSecondary}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: themeColors.textPrimary }]}>{name}</Text>
        {deliveryTime ? (
          <Text style={[styles.delivery, { color: themeColors.textSecondary }]}>{deliveryTime}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {deliveryCharge === 0 && <Text style={[styles.freeTag, { color: themeColors.savings }]}>FREE</Text>}
        <Text style={[styles.price, { color: themeColors.textPrimary }, isBest && { color: themeColors.primary }]}>
          ₹{price}
        </Text>
      </View>
      
      <View style={[styles.buyBtn, { backgroundColor: themeColors.primary + "15" }]}>
        <Ionicons name="chevron-forward" size={16} color={themeColors.primary} />
      </View>

      {isBest && (
        <View style={[styles.bestBadge, { backgroundColor: themeColors.primary, ...SHADOWS.glowSoft }]}>
          <Text style={styles.bestText}>BEST</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const areEqual = (prevProps, nextProps) => {
  const prevPlatform = prevProps.platform || {};
  const nextPlatform = nextProps.platform || {};

  return (
    prevProps.isCheapest === nextProps.isCheapest &&
    prevProps.onOpenStore === nextProps.onOpenStore &&
    prevPlatform.name === nextPlatform.name &&
    prevPlatform.price === nextPlatform.price &&
    prevPlatform.deliveryTime === nextPlatform.deliveryTime &&
    prevPlatform.deliveryCharge === nextPlatform.deliveryCharge &&
    prevPlatform.inStock === nextPlatform.inStock
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  imageIconContainer: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: RADIUS.md,
  },
  platformImage: {
    width: "100%",
    height: "100%",
  },
  cheapest: {
    borderWidth: 1.5,
  },
  info: {
    flex: 1,
  },
  name: {
    ...FONTS.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  delivery: {
    ...FONTS.caption,
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
  },
  price: {
    ...FONTS.priceSmall,
    fontSize: 18,
    fontWeight: "600",
  },
  freeTag: {
    ...FONTS.badge,
    marginBottom: 4,
  },
  naText: {
    ...FONTS.caption,
    flex: 1,
    textAlign: "right",
  },
  bestBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  bestText: {
    ...FONTS.badge,
    color: "#FFFFFF",
  },
  buyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});

export default React.memo(PlatformRow, areEqual);
