"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useSoundStore } from "@/store/sound.store";
import { useBalotoStore } from "@/store/baloto.store";
import { sfx } from "@/lib/audio/sfx";
import { zIndex, colors, neon, glow } from "@/lib/design/tokens";

// Floating mute toggle, top-right. Glows cyan when sound is on. Clicking to
// enable plays a coin so the user immediately hears that audio works. In
// checkout it drops below the top bar so it doesn't collide with the dock.

export default function SoundToggle() {
  const enabled = useSoundStore((s) => s.enabled);
  const toggle = useSoundStore((s) => s.toggle);
  const inCheckout = useBalotoStore((s) => s.checkoutStep !== null);

  return (
    <motion.button
      onClick={() => {
        const next = !enabled;
        toggle();
        if (next) sfx.coin();
      }}
      onMouseEnter={() => enabled && sfx.hover()}
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
      aria-pressed={enabled}
      className="fixed flex items-center justify-center rounded-full"
      style={{
        top: inCheckout ? 70 : 22,
        right: 22,
        width: 42,
        height: 42,
        zIndex: zIndex.logo,
        background: enabled ? "rgba(34,211,238,0.10)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${enabled ? neon.cyan : colors.surfaceBorder}`,
        boxShadow: enabled ? glow.box(neon.cyan, 0.55) : "none",
        color: enabled ? neon.cyan : colors.textMuted,
        backdropFilter: "blur(8px)",
      }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={enabled ? "on" : "off"}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
