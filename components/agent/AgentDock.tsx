"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Power } from "lucide-react";
import { useAgentStore } from "@/store/agent.store";
import { useBalotoStore } from "@/store/baloto.store";
import { connectAgent, disconnectAgent } from "@/lib/realtime/client";
import AgentOrb from "@/components/agent/AgentOrb";
import TranscriptBubble from "@/components/agent/TranscriptBubble";

// AgentOrb renders at w-64 h-64 (256px). We clip it to a 90px container
// by centering the 256px element via negative margins and overflow:hidden.
const ORB_CLIP = 90;
const ORB_FULL = 256;
const ORB_MARGIN = (ORB_CLIP - ORB_FULL) / 2; // -83

export default function AgentDock() {
  const status = useAgentStore((s) => s.status);
  const error = useAgentStore((s) => s.error);
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isConnecting = status === "connecting";
  const isActive =
    status !== "idle" && status !== "error" && status !== "connecting";

  // On mobile with panel open, hide dock — bottom sheet covers it
  if (isMobile && panelVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2"
      style={{ maxWidth: 340 }}
    >
      {/* Transcript floats above controls */}
      <TranscriptBubble />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Controls row: clipped orb + button */}
      <div className="flex items-center gap-3">
        {/* Orb — clipped to 90×90, centered */}
        <div
          className="flex-shrink-0 overflow-hidden rounded-full"
          style={{ width: ORB_CLIP, height: ORB_CLIP }}
        >
          <div
            style={{
              width: ORB_FULL,
              height: ORB_FULL,
              marginLeft: ORB_MARGIN,
              marginTop: ORB_MARGIN,
            }}
          >
            <AgentOrb />
          </div>
        </div>

        {/* Talk / End button */}
        <AnimatePresence mode="wait">
          {!isActive ? (
            <motion.button
              key="start"
              onClick={connectAgent}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-medium text-sm tracking-wide"
              style={{
                background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                boxShadow: "0 0 20px rgba(239,68,68,0.4)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 35px rgba(239,68,68,0.6)",
              }}
              whileTap={{ scale: 0.97 }}
              disabled={isConnecting}
            >
              <Mic size={15} />
              {isConnecting ? "Connecting..." : "Talk to Loto"}
            </motion.button>
          ) : (
            <motion.button
              key="stop"
              onClick={disconnectAgent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-white/60 text-sm font-medium tracking-wide hover:text-white/90"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
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

        {/* Live indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-white/30 tracking-widest uppercase"
            >
              <Mic size={10} />
              <span>live</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
