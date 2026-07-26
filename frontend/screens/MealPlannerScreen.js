import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  AccessibilityInfo,
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
  const [reduceMotion, setReduceMotion] = useState(false);
  const resultsHeaderAnim = useRef(new Animated.Value(0)).current;
  const ingredientAnims = useRef([]);
  const resultsCtaAnim = useRef(new Animated.Value(0)).current;
  const resultsSequence = useRef(null);
  const heroEntrance = useRef(new Animated.Value(0)).current;
  const composerEntrance = useRef(new Animated.Value(0)).current;
  const suggestionsEntrance = useRef(new Animated.Value(0)).current;
  const suggestionEntranceAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0)),
  ).current;
  const suggestionScaleAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(1)),
  ).current;
  const entranceSequence = useRef(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription?.remove?.();
  }, []);

  useFocusEffect(
    useCallback(() => {
      entranceSequence.current?.stop?.();
      heroEntrance.setValue(reduceMotion ? 1 : 0);
      composerEntrance.setValue(reduceMotion ? 1 : 0);
      suggestionsEntrance.setValue(reduceMotion ? 1 : 0);
      suggestionEntranceAnims.forEach((value) =>
        value.setValue(reduceMotion ? 1 : 0),
      );

      if (reduceMotion) return undefined;

      const entrance = Animated.parallel([
        Animated.timing(heroEntrance, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(composerEntrance, {
          toValue: 1,
          duration: 300,
          delay: 45,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(suggestionsEntrance, {
            toValue: 1,
            duration: 220,
            delay: 90,
            useNativeDriver: true,
          }),
          Animated.stagger(
            45,
            suggestionEntranceAnims.map((value) =>
              Animated.spring(value, {
                toValue: 1,
                stiffness: 185,
                damping: 19,
                mass: 0.78,
                useNativeDriver: true,
              }),
            ),
          ),
        ]),
      ]);

      entranceSequence.current = entrance;
      entrance.start();
      return () => entrance.stop();
    }, [
      composerEntrance,
      heroEntrance,
      reduceMotion,
      suggestionEntranceAnims,
      suggestionsEntrance,
    ]),
  );

  useEffect(() => {
    if (!ingredients) return undefined;

    resultsSequence.current?.stop?.();

    if (reduceMotion) {
      resultsHeaderAnim.setValue(1);
      ingredientAnims.current.forEach((value) => value.setValue(1));
      resultsCtaAnim.setValue(1);
      return undefined;
    }

    const sequence = Animated.sequence([
      Animated.timing(resultsHeaderAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.stagger(
        65,
        ingredientAnims.current.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.timing(resultsCtaAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

    resultsSequence.current = sequence;
    sequence.start();
    return () => sequence.stop();
  }, [
    ingredients,
    reduceMotion,
    resultsCtaAnim,
    resultsHeaderAnim,
  ]);

  const handlePlan = async (text) => {
    const query = (text || mealInput).trim();
    if (!query) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setIngredients(null);
    setError("");
    resultsSequence.current?.stop?.();
    resultsHeaderAnim.setValue(reduceMotion ? 1 : 0);
    resultsCtaAnim.setValue(reduceMotion ? 1 : 0);

    try {
      const result = await GroqService.parseMealIngredients(query);
      const nextIngredients = result.ingredients || [];
      ingredientAnims.current = nextIngredients.map(
        () => new Animated.Value(reduceMotion ? 1 : 0),
      );
      setDish(result.dish || query);
      setIngredients(nextIngredients);

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

  const animateSuggestionScale = (index, toValue) => {
    if (reduceMotion) return;
    Animated.spring(suggestionScaleAnims[index], {
      toValue,
      stiffness: 260,
      damping: 18,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
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
          <Animated.View
            style={[
              styles.mealHero,
              {
                opacity: heroEntrance,
                transform: [
                  {
                    translateY: heroEntrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[FONTS.editorialBold, styles.mealHeroTitle, { color: themeColors.aubergineDeep }]}>
              What’s cooking?
            </Text>
            <Text style={[FONTS.uiBody, styles.mealHeroSubtitle, { color: themeColors.inkSoft }]}>
              Name a meal and we’ll turn it into a cart-ready ingredient list.
            </Text>
          </Animated.View>

          {/* Input Card */}
          <Animated.View
            style={[
              styles.inputCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.line,
                opacity: composerEntrance,
                transform: [
                  {
                    translateY: composerEntrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                  {
                    scale: composerEntrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.985, 1],
                    }),
                  },
                ],
              },
            ]}
          >
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
          </Animated.View>

          {/* Quick suggestions */}
          {!ingredients && !loading && (
            <Animated.View
              style={[
                styles.suggestionsSection,
                {
                  opacity: suggestionsEntrance,
                  transform: [
                    {
                      translateY: suggestionsEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
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
                  <Animated.View
                    key={item.query}
                    style={{
                      opacity: suggestionEntranceAnims[index],
                      transform: [
                        {
                          translateY: suggestionEntranceAnims[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                          }),
                        },
                        { scale: suggestionScaleAnims[index] },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.suggestionCard, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
                      onPress={() => { setMealInput(item.query); handlePlan(item.query); }}
                      onPressIn={() => animateSuggestionScale(index, 0.965)}
                      onPressOut={() => animateSuggestionScale(index, 1)}
                      activeOpacity={0.92}
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
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
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
            <View>
              <Animated.View
                style={[
                  styles.resultsHeader,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.line,
                    opacity: resultsHeaderAnim,
                    transform: [
                      {
                        translateY: resultsHeaderAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.dishNameRow}>
                  <Ionicons name="checkmark-circle" size={20} color={themeColors.coriander} />
                  <Text style={[FONTS.heading, { fontSize: 20, flex: 1, color: themeColors.ink }]}>{dish}</Text>
                </View>
                <Text style={[FONTS.uiBody, { marginTop: 4, marginLeft: 28, fontSize: 13, color: themeColors.inkSoft }]}>
                  {ingredients.length} ingredients found
                </Text>
              </Animated.View>

              {/* Ingredient list */}
              {ingredients.map((ing, i) => {
                const rowAnim = ingredientAnims.current[i];
                return (
                  <Animated.View
                    key={`${ing.name}-${i}`}
                    style={{
                      opacity: rowAnim,
                      transform: [
                        {
                          translateY: rowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                        {
                          scale: rowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.985, 1],
                          }),
                        },
                      ],
                    }}
                  >
                    <TouchableOpacity
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
                  </Animated.View>
                );
              })}

              <Animated.View
                style={{
                  opacity: resultsCtaAnim,
                  transform: [
                    {
                      translateY: resultsCtaAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [12, 0],
                      }),
                    },
                  ],
                }}
              >
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
            </View>
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
    borderRadius: 999,
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
    borderRadius: 999,
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
