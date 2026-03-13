"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useMemo, useState } from "react";
import { useBalotoStore, JackpotRainTrigger } from "@/store/baloto.store";

// ─── Sound generation via Web Audio API ───────────────────────────────────────

function playCoinsSound() {
  try {
    const ctx = new AudioContext();
    // Cascading coin arpeggio — 6 rapid pings
    const freqs = [1046, 1319, 1568, 2093, 2637, 3136];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {
    // Audio not available — silent fallback
  }
}

function playDollarsSound() {
  try {
    const ctx = new AudioContext();
    // Cash register "ka-ching" — two-tone bell hit
    [[1200, 0], [1800, 0.08]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.start(t);
      osc.stop(t + 1.0);
    });
  } catch {
    // Silent fallback
  }
}

// ─── Rain item configuration ──────────────────────────────────────────────────

interface RainItem {
  id: number;
  x: number;      // % from left
  delay: number;  // seconds
  duration: number;
  size: number;
  spin: number;   // rotation degrees
  wobble: number; // horizontal drift px
}

function generateRainItems(count: number): RainItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 96,
    delay: Math.random() * 2.5,
    duration: 2.8 + Math.random() * 2.2,
    size: 28 + Math.random() * 30,
    spin: (Math.random() - 0.5) * 720,
    wobble: (Math.random() - 0.5) * 80,
  }));
}

// ─── Main component ───────────────────────────────────────────────────────────

const AUTO_CLEAR_MS = 5500;

export default function JackpotRain() {
  const jackpotRain = useBalotoStore((s) => s.jackpotRain);
  const clearJackpotRain = useBalotoStore((s) => s.clearJackpotRain);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!jackpotRain) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      clearJackpotRain();
    }, AUTO_CLEAR_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [jackpotRain, clearJackpotRain]);

  return (
    <AnimatePresence>
      {jackpotRain && (
        <RainScene
          key={jackpotRain.id}
          trigger={jackpotRain}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Rain scene ───────────────────────────────────────────────────────────────

function RainScene({ trigger }: { trigger: JackpotRainTrigger }) {
  const isCoins = trigger.type === "coins";
  const [soundFired, setSoundFired] = useState(false);

  useEffect(() => {
    if (!soundFired) {
      if (isCoins) playCoinsSound();
      else playDollarsSound();
      setSoundFired(true);
    }
  }, [isCoins, soundFired]);

  const items = useMemo(() => generateRainItems(28), []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9996 }}
    >
      {/* Dark overlay to make things pop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: AUTO_CLEAR_MS / 1000, times: [0, 0.06, 0.8, 1] }}
      />

      {/* Rain items */}
      {items.map((item) =>
        isCoins ? (
          <CoinItem key={item.id} item={item} />
        ) : (
          <DollarItem key={item.id} item={item} />
        )
      )}

      {/* Central jackpot amount display */}
      <JackpotDisplay amount={trigger.amount} />
    </div>
  );
}

// ─── Coin item ────────────────────────────────────────────────────────────────

function CoinItem({ item }: { item: RainItem }) {
  return (
    <motion.div
      className="absolute flex items-center justify-center rounded-full font-black select-none"
      style={{
        left: `${item.x}%`,
        top: -item.size - 20,
        width: item.size,
        height: item.size,
        background: "radial-gradient(circle at 35% 30%, #fde047, #ca8a04 55%, #92400e)",
        border: "2px solid #fbbf24",
        boxShadow: "0 0 12px rgba(251,191,36,0.7), inset 0 2px 4px rgba(255,255,255,0.4)",
        fontSize: item.size * 0.45,
        color: "#92400e",
      }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: typeof window !== "undefined" ? window.innerHeight + item.size + 40 : 900,
        x: item.wobble,
        rotate: item.spin,
        opacity: [1, 1, 1, 0],
      }}
      transition={{
        duration: item.duration,
        delay: item.delay,
        ease: "easeIn",
        opacity: { times: [0, 0.6, 0.85, 1], duration: item.duration, delay: item.delay },
      }}
    >
      $
    </motion.div>
  );
}

// ─── Dollar bill item ─────────────────────────────────────────────────────────

function DollarItem({ item }: { item: RainItem }) {
  const w = item.size * 1.8;
  const h = item.size * 0.9;
  return (
    <motion.div
      className="absolute flex items-center justify-center select-none"
      style={{
        left: `${item.x}%`,
        top: -h - 20,
        width: w,
        height: h,
        background: "linear-gradient(135deg, #15803d 0%, #16a34a 40%, #14532d 100%)",
        border: "1.5px solid #22c55e",
        borderRadius: 4,
        boxShadow: "0 0 14px rgba(34,197,94,0.6), inset 0 1px 3px rgba(255,255,255,0.2)",
        fontSize: h * 0.55,
        fontWeight: 900,
        color: "#bbf7d0",
        fontFamily: "serif",
      }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: typeof window !== "undefined" ? window.innerHeight + h + 40 : 900,
        x: item.wobble,
        rotate: item.spin * 0.4,
        opacity: [1, 1, 1, 0],
      }}
      transition={{
        duration: item.duration,
        delay: item.delay,
        ease: "easeIn",
        opacity: { times: [0, 0.6, 0.85, 1], duration: item.duration, delay: item.delay },
      }}
    >
      $
    </motion.div>
  );
}

// ─── Central jackpot display ──────────────────────────────────────────────────

function JackpotDisplay({ amount }: { amount?: string }) {
  // t1 = 0.12 (peak in), t2 = 0.78 (start exit), t3 = 1
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: AUTO_CLEAR_MS / 1000,
        times: [0, 0.12, 0.78, 1],
      }}
    >
      {/* Trophy emoji — big */}
      <motion.div
        style={{ fontSize: "clamp(64px, 14vmin, 140px)", lineHeight: 1 }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.3, 1.0], rotate: [-20, 8, 0] }}
        transition={{ duration: 0.55, ease: [0.22, 1.15, 0.36, 1] }}
      >
        🏆
      </motion.div>

      {/* Amount or fallback */}
      <motion.div
        className="text-center font-black uppercase tracking-tight"
        style={{
          fontSize: amount
            ? "clamp(40px, 10vw, 120px)"
            : "clamp(48px, 12vw, 140px)",
          color: "#fde047",
          textShadow:
            "0 0 40px rgba(253,224,71,0.9), 0 0 80px rgba(253,224,71,0.5), 0 4px 20px rgba(0,0,0,0.8)",
          lineHeight: 1.05,
        }}
        initial={{ scale: 0.2, y: 30 }}
        animate={{ scale: [0.2, 1.15, 1.0], y: [30, -6, 0] }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1.15, 0.36, 1] }}
      >
        {amount ?? "WIN BIG!"}
      </motion.div>

      {/* Subtext */}
      <motion.div
        className="font-bold uppercase tracking-[0.3em]"
        style={{
          fontSize: "clamp(14px, 2.5vmin, 28px)",
          color: "rgba(255,255,255,0.85)",
          textShadow: "0 0 20px rgba(253,224,71,0.4), 0 2px 10px rgba(0,0,0,0.9)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        Could be yours
      </motion.div>
    </motion.div>
  );
}
