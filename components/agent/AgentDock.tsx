"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Power } from "lucide-react";
import { useAgentStore } from "@/store/agent.store";
import { useBalotoStore } from "@/store/baloto.store";
import { connectAgent, disconnectAgent } from "@/lib/realtime/client";
import AgentOrb from "@/components/agent/AgentOrb";
import TranscriptBubble from "@/components/agent/TranscriptBubble";
import { useIsMobile } from "@/hooks/useIsMobile";
import { zIndex, gradients, colors, neon, glow } from "@/lib/design/tokens";
import { sfx } from "@/lib/audio/sfx";

// Orb intrinsic size — used to derive the negative-margin clip math (compact variant)
const ORB_FULL = 256;
const COMPACT_CLIP = 36;

interface AgentDockProps {
  variant?: "full" | "compact";
}

export default function AgentDock({ variant = "full" }: AgentDockProps) {
  const status = useAgentStore((s) => s.status);
  const error = useAgentStore((s) => s.error);
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const playCount = useBalotoStore((s) => s.plays.length);
  const isMobile = useIsMobile();

  const isConnecting = status === "connecting";
  const isActive =
    status !== "idle" && status !== "error" && status !== "connecting";

  // Full variant hides itself on mobile only when the cart sheet is actually
  // open (panel is gated on having locked in at least one bet).
  if (variant === "full" && isMobile && panelVisible && playCount > 0) return null;

  if (variant === "compact") return <CompactDock isActive={isActive} isConnecting={isConnecting} />;

  // ── Full variant (ordering scene, bottom-left) ────────────────────────────
  return (
    <div
      className="fixed bottom-4 left-4 flex flex-col items-start gap-2"
      style={{ maxWidth: isMobile ? 220 : 380, zIndex: zIndex.dock }}
      role="region"
      aria-label="Voice agent controls"
    >
      {/* Visual chat is removed on phones (< tablet) — voice-only there. */}
      {!isMobile && <TranscriptBubble />}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{
              color: colors.primary,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.button
              key="start"
              onClick={() => {
                sfx.click();
                connectAgent();
              }}
              onMouseEnter={() => sfx.hover()}
              aria-label={isConnecting ? "Connecting to voice agent" : "Start voice conversation with Loto"}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold text-sm tracking-wide"
              style={{
                background: gradients.primaryButton,
                boxShadow: glow.box(neon.magenta, 0.85),
                border: `1px solid ${neon.magentaBright}66`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.05, boxShadow: glow.box(neon.magenta, 1.3) }}
              whileTap={{ scale: 0.97 }}
              disabled={isConnecting}
            >
              <Mic size={15} />
              {isConnecting ? "Connecting..." : "Talk to Loto"}
            </motion.button>
          ) : (
            <motion.button
              key="stop"
              onClick={() => {
                sfx.click();
                disconnectAgent();
              }}
              aria-label="End voice session"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium tracking-wide"
              style={{
                color: colors.textSecondary,
                background: "rgba(255,255,255,0.07)",
                border: `1px solid ${colors.surfaceBorderHover}`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ background: "rgba(255,255,255,0.12)" }}
            >
              <Power size={13} />
              End session
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs tracking-widest uppercase font-display"
              style={{ color: neon.cyan, textShadow: glow.text(neon.cyan, 0.5) }}
              aria-live="polite"
            >
              <Mic size={10} aria-hidden="true" />
              <span>live</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Compact dock (used by CheckoutScene's top bar) ──────────────────────────

function CompactDock({ isActive, isConnecting }: { isActive: boolean; isConnecting: boolean }) {
  const clip = COMPACT_CLIP;
  const margin = (clip - ORB_FULL) / 2;

  return (
    <div className="flex items-center gap-2" role="region" aria-label="Voice agent">
      <div
        className="flex-shrink-0 overflow-hidden rounded-full"
        style={{ width: clip, height: clip }}
        aria-hidden="true"
      >
        <div
          style={{
            width: ORB_FULL,
            height: ORB_FULL,
            marginLeft: margin,
            marginTop: margin,
          }}
        >
          <AgentOrb />
        </div>
      </div>

      {!isActive ? (
        <button
          onClick={() => {
            sfx.click();
            connectAgent();
          }}
          aria-label={isConnecting ? "Connecting" : "Talk to Karol"}
          disabled={isConnecting}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${colors.checkoutBorder}`,
            color: colors.inkMuted,
          }}
        >
          <Mic size={13} aria-hidden="true" />
        </button>
      ) : (
        <button
          onClick={() => {
            sfx.click();
            disconnectAgent();
          }}
          aria-label="End voice session"
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: 32,
            height: 32,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${colors.checkoutBorder}`,
            color: colors.inkMuted,
          }}
        >
          <Power size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
