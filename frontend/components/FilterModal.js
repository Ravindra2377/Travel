import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from "../config/theme";

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
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort & Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionRow}
                  onPress={() => setSortBy(option.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      sortBy === option.id && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform Section */}
            <View style={styles.section}>
              <View style={styles.platformHeader}>
                <Text style={styles.sectionTitle}>Platforms</Text>
                <TouchableOpacity onPress={selectAll}>
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
              </View>
              {PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform}
                  style={styles.optionRow}
                  onPress={() => togglePlatform(platform)}
                >
                  <Text style={styles.optionText}>{platform}</Text>
                  <View
                    style={[
                      styles.checkbox,
                      selectedPlatforms[platform] && styles.checkboxActive,
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

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={onClose}>
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.xl,
    backgroundColor: COLORS.cardAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...FONTS.h2,
    fontSize: 20,
  },
  closeBtn: {
    backgroundColor: "#FFFFFF",
    padding: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
  },
  section: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  platformHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  selectAllText: {
    ...FONTS.captionBold,
    color: COLORS.primary,
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
    color: COLORS.textPrimary,
  },
  optionTextActive: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: {
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: "#FFFFFF",
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: "center",
    ...SHADOWS.colored(COLORS.primary),
  },
  applyBtnText: {
    ...FONTS.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default FilterModal;
