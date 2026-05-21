"use client";

import { motion, useAnimationFrame } from "framer-motion";
import { useRef } from "react";
import { useAgentStore, AgentStatus } from "@/store/agent.store";
import { colors } from "@/lib/design/tokens";

// Three layers: outer glow + thin outer ring + core. Status drives color
// and motion. No sparkles, no inner shimmer, no audio bars — those lived
// outside the dock's clip zone and added animation cost for no visible gain.

const STATUS_CONFIG: Record<
  AgentStatus,
  { color: string; glowColor: string; label: string }
> = {
  idle:       { color: "#2a1a47",      glowColor: `${colors.brand}14`,    label: "Start" },
  connecting: { color: colors.info,    glowColor: `${colors.info}3a`,     label: "Connecting" },
  listening:  { color: colors.success, glowColor: `${colors.success}3a`,  label: "Listening" },
  thinking:   { color: colors.warning, glowColor: `${colors.warning}3a`,  label: "Thinking" },
  speaking:   { color: colors.primary, glowColor: `${colors.primary}3a`,  label: "Speaking" },
  error:      { color: colors.error,   glowColor: `${colors.error}44`,    label: "Error" },
};

export default function AgentOrb() {
  const status = useAgentStore((s) => s.status);
  const audioLevel = useAgentStore((s) => s.audioLevel);
  const config = STATUS_CONFIG[status];

  const coreScale = 1 + audioLevel * 0.22;
  const glowScale = 1 + audioLevel * 0.4;

  return (
    <div
      className="relative flex items-center justify-center w-64 h-64"
      role="status"
      aria-label={`Voice agent status: ${config.label}`}
    >
      {/* Outer ambient glow — slightly dimmer than before */}
      <motion.div
        className="absolute rounded-full"
        aria-hidden="true"
        style={{
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
        }}
        animate={{ scale: status === "speaking" ? [1, glowScale, 1] : 1 }}
        transition={{ duration: 0.4, repeat: status === "speaking" ? Infinity : 0 }}
      />

      {/* Thin outer ring — solid line, rotates only when actively speaking */}
      {status !== "idle" && (
        <RotatingRing color={config.color} active={status === "speaking"} />
      )}

      {/* Core orb */}
      <motion.div
        className="absolute rounded-full"
        aria-hidden="true"
        style={{
          width: 140,
          height: 140,
          background: `radial-gradient(circle at 35% 35%, ${config.color}cc, ${config.color}66 50%, ${config.color}22)`,
          boxShadow: `0 0 32px ${config.glowColor}`,
          border: `1px solid ${config.color}33`,
        }}
        animate={{
          scale:
            status === "speaking"
              ? coreScale
              : status === "listening"
              ? [1, 1.035, 1]
              : 1,
        }}
        transition={{
          duration: status === "speaking" ? 0.15 : 2.4,
          repeat: status === "listening" || status === "speaking" ? Infinity : 0,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Thin solid ring that rotates only when speaking. Otherwise it sits static
// as a quiet outline around the orb.
function RotatingRing({ color, active }: { color: string; active: boolean }) {
  const rotation = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (!active || !ref.current) return;
    rotation.current += delta * 0.04;
    ref.current.style.transform = `rotate(${rotation.current}deg)`;
  });

  return (
    <div
      ref={ref}
      className="absolute rounded-full"
      aria-hidden="true"
      style={{
        width: 180,
        height: 180,
        border: `1px solid ${color}44`,
      }}
    />
  );
}
