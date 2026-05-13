"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import GameGrid from "@/components/baloto/GameGrid";
import PlaySlip from "@/components/baloto/PlaySlip";
import CartPanel from "@/components/baloto/CartPanel";
import { duration, colors } from "@/lib/design/tokens";

// Ordering-only right-side panel. Checkout has its own scene container — this
// component never renders checkout chrome.

export default function AgentPanel() {
  const activePlay = useBalotoStore((s) => s.activePlay);
  const plays = useBalotoStore((s) => s.plays);
  const setPanelVisible = useBalotoStore((s) => s.setPanelVisible);

  return (
    <div className="relative h-full flex flex-col" role="region" aria-label="Game Center">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.primary }} aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: colors.inkMuted }}>
            Game Center
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-5"
        >
          <GameGrid />

          <AnimatePresence>
            {activePlay ? (
              <motion.div
                key="playslip"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.normal }}
              >
                <PlaySlip />
              </motion.div>
            ) : plays.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <p className="text-xs" style={{ color: colors.inkSubtle }}>
                  Select a game above to start building your play
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {plays.length > 0 && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.normal, delay: 0.05 }}
              >
                <div className="pt-5" style={{ borderTop: `1px solid ${colors.surfaceBorder}` }}>
                  <CartPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
