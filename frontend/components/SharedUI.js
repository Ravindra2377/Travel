import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

export const SurfaceCard = ({ children, style, onPress, activeOpacity = 0.9 }) => {
  const { themeColors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <CardComponent
        activeOpacity={activeOpacity}
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        style={[
          styles.surfaceCard,
          { backgroundColor: themeColors.surface, ...SHADOWS.md },
          style,
        ]}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

export const AppButton = ({
  label,
  onPress,
  variant = "primary",
  colors,
  icon,
  rightIcon,
  disabled = false,
  style,
  textStyle,
  testID,
}) => {
  const { themeColors } = useTheme();
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";
  const isGradient = variant === "gradient";
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const buttonContent = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={(isPrimary || isGradient) ? themeColors.textInverse : themeColors.textPrimary}
          style={styles.buttonIcon}
        />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          (isPrimary || isGradient) ? { color: themeColors.textInverse } : { color: themeColors.textPrimary },
          disabled && { color: themeColors.textTertiary },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {rightIcon ? (
        <Ionicons
          name={rightIcon}
          size={18}
          color={(isPrimary || isGradient) ? themeColors.textInverse : themeColors.textPrimary}
          style={styles.buttonRightIcon}
        />
      ) : null}
    </>
  );

  if (isGradient) {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={[styles.buttonContainer, disabled && styles.buttonDisabled]}
          activeOpacity={0.9}
          testID={testID}
        >
          <LinearGradient
            colors={colors || themeColors.gradientAccent}
            style={[styles.button, styles.buttonGradient]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style, { borderRadius: RADIUS.lg }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          isPrimary && { backgroundColor: themeColors.primary, ...SHADOWS.glow },
          !isPrimary && !isGhost && { backgroundColor: themeColors.cardAlt, borderWidth: 1, borderColor: themeColors.border },
          isGhost && { backgroundColor: "transparent", borderWidth: 1, borderColor: themeColors.border },
          disabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
        testID={testID}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const TextField = ({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  rightAccessory,
  testID,
  returnKeyType,
  onSubmitEditing,
}) => {
  const { themeColors } = useTheme();
  return (
    <View style={[styles.inputWrap, { backgroundColor: themeColors.cardAlt }]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={themeColors.textTertiary} />
      ) : null}
      <TextInput
        style={[styles.input, { color: themeColors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        testID={testID}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
      {rightAccessory || null}
    </View>
  );
};

export const ScreenHeader = ({ title, subtitle, rightAction }) => {
  const { themeColors } = useTheme();
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderTextWrap}>
        <Text style={[styles.screenTitle, { color: themeColors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.screenSubtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {rightAction || null}
    </View>
  );
};

export const Badge = ({ label, color, bgColor, style }) => {
  const { themeColors } = useTheme();
  const c = color || themeColors.textAccent;
  const bg = bgColor || themeColors.accentLight;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.badgeText, { color: c }]}>{label}</Text>
    </View>
  );
};

export const PriceTag = ({ price, originalPrice, size = "md" }) => {
  const { themeColors } = useTheme();
  const priceStyle = size === "lg" ? FONTS.price : FONTS.priceSmall;
  return (
    <View style={styles.priceRow}>
      <Text style={[priceStyle, { color: themeColors.savings }]}>₹{price}</Text>
      {originalPrice && (
        <Text style={[styles.originalPrice, { color: themeColors.textTertiary }]}>₹{originalPrice}</Text>
      )}
    </View>
  );
};

export const RatingRow = ({ rating, reviewCount }) => {
  const { themeColors } = useTheme();
  return (
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={14} color={themeColors.warning} />
      <Text style={[styles.ratingText, { color: themeColors.textSecondary }]}>{rating.toFixed(1)}</Text>
      {reviewCount && <Text style={[styles.reviewCount, { color: themeColors.textTertiary }]}>({reviewCount})</Text>}
    </View>
  );
};

export const SectionHeader = ({ title, subtitle, actionText, onAction }) => {
  const { themeColors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={[FONTS.h3, { color: themeColors.textPrimary }]}>{title}</Text>
        {subtitle && (
          <Text style={[FONTS.caption, { marginTop: 2, color: themeColors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {actionText && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.actionText, { color: themeColors.primary }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  surfaceCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  screenHeaderTextWrap: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  screenTitle: {
    ...FONTS.h2,
    marginBottom: 2,
  },
  screenSubtitle: {
    ...FONTS.caption,
  },
  buttonContainer: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  button: {
    minHeight: 56,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  buttonGradient: {
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonRightIcon: {
    marginLeft: 8,
  },
  buttonText: {
    ...FONTS.bodyBold,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    paddingVertical: SPACING.xs,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    ...FONTS.badge,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
  },
  originalPrice: {
    ...FONTS.caption,
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    ...FONTS.captionBold,
  },
  reviewCount: {
    ...FONTS.caption,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: SPACING.md,
  },
  actionText: {
    ...FONTS.captionBold,
  },
});
