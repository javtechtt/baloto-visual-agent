"use client";

import { motion } from "framer-motion";
import { GAME_LIST } from "@/lib/baloto/games";
import { useBalotoStore } from "@/store/baloto.store";
import GameCard from "./GameCard";

export default function GameGrid() {
  const selectedGame = useBalotoStore((s) => s.selectedGame);

  return (
    <div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-white/30 text-xs font-medium uppercase tracking-widest mb-3"
      >
        Available Games
      </motion.p>
      <div className="flex flex-col gap-3">
        {GAME_LIST.map((game, i) => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGame === game.id}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
