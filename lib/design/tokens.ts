// Single source of truth for colors, z-index layers, animation presets,
// and spacing constants. Every component imports from here instead of
// hardcoding values.

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Brand — hot casino red, still used for alerts / brand dot
  primary: "#ff2d6f",       // hot neon rose — highlights & live state
  primaryDark: "#c91450",
  brand: "#ff2d95",         // neon magenta — primary chrome / glowing borders

  // Hero accent (ordering scene) — luminous casino gold
  gold: "#ffd86b",
  goldDim: "#c79a3c",

  // Semantic
  success: "#39ff9e",       // neon mint — "win" / confirmed
  successDark: "#16a34a",
  warning: "#ffb020",
  info: "#22d3ee",          // neon cyan
  error: "#ff4d6d",

  // Colorloto palette (kept vivid)
  lotoRed: "#ff4d6d",
  lotoGreen: "#39ff9e",
  lotoBlue: "#22d3ee",
  lotoYellow: "#ffd86b",

  // Neutrals (casino floor — deep violet void)
  bgDeep: "#070310",
  bgBase: "#0a0517",
  bgElevated: "#1a0d33",    // violet glow center for radial
  surface: "rgba(168,85,247,0.05)",
  surfaceHover: "rgba(168,85,247,0.10)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  surfaceBorderHover: "rgba(34,211,238,0.35)",

  // Checkout palette (the cashier — deep violet, calmer than the floor)
  checkoutBg: "#0a0614",
  checkoutSurface: "#15102a",
  checkoutSurfaceHover: "#1d1638",
  checkoutBorder: "rgba(255,255,255,0.07)",
  checkoutBorderHover: "rgba(34,211,238,0.3)",

  // Text — warm ivory for ordering, cooler ink for checkout
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.7)",
  textTertiary: "rgba(255,255,255,0.5)",
  textMuted: "rgba(255,255,255,0.4)",
  textSubtle: "rgba(255,255,255,0.3)",
  textFaint: "rgba(255,255,255,0.2)",

  ink: "#f4ecff",
  inkMuted: "rgba(244,236,255,0.62)",
  inkSubtle: "rgba(244,236,255,0.38)",
  inkFaint: "rgba(244,236,255,0.22)",
} as const;

// ─── Neon accent palette (the casino's signature lights) ─────────────────────

export const neon = {
  cyan: "#22d3ee",
  cyanBright: "#67e8f9",
  magenta: "#ff2d95",
  magentaBright: "#ff6ec7",
  violet: "#a855f7",
  violetBright: "#c084fc",
  gold: "#ffd86b",
  goldBright: "#ffe9a8",
  green: "#39ff9e",
} as const;

// Neon glow generators — drop-in box-shadow / text-shadow strings.
// `s` scales the spread for emphasis (1 = default, 2 = hero element).
export const glow = {
  box: (hex: string, s = 1) =>
    `0 0 ${8 * s}px ${hex}, 0 0 ${22 * s}px ${hex}88, 0 0 ${44 * s}px ${hex}44`,
  text: (hex: string, s = 1) =>
    `0 0 ${6 * s}px ${hex}, 0 0 ${18 * s}px ${hex}aa, 0 0 ${36 * s}px ${hex}66`,
  ring: (hex: string, s = 1) =>
    `inset 0 0 ${10 * s}px ${hex}55, 0 0 ${14 * s}px ${hex}66`,
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
  primaryButton: `linear-gradient(135deg, ${neon.magenta}, ${neon.violet})`,
  successButton: `linear-gradient(135deg, ${colors.success}, ${colors.successDark})`,
  // Casino floor — violet glow blooming up from the stage, fading to void
  bgRadial: `radial-gradient(ellipse 90% 70% at 50% 42%, ${colors.bgElevated} 0%, ${colors.bgBase} 45%, ${colors.bgDeep} 80%)`,
  // Neon marquee sweep — cyan → magenta → gold (for text/borders)
  neonSweep: `linear-gradient(90deg, ${neon.cyan}, ${neon.magenta} 50%, ${neon.gold})`,
  // Light pool cast on the floor under the active game
  spotlight: `radial-gradient(ellipse 60% 100% at 50% 0%, ${neon.violet}3a 0%, transparent 70%)`,
  // Checkout retains its deep-violet flat base — no gradient
} as const;
