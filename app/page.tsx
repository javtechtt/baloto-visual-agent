"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBalotoStore } from "@/store/baloto.store";
import AgentPanel from "@/components/agent/AgentPanel";
import AgentDock from "@/components/agent/AgentDock";
import FloatingCartButton from "@/components/agent/FloatingCartButton";
import GameShowcase from "@/components/baloto/GameShowcase";
import dynamic from "next/dynamic";
const BackgroundParticles = dynamic(
  () => import("@/components/background/BackgroundParticles"),
  { ssr: false }
);
import NumberBallShowcase from "@/components/baloto/NumberBallShowcase";
import ColorSplash from "@/components/baloto/ColorSplash";
import ZodiacFlash from "@/components/baloto/ZodiacFlash";
import JackpotRain from "@/components/baloto/JackpotRain";
import UrgencyPulse from "@/components/baloto/UrgencyPulse";
import GameIconsFloat from "@/components/baloto/GameIconsFloat";

export default function Home() {
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <main
      className="relative flex h-screen overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #0f0a1a 0%, #050508 100%)" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #ef4444, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-5 pointer-events-none" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      {/* Floating lottery balls + AI scan lines */}
      <BackgroundParticles />

      {/* Logo — fixed top-left */}
      <motion.div
        className="fixed top-8 left-8 z-30 flex items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-white font-bold tracking-[0.3em] text-sm uppercase">Baloto</span>
        <span className="text-red-400 font-light tracking-[0.3em] text-sm uppercase">AI</span>
      </motion.div>

      {/* ── Showcase column (left) ─────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex-shrink-0 overflow-hidden"
        animate={isMobile ? { width: "100%" } : { width: panelVisible ? "45%" : "100%" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <GameShowcase />
      </motion.div>

      {/* ── Desktop: right-side panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {panelVisible && !isMobile && (
          <motion.div
            key="desktop-panel"
            className="relative z-10 flex-shrink-0 overflow-hidden"
            style={{ width: "55%" }}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
              }}
            />
            <div className="relative h-full p-8 overflow-hidden">
              <AgentPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile: bottom sheet ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelVisible && isMobile && (
          <motion.div
            key="mobile-panel"
            className="fixed z-20 bottom-0 left-0 right-0"
            style={{ height: "72vh", borderRadius: "20px 20px 0 0" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "20px 20px 0 0",
                background: "linear-gradient(180deg, rgba(18,10,30,0.97) 0%, rgba(8,5,16,0.99) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            />
            <div className="relative flex justify-center pt-3 pb-0 z-10">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="relative h-full px-5 pt-2 pb-8 overflow-hidden z-10">
              <AgentPanel />
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
