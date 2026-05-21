"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HEADLINE_JACKPOT,
  formatCOP,
  nextDrawDate,
  timeUntil,
  type Countdown,
} from "@/lib/casino/data";
import { colors, neon, glow } from "@/lib/design/tokens";

// Top-center marquee: a live-ticking Grand Jackpot + countdown to the
// next draw. The number is seeded deterministically (so SSR matches) and only
// starts climbing after mount. The countdown renders placeholders until mounted
// because it depends on the current clock.

const pad = (n: number) => String(n).padStart(2, "0");

export default function JackpotTicker() {
  const [amount, setAmount] = useState(HEADLINE_JACKPOT.amountCOP);
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  // Tick the jackpot upward — small irregular bumps, like accumulating bets.
  useEffect(() => {
    const id = setInterval(() => {
      setAmount((a) => a + Math.floor(40_000 + Math.random() * 460_000));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Live countdown to the next draw.
  useEffect(() => {
    const target = nextDrawDate();
    const update = () => setCountdown(timeUntil(target));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none text-center px-4"
      style={{ top: 40, zIndex: 31 }}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      <span
        className="font-display uppercase tracking-[0.4em] text-[10px] sm:text-xs mb-1"
        style={{ color: neon.cyan, textShadow: glow.text(neon.cyan, 0.4) }}
      >
        {HEADLINE_JACKPOT.label}
      </span>

      <motion.span
        className="font-display font-black leading-none tabular-nums"
        style={{
          fontSize: "clamp(26px, 5.2vw, 56px)",
          color: neon.gold,
          textShadow: glow.text(neon.gold, 0.9),
        }}
        animate={{ scale: [1, 1.012, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {formatCOP(amount)}
        <span
          className="ml-2 align-middle text-[10px] sm:text-xs tracking-[0.3em]"
          style={{ color: colors.inkMuted, textShadow: "none" }}
        >
          COP
        </span>
      </motion.span>

      <div
        className="mt-2 flex items-center gap-2 font-mono text-[10px] sm:text-xs tracking-wider"
        style={{ color: colors.inkMuted }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: neon.magenta, boxShadow: glow.box(neon.magenta, 0.6) }}
        />
        <span className="uppercase tracking-[0.25em]" style={{ color: colors.inkSubtle }}>
          Next draw
        </span>
        <span
          className="font-display tabular-nums"
          style={{ color: neon.magentaBright, textShadow: glow.text(neon.magenta, 0.35) }}
        >
          {countdown
            ? `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
            : "··:··:··"}
        </span>
      </div>
    </motion.div>
  );
}
