import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "../components/Icon";
import { SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";
import { useTheme } from "../context/ThemeContext";

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "price_asc", label: "Price (Low to High)" },
  { id: "price_desc", label: "Price (High to Low)" },
];

const PLATFORMS = ["Blinkit", "Zepto", "BigBasket", "Amazon", "Flipkart"];

const FilterModal = ({
  visible,
  onClose,
  sortBy,
  setSortBy,
  selectedPlatforms,
  setSelectedPlatforms,
}) => {
  const { themeColors, isDark } = useTheme();

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const selectAll = () => {
    const all = {};
    PLATFORMS.forEach((p) => (all[p] = true));
    setSelectedPlatforms(all);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: themeColors.surface, ...SHADOWS.lg }]}>
          <View style={[styles.header, { backgroundColor: themeColors.cardAlt, borderBottomColor: themeColors.border }]}>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>Sort & Filter</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: themeColors.surface, ...SHADOWS.sm }]}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Sort Section */}
            <View style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionRow}
                  onPress={() => setSortBy(option.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: themeColors.textSecondary },
                      sortBy === option.id && { color: themeColors.primary, ...FONTS.bodyBold },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.id && (
                    <Ionicons name="checkmark" size={20} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform Section */}
            <View style={[styles.section, { borderBottomColor: themeColors.border }]}>
              <View style={styles.platformHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Platforms</Text>
                <TouchableOpacity onPress={selectAll}>
                  <Text style={[styles.selectAllText, { color: themeColors.primary }]}>Select All</Text>
                </TouchableOpacity>
              </View>
              {PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform}
                  style={styles.optionRow}
                  onPress={() => togglePlatform(platform)}
                >
                  <Text style={[styles.optionText, { color: themeColors.textSecondary }]}>{platform}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: themeColors.border },
                      selectedPlatforms[platform] && [styles.checkboxActive, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }],
                    ]}
                  >
                    {selectedPlatforms[platform] && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: themeColors.primary }]} onPress={onClose}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    borderRadius: RADIUS.xl,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.xl,
    borderBottomWidth: 1,
  },
  title: {
    ...FONTS.h2,
    fontSize: 20,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
  },
  section: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.sm,
  },
  platformHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  selectAllText: {
    ...FONTS.captionBold,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
  },
  optionText: {
    ...FONTS.body,
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {},
  footer: {
    padding: SPACING.xl,
    borderTopWidth: 1,
  },
  applyBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    ...FONTS.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default FilterModal;
