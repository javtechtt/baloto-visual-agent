"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, TargetAndTransition, Transition } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import { GAME_LIST, GAME_ICONS, BalotoGame, GameId } from "@/lib/baloto/games";
import { colors, neon, glow } from "@/lib/design/tokens";
import { sfx } from "@/lib/audio/sfx";
import { JACKPOTS_COP, GAME_BADGES, formatMillions } from "@/lib/casino/data";
import LotteryBall from "./LotteryBall";
import ColorWheelSvg from "./ColorWheelSvg";

// ─── Carousel constants ───────────────────────────────────────────────────────

const CARD_W  = 260;
const CARD_H  = 360;
const RADIUS  = 310;
const ITEMS   = GAME_LIST.length; // 5
const CYCLE_MS = 5500;

// ─── Sample numbers shown on each card ───────────────────────────────────────

const SHOWCASE_NUMBERS: Record<GameId, number[]> = {
  baloto:     [7, 14, 22, 33, 41],
  revancha:   [3, 9, 18, 27, 35],
  superastro: [3, 7, 2, 9],
  miloto:     [5, 12, 24, 38, 43],
  colorloto:  [4, 2, 8, 1],
};

const SHOWCASE_BONUS: Partial<Record<GameId, number>> = {
  baloto:   8,
  revancha: 11,
};

// ─── Per-game icon animations (colorloto uses SVG — handled separately) ──────

const ICON_ANIMATE: Partial<Record<GameId, TargetAndTransition>> = {
  baloto:     { scale: [1, 1.05, 1] },
  miloto:     { y: [0, -5, 0] },
  superastro: { x: [0, 8, 0], opacity: [1, 0.78, 1] },
  revancha:   { rotate: [-4, 4, -4] },
};

const ICON_TRANSITION: Partial<Record<GameId, Transition>> = {
  baloto:     { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  miloto:     { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  superastro: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  revancha:   { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
};

// ─── Opacity table per offset from active card ────────────────────────────────

function getCardOpacity(cardIdx: number, activeIdx: number): number {
  const offset     = ((cardIdx - activeIdx) % ITEMS + ITEMS) % ITEMS;
  const normalized = offset > ITEMS / 2 ? ITEMS - offset : offset;
  return [1.0, 0.32, 0.06][Math.min(normalized, 2)];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GameShowcase() {
  const selectedGame      = useBalotoStore((s) => s.selectedGame);
  const showcasedGame     = useBalotoStore((s) => s.showcasedGame);
  const checkoutStep      = useBalotoStore((s) => s.checkoutStep);
  const setShowcasedGame  = useBalotoStore((s) => s.setShowcasedGame);
  const [cycleIdx, setCycleIdx] = useState(0);
  const showcaseTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // During checkout the carousel always auto-cycles — ignore selectedGame/showcasedGame
  const isLocked = !checkoutStep && !!(selectedGame || showcasedGame);

  useEffect(() => {
    if (isLocked) return;
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % ITEMS), CYCLE_MS);
    return () => clearInterval(id);
  }, [isLocked]);

  useEffect(() => {
    if (!isLocked) setCycleIdx(0);
  }, [isLocked]);

  // Reset showcasedGame to auto-cycle after 15s of no agent activity on a game
  useEffect(() => {
    if (!showcasedGame) return;
    if (showcaseTimerRef.current) clearTimeout(showcaseTimerRef.current);
    showcaseTimerRef.current = setTimeout(() => setShowcasedGame(null), 20_000);
    return () => {
      if (showcaseTimerRef.current) clearTimeout(showcaseTimerRef.current);
    };
  }, [showcasedGame, setShowcasedGame]);

  const activeIdx = useMemo(() => {
    if (selectedGame)  return GAME_LIST.findIndex((g) => g.id === selectedGame);
    if (showcasedGame) return GAME_LIST.findIndex((g) => g.id === showcasedGame);
    return cycleIdx;
  }, [selectedGame, showcasedGame, cycleIdx]);

  // Rotate the stage so the active card faces the viewer
  const stageAngle = -(activeIdx / ITEMS) * 360;

  // Soft tick as the carousel rotates to a new game (skip the first paint)
  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    sfx.hover();
  }, [activeIdx]);

  return (
    <div className="flex flex-col items-center justify-center h-full select-none">

      {/* ── Perspective container ── */}
      <div
        style={{
          perspective:       "1200px",
          perspectiveOrigin: "50% 45%",
          width:  CARD_W,
          height: CARD_H,
        }}
      >
        {/* ── Rotating stage (only this element animates) ── */}
        <motion.div
          style={{
            width:          CARD_W,
            height:         CARD_H,
            position:       "relative",
            transformStyle: "preserve-3d",
          }}
          animate={{ rotateY: stageAngle }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
        >
          {GAME_LIST.map((game, i) => {
            // CRITICAL: rotateY BEFORE translateZ — positions each card on the cylinder
            const cardAngle = (i / ITEMS) * 360;
            const opacity   = getCardOpacity(i, activeIdx);
            const focused   = i === activeIdx;
            return (
              <div
                key={game.id}
                style={{
                  position:  "absolute",
                  width:     CARD_W,
                  height:    CARD_H,
                  transform: `rotateY(${cardAngle}deg) translateZ(${RADIUS}px)`,
                  opacity,
                  transition: "opacity 0.4s",
                }}
              >
                <CarouselCard game={game} focused={focused} />
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="flex items-center gap-2 mt-10">
        {GAME_LIST.map((g, i) => {
          const active = i === activeIdx;
          return (
            <motion.div
              key={g.id}
              className="h-1.5 rounded-full"
              animate={{
                width:           active ? 22 : 6,
                backgroundColor: active ? neon.cyan : colors.inkFaint,
                boxShadow:       active ? glow.box(neon.cyan, 0.6) : "0 0 0 transparent",
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Single carousel card face ────────────────────────────────────────────────

function CarouselCard({ game, focused }: { game: BalotoGame; focused: boolean }) {
  const numbers     = SHOWCASE_NUMBERS[game.id];
  const bonusNumber = SHOWCASE_BONUS[game.id];
  const accent      = game.accentColor;

  return (
    <>
      {/* Neon pedestal — light pool the card seems to stand in (focused only) */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%] pointer-events-none"
        style={{
          bottom: -26,
          width: "118%",
          height: 54,
          background: `radial-gradient(ellipse at center, ${accent} 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
        animate={{ opacity: focused ? 0.55 : 0 }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col items-center justify-between py-7 px-5"
        style={{
          // Deep glass with a faint accent bloom from the top
          background: `radial-gradient(130% 90% at 50% -10%, ${accent}22 0%, rgba(10,5,20,0.96) 58%)`,
          backfaceVisibility: "hidden",
          backdropFilter: "blur(4px)",
        }}
        animate={{
          border: `1px solid ${focused ? accent : `${accent}33`}`,
          boxShadow: focused
            ? `${glow.box(accent, 1.1)}, inset 0 1px 0 rgba(255,255,255,0.07)`
            : `0 0 0 transparent, inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
        transition={{ duration: 0.4 }}
      >
        {/* Neon top light bar */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 12px ${accent}`,
            opacity: focused ? 1 : 0.4,
          }}
          aria-hidden="true"
        />

        {/* HOT / NEW casino badge */}
        {GAME_BADGES[game.id] && (
          <div
            className="absolute top-3 right-3 font-display font-bold uppercase tracking-widest text-[9px] px-2 py-1 rounded-md"
            style={{
              color: "#0a0517",
              background:
                GAME_BADGES[game.id] === "HOT"
                  ? `linear-gradient(135deg, ${neon.magenta}, ${neon.gold})`
                  : `linear-gradient(135deg, ${neon.cyan}, ${neon.green})`,
              boxShadow: glow.box(
                GAME_BADGES[game.id] === "HOT" ? neon.magenta : neon.cyan,
                0.7
              ),
            }}
          >
            {GAME_BADGES[game.id] === "HOT" ? "🔥 Hot" : "✦ New"}
          </div>
        )}

        {/* ── Animated icon ── */}
        {game.id === "colorloto" ? (
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            style={{ filter: `drop-shadow(0 0 12px ${accent}aa)` }}
          >
            <ColorWheelSvg size={80} />
          </motion.div>
        ) : (
          <motion.div
            className="relative text-7xl leading-none"
            animate={ICON_ANIMATE[game.id]}
            transition={ICON_TRANSITION[game.id]}
            style={{ filter: `drop-shadow(0 0 14px ${accent}aa)` }}
          >
            {GAME_ICONS[game.id]}
          </motion.div>
        )}

        {/* Game name + jackpot prize + tagline */}
        <div className="relative text-center">
          <h3
            className="font-display text-xl font-extrabold tracking-wide uppercase"
            style={{
              color: colors.ink,
              textShadow: focused ? glow.text(accent, 0.55) : "none",
            }}
          >
            {game.name}
          </h3>

          {/* Jackpot prize — the "win this much" hook */}
          <div className="mt-2 flex flex-col items-center gap-0.5">
            <span
              className="uppercase tracking-[0.3em] text-[8px]"
              style={{ color: colors.inkSubtle }}
            >
              {game.jackpotLabel}
            </span>
            <span
              className="font-display font-black leading-none"
              style={{
                fontSize: 17,
                color: neon.gold,
                textShadow: focused ? glow.text(neon.gold, 0.6) : glow.text(neon.gold, 0.25),
              }}
            >
              {formatMillions(JACKPOTS_COP[game.id])}
            </span>
          </div>

          <p className="text-[11px] mt-2 leading-snug px-2" style={{ color: colors.inkMuted }}>
            {game.tagline}
          </p>
        </div>

        {/* Sample lottery balls */}
        <div className="relative flex flex-wrap justify-center gap-1.5">
          {numbers.map((n, i) => (
            <LotteryBall
              key={i}
              value={n}
              accentColor={accent}
              size="sm"
              index={i}
            />
          ))}
          {bonusNumber !== undefined && (
            <LotteryBall
              value={bonusNumber}
              accentColor={accent}
              isBonus
              size="sm"
              index={numbers.length}
            />
          )}
        </div>

        {/* Price + draw days */}
        <div className="relative flex flex-col items-center gap-0.5">
          <span
            className="font-display text-base font-bold tracking-wide"
            style={{ color: neon.gold, textShadow: glow.text(neon.gold, 0.5) }}
          >
            ${game.price.toLocaleString()}
            <span className="text-[10px] ml-1 tracking-widest" style={{ color: colors.inkMuted }}>COP</span>
          </span>
          <span className="text-xs" style={{ color: colors.inkMuted }}>
            {game.drawDays.join(" · ")}
          </span>
        </div>
      </motion.div>
    </>
  );
}
