import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "./Icon";
import { useTheme } from "../context/ThemeContext";
import { FONTS, SPACING, RADIUS } from "../config/theme";
import * as Haptics from "expo-haptics";

export default function ScreenHeader({ 
  title, 
  subtitle, 
  showBack = false, 
  onBackPress, 
  rightComponent,
  leftAlign = false,
  centerComponent,
  backgroundColor,
  style
}) {
  const { themeColors } = useTheme();

  return (
    <View style={[
      styles.header, 
      { backgroundColor: backgroundColor || themeColors.paper, borderBottomColor: themeColors.line },
      style
    ]}>
      
      {/* Left section: Back button or placeholder spacer */}
      <View style={leftAlign ? styles.leftSectionCompact : styles.leftSection}>
        {showBack && onBackPress ? (
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBackPress();
            }} 
            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.line }]}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.ink} />
          </TouchableOpacity>
        ) : (
          !leftAlign && <View style={{ width: 40 }} />
        )}
      </View>

      {/* Middle section: Title & Subtitle or Custom Component */}
      <View style={[styles.centerSection, leftAlign && { alignItems: "flex-start", paddingHorizontal: showBack ? SPACING.md : 0 }]}>
        {centerComponent ? (
          centerComponent
        ) : (
          <>
            {title ? (
              <Text style={[styles.title, { color: themeColors.ink }, leftAlign && { textAlign: "left" }]}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={[styles.subtitle, { color: themeColors.inkSoft }, leftAlign && { textAlign: "left" }]}>
                {subtitle}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {/* Right section: Actions or placeholder spacer */}
      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : (
          !leftAlign && <View style={{ width: 40 }} />
        )}
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  leftSection: {
    minWidth: 40,
    alignItems: "flex-start",
  },
  leftSectionCompact: {
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  rightSection: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...FONTS.uiBodyBold,
    fontSize: 16,
    textAlign: "center",
  },
  subtitle: {
    ...FONTS.uiBody,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
});
