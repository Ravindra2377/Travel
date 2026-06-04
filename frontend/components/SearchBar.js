import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "../components/Icon";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";
import * as Haptics from "expo-haptics";

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search products...",
  onClear,
  onFilterPress,
  onMicPress,
  isRecording = false,
  autoFocus = false,
  testID,
}) => {
  const { themeColors } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface }]}>
      <TouchableOpacity
        style={[styles.iconWrap, { backgroundColor: themeColors.accentLight }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        accessibilityLabel="searchButton"
      >
        <Ionicons name="search" size={18} color={themeColors.primary} />
      </TouchableOpacity>
      <TextInput
        style={[styles.input, { color: themeColors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        selectionColor={themeColors.primary}
        testID={testID}
        accessibilityLabel={testID || "searchInput"}
      />
      {value ? (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (onClear) onClear();
          }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.clearBtn}
          accessibilityLabel="clearSearchButton"
        >
          <Ionicons name="close-circle" size={18} color={themeColors.textTertiary} />
        </TouchableOpacity>
      ) : null}

      {/* Mic button — shown when no text typed */}
      {!value && onMicPress && (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(
                isRecording
                  ? Haptics.ImpactFeedbackStyle.Heavy
                  : Haptics.ImpactFeedbackStyle.Medium
              );
              onMicPress();
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={[styles.micBtn, { backgroundColor: isRecording ? "#EF4444" : themeColors.accentLight }]}
            accessibilityLabel="voiceSearchButton"
          >
            <Ionicons
              name={isRecording ? "stop-circle" : "mic"}
              size={18}
              color={isRecording ? "#fff" : themeColors.primary}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {onFilterPress && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFilterPress();
          }}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.filterBtn}
          accessibilityLabel="filterSearchButton"
        >
          <Ionicons name="options-outline" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 56,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    ...FONTS.body,
    fontWeight: "500",
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  filterBtn: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
});

export default SearchBar;
