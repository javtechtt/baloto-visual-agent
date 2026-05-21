import type { GameId } from "@/lib/baloto/games";

// ─── Live jackpots (seeded from baloto.com, May 2026) ────────────────────────
// Amounts in COP. The UI tickers start here and tick upward to feel "live."

export const JACKPOTS_COP: Record<GameId, number> = {
  baloto: 38_400_000_000, // Grand Jackpot — $38,400 million
  revancha: 3_200_000_000, // $3,200 million
  colorloto: 1_800_000_000, // $1,800 million
  miloto: 120_000_000, // $120 million
  superastro: 850_000_000, // not published on the homepage — plausible figure
};

// The headline jackpot shown in the marquee.
export const HEADLINE_JACKPOT = {
  gameId: "baloto" as GameId,
  label: "Grand Jackpot",
  amountCOP: JACKPOTS_COP.baloto,
};

// Casino-tile badges for the carousel cards.
export const GAME_BADGES: Partial<Record<GameId, "HOT" | "NEW">> = {
  baloto: "HOT",
  superastro: "HOT",
  colorloto: "NEW",
};

// Full grouped figure for the headline ticker, e.g. "$38,400,123,000".
export function formatCOP(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// Compact prize, e.g. "$38,400 million".
export function formatMillions(n: number): string {
  const millions = n / 1_000_000;
  return `$${millions.toLocaleString("en-US", { maximumFractionDigits: 0 })} million`;
}

// ─── Winners feed (demo) ──────────────────────────────────────────────────────
// Fixed, deterministic list — no Math.random in render, so SSR and client HTML
// match. Clearly illustrative, not real payouts.

export interface Winner {
  name: string;
  city: string;
  game: string;
  amountCOP: number;
}

export const WINNERS: Winner[] = [
  { name: "Juan D.", city: "Bogotá", game: "Baloto", amountCOP: 2_400_000_000 },
  { name: "María C.", city: "Medellín", game: "Color Loto", amountCOP: 180_000_000 },
  { name: "Carlos R.", city: "Cali", game: "Revancha", amountCOP: 620_000_000 },
  { name: "Luisa F.", city: "Barranquilla", game: "MiLoto", amountCOP: 45_000_000 },
  { name: "Andrés M.", city: "Cartagena", game: "Super Astro", amountCOP: 92_000_000 },
  { name: "Valentina S.", city: "Bucaramanga", game: "Baloto", amountCOP: 5_100_000_000 },
  { name: "Diego P.", city: "Pereira", game: "Color Loto", amountCOP: 240_000_000 },
  { name: "Sofía G.", city: "Cúcuta", game: "MiLoto", amountCOP: 78_000_000 },
  { name: "Camilo T.", city: "Santa Marta", game: "Revancha", amountCOP: 410_000_000 },
  { name: "Daniela V.", city: "Manizales", game: "Baloto", amountCOP: 1_750_000_000 },
  { name: "Felipe O.", city: "Ibagué", game: "Super Astro", amountCOP: 130_000_000 },
  { name: "Paula N.", city: "Villavicencio", game: "Color Loto", amountCOP: 320_000_000 },
];

// ─── Next draw countdown ──────────────────────────────────────────────────────
// Baloto draws Wednesday & Saturday ~11:00 PM Colombia time. We compute the next
// occurrence in the viewer's local clock (close enough for a demo countdown).

const DRAW_DOWS = [3, 6]; // Wed, Sat
const DRAW_HOUR = 23; // 11:00 PM

export function nextDrawDate(from: Date = new Date()): Date {
  const d = new Date(from);
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(d);
    candidate.setDate(d.getDate() + i);
    candidate.setHours(DRAW_HOUR, 0, 0, 0);
    if (DRAW_DOWS.includes(candidate.getDay()) && candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  // Fallback — one day out
  const fallback = new Date(from);
  fallback.setDate(from.getDate() + 1);
  fallback.setHours(DRAW_HOUR, 0, 0, 0);
  return fallback;
}

export interface Countdown {
  hours: number;
  minutes: number;
  seconds: number;
}

export function timeUntil(target: Date, now: Date = new Date()): Countdown {
  let diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(diff / 3600);
  diff -= hours * 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff - minutes * 60;
  return { hours, minutes, seconds };
}
