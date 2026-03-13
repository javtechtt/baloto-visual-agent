"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import { useAgentStore } from "@/store/agent.store";

export default function FloatingCartButton() {
  const plays = useBalotoStore((s) => s.plays);
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const setPanelVisible = useBalotoStore((s) => s.setPanelVisible);
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const status = useAgentStore((s) => s.status);

  const isAgentActive = status !== "idle" && status !== "error";

  // Show once agent is connected or there's something in the cart
  if (!isAgentActive && plays.length === 0) return null;

  // Don't render a separate button during checkout — the panel header already has a close button
  if (checkoutStep && panelVisible) return null;

  const hasItems = plays.length > 0;

  return (
    <motion.button
      className="fixed z-[200] flex items-center justify-center rounded-full"
      style={{
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        background: panelVisible
          ? "rgba(255,255,255,0.08)"
          : hasItems
          ? "linear-gradient(135deg, #ef4444, #b91c1c)"
          : "rgba(255,255,255,0.08)",
        boxShadow: panelVisible
          ? "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
          : hasItems
          ? "0 0 28px rgba(239,68,68,0.45), 0 4px 24px rgba(0,0,0,0.5)"
          : "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      onClick={() => setPanelVisible(!panelVisible)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      <AnimatePresence mode="wait">
        {panelVisible ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.18 }}
          >
            <X size={20} className="text-white/60" />
          </motion.div>
        ) : (
          <motion.div
            key="cart"
            className="relative"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.18 }}
          >
            <ShoppingCart size={20} className="text-white" />

            {/* Item count badge */}
            <AnimatePresence>
              {hasItems && (
                <motion.span
                  key="badge"
                  className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "white", color: "#ef4444" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  {plays.length}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse ring when items exist and panel is closed */}
      {hasItems && !panelVisible && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: "2px solid rgba(239,68,68,0.5)" }}
          animate={{ scale: [1, 1.6, 1.6], opacity: [0.8, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
