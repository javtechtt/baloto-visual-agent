"use client";

import { motion } from "framer-motion";
import { colors, zIndex, neon } from "@/lib/design/tokens";

// The casino floor. Layered from back to front:
//   1. violet floor-wash radial
//   2. drifting out-of-focus bokeh lights (the casino's neon haze)
//   3. a Tron-style perspective grid scrolling toward the viewer
//   4. a bright horizon line where the grid meets the back wall
//   5. a violet spotlight pool blooming up under the stage
//   6. rising sparkle dust
//   7. an edge vignette + film grain to seat everything in the dark
//
// All geometry is deterministic (no Math.random) so server and client HTML
// match — the prior particle backdrop had to be ssr:false'd to dodge exactly
// this hydration trap.

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

// Out-of-focus casino lights — fixed seeds keep SSR/CSR identical.
const BOKEH = [
  { x: "12%", y: "22%", size: 220, color: neon.cyan,    drift: [0, 24, -12, 0], rise: [0, -18, 10, 0], dur: 26 },
  { x: "78%", y: "18%", size: 260, color: neon.magenta, drift: [0, -20, 14, 0], rise: [0, 16, -10, 0], dur: 31 },
  { x: "60%", y: "62%", size: 300, color: neon.violet,  drift: [0, 18, -16, 0], rise: [0, -14, 12, 0], dur: 35 },
  { x: "26%", y: "70%", size: 200, color: neon.gold,    drift: [0, -16, 20, 0], rise: [0, 12, -16, 0], dur: 29 },
  { x: "88%", y: "55%", size: 180, color: neon.cyan,    drift: [0, 14, -10, 0], rise: [0, -10, 14, 0], dur: 33 },
  { x: "44%", y: "12%", size: 160, color: neon.magenta, drift: [0, -12, 8, 0],  rise: [0, 14, -8, 0],  dur: 24 },
] as const;

// Rising sparkle dust — staggered, looping.
const SPARKLES = [
  { x: "18%", size: 3, dur: 9,  delay: 0 },
  { x: "34%", size: 2, dur: 12, delay: 2 },
  { x: "52%", size: 3, dur: 10, delay: 4 },
  { x: "67%", size: 2, dur: 13, delay: 1 },
  { x: "81%", size: 3, dur: 11, delay: 3 },
  { x: "92%", size: 2, dur: 14, delay: 5 },
] as const;

export default function AmbientBackdrop() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: zIndex.backgroundParticles }}
      aria-hidden="true"
    >
      {/* 1 ── Violet floor-wash, slow breathing radial */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70vmax 55vmax at 50% 40%, ${colors.bgElevated} 0%, transparent 72%)`,
          willChange: "transform",
        }}
        animate={{
          transform: [
            "translate3d(0%, 0%, 0)",
            "translate3d(1.5%, 1%, 0)",
            "translate3d(-1.2%, -0.6%, 0)",
            "translate3d(0%, 0%, 0)",
          ],
        }}
        transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2 ── Drifting bokeh lights */}
      {BOKEH.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            opacity: 0.14,
            filter: "blur(28px)",
            willChange: "transform",
          }}
          animate={{ x: b.drift as unknown as number[], y: b.rise as unknown as number[] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* 3 ── Tron perspective grid — bottom 52%, scrolling toward viewer */}
      <div
        className="absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ height: "52%", perspective: "440px", perspectiveOrigin: "50% 0%" }}
      >
        <motion.div
          className="absolute left-1/2 bottom-0"
          style={{
            width: "260%",
            height: "180%",
            marginLeft: "-130%",
            transform: "rotateX(74deg)",
            transformOrigin: "50% 100%",
            backgroundImage: `
              linear-gradient(to right, ${neon.cyan}55 1px, transparent 1px),
              linear-gradient(to bottom, ${neon.violet}55 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 88%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 88%)",
            willChange: "background-position",
          }}
          animate={{ backgroundPositionY: ["0px", "64px"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 4 ── Horizon glow — bright neon seam at the grid's vanishing point */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: "52%",
          height: 2,
          background: `linear-gradient(90deg, transparent, ${neon.cyan} 30%, ${neon.magenta} 70%, transparent)`,
          boxShadow: `0 0 24px ${neon.cyan}, 0 0 48px ${neon.magenta}88`,
          opacity: 0.6,
        }}
      />

      {/* 5 ── Spotlight pool under the stage */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: "8%",
          width: "60vmax",
          height: "70vmax",
          background: `radial-gradient(ellipse 50% 60% at 50% 30%, ${neon.violet}26 0%, transparent 65%)`,
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 6 ── Rising sparkle dust */}
      {SPARKLES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.x,
            bottom: "8%",
            width: s.size,
            height: s.size,
            background: neon.goldBright,
            boxShadow: `0 0 6px ${neon.gold}`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], y: [-0, -240] }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 7 ── Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 45%, transparent 55%, rgba(3,1,8,0.85) 100%)",
        }}
      />

      {/* Film grain — static, low opacity */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
          opacity: 0.05,
        }}
      />
    </div>
  );
}
