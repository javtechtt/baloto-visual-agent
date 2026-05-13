"use client";

import { motion } from "framer-motion";
import { colors, zIndex } from "@/lib/design/tokens";

// Replaces the busy BackgroundParticles (22 numbered balls + 2 scan lines + grid).
// One slow-drifting warm radial glow + a faint film grain. Nothing else.

const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
       <filter id="n">
         <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
         <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/>
       </filter>
       <rect width="100%" height="100%" filter="url(#n)" opacity="1"/>
     </svg>`
  );

export default function AmbientBackdrop() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: zIndex.backgroundParticles }}
      aria-hidden="true"
    >
      {/* Slow-drifting warm radial — 40s loop, anchors the eye to the carousel */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60vmax 50vmax at 50% 38%, ${colors.bgElevated} 0%, transparent 70%)`,
          willChange: "transform",
        }}
        animate={{
          transform: [
            "translate3d(0%, 0%, 0)",
            "translate3d(2%, 1.2%, 0)",
            "translate3d(-1.5%, -0.8%, 0)",
            "translate3d(0%, 0%, 0)",
          ],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Film grain — static, low opacity, sized in px so it doesn't tile too coarse */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
          opacity: 0.04,
        }}
      />
    </div>
  );
}
