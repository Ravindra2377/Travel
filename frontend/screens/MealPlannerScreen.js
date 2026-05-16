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
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
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
  const { themeColors, isDark } = useTheme();
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
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: themeColors.background }]}
              onPress={() => navigation.goBack()}
            >
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerEyebrow, { color: themeColors.primary }]}>AI-Powered</Text>
            <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Meal Planner</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
              Tell us what you want to cook — we'll find every ingredient
            </Text>
          </View>
        </View>

        <ScrollView
          style={[styles.scroll, { backgroundColor: themeColors.background }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Input Card */}
          <View style={[styles.inputCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.inputRow, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <Ionicons name="restaurant-outline" size={20} color={themeColors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { color: themeColors.textPrimary }]}
                placeholder="e.g. Butter chicken for 4 people"
                placeholderTextColor={themeColors.textTertiary}
                value={mealInput}
                onChangeText={setMealInput}
                returnKeyType="done"
                onSubmitEditing={() => handlePlan()}
                multiline={false}
              />
              {mealInput.length > 0 && (
                <TouchableOpacity onPress={() => { setMealInput(""); setIngredients(null); }}>
                  <Ionicons name="close-circle" size={20} color={themeColors.textTertiary} />
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
                colors={mealInput.trim() ? (themeColors.gradientAccent || ["#7C3AED", "#A78BFA"]) : [themeColors.border, themeColors.border]}
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
              <Text style={[styles.suggestionsTitle, { color: themeColors.textSecondary }]}>TRY ONE OF THESE</Text>
              {MEAL_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionChip, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  onPress={() => { setMealInput(s); handlePlan(s); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flame-outline" size={15} color={themeColors.accent} />
                  <Text style={[styles.suggestionText, { color: themeColors.textPrimary }]}>{s}</Text>
                  <Ionicons name="arrow-forward" size={14} color={themeColors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: themeColors.error + "15", borderColor: themeColors.error + "30" }]}>
              <Ionicons name="alert-circle-outline" size={18} color={themeColors.error} />
              <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Results */}
          {ingredients && (
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={[styles.resultsHeader, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.dishNameRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.dishName, { color: themeColors.textPrimary }]}>{dish}</Text>
                </View>
                <Text style={[styles.ingredientCount, { color: themeColors.textSecondary }]}>
                  {ingredients.length} ingredients found
                </Text>
              </View>

              {/* Ingredient list */}
              {ingredients.map((ing, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.ingredientRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  onPress={() => handleSearchIngredient(ing.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.ingredientIndex, { backgroundColor: themeColors.primary + "15" }]}>
                    <Text style={[styles.ingredientIndexText, { color: themeColors.primary }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.ingredientInfo}>
                    <Text style={[styles.ingredientName, { color: themeColors.textPrimary }]}>{ing.name}</Text>
                    <Text style={[styles.ingredientQty, { color: themeColors.textSecondary }]}>{ing.quantity}</Text>
                  </View>
                  <View style={[styles.searchChip, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <Ionicons name="search" size={13} color={themeColors.primary} />
                    <Text style={[styles.searchChipText, { color: themeColors.primary }]}>Compare</Text>
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
                  colors={themeColors.gradientAccent || ["#7C3AED", "#A78BFA"]}
                  style={styles.searchAllGradient}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.searchAllText}>
                    Start with {ingredients[0]?.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.searchAllHint, { color: themeColors.textTertiary }]}>
                Tap any ingredient to compare prices across all platforms
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    ...SHADOWS.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    marginTop: 6,
  },
  headerTextContainer: { flex: 1 },
  headerEyebrow: {
    ...FONTS.eyebrow,
    fontSize: 10,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...FONTS.h1,
    fontSize: 28,
    lineHeight: 34,
  },
  headerSubtitle: {
    ...FONTS.body,
    lineHeight: 20,
    marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },
  inputCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOWS.md,
    marginBottom: SPACING.xxl,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...FONTS.body,
    fontSize: 15,
  },
  planBtn: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  planBtnGradient: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  planBtnText: {
    ...FONTS.bodyBold,
    color: "#fff",
  },
  suggestionsSection: {
    marginTop: SPACING.md,
  },
  suggestionsTitle: {
    ...FONTS.eyebrow,
    fontSize: 10,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    ...FONTS.body,
    fontSize: 15,
  },
  resultsHeader: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  dishNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dishName: {
    ...FONTS.h2,
    fontSize: 20,
    flex: 1,
  },
  ingredientCount: {
    ...FONTS.caption,
    marginTop: 4,
    marginLeft: 28,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: 12,
  },
  ingredientIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientIndexText: {
    ...FONTS.captionBold,
    fontSize: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    ...FONTS.bodyBold,
    fontSize: 15,
  },
  ingredientQty: {
    ...FONTS.caption,
    marginTop: 1,
  },
  searchChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  searchChipText: {
    ...FONTS.captionBold,
    fontSize: 11,
  },
  searchAllBtn: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  searchAllGradient: {
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  searchAllText: {
    ...FONTS.bodyBold,
    color: "#fff",
    fontSize: 16,
  },
  searchAllHint: {
    ...FONTS.caption,
    textAlign: "center",
    marginTop: SPACING.md,
    fontSize: 12,
  },
  errorCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: SPACING.lg,
  },
  errorText: {
    ...FONTS.captionBold,
    flex: 1,
  },
});

export default MealPlannerScreen;
