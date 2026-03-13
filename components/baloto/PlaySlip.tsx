"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Delete } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import { GAMES, ZODIAC_SIGNS, COLORLOTO_COLORS } from "@/lib/baloto/games";
import LotteryBall from "./LotteryBall";

export default function PlaySlip() {
  const activePlay = useBalotoStore((s) => s.activePlay);
  const confirmPlay = useBalotoStore((s) => s.confirmPlay);
  const setActiveNumbers = useBalotoStore((s) => s.setActiveNumbers);
  const setActiveBonusNumber = useBalotoStore((s) => s.setActiveBonusNumber);
  const clearActiveBonusNumber = useBalotoStore((s) => s.clearActiveBonusNumber);
  const setActiveZodiacSign = useBalotoStore((s) => s.setActiveZodiacSign);
  const setActiveColor = useBalotoStore((s) => s.setActiveColor);

  if (!activePlay?.gameId) return null;

  const game = GAMES[activePlay.gameId];
  const numbers = activePlay.numbers ?? [];
  const emptyMainSlots = Math.max(0, game.pickCount - numbers.length);
  const hasBonus = !!game.bonusPickCount;
  const isDigitGame = activePlay.gameId === "superastro" || activePlay.gameId === "colorloto";
  const mainFilled = numbers.length === game.pickCount;
  const isComplete =
    mainFilled &&
    (!hasBonus || activePlay.bonusNumber !== undefined) &&
    (activePlay.gameId !== "superastro" || activePlay.zodiacSign !== undefined) &&
    (activePlay.gameId !== "colorloto" || activePlay.color !== undefined);

  // ── Selection handlers ───────────────────────────────────────────────────────

  function toggleMain(n: number) {
    if (numbers.includes(n)) {
      setActiveNumbers(numbers.filter((x) => x !== n));
    } else if (numbers.length < game.pickCount) {
      setActiveNumbers([...numbers, n]);
    }
  }

  function appendDigit(d: number) {
    if (numbers.length < game.pickCount) {
      setActiveNumbers([...numbers, d]);
    }
  }

  function clearLastDigit() {
    if (numbers.length > 0) {
      setActiveNumbers(numbers.slice(0, -1));
    }
  }

  function toggleBonus(n: number) {
    if (activePlay.bonusNumber === n) {
      clearActiveBonusNumber();
    } else {
      setActiveBonusNumber(n);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${game.accentColor}18, rgba(255,255,255,0.03))`,
        border: `1px solid ${game.accentColor}30`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: game.accentColor }} />
          <span className="text-white/80 text-sm font-semibold">{game.name}</span>
          <span className="text-white/30 text-xs">— Current Play</span>
        </div>
        <span className="text-white/30 text-xs">
          {numbers.length}/{game.pickCount}
          {hasBonus ? ` + ${activePlay.bonusNumber ?? "?"}` : ""}
        </span>
      </div>

      {/* ── Selected numbers display ─────────────────────────────────────────── */}

      <div className="mb-3">
        <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
          {isDigitGame ? "Digits" : "Main Numbers"}
        </p>
        <div className="flex flex-wrap gap-2">
          {numbers.map((n, i) => (
            <LotteryBall key={i} value={n} accentColor={game.accentColor} index={i} size="md" />
          ))}
          {Array.from({ length: emptyMainSlots }).map((_, i) => (
            <LotteryBall key={`empty-${i}`} value="" accentColor={game.accentColor} isEmpty size="md" />
          ))}
        </div>
      </div>

      {/* Bonus ball display */}
      {hasBonus && (
        <div className="mb-3">
          <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Balotico</p>
          <div className="flex gap-2">
            {activePlay.bonusNumber !== undefined ? (
              <LotteryBall value={activePlay.bonusNumber} accentColor={game.accentColor} isBonus size="md" />
            ) : (
              <LotteryBall value="" accentColor={game.accentColor} isEmpty size="md" />
            )}
          </div>
        </div>
      )}

      {/* Zodiac sign — interactive */}
      {activePlay.gameId === "superastro" && (
        <div className="mb-3">
          <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Zodiac Sign</p>
          <div className="flex flex-wrap gap-2">
            {ZODIAC_SIGNS.map((sign) => (
              <motion.button
                key={sign}
                onClick={() => setActiveZodiacSign(sign)}
                className="px-2 py-1 rounded-full text-xs"
                style={{
                  background: activePlay.zodiacSign === sign ? game.accentColor : "rgba(255,255,255,0.06)",
                  color: activePlay.zodiacSign === sign ? "#fff" : "rgba(255,255,255,0.4)",
                  border: activePlay.zodiacSign === sign ? `1px solid ${game.accentColor}` : "1px solid transparent",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: activePlay.zodiacSign === sign ? 1.08 : 1 }}
              >
                {sign}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Color picker — interactive */}
      {activePlay.gameId === "colorloto" && (
        <div className="mb-3">
          <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Color</p>
          <div className="flex gap-2">
            {COLORLOTO_COLORS.map((color) => {
              const colorMap: Record<string, string> = {
                Red: "#ef4444", Green: "#22c55e", Blue: "#3b82f6", Yellow: "#eab308",
              };
              const hex = colorMap[color];
              const isSelected = activePlay.color === color;
              return (
                <motion.button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: isSelected ? hex : "rgba(255,255,255,0.06)",
                    color: isSelected ? "#fff" : "rgba(255,255,255,0.4)",
                    border: isSelected ? `1px solid ${hex}` : "1px solid transparent",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: isSelected ? 1.08 : 1 }}
                >
                  {color}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Interactive number picker ─────────────────────────────────────────── */}

      <div className="mt-1 pt-3 border-t border-white/08">
        {isDigitGame ? (
          <DigitPicker
            count={numbers.length}
            max={game.pickCount}
            onAppend={appendDigit}
            onClearLast={clearLastDigit}
            accentColor={game.accentColor}
          />
        ) : (
          <>
            <MainNumberGrid
              numbers={numbers}
              poolMax={game.mainPoolMax}
              pickCount={game.pickCount}
              onToggle={toggleMain}
              accentColor={game.accentColor}
            />
            {/* Balotico picker — only after main numbers are filled */}
            <AnimatePresence>
              {hasBonus && mainFilled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <BonusGrid
                    bonusNumber={activePlay.bonusNumber}
                    poolMax={game.bonusPoolMax!}
                    onToggle={toggleBonus}
                    accentColor={game.accentColor}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Confirm button */}
      <AnimatePresence>
        {isComplete && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={confirmPlay}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${game.accentColor}, ${game.accentColor}aa)`,
              boxShadow: `0 0 20px ${game.accentColor}40`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add to Cart
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main number grid (1–N, no repeats) ──────────────────────────────────────

function MainNumberGrid({
  numbers,
  poolMax,
  pickCount,
  onToggle,
  accentColor,
}: {
  numbers: number[];
  poolMax: number;
  pickCount: number;
  onToggle: (n: number) => void;
  accentColor: string;
}) {
  const atMax = numbers.length >= pickCount;

  return (
    <div>
      <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Select numbers</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: poolMax }, (_, i) => i + 1).map((n) => {
          const selected = numbers.includes(n);
          const disabled = atMax && !selected;
          return (
            <motion.button
              key={n}
              onClick={() => !disabled && onToggle(n)}
              className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center"
              style={{
                background: selected ? accentColor : "rgba(255,255,255,0.07)",
                color: selected ? "#fff" : disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.55)",
                boxShadow: selected ? `0 0 10px ${accentColor}60` : "none",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
              whileHover={disabled ? {} : { scale: 1.15 }}
              whileTap={disabled ? {} : { scale: 0.9 }}
              animate={{ scale: selected ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {n}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Balotico picker (1–N, single selection, toggle) ─────────────────────────

function BonusGrid({
  bonusNumber,
  poolMax,
  onToggle,
  accentColor,
}: {
  bonusNumber?: number;
  poolMax: number;
  onToggle: (n: number) => void;
  accentColor: string;
}) {
  return (
    <div className="mt-3">
      <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">Select balotico</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: poolMax }, (_, i) => i + 1).map((n) => {
          const selected = bonusNumber === n;
          return (
            <motion.button
              key={n}
              onClick={() => onToggle(n)}
              className="w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center"
              style={{
                background: selected ? accentColor : "rgba(255,255,255,0.07)",
                color: selected ? "#fff" : "rgba(255,255,255,0.55)",
                boxShadow: selected ? `0 0 10px ${accentColor}60` : "none",
                border: selected ? `1px solid ${accentColor}` : "1px solid transparent",
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: selected ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {n}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Digit picker (0–9, sequential, with backspace) ──────────────────────────

function DigitPicker({
  count,
  max,
  onAppend,
  onClearLast,
  accentColor,
}: {
  count: number;
  max: number;
  onAppend: (d: number) => void;
  onClearLast: () => void;
  accentColor: string;
}) {
  const full = count >= max;

  return (
    <div>
      <p className="text-white/30 text-xs mb-2 uppercase tracking-wider">
        {full ? "All digits selected" : `Tap a digit (${count}/${max})`}
      </p>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i).map((d) => (
          <motion.button
            key={d}
            onClick={() => !full && onAppend(d)}
            className="w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center"
            style={{
              background: full ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
              color: full ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
              cursor: full ? "not-allowed" : "pointer",
            }}
            whileHover={full ? {} : { scale: 1.15, background: accentColor, color: "#fff" }}
            whileTap={full ? {} : { scale: 0.9 }}
          >
            {d}
          </motion.button>
        ))}
        <motion.button
          onClick={onClearLast}
          disabled={count === 0}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: count === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
            color: count === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)",
            cursor: count === 0 ? "not-allowed" : "pointer",
          }}
          whileHover={count === 0 ? {} : { scale: 1.1, color: "#ef4444" }}
          whileTap={count === 0 ? {} : { scale: 0.9 }}
        >
          <Delete size={14} />
        </motion.button>
      </div>
    </div>
  );
}
