"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import PlaySlip from "@/components/baloto/PlaySlip";
import CartPanel from "@/components/baloto/CartPanel";
import { duration, colors, neon, glow } from "@/lib/design/tokens";

// Ordering-only right-side panel. It is a CART / CONFIRMATION surface — it only
// mounts once the user has locked in at least one bet (gated in OrderingScene),
// so there is no game-browser here. Game discovery happens on the carousel +
// by voice. If the agent is mid-building another play, the slip shows here too.

export default function AgentPanel() {
  const activePlay = useBalotoStore((s) => s.activePlay);
  const setPanelVisible = useBalotoStore((s) => s.setPanelVisible);

  return (
    <div className="relative h-full flex flex-col" role="region" aria-label="Your bets">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: neon.cyan, boxShadow: glow.box(neon.cyan, 0.6) }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: colors.inkMuted }}>
            Your Bets
          </span>
        </motion.div>
        <button
          onClick={() => setPanelVisible(false)}
          className="transition-colors p-1"
          style={{ color: colors.inkSubtle }}
          onMouseEnter={(e) => (e.currentTarget.style.color = colors.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = colors.inkSubtle)}
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content — active slip (if still building another) + the cart */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-5"
        >
          <AnimatePresence>
            {activePlay && (
              <motion.div
                key="playslip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.normal }}
              >
                <PlaySlip />
              </motion.div>
            )}
          </AnimatePresence>

          <CartPanel />
        </motion.div>
      </div>
    </div>
  );
}
