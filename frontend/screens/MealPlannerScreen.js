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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "../components/Icon";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import BrandHeader from "../components/BrandHeader";
import { useTheme } from "../context/ThemeContext";
import GroqService from "../services/GroqService";
import * as Haptics from "expo-haptics";

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
    navigation.navigate("Search", { query: ingredientName });
  };

  const handleSearchAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (ingredients?.length > 0) {
      navigation.navigate("Search", { query: ingredients[0].name });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.paper }]}>
      <View style={[styles.container, { backgroundColor: themeColors.paper }]}>
        <BrandHeader editorial />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <ScrollView
          style={[styles.scroll, { backgroundColor: themeColors.paper }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mealHero}>
            <Text style={[FONTS.editorialBold, styles.mealHeroTitle, { color: themeColors.aubergineDeep }]}>
              What’s cooking?
            </Text>
            <Text style={[FONTS.uiBody, styles.mealHeroSubtitle, { color: themeColors.inkSoft }]}>
              Name a meal and we’ll turn it into a cart-ready ingredient list.
            </Text>
          </View>

          {/* Input Card */}
          <View style={[styles.inputCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
            <Text style={[styles.inputLabel, { color: themeColors.ink }]}>Describe your meal</Text>
            <View style={[styles.inputRow, { backgroundColor: themeColors.paper, borderColor: themeColors.line }]}>
              <TextInput
                style={[styles.input, { color: themeColors.ink }]}
                placeholder="Butter chicken for 4 people"
                placeholderTextColor={themeColors.inkFaint}
                value={mealInput}
                onChangeText={setMealInput}
                returnKeyType="done"
                onSubmitEditing={() => handlePlan()}
                multiline={false}
              />
              {mealInput.length > 0 && (
                <TouchableOpacity onPress={() => { setMealInput(""); setIngredients(null); }}>
                  <Ionicons name="close-circle" size={20} color={themeColors.inkFaint} />
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
                colors={mealInput.trim() ? [themeColors.aubergine, themeColors.aubergineDeep] : [themeColors.inkFaint, themeColors.inkFaint]}
                style={styles.planBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.planBtnText}>Build my ingredient list</Text>
                    <Ionicons name="arrow-forward" size={17} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Quick suggestions */}
          {!ingredients && !loading && (
            <View style={styles.suggestionsSection}>
              <Text style={[styles.suggestionsTitle, { color: themeColors.ink }]}>Popular meal plans</Text>
              <Text style={[styles.suggestionsSubtitle, { color: themeColors.inkSoft }]}>Choose a meal to build its cart</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsDeck}
                decelerationRate="fast"
                snapToInterval={180}
              >
                {[
                  { meal: "Butter chicken", serves: "Serves 4", query: "Butter chicken for 4 people" },
                  { meal: "Dal makhani", serves: "Serves 6", query: "Dal makhani for 6" },
                  { meal: "Paneer tikka", serves: "Serves 2", query: "Paneer tikka masala for 2" },
                  { meal: "Rajma chawal", serves: "Family meal", query: "Rajma chawal for a family" },
                  { meal: "Chicken biryani", serves: "Serves 5", query: "Chicken biryani for 5" },
                  { meal: "Palak paneer", serves: "Serves 3", query: "Palak paneer for 3" },
                ].map((item, index) => (
                  <TouchableOpacity
                    key={item.query}
                    style={[styles.suggestionCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
                    onPress={() => { setMealInput(item.query); handlePlan(item.query); }}
                    activeOpacity={0.82}
                  >
                    <View style={styles.suggestionCardTop}>
                      <Text style={[styles.suggestionNumber, { color: themeColors.primary }]}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                      <Text style={[styles.suggestionType, { color: themeColors.inkFaint }]}>MEAL PLAN</Text>
                    </View>
                    <Text style={[styles.suggestionMeal, { color: themeColors.aubergineDeep }]} numberOfLines={2}>{item.meal}</Text>
                    <View style={styles.suggestionCardBottom}>
                      <Text style={[styles.suggestionServes, { color: themeColors.inkSoft }]}>{item.serves}</Text>
                      <View style={[styles.suggestionGo, { backgroundColor: themeColors.aubergineSoft }]}>
                        <Ionicons name="arrow-forward" size={14} color={themeColors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
              <View style={[styles.resultsHeader, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}>
                <View style={styles.dishNameRow}>
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.coriander} />
                  <Text style={[FONTS.heading, { fontSize: 20, flex: 1, color: themeColors.ink }]}>{dish}</Text>
                </View>
                <Text style={[FONTS.uiBody, { marginTop: 4, marginLeft: 28, fontSize: 13, color: themeColors.inkSoft }]}>
                  {ingredients.length} ingredients found
                </Text>
              </View>

              {/* Ingredient list */}
              {ingredients.map((ing, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.ingredientRow, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
                  onPress={() => handleSearchIngredient(ing.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.ingredientIndex, { backgroundColor: themeColors.aubergineSoft }]}>
                    <Text style={[FONTS.uiBodyBold, { fontSize: 12, color: themeColors.aubergine }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.ingredientInfo}>
                    <Text style={[FONTS.uiBodyBold, { fontSize: 15, color: themeColors.ink }]}>{ing.name}</Text>
                    <Text style={[FONTS.uiBody, { marginTop: 1, fontSize: 12, color: themeColors.inkSoft }]}>{ing.quantity}</Text>
                  </View>
                  <View style={[styles.searchChip, { backgroundColor: themeColors.aubergineSoft, borderColor: themeColors.aubergineSoft }]}>
                    <Ionicons name="search" size={13} color={themeColors.aubergine} />
                    <Text style={[FONTS.uiBodyBold, { fontSize: 11, color: themeColors.aubergine }]}>Compare</Text>
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
                  colors={[themeColors.aubergine, themeColors.aubergineDeep]}
                  style={styles.searchAllGradient}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={[FONTS.uiBodyBold, { color: "#fff", fontSize: 16 }]}>
                    Start with {ingredients[0]?.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[FONTS.uiBody, { textAlign: "center", marginTop: SPACING.md, fontSize: 12, color: themeColors.inkFaint }]}>
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
    paddingHorizontal: SPACING.xl,
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
    borderWidth: 1,
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
  scrollContent: { paddingHorizontal: SPACING.xl, paddingTop: 22, paddingBottom: 100 },
  mealHero: {
    marginBottom: 22,
  },
  mealHeroTitle: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  mealHeroSubtitle: {
    maxWidth: 315,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 6,
  },
  inputCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    ...SHADOWS.md,
    marginBottom: 28,
  },
  inputLabel: {
    ...FONTS.uiBodyBold,
    fontSize: 12,
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...FONTS.uiBody,
    fontSize: 14,
  },
  planBtn: {
    borderRadius: 16,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  planBtnGradient: {
    minHeight: 54,
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
    marginTop: 2,
  },
  suggestionsTitle: {
    ...FONTS.editorial,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.35,
  },
  suggestionsSubtitle: {
    ...FONTS.uiBody,
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 13,
  },
  suggestionsDeck: {
    gap: 12,
    paddingRight: 4,
    paddingBottom: 6,
  },
  suggestionCard: {
    width: 168,
    minHeight: 148,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  suggestionCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionNumber: {
    ...FONTS.editorial,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  suggestionType: {
    ...FONTS.uiBodyBold,
    fontSize: 8,
    letterSpacing: 1,
  },
  suggestionMeal: {
    ...FONTS.editorial,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 18,
  },
  suggestionCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 13,
  },
  suggestionServes: {
    ...FONTS.uiBody,
    fontSize: 11,
  },
  suggestionGo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
