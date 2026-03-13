"use client";

import { motion, useAnimationFrame } from "framer-motion";
import { useRef, useMemo } from "react";
import { useAgentStore, AgentStatus } from "@/store/agent.store";

// Maps agent status to visual properties
const STATUS_CONFIG: Record<
  AgentStatus,
  { color: string; glowColor: string; label: string }
> = {
  idle:       { color: "#1e293b", glowColor: "transparent",  label: "Start" },
  connecting: { color: "#0ea5e9", glowColor: "#0ea5e920",    label: "Connecting..." },
  listening:  { color: "#22c55e", glowColor: "#22c55e30",    label: "Listening" },
  thinking:   { color: "#f59e0b", glowColor: "#f59e0b30",    label: "Thinking..." },
  speaking:   { color: "#ef4444", glowColor: "#ef444430",    label: "Speaking" },
  error:      { color: "#ef4444", glowColor: "#ef444440",    label: "Error" },
};

export default function AgentOrb() {
  const status = useAgentStore((s) => s.status);
  const audioLevel = useAgentStore((s) => s.audioLevel);
  const config = STATUS_CONFIG[status];

  // The orb has 3 layers:
  // 1. Outer glow ring — pulses on audioLevel
  // 2. Mid ring — slow rotation
  // 3. Core sphere — scales slightly with audio

  const coreScale = 1 + audioLevel * 0.25;
  const glowScale = 1 + audioLevel * 0.5;

  // Stable particle positions — generated once per mount
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * 360,
        radius: 90 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 1.5,
        duration: 1.2 + Math.random() * 1,
      })),
    []
  );

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
        animate={{ scale: status === "speaking" ? [1, glowScale, 1] : 1 }}
        transition={{ duration: 0.4, repeat: status === "speaking" ? Infinity : 0 }}
      />

      {/* Rotating ring — visible when active */}
      {status !== "idle" && (
        <RotatingRing color={config.color} active={status !== "error"} />
      )}

      {/* Core orb */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle at 35% 35%, ${config.color}cc, ${config.color}66 50%, ${config.color}22)`,
          boxShadow: `0 0 40px ${config.glowColor}, 0 0 80px ${config.glowColor}`,
          border: `1px solid ${config.color}44`,
        }}
        animate={{
          scale: status === "speaking" ? coreScale : status === "listening" ? [1, 1.04, 1] : 1,
        }}
        transition={{
          duration: status === "speaking" ? 0.15 : 2,
          repeat: status === "listening" ? Infinity : status === "speaking" ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Inner shimmer */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 80, height: 80 }}
        animate={{
          background:
            status === "thinking"
              ? [
                  `radial-gradient(circle, ${config.color}88, transparent)`,
                  `radial-gradient(circle, ${config.color}cc, transparent)`,
                  `radial-gradient(circle, ${config.color}88, transparent)`,
                ]
              : `radial-gradient(circle, ${config.color}66, transparent)`,
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparkle particles — only when speaking */}
      {status === "speaking" &&
        particles.map((p) => {
          const x = Math.cos((p.angle * Math.PI) / 180) * p.radius;
          const y = Math.sin((p.angle * Math.PI) / 180) * p.radius;
          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: config.color,
                left: "50%",
                top: "50%",
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
              }}
              animate={{
                x: [0, x * 0.6, x],
                y: [0, y * 0.6, y],
                opacity: [0, 1, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          );
        })}

      {/* Status label */}
      <motion.span
        className="absolute -bottom-8 text-xs font-medium tracking-widest uppercase"
        style={{ color: config.color }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {config.label}
      </motion.span>

      {/* Audio visualization bars — below the orb */}
      <AudioBars audioLevel={audioLevel} color={config.color} active={status === "speaking" || status === "listening"} />
    </div>
  );
}

// Audio visualization bars — equalizer style, positioned below the orb
function AudioBars({ audioLevel, color, active }: { audioLevel: number; color: string; active: boolean }) {
  // Heights: middle bar tallest, tapers to sides — multiplied by audioLevel
  const baseHeights = [4, 8, 12, 18, 24, 18, 12, 8, 4];

  return (
    <div className="absolute flex items-end gap-0.5" style={{ bottom: -68 }}>
      {baseHeights.map((base, i) => {
        const targetHeight = active ? base + audioLevel * 20 : 4;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{ width: 3, background: color, opacity: active ? 0.7 : 0.15 }}
            animate={{ height: targetHeight }}
            transition={{ duration: 0.12, ease: "easeOut", delay: i * 0.01 }}
          />
        );
      })}
    </div>
  );
}

// Rotating dashed ring — shows activity
function RotatingRing({ color, active }: { color: string; active: boolean }) {
  const rotation = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (!active || !ref.current) return;
    rotation.current += delta * 0.05;
    ref.current.style.transform = `rotate(${rotation.current}deg)`;
  });

  return (
    <div
      ref={ref}
      className="absolute rounded-full"
      style={{
        width: 180,
        height: 180,
        border: `1px dashed ${color}55`,
        boxShadow: `inset 0 0 20px ${color}11`,
      }}
    />
  );
}
