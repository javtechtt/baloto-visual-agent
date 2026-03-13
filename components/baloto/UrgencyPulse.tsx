"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useBalotoStore } from "@/store/baloto.store";

const URGENCY_DELAY_MS = 60_000; // 1 minute at confirm before pulse starts

export default function UrgencyPulse() {
  const checkoutStep = useBalotoStore((s) => s.checkoutStep);
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (checkoutStep === "confirm") {
      // Start 60-second countdown
      timerRef.current = setTimeout(() => setActive(true), URGENCY_DELAY_MS);
    } else {
      // Left confirm — cancel timer and hide pulse
      if (timerRef.current) clearTimeout(timerRef.current);
      setActive(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [checkoutStep]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="urgency"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 150 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* Soft red vignette on all edges — pulses gently */}
          <motion.div
            className="absolute inset-0"
            style={{
              boxShadow: "inset 0 0 90px 30px rgba(220, 38, 38, 0.28)",
              borderRadius: 0,
            }}
            animate={{
              boxShadow: [
                "inset 0 0 90px 30px rgba(220,38,38,0.18)",
                "inset 0 0 120px 50px rgba(220,38,38,0.35)",
                "inset 0 0 90px 30px rgba(220,38,38,0.18)",
              ],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
