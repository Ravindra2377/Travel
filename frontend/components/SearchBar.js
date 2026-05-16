import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
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
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconWrap}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        accessibilityLabel="searchButton"
      >
        <Ionicons name="search" size={18} color={COLORS.primary} />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        selectionColor={COLORS.primary}
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
          <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
      ) : null}

      {/* Mic button — shown when no text typed */}
      {!value && onMicPress && (
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
          style={[styles.micBtn, isRecording && styles.micBtnActive]}
          accessibilityLabel="voiceSearchButton"
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic"}
            size={18}
            color={isRecording ? "#fff" : COLORS.primary}
          />
        </TouchableOpacity>
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
          <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    ...FONTS.body,
    fontWeight: "500",
    color: COLORS.textPrimary,
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 4,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  micBtnActive: {
    backgroundColor: "#EF4444",
  },
  filterBtn: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
});

export default SearchBar;
