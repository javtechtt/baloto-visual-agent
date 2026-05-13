"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useBalotoStore } from "@/store/baloto.store";
import { zIndex } from "@/lib/design/tokens";

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
          aria-hidden="true"
          style={{ zIndex: zIndex.urgencyPulse }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* Quiet warm vignette — toned down for the polished checkout scene */}
          <motion.div
            className="absolute inset-0"
            style={{
              boxShadow: "inset 0 0 80px 20px rgba(212,162,74,0.12)",
              borderRadius: 0,
            }}
            animate={{
              boxShadow: [
                "inset 0 0 80px 20px rgba(212,162,74,0.10)",
                "inset 0 0 110px 36px rgba(212,162,74,0.22)",
                "inset 0 0 80px 20px rgba(212,162,74,0.10)",
              ],
            }}
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
