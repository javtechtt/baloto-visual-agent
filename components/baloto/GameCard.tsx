"use client";

import { motion } from "framer-motion";
import { BalotoGame } from "@/lib/baloto/games";
import { useBalotoStore } from "@/store/baloto.store";

interface Props {
  game: BalotoGame;
  isSelected: boolean;
  index: number;
}

export default function GameCard({ game, isSelected, index }: Props) {
  const selectGame = useBalotoStore((s) => s.selectGame);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: isSelected ? 1 : 0.55, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      whileHover={{ opacity: 1, scale: 1.02 }}
      onClick={() => selectGame(game.id)}
      className="relative overflow-hidden rounded-2xl cursor-pointer select-none"
      style={{
        background: `linear-gradient(135deg, ${game.accentColor}22, ${game.accentColor}08)`,
        border: isSelected
          ? `1px solid ${game.accentColor}88`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isSelected
          ? `0 0 32px ${game.accentColor}30, inset 0 1px 0 ${game.accentColor}20`
          : "none",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease",
      }}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <motion.div
          layoutId="selected-bar"
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: game.accentColor }}
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div className="p-4 pl-5">
        {/* Game name + draw days */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-white font-semibold text-sm leading-tight">
            {game.name}
          </h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full ml-2 shrink-0"
            style={{
              background: `${game.accentColor}22`,
              color: game.accentColor,
            }}
          >
            {game.drawDays[0]}
          </span>
        </div>

        {/* Tagline */}
        <p className="text-white/40 text-xs mb-3 leading-snug">
          {game.tagline}
        </p>

        {/* Price + pick info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: game.accentColor }}
            />
            <span className="text-white/50 text-xs">
              {game.pickCount} numbers
              {game.bonusPickCount ? ` + ${game.bonusPickCount} bonus` : ""}
            </span>
          </div>
          <span className="text-white/70 text-xs font-medium">
            ${game.price.toLocaleString()} COP
          </span>
        </div>
      </div>
    </motion.div>
  );
}
