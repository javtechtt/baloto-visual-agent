"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, TargetAndTransition, Transition } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import { GAME_LIST, GAME_ICONS, BalotoGame, GameId } from "@/lib/baloto/games";
import LotteryBall from "./LotteryBall";
import ColorWheelSvg from "./ColorWheelSvg";

// ─── Carousel constants ───────────────────────────────────────────────────────

const CARD_W  = 260;
const CARD_H  = 360;
const RADIUS  = 310;
const ITEMS   = GAME_LIST.length; // 5
const CYCLE_MS = 3500;

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
  baloto:     { scale: [1, 1.28, 1] },
  miloto:     { y: [0, -12, 0] },
  superastro: { x: [0, 18, 0], opacity: [1, 0.55, 1] },
  revancha:   { rotate: [-9, 9, -9] },
};

const ICON_TRANSITION: Partial<Record<GameId, Transition>> = {
  baloto:     { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
  miloto:     { duration: 1.3, repeat: Infinity, ease: "easeInOut" },
  superastro: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
  revancha:   { duration: 1.1, repeat: Infinity, ease: "easeInOut" },
};

// ─── Opacity table per offset from active card ────────────────────────────────

function getCardOpacity(cardIdx: number, activeIdx: number): number {
  const offset     = ((cardIdx - activeIdx) % ITEMS + ITEMS) % ITEMS;
  const normalized = offset > ITEMS / 2 ? ITEMS - offset : offset;
  return [1.0, 0.5, 0.12][Math.min(normalized, 2)];
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
                <CarouselCard game={game} />
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Dot indicators ── */}
      <div className="flex items-center gap-2 mt-10">
        {GAME_LIST.map((g, i) => (
          <motion.div
            key={g.id}
            className="h-1.5 rounded-full"
            animate={{
              width:           i === activeIdx ? 20 : 6,
              backgroundColor: i === activeIdx
                ? GAME_LIST[activeIdx].accentColor
                : "rgba(255,255,255,0.18)",
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single carousel card face ────────────────────────────────────────────────

function CarouselCard({ game }: { game: BalotoGame }) {
  const numbers     = SHOWCASE_NUMBERS[game.id];
  const bonusNumber = SHOWCASE_BONUS[game.id];

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col items-center justify-between py-7 px-5"
      style={{
        background: `linear-gradient(160deg, ${game.accentColor}18 0%, rgba(10,6,20,0.92) 60%)`,
        border:     `1px solid ${game.accentColor}30`,
        boxShadow:  `0 0 40px ${game.accentColor}15, inset 0 1px 0 ${game.accentColor}20`,
        backfaceVisibility: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${game.accentColor}22, transparent 65%)`,
        }}
      />

      {/* ── Animated icon ── */}
      {game.id === "colorloto" ? (
        // SVG spinning color wheel
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ filter: "drop-shadow(0 0 14px rgba(255,255,255,0.35))" }}
        >
          <ColorWheelSvg size={80} />
        </motion.div>
      ) : (
        // Emoji with per-game loop animation
        <motion.div
          className="relative text-7xl leading-none"
          animate={ICON_ANIMATE[game.id]}
          transition={ICON_TRANSITION[game.id]}
          style={{ filter: `drop-shadow(0 0 16px ${game.accentColor}90)` }}
        >
          {GAME_ICONS[game.id]}
        </motion.div>
      )}

      {/* Game name + tagline */}
      <div className="relative text-center">
        <h3
          className="text-2xl font-black tracking-tight"
          style={{ color: game.accentColor }}
        >
          {game.name}
        </h3>
        <p className="text-white/35 text-xs mt-1 leading-snug px-2">
          {game.tagline}
        </p>
      </div>

      {/* Sample lottery balls */}
      <div className="relative flex flex-wrap justify-center gap-1.5">
        {numbers.map((n, i) => (
          <LotteryBall
            key={i}
            value={n}
            accentColor={game.accentColor}
            size="sm"
            index={i}
          />
        ))}
        {bonusNumber !== undefined && (
          <LotteryBall
            value={bonusNumber}
            accentColor={game.accentColor}
            isBonus
            size="sm"
            index={numbers.length}
          />
        )}
      </div>

      {/* Price + draw days */}
      <div className="relative flex flex-col items-center gap-0.5">
        <span className="text-sm font-bold" style={{ color: game.accentColor }}>
          ${game.price.toLocaleString()} COP
        </span>
        <span className="text-white/28 text-xs">
          {game.drawDays.join(" · ")}
        </span>
      </div>
    </div>
  );
}
