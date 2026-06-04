// Drop-in SVG replacement for Ionicons that works in APK builds.
// Usage: <Ionicons name="home" size={24} color="#000" />
// This component renders pure SVG — no font files needed.

import React from "react";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";

const Icon = ({ name, size = 24, color = "#000", style }) => {
  const s = size;
  const c = color;
  const sw = 1.5; // default stroke width

  const icon = ICONS[name];
  if (!icon) {
    // Fallback: render a simple square placeholder
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24" style={style}>
        <Rect x="4" y="4" width="16" height="16" rx="2" stroke={c} strokeWidth={sw} fill="none" />
      </Svg>
    );
  }

  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" style={style}>
      {icon(c, sw)}
    </Svg>
  );
};

// ─── Icon definitions (24x24 viewBox) ────────────────────────────────────────
// Outline icons use stroke, filled icons use fill.

const ICONS = {
  // ── Navigation ──
  "home": (c) => <Path d="M3 12.5L12 3l9 9.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" fill={c} />,
  "home-outline": (c, sw) => <Path d="M3 12.5L12 3l9 9.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />,

  "arrow-back": (c, sw) => <G><Line x1="20" y1="12" x2="4" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Polyline points="10,18 4,12 10,6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,
  "arrow-forward": (c, sw) => <G><Line x1="4" y1="12" x2="20" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Polyline points="14,6 20,12 14,18" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  "chevron-forward": (c, sw) => <Polyline points="9,6 15,12 9,18" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  "chevron-back": (c, sw) => <Polyline points="15,6 9,12 15,18" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  "chevron-down": (c, sw) => <Polyline points="6,9 12,15 18,9" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />,

  // ── Close / Check ──
  "close": (c, sw) => <G><Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,
  "close-circle": (c) => <G><Circle cx="12" cy="12" r="10" fill={c} /><Line x1="15" y1="9" x2="9" y2="15" stroke="#fff" strokeWidth={2} strokeLinecap="round" /><Line x1="9" y1="9" x2="15" y2="15" stroke="#fff" strokeWidth={2} strokeLinecap="round" /></G>,

  "checkmark": (c, sw) => <Polyline points="5,12 10,17 19,7" stroke={c} strokeWidth={sw + 0.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  "checkmark-circle": (c) => <G><Circle cx="12" cy="12" r="10" fill={c} /><Polyline points="7,12 10.5,15.5 17,8.5" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,
  "checkbox": (c) => <G><Rect x="3" y="3" width="18" height="18" rx="3" fill={c} /><Polyline points="7,12 10.5,15.5 17,8.5" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  // ── Search ──
  "search": (c, sw) => <G><Circle cx="10.5" cy="10.5" r="7" stroke={c} strokeWidth={sw} fill="none" /><Line x1="15.5" y1="15.5" x2="21" y2="21" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,
  "search-outline": (c, sw) => <G><Circle cx="10.5" cy="10.5" r="7" stroke={c} strokeWidth={sw} fill="none" /><Line x1="15.5" y1="15.5" x2="21" y2="21" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  // ── Heart / Likes ──
  "heart": (c) => <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={c} />,
  "heart-outline": (c, sw) => <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke={c} strokeWidth={sw} fill="none" />,

  // ── Person / Profile ──
  "person": (c) => <G><Circle cx="12" cy="7" r="4" fill={c} /><Path d="M4 21v-1c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v1" fill={c} /></G>,
  "person-outline": (c, sw) => <G><Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={sw} fill="none" /><Path d="M4 21v-1c0-3.31 2.69-6 6-6h4c3.31 0 6 2.69 6 6v1" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  // ── Restaurant / Food ──
  "restaurant": (c) => <G><Path d="M7 2v9a3 3 0 003 3v8h0" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" /><Line x1="7" y1="8" x2="7" y2="2" stroke={c} strokeWidth={1.5} strokeLinecap="round" /><Path d="M17 2v6c0 1.66-1.34 3-3 3h0v11" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" /><Line x1="3" y1="2" x2="3" y2="8" stroke={c} strokeWidth={1.5} strokeLinecap="round" /><Line x1="5" y1="2" x2="5" y2="8" stroke={c} strokeWidth={1.5} strokeLinecap="round" /><Line x1="3" y1="8" x2="7" y2="8" stroke={c} strokeWidth={1.5} strokeLinecap="round" /></G>,
  "restaurant-outline": (c, sw) => <G><Path d="M5 2v7a3 3 0 003 3v10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Line x1="3" y1="2" x2="3" y2="7" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="5" y1="2" x2="5" y2="7" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="7" y1="2" x2="7" y2="7" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Path d="M17 2c0 0 2 1 2 5s-2 5-2 5v10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  "fast-food-outline": (c, sw) => <G><Path d="M4 14h16l-1 7H5z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Path d="M4 14c0-5 3.5-8 8-8s8 3 8 8" stroke={c} strokeWidth={sw} fill="none" /><Line x1="2" y1="14" x2="22" y2="14" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  // ── Shopping ──
  "basket": (c) => <G><Path d="M2 10h20l-2 10H4z" fill={c} /><Polyline points="8,10 12,3 16,10" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,
  "basket-outline": (c, sw) => <G><Path d="M2 10h20l-2 10H4z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Polyline points="8,10 12,3 16,10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  "cart": (c) => <G><Path d="M6 6h15l-1.5 9H7.5z" fill={c} /><Circle cx="9" cy="20" r="1.5" fill={c} /><Circle cx="18" cy="20" r="1.5" fill={c} /><Line x1="1" y1="3" x2="5" y2="3" stroke={c} strokeWidth={1.5} strokeLinecap="round" /><Line x1="5" y1="3" x2="6" y2="15" stroke={c} strokeWidth={1.5} strokeLinecap="round" /></G>,
  "cart-outline": (c, sw) => <G><Path d="M6 6h15l-1.5 9H7.5z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Circle cx="9" cy="20" r="1.5" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="18" cy="20" r="1.5" stroke={c} strokeWidth={sw} fill="none" /><Line x1="1" y1="3" x2="5" y2="3" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="5" y1="3" x2="6" y2="15" stroke={c} strokeWidth={sw} /></G>,

  "bag": (c) => <G><Path d="M4 7h16l-1 14H5z" fill={c} /><Path d="M8 7V5a4 4 0 018 0v2" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>,

  "wallet-outline": (c, sw) => <G><Rect x="2" y="5" width="20" height="15" rx="2" stroke={c} strokeWidth={sw} fill="none" /><Line x1="2" y1="10" x2="22" y2="10" stroke={c} strokeWidth={sw} /><Circle cx="17" cy="14.5" r="1.5" fill={c} /></G>,

  "pricetags": (c) => <G><Path d="M2 12.5V6a2 2 0 012-2h6.5l9.5 9.5-7 7z" fill={c} /><Circle cx="7" cy="8.5" r="1.5" fill="#fff" /></G>,
  "pricetags-outline": (c, sw) => <G><Path d="M2 12.5V6a2 2 0 012-2h6.5l9.5 9.5-7 7z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Circle cx="7" cy="8.5" r="1.5" fill={c} /></G>,

  // ── Communication ──
  "send": (c) => <Path d="M3 3l19 9-19 9V14l13-2-13-2z" fill={c} />,

  // ── Status / Info ──
  "alert-circle-outline": (c, sw) => <G><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none" /><Line x1="12" y1="7" x2="12" y2="13" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="16.5" r="0.8" fill={c} /></G>,
  "information-circle": (c) => <G><Circle cx="12" cy="12" r="10" fill={c} /><Line x1="12" y1="11" x2="12" y2="17" stroke="#fff" strokeWidth={2} strokeLinecap="round" /><Circle cx="12" cy="7.5" r="1" fill="#fff" /></G>,
  "warning-outline": (c, sw) => <G><Path d="M12 2L1 21h22z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Line x1="12" y1="9" x2="12" y2="14" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="17" r="0.8" fill={c} /></G>,
  "help-circle-outline": (c, sw) => <G><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none" /><Path d="M9.5 9a3 3 0 015 1.5c0 2-2.5 2-2.5 4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /><Circle cx="12" cy="17" r="0.8" fill={c} /></G>,

  // ── Star / Sparkles ──
  "star": (c) => <Path d="M12 2l2.9 6.3 6.6.8-4.8 4.5 1.2 6.6L12 17l-5.9 3.2 1.2-6.6L2.5 9.1l6.6-.8z" fill={c} />,
  "sparkles": (c) => <G><Path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" fill={c} /><Path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill={c} /><Path d="M5 16l.7 2.3L8 19l-2.3.7L5 22l-.7-2.3L2 19l2.3-.7z" fill={c} /></G>,

  // ── Trending ──
  "trending-down": (c, sw) => <G><Polyline points="22,17 16,11 12,15 2,5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Polyline points="16,17 22,17 22,11" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  // ── Location ──
  "location": (c) => <G><Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={c} /><Circle cx="12" cy="9" r="2.5" fill="#fff" /></G>,
  "pin-outline": (c, sw) => <G><Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth={sw} fill="none" /></G>,
  "navigate-outline": (c, sw) => <Path d="M3 12l9-9 9 9-9 9z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />,

  // ── Misc Actions ──
  "log-out-outline": (c, sw) => <G><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Polyline points="16,17 21,12 16,7" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Line x1="21" y1="12" x2="9" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  "sync-outline": (c, sw) => <G><Polyline points="1,4 1,10 7,10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Polyline points="23,20 23,14 17,14" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M20.5 9A9 9 0 005 5.6L1 10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /><Path d="M3.5 15a9 9 0 0015.5 3.4l4-4.4" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  "reload": (c, sw) => <G><Polyline points="1,4 1,10 7,10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M3.5 15a9 9 0 102-7L1 10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,
  "refresh": (c, sw) => <G><Polyline points="1,4 1,10 7,10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M3.5 15a9 9 0 102-7L1 10" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  "trash-outline": (c, sw) => <G><Polyline points="3,6 5,6 21,6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth={sw} fill="none" /><Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  "share-outline": (c, sw) => <G><Circle cx="18" cy="5" r="3" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="6" cy="12" r="3" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="18" cy="19" r="3" stroke={c} strokeWidth={sw} fill="none" /><Line x1="8.6" y1="13.5" x2="15.4" y2="17.5" stroke={c} strokeWidth={sw} /><Line x1="15.4" y1="6.5" x2="8.6" y2="10.5" stroke={c} strokeWidth={sw} /></G>,

  "options-outline": (c, sw) => <G><Line x1="4" y1="6" x2="20" y2="6" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="4" y1="12" x2="20" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="4" y1="18" x2="20" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Circle cx="8" cy="6" r="2" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="16" cy="12" r="2" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="10" cy="18" r="2" stroke={c} strokeWidth={sw} fill="none" /></G>,

  "apps-outline": (c, sw) => <G><Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth={sw} fill="none" /><Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth={sw} fill="none" /><Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth={sw} fill="none" /><Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth={sw} fill="none" /></G>,

  "flame-outline": (c, sw) => <Path d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-7l1-1 1 2c.5-1 1.5-3 1.5-5.5 0-.5.5-1 1-.5C16 5 19 9 19 15c0 4-3 7-7 7z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />,

  "flash": (c) => <Path d="M13 2L4.5 13H12l-1 9 8.5-11H12z" fill={c} />,
  "flash-outline": (c, sw) => <Path d="M13 2L4.5 13H12l-1 9 8.5-11H12z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" />,

  "bicycle": (c, sw) => <G><Circle cx="5.5" cy="17" r="3.5" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="18.5" cy="17" r="3.5" stroke={c} strokeWidth={sw} fill="none" /><Polyline points="8,6 11,6 14,17" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Line x1="5.5" y1="17" x2="11" y2="6" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="14" y1="17" x2="18.5" y2="17" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  "rocket-outline": (c, sw) => <G><Path d="M12 2c0 0-7 4-7 12l3 4h8l3-4c0-8-7-12-7-12z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Circle cx="12" cy="11" r="2" stroke={c} strokeWidth={sw} fill="none" /><Line x1="8" y1="22" x2="8" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="16" y1="22" x2="16" y2="18" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  "storefront-outline": (c, sw) => <G><Path d="M3 10V21h18V10" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Path d="M1 10l3-7h16l3 7" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Path d="M1 10c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke={c} strokeWidth={sw} fill="none" /><Path d="M7 10c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke={c} strokeWidth={sw} fill="none" /><Path d="M13 10c0 1.66 1.34 3 3 3s3-1.34 3-3" stroke={c} strokeWidth={sw} fill="none" /><Path d="M19 10c0 1.66 1.34 3 3 3" stroke={c} strokeWidth={sw} fill="none" /></G>,

  // ── Documents ──
  "document-text-outline": (c, sw) => <G><Path d="M6 2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Polyline points="14,2 14,8 20,8" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Line x1="8" y1="13" x2="16" y2="13" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="17" x2="13" y2="17" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  "link-outline": (c, sw) => <G><Path d="M10 13a4.5 4.5 0 006.36 0l3-3a4.5 4.5 0 00-6.36-6.36l-1 1" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /><Path d="M14 11a4.5 4.5 0 00-6.36 0l-3 3a4.5 4.5 0 006.36 6.36l1-1" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  "image-outline": (c, sw) => <G><Rect x="3" y="3" width="18" height="18" rx="2" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="8.5" cy="8.5" r="1.5" fill={c} /><Path d="M21 15l-5-5L5 21" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  "layers-outline": (c, sw) => <G><Path d="M12 2l10 6-10 6L2 8z" stroke={c} strokeWidth={sw} fill="none" strokeLinejoin="round" /><Path d="M2 12l10 6 10-6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M2 17l10 6 10-6" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  // ── Theme ──
  "moon": (c) => <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={c} />,
  "sunny": (c, sw) => <G><Circle cx="12" cy="12" r="4" fill={c} /><Line x1="12" y1="2" x2="12" y2="5" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="19" x2="12" y2="22" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="2" y1="12" x2="5" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="19" y1="12" x2="22" y2="12" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke={c} strokeWidth={sw} strokeLinecap="round" /><Line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke={c} strokeWidth={sw} strokeLinecap="round" /></G>,

  // ── Misc ──
  "lock-closed": (c) => <G><Rect x="5" y="11" width="14" height="10" rx="2" fill={c} /><Path d="M8 11V7a4 4 0 018 0v4" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>,

  "bulb": (c) => <G><Path d="M9 21h6M12 2a7 7 0 00-4 12.7V17a1 1 0 001 1h6a1 1 0 001-1v-2.3A7 7 0 0012 2z" stroke={c} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></G>,

  "sad-outline": (c, sw) => <G><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={sw} fill="none" /><Circle cx="8.5" cy="10" r="1" fill={c} /><Circle cx="15.5" cy="10" r="1" fill={c} /><Path d="M8 16c1-1.5 2.5-2.5 4-2.5s3 1 4 2.5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /></G>,

  "speedometer-outline": (c, sw) => <G><Path d="M12 2a10 10 0 00-8.66 15" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /><Path d="M12 2a10 10 0 018.66 15" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" /><Line x1="12" y1="12" x2="16" y2="6" stroke={c} strokeWidth={sw + 0.5} strokeLinecap="round" /><Circle cx="12" cy="12" r="2" fill={c} /></G>,

  "business-outline": (c, sw) => <G><Rect x="2" y="7" width="20" height="15" rx="1" stroke={c} strokeWidth={sw} fill="none" /><Rect x="6" y="2" width="12" height="5" rx="1" stroke={c} strokeWidth={sw} fill="none" /><Line x1="2" y1="13" x2="22" y2="13" stroke={c} strokeWidth={sw} /><Rect x="9" y="10" width="6" height="6" stroke={c} strokeWidth={sw} fill="none" /></G>,
};

// Also export as default AND as named export so existing `import { Ionicons }` syntax works
export { Icon as Ionicons };
export default Icon;
