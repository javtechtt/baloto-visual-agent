"use client";

import { motion } from "framer-motion";
import { WINNERS, formatMillions } from "@/lib/casino/data";
import { colors, neon, glow } from "@/lib/design/tokens";

// Thin full-width scrolling marquee of recent winners — the classic casino FOMO
// strip. Demo data (see lib/casino/data). The list is rendered twice so the
// loop is seamless as x animates from 0 to -50%.

export default function WinnersTicker() {
  const items = [...WINNERS, ...WINNERS];

  return (
    <div
      className="fixed top-0 left-0 overflow-hidden pointer-events-none flex items-center"
      aria-hidden="true"
      style={{
        height: 30,
        right: 74, // leave the top-right corner for the sound toggle
        zIndex: 29,
        background: "linear-gradient(180deg, rgba(10,5,20,0.92), rgba(10,5,20,0.7))",
        borderBottom: `1px solid ${neon.magenta}33`,
        boxShadow: `0 0 18px ${neon.magenta}22`,
      }}
    >
      <span
        className="flex-shrink-0 h-full flex items-center px-3 font-display uppercase text-[10px] tracking-[0.2em] z-10"
        style={{
          color: "#0a0517",
          background: `linear-gradient(90deg, ${neon.gold}, ${neon.goldBright})`,
          boxShadow: glow.box(neon.gold, 0.5),
        }}
      >
        🏆 Winners
      </span>

      <motion.div
        className="flex items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      >
        {items.map((w, i) => (
          <span key={i} className="flex items-center text-xs px-5">
            <span style={{ color: neon.cyan }}>●</span>
            <span className="ml-2" style={{ color: colors.ink }}>
              {w.name}
            </span>
            <span className="ml-1.5" style={{ color: colors.inkSubtle }}>
              · {w.city}
            </span>
            <span className="ml-2" style={{ color: colors.inkMuted }}>
              won
            </span>
            <span
              className="ml-1.5 font-semibold"
              style={{ color: neon.gold, textShadow: glow.text(neon.gold, 0.3) }}
            >
              {formatMillions(w.amountCOP)}
            </span>
            <span className="ml-1.5" style={{ color: colors.inkSubtle }}>
              on {w.game}
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
