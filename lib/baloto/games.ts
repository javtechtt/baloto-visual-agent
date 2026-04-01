// ─── Constants (must be defined before GAMES, which references them) ──────────

export const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer",
  "Leo", "Virgo", "Libra", "Scorpio",
  "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const COLORLOTO_COLORS = ["Red", "Green", "Blue", "Yellow"] as const;

// ─── Interactive games (playable through the UI) ──────────────────────────────

export type GameId = "baloto" | "revancha" | "superastro" | "miloto" | "colorloto";

export interface ExtraPick {
  type: "zodiac" | "color";
  options: readonly string[];
}

export interface BalotoGame {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  pickCount: number;
  mainPoolMin?: number; // 0 for digit games (superastro, colorloto), default 1
  mainPoolMax: number;
  bonusPickCount?: number;
  bonusPoolMax?: number;
  extraPick?: ExtraPick; // additional selection (zodiac sign, color, etc.)
  requiresBase?: GameId; // add-on game — reuses numbers from the base game
  drawDays: string[];
  price: number;
  color: string;
  accentColor: string;
  jackpotLabel: string;
}

export const GAMES: Record<GameId, BalotoGame> = {
  baloto: {
    id: "baloto",
    name: "Baloto",
    tagline: "The game that changes your life",
    description:
      "Pick 5 numbers from 1–43 and 1 balotico from 1–16. Match all 6 to win the jackpot.",
    pickCount: 5,
    mainPoolMax: 43,
    bonusPickCount: 1,
    bonusPoolMax: 16,
    drawDays: ["Wednesday", "Saturday"],
    price: 3700,
    color: "from-red-600 to-red-800",
    accentColor: "#ef4444",
    jackpotLabel: "Pozo Mayor",
  },
  revancha: {
    id: "revancha",
    name: "Revancha",
    tagline: "A second chance to win",
    description:
      "An add-on to Baloto — your same numbers enter a separate draw for another chance to win.",
    pickCount: 5,
    mainPoolMax: 43,
    bonusPickCount: 1,
    bonusPoolMax: 16,
    requiresBase: "baloto",
    drawDays: ["Wednesday", "Saturday"],
    price: 1500,
    color: "from-yellow-500 to-orange-600",
    accentColor: "#f59e0b",
    jackpotLabel: "Premio Revancha",
  },
  superastro: {
    id: "superastro",
    name: "Super Astro",
    tagline: "Your zodiac sign is your luck",
    description:
      "Pick 4 digits (0–9) and a zodiac sign. Draws happen every hour, every day.",
    pickCount: 4,
    mainPoolMin: 0,
    mainPoolMax: 9,
    extraPick: { type: "zodiac", options: ZODIAC_SIGNS },
    drawDays: ["Every day, every hour"],
    price: 1000,
    color: "from-purple-600 to-indigo-700",
    accentColor: "#8b5cf6",
    jackpotLabel: "Premio Mayor",
  },
  miloto: {
    id: "miloto",
    name: "Miloto",
    tagline: "More numbers, more chances",
    description:
      "Pick 5 numbers from 1–43. No bonus ball. Multiple prize tiers. Simple and accessible.",
    pickCount: 5,
    mainPoolMax: 43,
    drawDays: ["Wednesday", "Saturday"],
    price: 1000,
    color: "from-cyan-500 to-blue-600",
    accentColor: "#06b6d4",
    jackpotLabel: "Premio Mayor",
  },
  colorloto: {
    id: "colorloto",
    name: "Colorloto",
    tagline: "Pick your color, pick your digits",
    description:
      "Choose 4 digits (0–9 each) and a color. Fast-play format with daily draws.",
    pickCount: 4,
    mainPoolMin: 0,
    mainPoolMax: 9,
    extraPick: { type: "color", options: COLORLOTO_COLORS },
    drawDays: ["Every day"],
    price: 500,
    color: "from-emerald-500 to-green-600",
    accentColor: "#10b981",
    jackpotLabel: "Premio",
  },
};

export const GAME_LIST = Object.values(GAMES);
export const GAME_IDS = Object.keys(GAMES) as GameId[];

// ─── Additional Baloto products (informational — not interactively playable in this UI) ──
// Source of truth for the get_product_catalog tool result.
// Any product that exists on baloto.com belongs here.

export interface BalotoProduct {
  id: string;
  name: string;
  description: string;
  drawSchedule: string;
  price?: string;
  accentColor: string;
  playableInApp: false;
}

export const ADDITIONAL_PRODUCTS: BalotoProduct[] = [
  {
    id: "superastro-sol",
    name: "Super Astro Sol",
    description:
      "A Super Astro variant. Pick 4 digits and a zodiac sign. Dedicated draw series.",
    drawSchedule: "Multiple times daily",
    price: "$1,000 COP",
    accentColor: "#f97316",
    playableInApp: false,
  },
  {
    id: "superastro-luna",
    name: "Super Astro Luna",
    description:
      "A Super Astro variant with its own independent draw. Pick 4 digits and a zodiac sign.",
    drawSchedule: "Multiple times daily",
    price: "$1,000 COP",
    accentColor: "#a78bfa",
    playableInApp: false,
  },
];

// ─── Checkout flow steps (single source of truth) ────────────────────────────

export const CHECKOUT_STEPS = ["cart", "details", "payment", "confirm", "success"] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

// ─── Serializer used by the get_product_catalog tool handler ──────────────────
// Returns a structured plain-text catalog injected directly into the model's context
// as a function_call_output. The model reads this data — not its training memory.

export function serializeProductCatalog(): string {
  const interactive = GAME_LIST
    .map(
      (g) =>
        `• ${g.name} [playable in this session]\n` +
        `  ${g.description}\n` +
        `  Draw days: ${g.drawDays.join(", ")} | Price: $${g.price.toLocaleString()} COP`
    )
    .join("\n\n");

  const informational = ADDITIONAL_PRODUCTS
    .map(
      (p) =>
        `• ${p.name} [available on baloto.com]\n` +
        `  ${p.description}\n` +
        `  Draw schedule: ${p.drawSchedule}${p.price ? ` | Price: ${p.price}` : ""}`
    )
    .join("\n\n");

  return (
    `COMPLETE BALOTO PRODUCT CATALOG\n` +
    `================================\n\n` +
    `Games you can play right now in this session:\n\n` +
    `${interactive}\n\n` +
    `Other Baloto products (direct user to baloto.com for full details):\n\n` +
    `${informational}\n\n` +
    `Total products: ${GAME_LIST.length + ADDITIONAL_PRODUCTS.length}`
  );
}

// ─── Misc ──────────────────────────────────────────────────────────────────────

export const GAME_ICONS: Record<GameId, string> = {
  baloto:     "🏆",   // cashpot / jackpot
  revancha:   "💸",   // flying money — money-back + return
  superastro: "🌠",   // shooting star
  miloto:     "💰",   // money bag
  colorloto:  "🎡",   // fortune wheel / color wheel
};
