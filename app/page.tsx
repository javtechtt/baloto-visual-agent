"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import AgentPanel from "@/components/agent/AgentPanel";
import AgentDock from "@/components/agent/AgentDock";
import FloatingCartButton from "@/components/agent/FloatingCartButton";
import GameShowcase from "@/components/baloto/GameShowcase";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import dynamic from "next/dynamic";
const BackgroundParticles = dynamic(
  () => import("@/components/background/BackgroundParticles"),
  { ssr: false } // Uses deterministic PRNG at module level — must skip SSR to avoid hydration mismatch
);
import NumberBallShowcase from "@/components/baloto/NumberBallShowcase";
import ColorSplash from "@/components/baloto/ColorSplash";
import ZodiacFlash from "@/components/baloto/ZodiacFlash";
import JackpotRain from "@/components/baloto/JackpotRain";
import UrgencyPulse from "@/components/baloto/UrgencyPulse";
import GameIconsFloat from "@/components/baloto/GameIconsFloat";
import { useIsMobile } from "@/hooks/useIsMobile";
import { colors, zIndex, easing, duration, gradients } from "@/lib/design/tokens";

export default function Home() {
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const isMobile = useIsMobile();

  return (
    <main
      className="relative flex h-screen overflow-hidden"
      style={{ background: gradients.bgRadial }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            `linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none" aria-hidden="true" style={{ background: `radial-gradient(circle, ${colors.primary}, transparent)` }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none" aria-hidden="true" style={{ background: `radial-gradient(circle, ${colors.purple}, transparent)` }} />

      {/* Floating lottery balls + AI scan lines */}
      <BackgroundParticles />

      {/* Logo — fixed top-left */}
      <motion.div
        className="fixed top-8 left-8 flex items-center gap-2"
        style={{ zIndex: zIndex.logo }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
        <span className="text-white font-bold tracking-[0.3em] text-sm uppercase">Baloto</span>
        <span className="text-red-400 font-light tracking-[0.3em] text-sm uppercase">AI</span>
      </motion.div>

      {/* ── Showcase column (left) ─────────────────────────────────────────────── */}
      <motion.div
        className="relative flex-shrink-0 overflow-hidden"
        style={{ zIndex: zIndex.content }}
        animate={isMobile ? { width: "100%" } : { width: panelVisible ? "45%" : "100%" }}
        transition={{ duration: duration.panel, ease: easing.standard }}
      >
        <GameShowcase />
      </motion.div>

      {/* ── Desktop: right-side panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {panelVisible && !isMobile && (
          <motion.div
            key="desktop-panel"
            className="relative flex-shrink-0 overflow-hidden"
            style={{ width: "55%", zIndex: zIndex.panel }}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: duration.panel, ease: easing.standard }}
          >
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                borderLeft: `1px solid ${colors.surfaceBorder}`,
                backdropFilter: "blur(12px)",
              }}
            />
            <div className="relative h-full p-8 overflow-hidden">
              <ErrorBoundary>
                <AgentPanel />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: bottom sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelVisible && isMobile && (
          <motion.div
            key="mobile-panel"
            className="fixed bottom-0 left-0 right-0"
            style={{
              height: "72vh",
              borderRadius: "20px 20px 0 0",
              zIndex: zIndex.mobileSheet,
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: easing.standard }}
          >
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                borderRadius: "20px 20px 0 0",
                background: "linear-gradient(180deg, rgba(18,10,30,0.97) 0%, rgba(8,5,16,0.99) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            />
            <div className="relative flex justify-center pt-3 pb-0" style={{ zIndex: 1 }}>
              <div className="w-10 h-1 rounded-full bg-white/20" aria-hidden="true" />
            </div>
            <div className="relative h-full px-5 pt-2 pb-8 overflow-hidden" style={{ zIndex: 1 }}>
              <ErrorBoundary>
                <AgentPanel />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed overlays ─────────────────────────────────────────────────────── */}
      <AgentDock />
      <FloatingCartButton />

      {/* Full-screen effects */}
      <GameIconsFloat />
      <NumberBallShowcase />
      <ColorSplash />
      <ZodiacFlash />
      <JackpotRain />
      <UrgencyPulse />
    </main>
  );
}
