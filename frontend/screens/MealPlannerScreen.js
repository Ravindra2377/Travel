import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import GroqService from "../services/GroqService";
import * as Haptics from "expo-haptics";

const PLATFORM_COLORS = {
  Blinkit: "#F8CB46",
  Zepto: "#7C3AED",
  BigBasket: "#84C225",
  Amazon: "#FF9900",
  Flipkart: "#2874F0",
};

const MEAL_SUGGESTIONS = [
  "Butter chicken for 4 people",
  "Dal makhani for 6",
  "Paneer tikka masala for 2",
  "Rajma chawal for a family",
  "Chicken biryani for 5",
  "Palak paneer for 3",
];

const MealPlannerScreen = () => {
  const navigation = useNavigation();
  const [mealInput, setMealInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState(null);
  const [dish, setDish] = useState("");
  const [error, setError] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handlePlan = async (text) => {
    const query = (text || mealInput).trim();
    if (!query) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setIngredients(null);
    setError("");
    fadeAnim.setValue(0);

    try {
      const result = await GroqService.parseMealIngredients(query);
      setDish(result.dish || query);
      setIngredients(result.ingredients || []);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError("Couldn't parse that meal. Try again or be more specific.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchIngredient = (ingredientName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MainTabs", {
      screen: "Search",
      params: { query: ingredientName },
    });
  };

  const handleSearchAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (ingredients?.length > 0) {
      navigation.navigate("MainTabs", {
        screen: "Search",
        params: { query: ingredients[0].name },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerEyebrow}>AI-Powered</Text>
            <Text style={styles.headerTitle}>Meal Planner</Text>
            <Text style={styles.headerSubtitle}>
              Tell us what you want to cook — we'll find every ingredient
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Input Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Butter chicken for 4 people"
                placeholderTextColor={COLORS.textTertiary}
                value={mealInput}
                onChangeText={setMealInput}
                returnKeyType="done"
                onSubmitEditing={() => handlePlan()}
                multiline={false}
              />
              {mealInput.length > 0 && (
                <TouchableOpacity onPress={() => { setMealInput(""); setIngredients(null); }}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.planBtn, loading && styles.planBtnDisabled]}
              onPress={() => handlePlan()}
              disabled={loading || !mealInput.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={mealInput.trim() ? COLORS.gradientAccent : [COLORS.border, COLORS.border]}
                style={styles.planBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                    <Text style={styles.planBtnText}>Generate Ingredient List</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick suggestions */}
          {!ingredients && !loading && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Try one of these</Text>
              {MEAL_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => { setMealInput(s); handlePlan(s); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame-outline" size={15} color={COLORS.accentGold} />
                  <Text style={styles.suggestionText}>{s}</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Results */}
          {ingredients && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={styles.resultsHeader}>
                <View style={styles.dishNameRow}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.savings} />
                  <Text style={styles.dishName}>{dish}</Text>
                </View>
                <Text style={styles.ingredientCount}>
                  {ingredients.length} ingredients found
                </Text>
              </View>

              {/* Ingredient list */}
              {ingredients.map((ing, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.ingredientRow}
                  onPress={() => handleSearchIngredient(ing.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.ingredientIndex}>
                    <Text style={styles.ingredientIndexText}>{i + 1}</Text>
                  </View>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <Text style={styles.ingredientQty}>{ing.quantity}</Text>
                  </View>
                  <View style={styles.searchChip}>
                    <Ionicons name="search" size={13} color={COLORS.primary} />
                    <Text style={styles.searchChipText}>Compare</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Search all CTA */}
              <TouchableOpacity
                style={styles.searchAllBtn}
                onPress={handleSearchAll}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={COLORS.gradientAccent}
                  style={styles.searchAllGradient}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.searchAllText}>
                    Start with {ingredients[0]?.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.searchAllHint}>
                Tap any ingredient to compare prices across all platforms
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
    zIndex: 10,
  },
  backBtn: {
    marginRight: SPACING.md,
    marginTop: 6, // align with eyebrow text
  },
  headerTextContainer: { flex: 1 },
  headerEyebrow: {
    ...FONTS.eyebrow,
    fontSize: 10,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.h1,
    fontSize: 28,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  planBtn: { borderRadius: RADIUS.lg, overflow: "hidden" },
  planBtnDisabled: { opacity: 0.5 },
  planBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  planBtnText: { ...FONTS.bodyBold, color: "#fff", fontSize: 15 },
  suggestionsSection: { marginBottom: SPACING.xl },
  suggestionsTitle: {
    ...FONTS.captionBold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
    gap: 10,
    ...SHADOWS.sm,
  },
  suggestionText: { flex: 1, ...FONTS.body, color: COLORS.textPrimary },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: { ...FONTS.body, color: COLORS.error, flex: 1 },
  resultsHeader: {
    marginBottom: SPACING.lg,
  },
  dishNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dishName: {
    ...FONTS.h3,
    fontSize: 20,
    color: COLORS.textPrimary,
    textTransform: "capitalize",
  },
  ingredientCount: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: 28,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 12,
    ...SHADOWS.sm,
  },
  ingredientIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.violetLight,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientIndexText: {
    ...FONTS.captionBold,
    color: COLORS.primary,
    fontSize: 12,
  },
  ingredientInfo: { flex: 1 },
  ingredientName: {
    ...FONTS.bodyBold,
    color: COLORS.textPrimary,
    fontSize: 15,
    textTransform: "capitalize",
  },
  ingredientQty: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.violetLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchChipText: { ...FONTS.captionBold, color: COLORS.primary, fontSize: 11 },
  searchAllBtn: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    marginTop: SPACING.xl,
    ...SHADOWS.colored,
  },
  searchAllGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  searchAllText: { ...FONTS.bodyBold, color: "#fff", fontSize: 16 },
  searchAllHint: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});

export default MealPlannerScreen;
