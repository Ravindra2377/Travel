import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "../components/Icon";
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
          { backgroundColor: themeColors.card, borderColor: themeColors.line, ...SHADOWS.sm },
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
          isPrimary && { backgroundColor: themeColors.ink },
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
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.inputWrap,
        {
          backgroundColor: focused ? themeColors.card : themeColors.cardAlt,
          borderColor: focused ? themeColors.aubergine : themeColors.line,
        },
      ]}
    >
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
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

export const Chip = ({ label, icon, active, onPress, style }) => {
  const { themeColors } = useTheme();
  const bg = active ? themeColors.aubergine : themeColors.card;
  const border = active ? themeColors.aubergine : themeColors.lineStrong;
  const textColor = active ? themeColors.paper : themeColors.inkSoft;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderColor: border,
          borderWidth: 1,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 999,
          gap: 6,
        },
        style
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={textColor} />}
      <Text style={[FONTS.uiBodyBold, { fontSize: 13, color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const AIInsightBox = ({ text, style }) => {
  const { themeColors } = useTheme();
  return (
    <View style={[{
      flexDirection: "row",
      backgroundColor: themeColors.aubergineSoft,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      gap: SPACING.sm,
      alignItems: "flex-start",
    }, style]}>
      <Ionicons name="sparkles" size={18} color={themeColors.aubergine} style={{ marginTop: 2 }} />
      <Text style={[FONTS.uiBody, { flex: 1, color: themeColors.aubergineDeep, fontSize: 14, lineHeight: 20 }]}>
        {text}
      </Text>
    </View>
  );
};

export const SavingsReceiptCard = ({ amount, itemsTracked, children, style }) => {
  const { themeColors } = useTheme();
  return (
    <View style={[{
      backgroundColor: themeColors.card,
      borderRadius: RADIUS.lg,
      marginTop: SPACING.lg,
      overflow: "hidden",
      ...SHADOWS.cardSoft,
    }, style]}>
      <View style={{
        height: 12,
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}>
        <View style={{
          position: "absolute",
          top: -10,
          left: 0,
          right: 0,
          height: 20,
          borderBottomWidth: 4,
          borderBottomColor: themeColors.paper,
          borderStyle: "dashed",
        }} />
      </View>
      <View style={{ padding: SPACING.xl, paddingTop: SPACING.md }}>
        <Text style={[FONTS.uiBodyMedium, { color: themeColors.inkSoft, fontSize: 13, marginBottom: SPACING.xs }]}>
          Potential savings this week
        </Text>
        <Text style={[FONTS.heading, { color: themeColors.coriander, fontSize: 36, marginBottom: SPACING.md }]}>
          ₹<Text style={[FONTS.monoBold, { fontSize: 36 }]}>{amount}</Text>
        </Text>
        {children}
      </View>
    </View>
  );
};

export const EmptyState = ({ icon, title, message, actionLabel, onAction, style }) => {
  const { themeColors } = useTheme();
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", padding: SPACING.xl }, style]}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: themeColors.paperDim,
        alignItems: "center", justifyContent: "center",
        marginBottom: SPACING.lg
      }}>
        <Ionicons name={icon} size={32} color={themeColors.inkFaint} />
      </View>
      <Text style={[FONTS.heading, { fontSize: 20, color: themeColors.ink, marginBottom: SPACING.sm, textAlign: "center" }]}>
        {title}
      </Text>
      <Text style={[FONTS.uiBody, { fontSize: 15, color: themeColors.inkSoft, textAlign: "center", marginBottom: SPACING.xl, lineHeight: 22 }]}>
        {message}
      </Text>
      {actionLabel && (
        <AppButton label={actionLabel} onPress={onAction} style={{ minWidth: 160 }} />
      )}
    </View>
  );
};

export const ChatBubble = ({ message, isUser, time }) => {
  const { themeColors } = useTheme();
  return (
    <View style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      maxWidth: "85%",
      marginBottom: SPACING.lg,
    }}>
      <View style={{
        backgroundColor: isUser ? themeColors.aubergine : themeColors.card,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        borderBottomRightRadius: isUser ? 4 : RADIUS.lg,
        borderBottomLeftRadius: isUser ? RADIUS.lg : 4,
        ...(!isUser ? SHADOWS.cardSoft : {}),
      }}>
        <Text style={[FONTS.uiBody, { 
          color: isUser ? themeColors.paper : themeColors.ink,
          fontSize: 15, lineHeight: 22 
        }]}>
          {message}
        </Text>
      </View>
      {time && (
        <Text style={[FONTS.uiBody, {
          fontSize: 11,
          color: themeColors.inkFaint,
          marginTop: 6,
          alignSelf: isUser ? "flex-end" : "flex-start",
          paddingHorizontal: 4
        }]}>
          {time}
        </Text>
      )}
    </View>
  );
};

export const PriceDisplay = ({ price, originalPrice, saveBadge, size = "md" }) => {
  const { themeColors } = useTheme();
  const isLg = size === "lg";
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: SPACING.sm }}>
      <Text style={[FONTS.monoBold, { 
        fontSize: isLg ? 24 : 18, 
        color: themeColors.ink,
        letterSpacing: -0.5
      }]}>
        <Text style={{ fontSize: isLg ? 18 : 14, color: themeColors.inkSoft }}>₹</Text>{price}
      </Text>
      
      {originalPrice && (
        <Text style={[FONTS.mono, { 
          fontSize: isLg ? 16 : 13, 
          color: themeColors.inkFaint,
          textDecorationLine: "line-through" 
        }]}>
          ₹{originalPrice}
        </Text>
      )}
      
      {saveBadge && (
        <View style={{
          backgroundColor: themeColors.corianderSoft,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 4,
          transform: [{ translateY: -2 }]
        }}>
          <Text style={[FONTS.uiBodyBold, { fontSize: 11, color: themeColors.coriander }]}>
            {saveBadge}
          </Text>
        </View>
      )}
    </View>
  );
};

export const StatStrip = ({ stats, style }) => {
  const { themeColors } = useTheme();
  return (
    <View style={[{
      flexDirection: "row",
      backgroundColor: themeColors.card,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      justifyContent: "space-between",
      ...SHADOWS.cardSoft,
    }, style]}>
      {stats.map((stat, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", borderRightWidth: i < stats.length - 1 ? 1 : 0, borderRightColor: themeColors.line }}>
          <Text style={[FONTS.monoBold, { fontSize: 18, color: themeColors.ink, marginBottom: 2 }]}>{stat.value}</Text>
          <Text style={[FONTS.uiBody, { fontSize: 11, color: themeColors.inkSoft }]}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

export const SettingsRow = ({ icon, label, rightElement, onPress, isDestructive, isFirst, isLast }) => {
  const { themeColors } = useTheme();
  const textColor = isDestructive ? themeColors.tomato : themeColors.ink;
  
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: themeColors.card,
        padding: SPACING.lg,
        borderTopLeftRadius: isFirst ? RADIUS.lg : 0,
        borderTopRightRadius: isFirst ? RADIUS.lg : 0,
        borderBottomLeftRadius: isLast ? RADIUS.lg : 0,
        borderBottomRightRadius: isLast ? RADIUS.lg : 0,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: themeColors.line,
      }}
    >
      {icon && (
        <View style={{ width: 32, alignItems: "flex-start" }}>
          <Ionicons name={icon} size={20} color={textColor} />
        </View>
      )}
      <Text style={[FONTS.uiBodyMedium, { flex: 1, fontSize: 16, color: textColor }]}>
        {label}
      </Text>
      {rightElement || (
        onPress && !isDestructive && <Ionicons name="chevron-forward" size={20} color={themeColors.inkFaint} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surfaceCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
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
    borderWidth: 1,
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
