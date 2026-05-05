import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { buildPlatformSearchUrl } from '../config/utils';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../config/theme';
import api from '../config/api';
import DealScoringService from '../services/DealScoringService';
import {
  shouldRefreshDeals,
  markDealsRefreshed,
  getTimeUntilNextRefresh,
  formatCountdown,
  cacheDealsList,
  loadCachedDeals,
  REFRESH_INTERVAL,
} from '../services/dealScheduler';
import * as Haptics from 'expo-haptics';

// ── Filter chip options ──
const FILTER_TIERS = [
  { key: 'all', label: 'All Deals', emoji: '🛒' },
  { key: 'on_fire', label: 'On Fire', emoji: '🔴' },
  { key: 'trending', label: 'Trending', emoji: '🟠' },
  { key: 'worth_noting', label: 'Worth It', emoji: '🟡' },
];

// ── Deal Card Component ──
const DealCard = ({ item, navigation }) => {
  const savings = item.mrp && item.price ? item.mrp - item.price : 0;
  const tierColor =
    item.deal_tier === 'on_fire' ? '#EF4444' :
    item.deal_tier === 'trending' ? '#F97316' :
    item.deal_tier === 'worth_noting' ? '#EAB308' : '#22C55E';

  return (
    <TouchableOpacity
      style={styles.dealCard}
      activeOpacity={0.9}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const name = (item.product_name || '').split(' (')[0];
        if (item.product_url) {
          Linking.openURL(item.product_url).catch(() => {
            navigation.navigate('Search', { query: name });
          });
        } else {
          const searchUrl = buildPlatformSearchUrl(item.platform, name);
          if (searchUrl) {
            Linking.openURL(searchUrl).catch(() =>
              navigation.navigate('Search', { query: name })
            );
          } else {
            navigation.navigate('Search', { query: name });
          }
        }
      }}
    >
      {/* Image */}
      <View style={styles.dealImgContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.dealImg} resizeMode="contain" />
        ) : (
          <View style={styles.dealImgPlaceholder}>
            <Ionicons name="image-outline" size={32} color={COLORS.textTertiary} />
          </View>
        )}
        {/* Tier badge */}
        <LinearGradient 
          colors={[tierColor, tierColor + 'E6']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }} 
          style={styles.tierBadge}
        >
          <Text style={styles.tierBadgeText}>
            {item.tier_emoji || '🔥'} {Math.round(item.hot_score || 0)}
          </Text>
        </LinearGradient>
        {/* Top tag */}
        {item.tags && item.tags.length > 0 && (
          <LinearGradient 
            colors={['#1E293B', '#0F172A']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.topTag}
          >
            <Ionicons name="flash" size={10} color="#FBBF24" style={{marginRight: 2}} />
            <Text style={styles.topTagText}>{item.tags[0]}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Info */}
      <View style={styles.dealInfo}>
        <Text style={styles.dealName} numberOfLines={2}>{item.product_name}</Text>

        <View style={styles.dealPlatformRow}>
          <Ionicons name="storefront-outline" size={11} color={COLORS.textTertiary} />
          <Text style={styles.dealPlatform}>{item.platform}</Text>
          {item.delivery_time ? (
            <>
              <Text style={styles.dealDot}>·</Text>
              <Ionicons name="time-outline" size={11} color={COLORS.textTertiary} />
              <Text style={styles.dealDelivery}>{item.delivery_time}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.dealPriceRow}>
          <Text style={styles.dealPrice}>₹{item.price}</Text>
          {item.mrp > item.price && (
            <Text style={styles.dealMRP}>₹{item.mrp}</Text>
          )}
          {savings > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save ₹{Math.round(savings)}</Text>
            </View>
          )}
        </View>

        {item.discount_pct > 0 && (
          <View style={styles.discountRow}>
            <Ionicons name="arrow-down-circle" size={12} color={COLORS.savings} />
            <Text style={styles.discountText}>{item.discount_pct}% OFF</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ──
const DealsScreen = ({ navigation }) => {
  const [deals, setDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTier, setActiveTier] = useState('all');
  const [countdown, setCountdown] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const countdownRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Countdown ticker ──
  const startCountdownTick = useCallback((initialMs) => {
    let remaining = initialMs;
    if (countdownRef.current) clearInterval(countdownRef.current);

    setCountdown(formatCountdown(remaining));

    countdownRef.current = setInterval(() => {
      remaining -= 1000;
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown('Refreshing...');
        loadDeals(); // Auto-refresh when timer hits 0
      } else {
        setCountdown(formatCountdown(remaining));
      }
    }, 1000);
  }, []);

  // ── Fetch deals from backend ──
  const loadDeals = useCallback(async () => {
    try {
      const res = await api.get('/deals/trending', {
        params: { limit: 50 },
        timeout: 8000,
      });
      if (res.data?.deals?.length > 0) {
        const backendDeals = res.data.deals.map((d) => ({
          ...d,
          tags: d.parsed_tags || [],
        }));
        
        // Re-score to ensure tiers are current
        const scored = DealScoringService.scoreAll(backendDeals);
        const withTrending = DealScoringService.detectTrending(scored);
        setDeals(withTrending);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

        // Cache locally for instant load next time
        await cacheDealsList(withTrending);
      } else {
        // No backend deals — try loading cached deals
        const cached = await loadCachedDeals();
        if (cached.length > 0) {
          setDeals(cached);
        } else {
          setDeals([]);
        }
      }

      // Mark as refreshed and restart timer
      await markDealsRefreshed();
      const remaining = await getTimeUntilNextRefresh();
      startCountdownTick(remaining > 0 ? remaining : REFRESH_INTERVAL);
    } catch (err) {
      console.log('[Deals] Backend fetch failed:', err.message);
      // Try cached deals on error
      const cached = await loadCachedDeals();
      if (cached.length > 0) {
        setDeals(cached);
      } else {
        setDeals([]);
      }

      // Still set a timer so we retry later
      startCountdownTick(REFRESH_INTERVAL);
    }
  }, [startCountdownTick]);

  // ── Initialize on mount ──
  useEffect(() => {
    async function initialize() {
      const needsRefresh = await shouldRefreshDeals();

      if (needsRefresh) {
        await loadDeals();
      } else {
        // Load cached deals instantly, then set countdown
        const cached = await loadCachedDeals();
        if (cached.length > 0) setDeals(cached);

        const remainingMs = await getTimeUntilNextRefresh();
        startCountdownTick(remainingMs);
      }

      setLoading(false);
    }
    initialize();

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [loadDeals, startCountdownTick]);

  // ── Handle app resuming from background ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        const needsRefresh = await shouldRefreshDeals();
        if (needsRefresh) {
          console.log('[Deals] App resumed after 4hrs — auto refreshing');
          loadDeals();
        } else {
          // Recalculate countdown since time passed while backgrounded
          const remainingMs = await getTimeUntilNextRefresh();
          startCountdownTick(remainingMs);
        }
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [loadDeals, startCountdownTick]);

  // ── Apply tier filter ──
  useEffect(() => {
    if (activeTier === 'all') {
      setFilteredDeals(deals);
    } else {
      setFilteredDeals(deals.filter((d) => d.deal_tier === activeTier));
    }
  }, [deals, activeTier]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDeals();
    setRefreshing(false);
  }, [loadDeals]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding best deals…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🔥 Hot Deals</Text>
          <Text style={styles.headerSubtitle}>
            {deals.length} deals scored across 5 platforms
          </Text>
        </View>
        {/* Countdown timer */}
        <View style={styles.timerContainer}>
          <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
          <Text style={styles.timerText}>{countdown}</Text>
        </View>
      </View>

      {/* Last updated indicator */}
      {lastUpdated && (
        <View style={styles.lastUpdatedRow}>
          <Ionicons name="checkmark-circle" size={12} color={COLORS.savings} />
          <Text style={styles.lastUpdatedText}>Updated at {lastUpdated}</Text>
        </View>
      )}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, minHeight: 65 }}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTER_TIERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              activeTier === f.key && styles.filterChipActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTier(f.key);
            }}
          >
            <Text style={styles.filterEmoji}>{f.emoji}</Text>
            <Text
              style={[
                styles.filterLabel,
                activeTier === f.key && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deal grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {filteredDeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No deals in this tier</Text>
            <Text style={styles.emptySubtitle}>
              Search for products to discover deals, or pull to refresh
            </Text>
            {countdown ? (
              <View style={styles.emptyTimerRow}>
                <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
                <Text style={styles.emptyTimerText}>Next refresh in {countdown}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredDeals.map((item, idx) => (
              <DealCard key={item.id || idx} item={item} navigation={navigation} />
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// ── Styles ──
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.md },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { ...FONTS.h2, color: COLORS.textPrimary },
  headerSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },

  // Last updated
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 6,
    gap: 4,
    backgroundColor: COLORS.savingsLight,
  },
  lastUpdatedText: {
    ...FONTS.caption,
    color: COLORS.savings,
    fontWeight: '500',
  },

  // Filters
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterEmoji: { fontSize: 14, marginRight: 6 },
  filterLabel: { ...FONTS.captionBold, color: COLORS.textSecondary },
  filterLabelActive: { color: '#FFF' },

  // Grid
  scrollContent: { padding: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  // Card
  dealCard: {
    width: '48%',
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  dealImgContainer: {
    height: 140,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  dealImg: { width: '90%', height: '90%' },
  dealImgPlaceholder: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  tierBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  topTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  topTagText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  // Info
  dealInfo: { padding: SPACING.md, paddingTop: SPACING.sm },
  dealName: {
    ...FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: 40,
    lineHeight: 18,
  },
  dealPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  dealPlatform: { ...FONTS.caption, color: COLORS.textTertiary, marginLeft: 4, fontWeight: '500' },
  dealDot: { color: COLORS.textTertiary, marginHorizontal: 4 },
  dealDelivery: { ...FONTS.caption, color: COLORS.textTertiary, marginLeft: 3, fontWeight: '500' },

  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: 6,
  },
  dealPrice: { ...FONTS.h3, color: COLORS.primary, fontSize: 16 },
  dealMRP: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  savingsBadge: {
    backgroundColor: COLORS.savingsLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  savingsText: { color: COLORS.savings, fontSize: 10, fontWeight: '700' },

  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  discountText: { color: COLORS.savings, fontSize: 11, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { ...FONTS.bodyBold, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { ...FONTS.caption, color: COLORS.textTertiary, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
  emptyTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  emptyTimerText: {
    ...FONTS.captionBold,
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
});

export default DealsScreen;
