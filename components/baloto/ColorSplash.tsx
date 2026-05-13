"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBalotoStore } from "@/store/baloto.store";
import { zIndex } from "@/lib/design/tokens";

// 8 paint blobs (down from 10) — positions stable per render
const BLOB_CONFIGS = [
  { cx: 0.5,  cy: 0.5,  r: 0.65, delay: 0    },  // center — biggest
  { cx: 0.0,  cy: 0.0,  r: 0.5,  delay: 0.06 },  // top-left
  { cx: 1.0,  cy: 0.0,  r: 0.5,  delay: 0.09 },  // top-right
  { cx: 0.0,  cy: 1.0,  r: 0.5,  delay: 0.12 },  // bottom-left
  { cx: 1.0,  cy: 1.0,  r: 0.5,  delay: 0.15 },  // bottom-right
  { cx: 0.5,  cy: 0.0,  r: 0.4,  delay: 0.07 },  // top-center
  { cx: 0.5,  cy: 1.0,  r: 0.4,  delay: 0.10 },  // bottom-center
  { cx: 0.3,  cy: 0.35, r: 0.32, delay: 0.13 },  // inner cluster
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
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: zIndex.effectColorSplash }}>

      {/* Full-screen flash — dimmed slightly so it feels more polished */}
      <motion.div
        className="absolute inset-0"
        style={{ background: color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.65, 0.55, 0] }}
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
            fontSize: "clamp(64px, 14vw, 200px)",
            color: "white",
            textShadow: `0 0 36px ${color}, 0 4px 24px rgba(0,0,0,0.8)`,
            mixBlendMode: "overlay",
          }}
          initial={{ scale: 0.3, rotate: -8 }}
          animate={{ scale: [0.3, 1.1, 1.0], rotate: [-8, 3, 0] }}
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
  // Blob size = r * 200vmax so at r=0.65 it covers 130vmax
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
        filter: "blur(24px)",
      }}
      initial={{ scale: 0, opacity: 0.85 }}
      animate={{ scale: [0, 1.2, 1.05, 0], opacity: [0.85, 0.75, 0.5, 0] }}
      transition={{
        duration: 1.7,
        delay,
        times: [0, 0.25, 0.45, 1],
        ease: "easeOut",
      }}
    />
  );
}
