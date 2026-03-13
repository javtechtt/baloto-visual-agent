"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBalotoStore } from "@/store/baloto.store";

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries:       "♈",
  Taurus:      "♉",
  Gemini:      "♊",
  Cancer:      "♋",
  Leo:         "♌",
  Virgo:       "♍",
  Libra:       "♎",
  Scorpio:     "♏",
  Sagittarius: "♐",
  Capricorn:   "♑",
  Aquarius:    "♒",
  Pisces:      "♓",
};

// Total duration: 0.7s entrance + 3s hold + 0.9s exit = 4.6s
const ENTRANCE_MS  = 700;
const HOLD_MS      = 3000;
const EXIT_MS      = 900;
const TOTAL_MS     = ENTRANCE_MS + HOLD_MS + EXIT_MS;

export default function ZodiacFlash() {
  const zodiacFlash = useBalotoStore((s) => s.zodiacFlash);
  const clearZodiacFlash = useBalotoStore((s) => s.clearZodiacFlash);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!zodiacFlash) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      clearZodiacFlash();
    }, TOTAL_MS + 200); // small buffer after animation
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [zodiacFlash, clearZodiacFlash]);

  return (
    <AnimatePresence>
      {zodiacFlash && (
        <ZodiacScene
          key={zodiacFlash.id}
          sign={zodiacFlash.sign}
          color={zodiacFlash.color}
        />
      )}
    </AnimatePresence>
  );
}

function ZodiacScene({ sign, color }: { sign: string; color: string }) {
  const symbol = ZODIAC_SYMBOLS[sign] ?? "✦";

  // Timeline fractions for a 4.6s animation
  // [0=start, 0.15=peak-in, 0.80=start-exit, 1=done]
  const t0 = 0;
  const t1 = ENTRANCE_MS / TOTAL_MS;           // ~0.152
  const t2 = (ENTRANCE_MS + HOLD_MS) / TOTAL_MS; // ~0.804
  const t3 = 1;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center"
      style={{ zIndex: 9997 }}
    >
      {/* Dark backdrop with radial color glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${color}55 0%, rgba(0,0,0,0.92) 60%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: TOTAL_MS / 1000, times: [t0, t1, t2, t3], ease: "easeInOut" }}
      />

      {/* Outer glow ring — expands slowly during hold */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: `2px solid ${color}`, boxShadow: `0 0 80px ${color}60` }}
        initial={{ width: "20vmin", height: "20vmin", opacity: 0 }}
        animate={{
          width:   ["20vmin",  "90vmin",  "110vmin", "200vmin"],
          height:  ["20vmin",  "90vmin",  "110vmin", "200vmin"],
          opacity: [0,         0.6,       0.4,       0],
        }}
        transition={{ duration: TOTAL_MS / 1000, times: [t0, t1, t2, t3], ease: "easeInOut" }}
      />

      {/* Second pulse ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ border: `1px solid ${color}80` }}
        initial={{ width: "10vmin", height: "10vmin", opacity: 0 }}
        animate={{
          width:   ["10vmin",  "70vmin",  "95vmin",  "180vmin"],
          height:  ["10vmin",  "70vmin",  "95vmin",  "180vmin"],
          opacity: [0,         0.4,       0.25,      0],
        }}
        transition={{
          duration: TOTAL_MS / 1000,
          delay: 0.15,
          times: [t0, t1, t2, t3],
          ease: "easeInOut",
        }}
      />

      {/* The zodiac symbol — fills the screen */}
      <motion.div
        className="absolute flex flex-col items-center justify-center gap-4 select-none"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{
          scale:   [0,   1.12, 1.0,  1.0,  0.2],
          rotate:  [-15, 5,    0,    0,    10],
          opacity: [0,   1,    1,    1,    0],
        }}
        transition={{
          duration: TOTAL_MS / 1000,
          times: [t0, t1 * 0.7, t1, t2, t3],
          ease: [0.22, 1.1, 0.36, 1],
        }}
      >
        {/* Symbol */}
        <motion.span
          style={{
            fontSize: "clamp(120px, 40vmin, 500px)",
            lineHeight: 1,
            color,
            filter: `drop-shadow(0 0 40px ${color}) drop-shadow(0 0 80px ${color}80)`,
          }}
          animate={{
            filter: [
              `drop-shadow(0 0 40px ${color}) drop-shadow(0 0 80px ${color}80)`,
              `drop-shadow(0 0 80px ${color}) drop-shadow(0 0 160px ${color})`,
              `drop-shadow(0 0 80px ${color}) drop-shadow(0 0 160px ${color})`,
              `drop-shadow(0 0 20px ${color}40) drop-shadow(0 0 40px ${color}20)`,
            ],
          }}
          transition={{
            duration: TOTAL_MS / 1000,
            times: [t0, t1, t2, t3],
            ease: "easeInOut",
          }}
        >
          {symbol}
        </motion.span>

        {/* Sign name */}
        <motion.span
          className="font-black uppercase tracking-[0.35em]"
          style={{
            fontSize: "clamp(18px, 4vmin, 52px)",
            color: "rgba(255,255,255,0.9)",
            textShadow: `0 0 30px ${color}, 0 2px 12px rgba(0,0,0,0.8)`,
          }}
        >
          {sign}
        </motion.span>
      </motion.div>
    </div>
  );
}
