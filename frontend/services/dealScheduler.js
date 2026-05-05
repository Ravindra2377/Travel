/**
 * dealScheduler.js — 4-Hour Deal Refresh Timer
 *
 * Manages the refresh cycle for the Hot Deals screen.
 * Tracks when deals were last fetched and provides countdown utilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const LAST_FETCH_KEY = '@deals_last_fetched';
const CACHED_DEALS_KEY = '@deals_cached';

// ─────────────────────────────────────────
// Check if 4 hours have passed since last fetch
// ─────────────────────────────────────────
export async function shouldRefreshDeals() {
  try {
    const lastFetched = await AsyncStorage.getItem(LAST_FETCH_KEY);
    if (!lastFetched) return true; // First launch → always fetch
    const elapsed = Date.now() - parseInt(lastFetched, 10);
    return elapsed >= REFRESH_INTERVAL_MS;
  } catch {
    return true;
  }
}

// ─────────────────────────────────────────
// Mark deals as freshly fetched
// ─────────────────────────────────────────
export async function markDealsRefreshed() {
  await AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
}

// ─────────────────────────────────────────
// Get milliseconds remaining until next refresh
// ─────────────────────────────────────────
export async function getTimeUntilNextRefresh() {
  try {
    const lastFetched = await AsyncStorage.getItem(LAST_FETCH_KEY);
    if (!lastFetched) return 0;
    const elapsed = Date.now() - parseInt(lastFetched, 10);
    return Math.max(0, REFRESH_INTERVAL_MS - elapsed);
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────
// Format countdown as HH:MM:SS
// ─────────────────────────────────────────
export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

// ─────────────────────────────────────────
// Cache deals locally for offline / instant display
// ─────────────────────────────────────────
export async function cacheDealsList(deals) {
  try {
    await AsyncStorage.setItem(CACHED_DEALS_KEY, JSON.stringify(deals));
  } catch (err) {
    console.log('[DealScheduler] Cache write failed:', err.message);
  }
}

export async function loadCachedDeals() {
  try {
    const raw = await AsyncStorage.getItem(CACHED_DEALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const REFRESH_INTERVAL = REFRESH_INTERVAL_MS;
