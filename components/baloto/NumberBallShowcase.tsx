"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useBalotoStore, BallShowcaseEntry } from "@/store/baloto.store";

const BALL_SIZE = 72;

interface FlyingBall extends BallShowcaseEntry {
  delay: number;
  dxPeak: number;
  dyPeak: number;
  dxEnd: number;
  dyEnd: number;
  startLeft: number;
  startTop: number;
}

export default function NumberBallShowcase() {
  const ballQueue = useBalotoStore((s) => s.ballQueue);
  const clearBallQueue = useBalotoStore((s) => s.clearBallQueue);
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const [activeBalls, setActiveBalls] = useState<FlyingBall[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unseen = ballQueue.filter((b) => !seenIdsRef.current.has(b.id));
    if (unseen.length === 0) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Orb center approximation
    const orbX = panelVisible && vw >= 768 ? vw * 0.22 : vw * 0.5;
    const orbY = vh * 0.43;

    const newBalls: FlyingBall[] = unseen.map((entry, i) => {
      seenIdsRef.current.add(entry.id);

      // Peak: spread across center of screen
      const peakX = vw * (0.36 + Math.random() * 0.28);
      const peakY = vh * (0.2 + Math.random() * 0.52);

      // Exit direction — random edge
      const r = Math.random();
      const endX =
        r < 0.33
          ? vw * (0.75 + Math.random() * 0.4)
          : r < 0.66
          ? vw * (-0.25 - Math.random() * 0.2)
          : vw * (0.1 + Math.random() * 0.8);
      const endY =
        Math.random() < 0.5
          ? vh * (-0.2 - Math.random() * 0.25)
          : vh * (1.15 + Math.random() * 0.2);

      return {
        ...entry,
        delay: i * 0.75,           // 750ms between each ball — clearly separated
        startLeft: orbX - BALL_SIZE / 2,
        startTop: orbY - BALL_SIZE / 2,
        dxPeak: peakX - orbX,
        dyPeak: peakY - orbY,
        dxEnd: endX - orbX,
        dyEnd: endY - orbY,
      };
    });

    setActiveBalls((prev) => [...prev, ...newBalls]);

    // Clear from store queue after all animations complete
    const totalDuration = (unseen.length - 1) * 750 + 4500;
    const ids = unseen.map((b) => b.id);
    setTimeout(() => {
      clearBallQueue(ids);
      seenIdsRef.current = new Set(
        [...seenIdsRef.current].filter((id) => !ids.includes(id))
      );
    }, totalDuration);
  }, [ballQueue, panelVisible, clearBallQueue]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {activeBalls.map((ball) => (
        <BallFly
          key={ball.id}
          ball={ball}
          onDone={() => setActiveBalls((prev) => prev.filter((b) => b.id !== ball.id))}
        />
      ))}
    </div>
  );
}

function BallFly({ ball, onDone }: { ball: FlyingBall; onDone: () => void }) {
  // 6-keyframe trajectory: orb → arc → PEAK (massive, long hold) → wobble → exit
  const x0 = 0,            y0 = 0;
  const x1 = ball.dxPeak * 0.45,  y1 = ball.dyPeak * 0.45 - 50; // arc upward
  const x2 = ball.dxPeak,         y2 = ball.dyPeak;               // peak
  const x3 = ball.dxPeak + 22,    y3 = ball.dyPeak - 24;          // wobble
  const x4 = ball.dxPeak - 10,    y4 = ball.dyPeak + 14;          // settle
  const x5 = ball.dxEnd,          y5 = ball.dyEnd;                 // exit

  return (
    <motion.div
      className="absolute flex items-center justify-center select-none"
      style={{
        left: ball.startLeft,
        top: ball.startTop,
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: "50%",
        background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.95), ${ball.color}dd 42%, ${ball.color})`,
        fontSize: 28,
        fontWeight: 900,
        color: "white",
        textShadow: "0 2px 10px rgba(0,0,0,0.8)",
        fontFamily: "inherit",
        willChange: "transform, opacity",
      }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        x:     [x0, x1, x2,  x3,   x4,  x5],
        y:     [y0, y1, y2,  y3,   y4,  y5],
        scale: [0,  2,  5.5, 5.2,  5.4, 0],
        opacity:[0,  1,  1,   1,    1,   0],
        rotate:[0, -120, -300, -340, -380, -600],
        boxShadow: [
          `0 0 0px ${ball.color}00`,
          `0 0 50px ${ball.color}, 0 0 100px ${ball.color}70`,
          `0 0 100px ${ball.color}, 0 0 200px ${ball.color}90, 0 0 300px ${ball.color}40`,
          `0 0 100px ${ball.color}, 0 0 200px ${ball.color}90, 0 0 300px ${ball.color}40`,
          `0 0 80px ${ball.color},  0 0 150px ${ball.color}70`,
          `0 0 0px ${ball.color}00`,
        ],
      }}
      transition={{
        duration: 4.0,
        delay: ball.delay,
        // Times tuned so ball LINGERS at peak (0.28–0.62 = 34% of 4s = 1.36s at full size)
        times: [0, 0.18, 0.28, 0.44, 0.62, 1],
        ease: "easeInOut",
      }}
      onAnimationComplete={onDone}
    >
      {ball.number}

      {/* Expanding pulse ring at peak */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 0,
          borderRadius: "50%",
          border: `3px solid ${ball.color}`,
        }}
        initial={{ scale: 1, opacity: 0 }}
        animate={{
          scale:   [1, 1,   1,    2.8,  4.2, 5.5],
          opacity: [0, 0,   0.9,  0.6,  0.3,   0],
        }}
        transition={{
          duration: 4.0,
          delay: ball.delay,
          times: [0, 0.22, 0.32, 0.48, 0.65, 0.85],
          ease: "easeOut",
        }}
      />

      {/* Second ring, offset timing */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${ball.color}88`,
        }}
        initial={{ scale: 1, opacity: 0 }}
        animate={{
          scale:   [1, 1,   1,    1.8,  3.0, 4.5],
          opacity: [0, 0,   0.7,  0.5,  0.2, 0],
        }}
        transition={{
          duration: 4.0,
          delay: ball.delay + 0.25,
          times: [0, 0.22, 0.32, 0.48, 0.65, 0.85],
          ease: "easeOut",
        }}
      />
    </motion.div>
  );
}
