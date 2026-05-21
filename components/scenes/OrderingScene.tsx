"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import { useIsMobile } from "@/hooks/useIsMobile";
import AgentPanel from "@/components/agent/AgentPanel";
import AgentDock from "@/components/agent/AgentDock";
import FloatingCartButton from "@/components/agent/FloatingCartButton";
import GameShowcase from "@/components/baloto/GameShowcase";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AmbientBackdrop from "@/components/background/AmbientBackdrop";
import SlotReelDraw from "@/components/baloto/SlotReelDraw";
import ColorSplash from "@/components/baloto/ColorSplash";
import ZodiacFlash from "@/components/baloto/ZodiacFlash";
import JackpotRain from "@/components/baloto/JackpotRain";
import GameIconsFloat from "@/components/baloto/GameIconsFloat";
import WinnersTicker from "@/components/casino/WinnersTicker";
import JackpotTicker from "@/components/casino/JackpotTicker";
import { colors, zIndex, easing, duration } from "@/lib/design/tokens";

export default function OrderingScene() {
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const isMobile = useIsMobile();

  return (
    <>
      <AmbientBackdrop />

      {/* ── Casino floor chrome: live winners feed + jackpot marquee ───────── */}
      <WinnersTicker />
      <JackpotTicker />

      {/* ── Showcase column (left) ─────────────────────────────────────────── */}
      <motion.div
        className="relative flex-shrink-0 overflow-hidden h-full"
        style={{ zIndex: zIndex.content }}
        animate={isMobile ? { width: "100%" } : { width: panelVisible ? "45%" : "100%" }}
        transition={{ duration: duration.panel, ease: easing.standard }}
      >
        <GameShowcase />
      </motion.div>

      {/* ── Desktop: right-side panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {panelVisible && !isMobile && (
          <motion.div
            key="desktop-panel"
            className="relative flex-shrink-0 overflow-hidden h-full"
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

      {/* ── Mobile: bottom sheet ───────────────────────────────────────────── */}
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
                background: `linear-gradient(180deg, ${colors.bgElevated} 0%, ${colors.bgDeep} 100%)`,
                borderTop: `1px solid ${colors.surfaceBorder}`,
                backdropFilter: "blur(20px)",
              }}
            />
            <div className="relative flex justify-center pt-3 pb-0" style={{ zIndex: 1 }}>
              <div className="w-10 h-1 rounded-full" style={{ background: colors.inkFaint }} aria-hidden="true" />
            </div>
            <div className="relative h-full px-5 pt-2 pb-8 overflow-hidden" style={{ zIndex: 1 }}>
              <ErrorBoundary>
                <AgentPanel />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed overlays ─────────────────────────────────────────────────── */}
      <AgentDock />
      <FloatingCartButton />

      {/* ── Triggered effects (ordering-scene only) ────────────────────────── */}
      <GameIconsFloat />
      <SlotReelDraw />
      <ColorSplash />
      <ZodiacFlash />
      <JackpotRain />
    </>
  );
}
