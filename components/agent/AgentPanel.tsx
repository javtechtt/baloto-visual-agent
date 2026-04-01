"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import GameGrid from "@/components/baloto/GameGrid";
import PlaySlip from "@/components/baloto/PlaySlip";
import CartPanel from "@/components/baloto/CartPanel";
import CheckoutFlow from "@/components/baloto/CheckoutFlow";
import { duration } from "@/lib/design/tokens";

// The right-side panel. Routing logic:
// - checkoutStep set   -> CheckoutFlow (full panel)
// - otherwise          -> GameGrid + PlaySlip (if building) + CartPanel (if plays exist)

export default function AgentPanel() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const activePlay = useBalotoStore((s) => s.activePlay);
  const plays = useBalotoStore((s) => s.plays);
  const setPanelVisible = useBalotoStore((s) => s.setPanelVisible);

  return (
    <div className="relative h-full flex flex-col" role="region" aria-label={checkoutStep ? "Checkout" : "Game Center"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-white/50 text-xs font-medium uppercase tracking-widest">
            {checkoutStep ? "Checkout" : "Game Center"}
          </span>
        </motion.div>
        <button
          onClick={() => setPanelVisible(false)}
          className="text-white/30 hover:text-white/60 transition-colors p-1"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        <AnimatePresence mode="wait">
          {checkoutStep ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: duration.normal }}
              className="h-full"
            >
              <CheckoutFlow />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                    <p className="text-white/30 text-xs">
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
                    <div className="border-t border-white/10 pt-5">
                      <CartPanel />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
