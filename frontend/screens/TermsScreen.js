import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '../components/Icon';
import { SPACING, RADIUS, FONTS } from '../config/theme';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const TermsScreen = ({ navigation }) => {
  const { themeColors, isDark } = useTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: themeColors.background }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lastUpdated, { color: themeColors.textTertiary }]}>Last Updated: May 9, 2026</Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          By accessing and using CompareZ ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>2. Service Description (Aggregator Model)</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          CompareZ is an independent search and comparison engine that aggregates public data from third-party grocery platforms (Amazon, Flipkart, Blinkit, Zepto, BigBasket). We are not an e-commerce platform, we do not sell products directly, and we have no control over the fulfillment, delivery, or quality of items purchased through external links.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>3. Accuracy & Automated Filtering</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          While we strive for real-time accuracy using our multi-layered scanning technology, prices and availability are subject to change by the respective platforms without notice. CompareZ employs automated heuristics to filter out-of-stock items; however, we do not guarantee the 100% accuracy of these filters. Final pricing and availability must be verified on the retailer's platform.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>4. Comparison Algorithms</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          Our "Best Price" and "Relevance" rankings are generated via automated algorithms based on available data points. These rankings are for informational purposes only and do not constitute an endorsement of any specific platform or product.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>5. User Accounts & Privacy</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          You are responsible for maintaining the confidentiality of your account. We process data in accordance with our internal privacy standards to provide a personalized comparison experience, including your "Liked Products" and search history.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>6. Limitations of Liability</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          CompareZ shall not be liable for any indirect, incidental, or consequential damages resulting from discrepancies in pricing, stock status, or issues arising from transactions on third-party websites.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>7. Changes to Terms</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          We reserve the right to modify these terms at any time. Your continued use of the app following any updates constitutes acceptance of the modified Terms of Service.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>8. AI-Powered Features</Text>
        <Text style={[styles.paragraph, { color: themeColors.textSecondary }]}>
          CompareZ uses BEANS, our friendly AI shopping assistant, to provide intelligent features including AI chat support, natural language search, and deal analysis. AI-generated responses are for informational purposes only and do not constitute purchasing advice.
        </Text>

        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
          <Text style={[styles.footerText, { color: themeColors.textTertiary }]}>Empowering your shopping decisions with CompareZ.</Text>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
  },
  content: {
    padding: SPACING.lg,
  },
  lastUpdated: {
    ...FONTS.caption,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.bodyBold,
    fontSize: 16,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    ...FONTS.body,
    lineHeight: 22,
  },
  footer: {
    marginTop: SPACING.huge,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
  },
  footerText: {
    ...FONTS.captionBold,
  },
});

export default TermsScreen;
