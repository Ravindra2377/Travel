import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../config/theme';
import * as Haptics from 'expo-haptics';

const TermsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: May 9, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using CompareZ ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
        </Text>

        <Text style={styles.sectionTitle}>2. Service Description (Aggregator Model)</Text>
        <Text style={styles.paragraph}>
          CompareZ is an independent search and comparison engine that aggregates public data from third-party grocery platforms (Amazon, Flipkart, Blinkit, Zepto, BigBasket). We are not an e-commerce platform, we do not sell products directly, and we have no control over the fulfillment, delivery, or quality of items purchased through external links.
        </Text>

        <Text style={styles.sectionTitle}>3. Accuracy & Automated Filtering</Text>
        <Text style={styles.paragraph}>
          While we strive for real-time accuracy using our multi-layered scanning technology, prices and availability are subject to change by the respective platforms without notice. CompareZ employs automated heuristics to filter out-of-stock items; however, we do not guarantee the 100% accuracy of these filters. Final pricing and availability must be verified on the retailer's platform.
        </Text>

        <Text style={styles.sectionTitle}>4. Comparison Algorithms</Text>
        <Text style={styles.paragraph}>
          Our "Best Price" and "Relevance" rankings are generated via automated algorithms based on available data points. These rankings are for informational purposes only and do not constitute an endorsement of any specific platform or product.
        </Text>

        <Text style={styles.sectionTitle}>5. User Accounts & Privacy</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account. We process data in accordance with our internal privacy standards to provide a personalized comparison experience, including your "Liked Products" and search history.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitations of Liability</Text>
        <Text style={styles.paragraph}>
          CompareZ shall not be liable for any indirect, incidental, or consequential damages resulting from discrepancies in pricing, stock status, or issues arising from transactions on third-party websites.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. Your continued use of the app following any updates constitutes acceptance of the modified Terms of Service.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Empowering your shopping decisions with CompareZ.</Text>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardAlt,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  content: {
    padding: SPACING.lg,
  },
  lastUpdated: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.bodyBold,
    fontSize: 16,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
  },
  paragraph: {
    ...FONTS.body,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: SPACING.huge,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    ...FONTS.captionBold,
    color: COLORS.textTertiary,
  },
});

export default TermsScreen;
