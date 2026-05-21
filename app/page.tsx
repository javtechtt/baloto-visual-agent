"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import OrderingScene from "@/components/scenes/OrderingScene";
import CheckoutScene from "@/components/scenes/CheckoutScene";
import SoundManager from "@/components/ui/SoundManager";
import SoundToggle from "@/components/ui/SoundToggle";
import { colors, zIndex, gradients, duration, easing, neon, glow } from "@/lib/design/tokens";

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
      {/* Global sound: gesture-unlock + ambient bed, and the mute toggle */}
      <SoundManager />
      <SoundToggle />

      {/* Logo — neon marquee. Ordering scene only: it sits below the winners
          ticker. Hidden in checkout, whose top bar owns the "Back to game"
          control in that corner (avoids the logo overlapping it). */}
      {!inCheckout && (
      <motion.div
        className="fixed left-6 hidden sm:flex items-center gap-2.5 pointer-events-none"
        style={{ zIndex: zIndex.logo, top: 40 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Glowing marquee bulb */}
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{
            background: colors.brand,
            boxShadow: glow.box(colors.brand, 0.9),
          }}
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
        <span
          className="font-display neon-marquee font-extrabold tracking-[0.28em] text-sm uppercase"
        >
          Baloto
        </span>
        <span
          className="font-display font-medium tracking-[0.28em] text-sm uppercase"
          style={{ color: neon.cyan, textShadow: glow.text(neon.cyan, 0.7) }}
        >
          AI
        </span>
      </motion.div>
      )}

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
