"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useBalotoStore } from "@/store/baloto.store";

// 10 paint blobs — positions and sizes are seeded per render so they're stable
const BLOB_CONFIGS = [
  { cx: 0.5,  cy: 0.5,  r: 0.7,  delay: 0    },  // center — biggest
  { cx: 0.0,  cy: 0.0,  r: 0.55, delay: 0.06 },  // top-left
  { cx: 1.0,  cy: 0.0,  r: 0.55, delay: 0.09 },  // top-right
  { cx: 0.0,  cy: 1.0,  r: 0.55, delay: 0.12 },  // bottom-left
  { cx: 1.0,  cy: 1.0,  r: 0.55, delay: 0.15 },  // bottom-right
  { cx: 0.5,  cy: 0.0,  r: 0.45, delay: 0.07 },  // top-center
  { cx: 0.5,  cy: 1.0,  r: 0.45, delay: 0.10 },  // bottom-center
  { cx: 0.0,  cy: 0.5,  r: 0.45, delay: 0.08 },  // left-center
  { cx: 1.0,  cy: 0.5,  r: 0.45, delay: 0.11 },  // right-center
  { cx: 0.3,  cy: 0.35, r: 0.35, delay: 0.13 },  // inner cluster
];

export default function ColorSplash() {
  const colorSplash = useBalotoStore((s) => s.colorSplash);
  const clearColorSplash = useBalotoStore((s) => s.clearColorSplash);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!colorSplash) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      clearColorSplash();
    }, 2200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [colorSplash, clearColorSplash]);

  return (
    <AnimatePresence>
      {colorSplash && (
        <SplashScene key={colorSplash.id} color={colorSplash.color} label={colorSplash.label} />
      )}
    </AnimatePresence>
  );
}

function SplashScene({ color, label }: { color: string; label: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9998 }}>

      {/* Full-screen flash — instantaneous flood then recedes */}
      <motion.div
        className="absolute inset-0"
        style={{ background: color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.82, 0.75, 0] }}
        transition={{ duration: 1.8, times: [0, 0.08, 0.3, 1], ease: "easeOut" }}
      />

      {/* Paint blobs from every corner and center */}
      {BLOB_CONFIGS.map((b, i) => (
        <PaintBlob key={i} {...b} color={color} />
      ))}

      {/* Massive color name — slams in and out */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.8, times: [0, 0.08, 0.55, 1] }}
      >
        <motion.span
          className="font-black uppercase tracking-widest select-none"
          style={{
            fontSize: "clamp(80px, 22vw, 280px)",
            color: "white",
            textShadow: `0 0 60px ${color}, 0 0 120px ${color}, 0 4px 30px rgba(0,0,0,0.8)`,
            mixBlendMode: "overlay",
          }}
          initial={{ scale: 0.3, rotate: -8 }}
          animate={{ scale: [0.3, 1.15, 1.0], rotate: [-8, 4, 0] }}
          transition={{ duration: 0.5, ease: [0.23, 1.2, 0.32, 1] }}
        >
          {label}
        </motion.span>
      </motion.div>
    </div>
  );
}

function PaintBlob({
  cx, cy, r, delay, color,
}: {
  cx: number; cy: number; r: number; delay: number; color: string;
}) {
  // Blob size = r * 200vmax so at r=0.7 it covers 140vmax
  const size = `${r * 200}vmax`;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${cx * 100}%`,
        top:  `${cy * 100}%`,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        background: color,
        filter: "blur(40px)",
      }}
      initial={{ scale: 0, opacity: 0.9 }}
      animate={{ scale: [0, 1.3, 1.1, 0], opacity: [0.9, 0.85, 0.6, 0] }}
      transition={{
        duration: 1.7,
        delay,
        times: [0, 0.25, 0.45, 1],
        ease: "easeOut",
      }}
    />
  );
}
