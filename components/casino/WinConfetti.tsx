"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { neon } from "@/lib/design/tokens";
import { sfx } from "@/lib/audio/sfx";

// A one-shot confetti burst for the win moment. Mounting it fires the fanfare
// and rains neon confetti for ~4s, then removes itself. Generated with random
// values, but only ever mounted after a user interaction (the order confirm),
// so there is no SSR hydration concern.

const COLORS = [neon.cyan, neon.magenta, neon.gold, neon.green, neon.violet, "#ffffff"];

interface Piece {
  id: number;
  x: number; // vw start (centered-ish)
  drift: number; // px horizontal drift
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  color: string;
  round: boolean;
}

function makePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 70,
    drift: (Math.random() - 0.5) * 300,
    delay: Math.random() * 0.6,
    duration: 2.6 + Math.random() * 1.8,
    size: 7 + Math.random() * 9,
    rotate: (Math.random() - 0.5) * 900,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    round: Math.random() > 0.6,
  }));
}

export default function WinConfetti() {
  const pieces = useMemo(() => makePieces(70), []);
  const [done, setDone] = useState(false);

  useEffect(() => {
    sfx.win();
    const t = setTimeout(() => setDone(true), 4600);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: 240 }}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}vw`,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? "50%" : 2,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
          }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 40 : 900,
            x: p.drift,
            rotate: p.rotate,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            opacity: { times: [0, 0.6, 0.85, 1], duration: p.duration, delay: p.delay },
          }}
        />
      ))}
    </div>
  );
}
