"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBalotoStore } from "@/store/baloto.store";
import { zIndex, colors, neon, glow } from "@/lib/design/tokens";
import { sfx } from "@/lib/audio/sfx";

// Slot-machine number draw. Consumes the same `ballQueue` trigger the old
// flying-ball showcase used: when the agent picks numbers, a slot machine drops
// in, the reels spin and land — left to right — on the chosen numbers, then a
// coin cascade plays. Replaces NumberBallShowcase in the ordering scene.

const H = 56; // reel cell height
const WINDOW = H * 3; // 3 visible cells, payline in the middle

interface Draw {
  id: string;
  numbers: number[];
  color: string;
}

export default function SlotReelDraw() {
  const ballQueue = useBalotoStore((s) => s.ballQueue);
  const clearBallQueue = useBalotoStore((s) => s.clearBallQueue);
  const [draw, setDraw] = useState<Draw | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unseen = ballQueue.filter((b) => !seen.current.has(b.id));
    if (unseen.length === 0) return;
    unseen.forEach((b) => seen.current.add(b.id));

    const numbers = unseen.map((b) => b.number);
    const color = unseen[0]?.color ?? neon.cyan;
    const id = unseen.map((b) => b.id).join("|");
    setDraw({ id, numbers, color });

    const ids = unseen.map((b) => b.id);
    const total = 1500 + numbers.length * 300 + 1800;
    const t = setTimeout(() => {
      clearBallQueue(ids);
      seen.current = new Set([...seen.current].filter((s) => !ids.includes(s)));
      setDraw((d) => (d && d.id === id ? null : d));
    }, total);
    return () => clearTimeout(t);
  }, [ballQueue, clearBallQueue]);

  return (
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      style={{ zIndex: zIndex.effectBallShowcase }}
      aria-hidden="true"
    >
      <AnimatePresence>{draw && <SlotMachine key={draw.id} draw={draw} />}</AnimatePresence>
    </div>
  );
}

// ─── The machine ──────────────────────────────────────────────────────────────

function SlotMachine({ draw }: { draw: Draw }) {
  const { numbers, color } = draw;
  const n = numbers.length;
  const digitGame = numbers.every((x) => x <= 9);
  const poolMin = digitGame ? 0 : 1;
  const poolMax = digitGame ? 9 : 43;

  const [landed, setLanded] = useState(0);
  const allLanded = landed >= n;

  useEffect(() => {
    sfx.reel();
  }, []);

  useEffect(() => {
    if (allLanded) sfx.coins();
  }, [allLanded]);

  return (
    <motion.div
      className="relative flex flex-col items-center rounded-3xl"
      initial={{ scale: 0.7, opacity: 0, y: 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.82, opacity: 0, y: 12 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      style={{
        padding: "18px 18px 20px",
        background: "linear-gradient(180deg, rgba(20,10,38,0.96), rgba(8,4,18,0.98))",
        border: `2px solid ${color}`,
        boxShadow: `${glow.box(color, 1.3)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Bulb strip */}
      <div className="flex items-center gap-1.5 mb-2">
        {Array.from({ length: 11 }).map((_, i) => (
          <motion.span
            key={i}
            className="rounded-full"
            style={{ width: 5, height: 5, background: i % 2 ? neon.gold : color }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Header */}
      <div
        className="font-display uppercase tracking-[0.35em] text-[11px] mb-3"
        style={{ color: neon.gold, textShadow: glow.text(neon.gold, 0.5) }}
      >
        ★ Draw ★
      </div>

      {/* Reels */}
      <div
        className="flex gap-2 rounded-2xl"
        style={{ padding: 10, background: "rgba(0,0,0,0.55)", border: `1px solid ${color}44` }}
      >
        {numbers.map((target, i) => (
          <Reel
            key={i}
            index={i}
            target={target}
            color={color}
            poolMin={poolMin}
            poolMax={poolMax}
            onLand={() => setLanded((c) => c + 1)}
          />
        ))}
      </div>

      {/* Win flourish */}
      <AnimatePresence>
        {allLanded && (
          <motion.div
            className="font-display uppercase tracking-[0.3em] text-sm mt-3"
            style={{ color, textShadow: glow.text(color, 0.6) }}
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            Your numbers!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── One reel ─────────────────────────────────────────────────────────────────

function Reel({
  index,
  target,
  color,
  poolMin,
  poolMax,
  onLand,
}: {
  index: number;
  target: number;
  color: string;
  poolMin: number;
  poolMax: number;
  onLand: () => void;
}) {
  // Build a spin sequence ending with [neighbor, target, neighbor] so the target
  // settles on the centre payline. Stagger spin length per reel.
  const seq = useMemo(() => {
    const rnd = () => poolMin + Math.floor(Math.random() * (poolMax - poolMin + 1));
    const fillerCount = 16 + index * 4;
    const filler = Array.from({ length: fillerCount }, rnd);
    return [...filler, rnd(), target, rnd()];
  }, [index, target, poolMin, poolMax]);

  const targetIdx = seq.length - 2; // the target sits second-to-last
  const finalY = -(targetIdx - 1) * H; // centre the target in the 3-cell window
  const duration = 1.5 + index * 0.3;

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        width: 52,
        height: WINDOW,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.4))",
        border: `1px solid ${color}55`,
      }}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: finalY }}
        transition={{ duration, ease: [0.1, 0.75, 0.25, 1] }}
        onAnimationComplete={onLand}
      >
        {seq.map((num, i) => (
          <div
            key={i}
            className="flex items-center justify-center font-display font-black"
            style={{
              height: H,
              fontSize: 26,
              color: i === targetIdx ? color : colors.ink,
              textShadow: i === targetIdx ? glow.text(color, 0.5) : "none",
            }}
          >
            {num}
          </div>
        ))}
      </motion.div>

      {/* Payline highlight (centre row) */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: H,
          height: H,
          borderTop: `1px solid ${color}`,
          borderBottom: `1px solid ${color}`,
          boxShadow: `inset 0 0 18px ${color}44`,
        }}
      />

      {/* Top / bottom fade so off-payline cells dim out */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,4,18,0.92) 0%, transparent 33%, transparent 67%, rgba(8,4,18,0.92) 100%)",
        }}
      />
    </div>
  );
}
