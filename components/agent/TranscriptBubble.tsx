"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/store/agent.store";

export default function TranscriptBubble() {
  const transcript = useAgentStore((s) => s.transcript);
  const userTranscript = useAgentStore((s) => s.userTranscript);
  const status = useAgentStore((s) => s.status);

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg px-4">
      {/* User speech */}
      <AnimatePresence>
        {userTranscript && status !== "idle" && (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="self-end max-w-xs px-4 py-2 rounded-2xl rounded-br-sm text-sm text-white"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {userTranscript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent speech */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="self-start max-w-sm px-4 py-2 rounded-2xl rounded-bl-sm text-sm text-white"
            style={{ background: "rgba(239,68,68,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span className="text-xs font-semibold text-red-400 block mb-0.5">Loto</span>
            {transcript}
            {status === "speaking" && <BlinkingCursor />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlinkingCursor() {
  return (
    <motion.span
      className="inline-block w-1 h-3 ml-0.5 align-middle bg-red-400 rounded-full"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  );
}
