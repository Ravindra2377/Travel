// ─────────────────────────────────────────────────────────────────────────────
// Travel Chronicles — Editorial Travel Journal Design System
// Warm paper · deep ink · forest green · quiet photography-first surfaces
// ─────────────────────────────────────────────────────────────────────────────

export const lightColors = {
  // ── Core Travel Backgrounds ───────────────────────────────────────
  paper:          "#F7F8F5", // Warm paper
  paperDim:       "#EDF2EC",
  background:     "#F7F8F7", // Compatible warm base
  surface:        "#FFFFFF",
  card:           "#FFFFFF",
  cardAlt:        "#F2F5F2",
  headerSurface:  "#EBF2EC",
  border:         "#E3EBE4",
  borderLight:    "#EEF4EF",
  divider:        "#E3EBE4",
  line:           "#E3EBE4",
  lineStrong:     "#C9D7CC",

  // ── Brand & Action Accents ────────────────────────────────────────
  primary:        "#16845B", // Forest green
  primaryLight:   "#4FAF86",
  accent:         "#16845B", // Brand accent
  accentMuted:    "rgba(22, 132, 91, 0.08)",
  forest:         "#17211B", // Deep forest
  moss:           "#26382C", // Moss
  sage:           "#DDE7DC", // Soft sage
  secondary:      "#059669",
  secondaryLight: "rgba(5, 150, 105, 0.10)",

  // ── Travel Heritage Accents ───────────────────────────────────────
  turmeric:       "#D97706", // Golden hour / amber
  turmericSoft:   "#FFF4D9",
  terracotta:     "#E76F51", // Earth red
  terracottaSoft: "#FDEEEA",
  cobalt:         "#2563EB", // Deep sea / oceans
  cobaltSoft:     "#EFF6FF",

  // ── Typography & Ink ──────────────────────────────────────────────
  ink:            "#18201C", // Deep ink
  inkSoft:        "#66706A", // Secondary text
  inkFaint:       "#929B95", // Tertiary text
  textPrimary:    "#18201C",
  textSecondary:  "#66706A",
  textTertiary:   "#929B95",
  textOnDark:     "#FFFFFF",
  textOnDarkSec:  "rgba(255,255,255,0.75)",
  textOnDarkTer:  "rgba(255,255,255,0.45)",
  textInverse:    "#FFFFFF",
  textAccent:     "#16845B",

  // ── Restrained Glassmorphism (for floating chrome only) ───────────
  glassSurface:     "rgba(255, 255, 255, 0.75)",
  glassBorder:      "rgba(255, 255, 255, 0.60)",
  glassHighlight:   "rgba(255, 255, 255, 0.35)",
  glassShadow:      "rgba(22, 132, 91, 0.08)",

  // ── Semantic Status ───────────────────────────────────────────────
  warning:        "#F59E0B",
  warningLight:   "rgba(245, 158, 11, 0.08)",
  error:          "#EF4444",
  errorLight:     "rgba(239, 68, 68, 0.08)",
  info:           "#3B82F6",
  infoLight:      "rgba(59, 130, 246, 0.08)",
  success:        "#10B981",

  // ── Gradients ─────────────────────────────────────────────────────
  gradientHero:     ["#0D4F3C", "#16845B", "#3A9D76"],
  gradientCard:     ["#FFFFFF", "#FAFCFA"],
  gradientAccent:   ["#116149", "#16845B"],
  gradientSavings:  ["#059669", "#047857"],
  gradientGlass:    ["rgba(255,255,255,0.92)", "rgba(247,248,245,0.85)"],
  gradientGold:     ["#F97316", "#FB923C"],
  gradientWarm:     ["#E76F51", "#F59E0B"],
  gradientCool:     ["#0EA5A8", "#16845B"],

  // ── Backward-compatible Aliases ───────────────────────────────────
  aubergine:      "#16845B",
  aubergineDeep:  "#0D4F3C",
  aubergineSoft:  "#E3F3EA",
  coriander:      "#059669",
  corianderSoft:  "#E7F7F1",
  savings:        "#059669",
  savingsLight:   "rgba(5, 150, 105, 0.10)",
};

export const darkColors = {
  ...lightColors,
  // ── Core Travel Backgrounds ───────────────────────────────────────
  paper:          "#0E1511", // Deep evergreen
  paperDim:       "#141E18",
  background:     "#0E1511",
  surface:        "#17211B",
  card:           "#17211B",
  cardAlt:        "#1E2B23",
  headerSurface:  "#16241D",
  border:         "#26382C",
  borderLight:    "#1F2E24",
  divider:        "#26382C",
  line:           "#26382C",
  lineStrong:     "#3A5243",

  // ── Brand & Action Accents ────────────────────────────────────────
  primary:        "#65C99C", // Luminous forest green
  primaryLight:   "#8AD9B5",
  accent:         "#65C99C",
  accentMuted:    "rgba(101, 201, 156, 0.12)",
  forest:         "#09110D",
  moss:           "#1F2E24",
  sage:           "#2D4033",

  // ── Typography & Ink ──────────────────────────────────────────────
  ink:            "#F7F8FA", // Soft white
  inkSoft:        "#B4BDB7", // Secondary muted text
  inkFaint:       "#77827B", // Tertiary muted text
  textPrimary:    "#F7F8FA",
  textSecondary:  "#B4BDB7",
  textTertiary:   "#77827B",
  textInverse:    "#FFFFFF",

  // ── Restrained Glassmorphism ──────────────────────────────────────
  glassSurface:     "rgba(23, 33, 27, 0.80)",
  glassBorder:      "rgba(255, 255, 255, 0.10)",
  glassHighlight:   "rgba(255, 255, 255, 0.15)",
  glassShadow:      "rgba(0, 0, 0, 0.40)",

  // ── Gradients ─────────────────────────────────────────────────────
  gradientCard:     ["#17211B", "#141E18"],
  gradientGlass:    ["rgba(23,33,27,0.92)", "rgba(14,21,17,0.85)"],

  // ── Backward-compatible Aliases ───────────────────────────────────
  aubergine:      "#65C99C",
  aubergineDeep:  "#09110D",
  aubergineSoft:  "#203B2E",
};

// Fallback for static usage
export const COLORS = lightColors;

const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   16,
  xl:   24,
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

const RADIUS = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  full: 999,
};

const SHADOWS = {
  none: {},
  sm: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  lg: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 7,
  },
  navbar: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  glow: {
    shadowColor: "#5B5AE6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  glowSoft: {
    shadowColor: "#16845B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  }),
};

const FONTS = {
  // Editorial Display Headings (Fraunces)
  h1: {
    fontFamily: "FrauncesBold",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "FrauncesBold",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: "FrauncesMedium",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  editorial: {
    fontFamily: "FrauncesSemiBold",
    fontWeight: "600",
  },
  editorialBold: {
    fontFamily: "FrauncesBold",
    fontWeight: "700",
  },
  heading: {
    fontFamily: "FrauncesBold",
    fontWeight: "600",
  },

  // Interface Text (Inter)
  body: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyMedium: {
    fontFamily: "InterMedium",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: "InterSemiBold",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  uiBody: {
    fontFamily: "Inter",
    fontWeight: "400",
  },
  uiBodyMedium: {
    fontFamily: "InterMedium",
    fontWeight: "500",
  },
  uiBodyBold: {
    fontFamily: "InterSemiBold",
    fontWeight: "600",
  },
  caption: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: "InterSemiBold",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  badge: {
    fontFamily: "InterSemiBold",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eyebrow: {
    fontFamily: "InterBold",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.0,
    textTransform: "uppercase",
  },

  // Travel Details & Coordinates (IBM Plex Mono)
  mono: {
    fontFamily: "IBMPlexMono",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  monoMedium: {
    fontFamily: "IBMPlexMonoMedium",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  monoBold: {
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  ticketStamp: {
    fontFamily: "IBMPlexMonoSemiBold",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
};

export { SPACING, RADIUS, SHADOWS, FONTS };
