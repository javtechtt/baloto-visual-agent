// Single source of truth for colors, z-index layers, animation presets,
// and spacing constants. Every component imports from here instead of
// hardcoding values.

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Brand
  primary: "#ef4444",       // hot accent — used sparingly for highlights
  primaryDark: "#b91c1c",
  brand: "#c91414",         // deeper, less neon — used on chrome / borders

  // Hero accent (ordering scene only)
  gold: "#d4a24a",
  goldDim: "#9d7a36",

  // Semantic
  success: "#22c55e",
  successDark: "#16a34a",
  warning: "#f59e0b",
  info: "#0ea5e9",
  error: "#ef4444",

  // Colorloto palette
  lotoRed: "#ef4444",
  lotoGreen: "#22c55e",
  lotoBlue: "#3b82f6",
  lotoYellow: "#eab308",

  // Neutrals (ordering theme — warmer)
  bgDeep: "#08070a",
  bgBase: "#0a0a0a",
  bgElevated: "#15100a",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  surfaceBorder: "rgba(255,255,255,0.08)",
  surfaceBorderHover: "rgba(255,255,255,0.12)",

  // Checkout palette (explicitly neutral, no warm cast)
  checkoutBg: "#0e0d10",
  checkoutSurface: "#17151a",
  checkoutSurfaceHover: "#1d1b21",
  checkoutBorder: "rgba(255,255,255,0.06)",
  checkoutBorderHover: "rgba(255,255,255,0.12)",

  // Text — warm ivory for ordering, cooler ink for checkout
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.7)",
  textTertiary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.4)",
  textSubtle: "rgba(255,255,255,0.3)",
  textFaint: "rgba(255,255,255,0.2)",

  ink: "#f4ecdf",
  inkMuted: "rgba(244,236,223,0.62)",
  inkSubtle: "rgba(244,236,223,0.38)",
  inkFaint: "rgba(244,236,223,0.22)",
} as const;

// Colorloto color map — used by PlaySlip and ColorWheelSvg
export const COLORLOTO_HEX: Record<string, string> = {
  Red: colors.lotoRed,
  Green: colors.lotoGreen,
  Blue: colors.lotoBlue,
  Yellow: colors.lotoYellow,
};

// ─── Z-index layers ──────────────────────────────────────────────────────────

export const zIndex = {
  background: 1,
  backgroundParticles: 2,
  content: 10,
  panel: 10,
  mobileSheet: 20,
  logo: 30,
  dock: 50,
  urgencyPulse: 100,
  floatingButton: 150,
  // Full-screen effects — ordered by visual priority
  effectGameIcons: 200,
  effectJackpotRain: 210,
  effectZodiacFlash: 220,
  effectColorSplash: 230,
  effectBallShowcase: 240,
} as const;

// ─── Animation presets ───────────────────────────────────────────────────────

export const easing = {
  standard: [0.4, 0, 0.2, 1] as const,     // Material standard
  decelerate: [0, 0, 0.2, 1] as const,      // Entering elements
  accelerate: [0.4, 0, 1, 1] as const,      // Exiting elements
  spring: { type: "spring" as const, stiffness: 400, damping: 20 },
  springSnappy: { type: "spring" as const, stiffness: 500, damping: 26 },
  springGentle: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export const duration = {
  instant: 0.12,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  panel: 0.5,
  carousel: 0.75,
  scene: 0.22,
} as const;

// Common animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
};

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

// ─── Gradients (reusable) ────────────────────────────────────────────────────

export const gradients = {
  primaryButton: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
  successButton: `linear-gradient(135deg, ${colors.success}, ${colors.successDark})`,
  // Single warm radial — replaces the prior red/purple split
  bgRadial: `radial-gradient(ellipse at 50% 35%, ${colors.bgElevated} 0%, ${colors.bgDeep} 70%)`,
  // Checkout has a flat background — no gradient
} as const;
