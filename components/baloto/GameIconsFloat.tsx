"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useBalotoStore } from "@/store/baloto.store";
import { GAME_LIST, GAME_ICONS } from "@/lib/baloto/games";
import { zIndex } from "@/lib/design/tokens";
import ColorWheelSvg from "./ColorWheelSvg";

const AUTO_CLEAR_MS = 3200;

// Evenly distributed x positions across the screen (percentage from left)
const X_POSITIONS = [8, 24, 42, 60, 78];

export default function GameIconsFloat() {
  const gameIconsFloat = useBalotoStore((s) => s.gameIconsFloat);
  const clearGameIconsFloat = useBalotoStore((s) => s.clearGameIconsFloat);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gameIconsFloat) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(clearGameIconsFloat, AUTO_CLEAR_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameIconsFloat, clearGameIconsFloat]);

  return (
    <AnimatePresence>
      {gameIconsFloat && (
        <motion.div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{ zIndex: zIndex.effectGameIcons }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {GAME_LIST.map((game, i) => (
            <motion.div
              key={game.id}
              className="absolute flex flex-col items-center gap-2"
              style={{ left: `${X_POSITIONS[i]}%`, bottom: -160 }}
              initial={{ y: 0, opacity: 0 }}
              animate={{
                y: [0, -220, -400, -520],
                opacity: [0, 1, 0.9, 0],
              }}
              transition={{
                duration: AUTO_CLEAR_MS / 1000,
                delay: i * 0.11,
                ease: "easeOut",
              }}
            >
              {/* Icon — spinning SVG wheel for colorloto, styled ball for others */}
              {game.id === "colorloto" ? (
                <motion.div
                  style={{ width: 68, height: 68, filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  <ColorWheelSvg size={68} />
                </motion.div>
              ) : (
                <div
                  className="flex items-center justify-center rounded-full text-2xl select-none"
                  style={{
                    width: 68,
                    height: 68,
                    background: `radial-gradient(circle at 35% 30%, ${game.accentColor}ee, ${game.accentColor}55)`,
                    border: `1.5px solid ${game.accentColor}`,
                    boxShadow: `0 0 18px ${game.accentColor}55`,
                  }}
                >
                  {GAME_ICONS[game.id]}
                </div>
              )}

              {/* Game name */}
              <span
                className="text-xs font-semibold tracking-wider uppercase whitespace-nowrap"
                style={{
                  color: game.accentColor,
                  textShadow: `0 0 8px ${game.accentColor}55`,
                }}
              >
                {game.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
