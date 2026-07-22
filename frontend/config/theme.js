// ─────────────────────────────────────────────────────────────────────────────
// CompareZ — Calm Commerce Design System
// Warm neutral surfaces · focused aubergine accents · consistent contrast
// ─────────────────────────────────────────────────────────────────────────────

export const lightColors = {
  // ── Core backgrounds ──────────────────────────────────────────────
  primary:        "#4D3568",
  primaryLight:   "#846AA0",
  brandPurple:    "#4D3568",
  brandPurpleLight: "#846AA0",
  background:     "#F8F6F1",
  backgroundDark: "#0F172A", // Fallback if used statically
  surface:        "#FFFFFF",
  surfaceDark:    "#1E293B",
  card:           "#FFFFFF",
  cardAlt:        "#F2EFE8",
  cardDark:       "#1E293B",
  border:         "#E5E0D7",
  borderDark:     "#334155",
  borderLight:    "#EEEAE3",
  divider:        "#E5E0D7",

  // ── Glassmorphism ─────────────────────────────────────────────────
  glassSurface:     "rgba(255, 255, 255, 0.45)",
  glassSurfaceDark: "rgba(15, 23, 42, 0.55)",
  glassBorder:      "rgba(255, 255, 255, 0.50)",
  glassBorderDark:  "rgba(255, 255, 255, 0.12)",
  glassHighlight:   "rgba(255, 255, 255, 0.30)",
  glassShadow:      "rgba(124, 58, 237, 0.08)",

  // ── Accent (Logo Derived) ─────────────────────────────────────────
  accent:       "#4D3568",
  accentGold:   "#C5852D",
  accentLight:  "rgba(77, 53, 104, 0.10)",
  accentStrong: "#352247",
  accentMuted:  "rgba(77, 53, 104, 0.06)",
  secondary:    "#287A5A",
  secondaryLight: "rgba(40, 122, 90, 0.10)",
  violet:       "#6D527F",
  violetLight:  "rgba(77, 53, 104, 0.10)",

  // ── Semantic (Consistent across themes for safety) ────────────────
  savings:      "#287A5A",
  savingsLight: "rgba(40, 122, 90, 0.10)",
  savingsDark:  "#1F6248",
  warning:      "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.08)",
  error:        "#EF4444",
  errorLight:   "rgba(239, 68, 68, 0.08)",
  info:         "#3B82F6",
  infoLight:    "rgba(59, 130, 246, 0.08)",

  // ── Platform accent colors ────────────────────────────────────────
  platformBlinkit:   "#F8CB46",
  platformZepto:     "#5901C9",
  platformBigBasket: "#84C225",
  platformAmazon:    "#FF9900",
  platformFlipkart:  "#2874F0",

  // ── Text ──────────────────────────────────────────────────────────
  textPrimary:   "#211C27",
  textSecondary: "#69616F",
  textTertiary:  "#9B939F",
  textOnDark:    "#FFFFFF",
  textOnDarkSec: "rgba(255,255,255,0.70)",
  textOnDarkTer: "rgba(255,255,255,0.45)",
  textInverse:   "#FFFFFF",
  textAccent:    "#4D3568",

  // ── Gradients ─────────────────────────────────────────────────────
  gradientHero:     ["#2E1E3D", "#4D3568", "#6D527F"],
  gradientCard:     ["#FFFFFF", "#FBFAF7"],
  gradientCardDark: ["rgba(30,41,59,0.98)", "rgba(15,23,42,0.98)"],
  gradientAccent:   ["#352247", "#5E4278"],
  gradientSavings:  ["#287A5A", "#1F6248"],
  gradientGlass:    ["rgba(255,255,255,0.95)", "rgba(248,250,252,0.90)"],
  gradientGold:     ["#F97316", "#FB923C"],
  gradientWarm:     ["#F97316", "#EC4899"],
  gradientCool:     ["#06B6D4", "#7C3AED"],

  // ── CompareZ Redesign Tokens (Additive) ───────────────────────────
  paper:          "#F8F6F1",
  paperDim:       "#EFEBE3",
  ink:            "#211C2B",
  inkSoft:        "#6E6579",
  inkFaint:       "#A79FAE",
  line:           "#E5E0D7",
  lineStrong:     "#D4CCBF",
  aubergine:      "#4D3568",
  aubergineDeep:  "#2E1E3D",
  aubergineSoft:  "#EEE8F2",
  coriander:      "#287A5A",
  corianderSoft:  "#E4F1EA",
  turmeric:       "#C98A1F",
  turmericSoft:   "#FBEDD3",
  tomato:         "#C94A32",
  tomatoSoft:     "#FBE5DF",
};

export const darkColors = {
  ...lightColors,
  // ── Core backgrounds ──────────────────────────────────────────────
  primary:        "#C1ADD3",
  primaryLight:   "#D8C8E5",
  background:     "#17141B",
  surface:        "#211D25",
  card:           "#211D25",
  cardAlt:        "#2A252E",
  border:         "#3A343F",
  borderLight:    "#302A35",
  divider:        "#3A343F",

  // ── Text ──────────────────────────────────────────────────────────
  textPrimary:   "#F7F3F8",
  textSecondary: "#B8AFBB",
  textTertiary:  "#817985",
  textInverse:   "#FFFFFF", // White text on primary buttons for better contrast

  // ── Gradients ─────────────────────────────────────────────────────
  gradientCard:     ["rgba(30,41,59,0.98)", "rgba(15,23,42,0.98)"],
  gradientGlass:    ["rgba(15,23,42,0.95)", "rgba(30,41,59,0.90)"],

  // ── CompareZ Redesign Tokens (Dark overrides) ─────────────────────
  paper:          "#17141B",
  paperDim:       "#201B24",
  ink:            "#FAF6EF",
  inkSoft:        "#A79FAE",
  inkFaint:       "#6E6579",
  line:           "#3A343F",
  lineStrong:     "#504856",
  aubergine:      "#C1ADD3",
  aubergineDeep:  "#120E16",
  aubergineSoft:  "#33283D",
};

// Fallback for static usage
export const COLORS = lightColors;

const SPACING = {
  xs:   4,
  sm:   8,
  md:   16,        // Normalized from 12
  lg:   16,
  xl:   24,        // Normalized from 20
  xxl:  24,
  xxxl: 32,
  huge: 48,
};

const RADIUS = {
  xs:  6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  24,
  xxl: 32,
  full: 999,
};

const SHADOWS = {
  none: {},
  sm: {
    shadowColor: "#211C27",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#211C27",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#211C27",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 10,
  },
  navbar: {
    shadowColor: "#211C27",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  glow: {
    shadowColor: "#5B5AE6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  glowSoft: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  }),
  cardSoft: {
    shadowColor: "#211C2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  cardPop: {
    shadowColor: "#281A3B",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 60,
    elevation: 20,
  },
};

const FONTS = {
  h1: {
    fontFamily: "RobotoBold",
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  h1Dark: {
    fontFamily: "RobotoBold",
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "RobotoBold",
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  h2Dark: {
    fontFamily: "RobotoBold",
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: "RobotoMedium",
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  h3Dark: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: "Roboto",
    fontSize: 15,
    fontWeight: "400",
    color: "#475569",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  bodyDark: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.70)",
    lineHeight: 20,
  },
  bodyBold: {
    fontFamily: "RobotoBold",
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  bodyBoldDark: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  caption: {
    fontFamily: "Roboto",
    fontSize: 12,
    fontWeight: "400",
    color: "#94A3B8",
    lineHeight: 16,
  },
  captionDark: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: "RobotoMedium",
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 0.2,
  },
  captionBoldDark: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
    letterSpacing: 0.2,
  },
  price: {
    fontFamily: "RobotoBold",
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  priceDark: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  priceSmall: {
    fontFamily: "RobotoBold",
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  luxury: {
    fontFamily: "RobotoBold",
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  luxurySub: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "#FFFFFF", // Brighter on gradients
  },
  // ── CompareZ Redesign Fonts (Additive) ────────────────────────────
  heading: {
    fontFamily: "RobotoBold",
    fontWeight: "600",
    color: "#211C2B",
  },
  uiBody: {
    fontFamily: "Roboto",
    fontWeight: "400",
    color: "#211C2B",
  },
  uiBodyMedium: {
    fontFamily: "RobotoMedium",
    fontWeight: "500",
    color: "#211C2B",
  },
  uiBodyBold: {
    fontFamily: "RobotoBold",
    fontWeight: "600",
    color: "#211C2B",
  },
  mono: {
    fontFamily: "IBMPlexMono",
    fontWeight: "500",
    color: "#211C2B",
  },
  monoBold: {
    fontFamily: "IBMPlexMonoBold",
    fontWeight: "600",
    color: "#211C2B",
  },
};

export { SPACING, RADIUS, SHADOWS, FONTS };
