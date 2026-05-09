import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WishlistContext } from "../context/WishlistContext";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useNavigation } from "@react-navigation/native";

const WishlistScreen = () => {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const navigation = useNavigation();

  const renderProductItem = ({ item }) => {
    // Get the primary price (best price)
    const price = item.price || (item.platforms && item.platforms[0]?.price);
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
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Liked Products</Text>
          <Text style={styles.headerSubtitle}>
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </Text>
        </View>

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
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: {
    ...FONTS.h1,
    fontSize: 28,
  },
  headerSubtitle: {
    ...FONTS.caption,
    marginTop: 4,
  },
  list: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: "center",
  },
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
  price: {
    ...FONTS.priceSmall,
    color: COLORS.primary,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardAlt,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: SPACING.xxl,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.colored(COLORS.primary),
  },
  exploreBtnText: {
    ...FONTS.bodyBold,
    color: "#FFFFFF",
  },
});

export default WishlistScreen;
