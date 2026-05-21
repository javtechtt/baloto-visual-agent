"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { neon } from "@/lib/design/tokens";

// Frames the 3D host as a lit stage. The Canvas component is loaded with
// ssr:false (three.js touches browser-only APIs) so the statically prerendered
// page never tries to render WebGL on the server. The stage is display-only
// (pointer-events: none) so it never blocks the carousel or controls.

const AvatarHost3D = dynamic(() => import("./AvatarHost3D"), {
  ssr: false,
  loading: () => <StageFallback />,
});

// A quiet neon shimmer while the model streams in — deliberately NOT a
// placeholder character.
function StageFallback() {
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-10">
      <motion.div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${neon.violet}55, transparent 70%)`,
          filter: "blur(6px)",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

interface Props {
  width?: number;
  height?: number;
}

export default function AvatarStage({ width = 300, height = 360 }: Props) {
  return (
    <div
      className="relative select-none"
      style={{ width, height, pointerEvents: "none" }}
      aria-hidden="true"
    >
      {/* Stage glow pooled under the host (raised to sit under her lower body) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(58% 42% at 50% 72%, ${neon.violet}3a 0%, transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
      {/* Neon floor line */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "22%",
          width: "62%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${neon.cyan}, ${neon.magenta}, transparent)`,
          boxShadow: `0 0 16px ${neon.cyan}aa`,
          opacity: 0.7,
        }}
      />

      <AvatarHost3D />
    </div>
  );
}
