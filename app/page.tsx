"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import OrderingScene from "@/components/scenes/OrderingScene";
import CheckoutScene from "@/components/scenes/CheckoutScene";
import { colors, zIndex, gradients, duration, easing } from "@/lib/design/tokens";

export default function Home() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const inCheckout = checkoutStep !== null;

  return (
    <main
      className="relative flex h-screen overflow-hidden"
      style={{
        background: inCheckout ? colors.checkoutBg : gradients.bgRadial,
        transition: `background ${duration.scene}s cubic-bezier(${easing.standard.join(",")})`,
      }}
    >
      {/* Logo — present in both scenes for brand consistency */}
      <motion.div
        className="fixed top-6 left-6 flex items-center gap-2 pointer-events-none"
        style={{ zIndex: zIndex.logo }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: inCheckout ? colors.brand : colors.primary }}
          aria-hidden="true"
        />
        <span
          className="font-bold tracking-[0.3em] text-xs uppercase"
          style={{ color: inCheckout ? colors.ink : "#fff" }}
        >
          Baloto
        </span>
        <span
          className="font-light tracking-[0.3em] text-xs uppercase"
          style={{ color: inCheckout ? colors.inkMuted : colors.primary }}
        >
          AI
        </span>
      </motion.div>

      {/* Scene router — one scene at a time, brief cross-fade between */}
      <AnimatePresence mode="wait">
        {inCheckout ? (
          <motion.div
            key="checkout-scene"
            className="absolute inset-0 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.scene, ease: easing.standard }}
          >
            <CheckoutScene />
          </motion.div>
        ) : (
          <motion.div
            key="ordering-scene"
            className="absolute inset-0 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.scene, ease: easing.standard }}
          >
            <OrderingScene />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
