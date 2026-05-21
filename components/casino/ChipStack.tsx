"use client";

import { motion, AnimatePresence } from "framer-motion";

// A little stack of poker chips that grows with the wager. Each chip drops in
// with a stagger; the whole stack bobs gently. Purely decorative casino flavor.

const CHIP_COLORS = [
  "#ef4444", // red
  "#22d3ee", // cyan
  "#22c55e", // green
  "#a855f7", // purple
  "#ffd86b", // gold
  "#ff2d95", // magenta
];

const CHIP_W = 46;
const CHIP_H = 13;
const OFFSET = 7; // vertical gap between stacked chips
const MAX = 6;

export default function ChipStack({ count = 5 }: { count?: number }) {
  const n = Math.max(1, Math.min(MAX, count));
  const height = (n - 1) * OFFSET + CHIP_H + 4;

  return (
    <motion.div
      className="relative"
      style={{ width: CHIP_W, height }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {Array.from({ length: n }).map((_, i) => {
          const color = CHIP_COLORS[i % CHIP_COLORS.length];
          const isTop = i === n - 1;
          return (
            <motion.div
              key={i}
              className="absolute left-0"
              style={{ bottom: i * OFFSET, width: CHIP_W, height: CHIP_H }}
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 420, damping: 22 }}
            >
              {/* Chip edge (the side of the disc) */}
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: "50%",
                  background: `radial-gradient(ellipse at 50% 25%, ${color}ee, ${color}99 60%, ${color}55)`,
                  boxShadow: `0 1px 3px rgba(0,0,0,0.55), 0 0 10px ${color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
                }}
              />
              {/* Rim stripes */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: CHIP_H / 2 - 2,
                  height: 4,
                  borderRadius: 2,
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0 3px, transparent 3px 9px)",
                  opacity: 0.5,
                  maskImage: "radial-gradient(ellipse at center, #000 60%, transparent 100%)",
                  WebkitMaskImage: "radial-gradient(ellipse at center, #000 60%, transparent 100%)",
                }}
              />
              {/* Top face on the top chip only */}
              {isTop && (
                <div
                  className="absolute"
                  style={{
                    left: CHIP_W * 0.18,
                    top: -CHIP_H * 0.28,
                    width: CHIP_W * 0.64,
                    height: CHIP_H * 0.9,
                    borderRadius: "50%",
                    background: `repeating-conic-gradient(${color} 0deg 24deg, rgba(255,255,255,0.85) 24deg 48deg)`,
                    boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.5)",
                    opacity: 0.92,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
