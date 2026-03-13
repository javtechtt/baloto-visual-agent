"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Power } from "lucide-react";
import { useAgentStore } from "@/store/agent.store";
import { useBalotoStore } from "@/store/baloto.store";
import { connectAgent, disconnectAgent } from "@/lib/realtime/client";
import AgentOrb from "@/components/agent/AgentOrb";
import TranscriptBubble from "@/components/agent/TranscriptBubble";
import AgentPanel from "@/components/agent/AgentPanel";
import FloatingCartButton from "@/components/agent/FloatingCartButton";
import BackgroundParticles from "@/components/background/BackgroundParticles";
import NumberBallShowcase from "@/components/baloto/NumberBallShowcase";
import ColorSplash from "@/components/baloto/ColorSplash";
import ZodiacFlash from "@/components/baloto/ZodiacFlash";
import JackpotRain from "@/components/baloto/JackpotRain";
import UrgencyPulse from "@/components/baloto/UrgencyPulse";

export default function Home() {
  const status = useAgentStore((s) => s.status);
  const error = useAgentStore((s) => s.error);
  const panelVisible = useBalotoStore((s) => s.panelVisible);
  const [isMobile, setIsMobile] = useState(false);

  const isConnecting = status === "connecting";
  const isActive = status !== "idle" && status !== "error" && status !== "connecting";

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

      {/* ── Agent column ──────────────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center flex-shrink-0"
        animate={isMobile ? { width: "100%" } : { width: panelVisible ? "45%" : "100%" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="absolute top-8 flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white font-bold tracking-[0.3em] text-sm uppercase">Baloto</span>
          <span className="text-red-400 font-light tracking-[0.3em] text-sm uppercase">AI</span>
        </motion.div>

        {/* Orb — scaled down on mobile */}
        <motion.div
          className="origin-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: isMobile && panelVisible ? 0.6 : isMobile ? 0.8 : 1,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <AgentOrb />
        </motion.div>

        {/* Transcript */}
        <motion.div
          className="mt-8 w-full flex justify-center px-8"
          animate={{ opacity: isMobile && panelVisible ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <TranscriptBubble />
        </motion.div>

        {/* Controls */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {!isActive ? (
              <motion.button
                key="start"
                onClick={connectAgent}
                className="flex items-center gap-3 px-8 py-4 rounded-full text-white font-medium tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  boxShadow: "0 0 30px rgba(239,68,68,0.4)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(239,68,68,0.6)" }}
                whileTap={{ scale: 0.97 }}
                disabled={isConnecting}
              >
                <Mic size={18} />
                {isConnecting ? "Connecting..." : "Talk to Loto"}
              </motion.button>
            ) : (
              <motion.button
                key="stop"
                onClick={disconnectAgent}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-white/60 text-sm font-medium tracking-wide hover:text-white/90"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Power size={14} />
                End session
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm text-center max-w-xs px-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mic indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 flex items-center gap-2 text-xs text-white/30 tracking-widest uppercase"
            >
              <Mic size={12} />
              <span>Microphone active · WebRTC</span>
            </motion.div>
          )}
        </AnimatePresence>
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
            style={{
              height: "72vh",
              borderRadius: "20px 20px 0 0",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Sheet background */}
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "20px 20px 0 0",
                background: "linear-gradient(180deg, rgba(18,10,30,0.97) 0%, rgba(8,5,16,0.99) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            />

            {/* Drag handle */}
            <div className="relative flex justify-center pt-3 pb-0 z-10">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Panel content */}
            <div className="relative h-full px-5 pt-2 pb-8 overflow-hidden z-10">
              <AgentPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating cart toggle button */}
      <FloatingCartButton />

      {/* Full-screen effects — fire on number/color/zodiac selection */}
      <NumberBallShowcase />
      <ColorSplash />
      <ZodiacFlash />

      {/* Sales-mode effects — jackpot rain + urgency edge pulse */}
      <JackpotRain />
      <UrgencyPulse />
    </main>
  );
}
