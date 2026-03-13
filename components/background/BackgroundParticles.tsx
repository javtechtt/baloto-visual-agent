"use client";

import { motion } from "framer-motion";

// ─── Deterministic pseudo-random (no Math.random at render time → no SSR/hydration mismatch) ──

function r(seed: number, min: number, max: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return min + (s - Math.floor(s)) * (max - min);
}

// ─── Color palette — red / purple / white / gold matching app theme ──────────

const PALETTE = [
  {
    border: "rgba(239,68,68,0.65)",
    fill: "radial-gradient(circle at 33% 28%, rgba(239,68,68,0.28), rgba(239,68,68,0.08) 70%)",
    glow: "rgba(239,68,68,0.35)",
    text: "rgba(239,68,68,0.9)",
  },
  {
    border: "rgba(139,92,246,0.65)",
    fill: "radial-gradient(circle at 33% 28%, rgba(139,92,246,0.28), rgba(139,92,246,0.08) 70%)",
    glow: "rgba(139,92,246,0.35)",
    text: "rgba(139,92,246,0.9)",
  },
  {
    border: "rgba(255,255,255,0.45)",
    fill: "radial-gradient(circle at 33% 28%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 70%)",
    glow: "rgba(255,255,255,0.2)",
    text: "rgba(255,255,255,0.85)",
  },
  {
    border: "rgba(251,191,36,0.6)",
    fill: "radial-gradient(circle at 33% 28%, rgba(251,191,36,0.24), rgba(251,191,36,0.07) 70%)",
    glow: "rgba(251,191,36,0.3)",
    text: "rgba(251,191,36,0.9)",
  },
];

// ─── Ball data — generated once at module level (stable across renders) ───────

interface FloatingBall {
  id: number;
  number: number;
  x: number;          // % from left
  y: number;          // % from top
  size: number;       // diameter in px
  baseOpacity: number;
  floatRange: number; // bob distance in px
  duration: number;   // seconds for one bob cycle
  delay: number;      // animation start delay in seconds
  colorIdx: number;
}

const BALLS: FloatingBall[] = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  number: Math.round(r(i * 7 + 1, 1, 43)),
  x: r(i * 3 + 2, 2, 96),
  y: r(i * 5 + 3, 3, 91),
  size: r(i * 11 + 4, 20, 42),
  baseOpacity: r(i * 13 + 5, 0.18, 0.42),
  floatRange: r(i * 17 + 6, 18, 52),
  duration: r(i * 19 + 7, 5, 14),
  delay: r(i * 23 + 8, 0, 7),
  colorIdx: Math.floor(r(i * 29 + 9, 0, 4)),
}));

// ─── Component ────────────────────────────────────────────────────────────────

export default function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>

      {/* ── Floating lottery balls ─────────────────────────────────────────── */}
      {BALLS.map((ball) => {
        const c = PALETTE[ball.colorIdx];
        return (
          <motion.div
            key={ball.id}
            className="absolute flex items-center justify-center rounded-full select-none"
            style={{
              left: `${ball.x}%`,
              top: `${ball.y}%`,
              width: ball.size,
              height: ball.size,
              background: c.fill,
              border: `1px solid ${c.border}`,
              boxShadow: `0 0 18px ${c.glow}, 0 0 6px ${c.glow}, inset 0 0 8px ${c.glow}`,
              fontSize: Math.round(ball.size * 0.4),
              fontWeight: 800,
              color: c.text,
              opacity: ball.baseOpacity,
              letterSpacing: "-0.02em",
            }}
            animate={{
              y: [0, -ball.floatRange, 0],
              opacity: [ball.baseOpacity, ball.baseOpacity * 1.55, ball.baseOpacity],
            }}
            transition={{
              duration: ball.duration,
              delay: ball.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {ball.number}
          </motion.div>
        );
      })}

      {/* ── AI scan line — sweeps top → bottom slowly, very subtle ─────────── */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          height: 2,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.3) 15%, rgba(139,92,246,0.5) 45%, rgba(139,92,246,0.5) 55%, rgba(239,68,68,0.3) 85%, transparent 100%)",
        }}
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 4,
        }}
      />

      {/* ── Second scan line — offset timing, horizontal ──────────────────── */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)",
        }}
        initial={{ top: "50%" }}
        animate={{ top: ["50%", "100%", "0%", "50%"] }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
