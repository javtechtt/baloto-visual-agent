"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Plus } from "lucide-react";
import { useBalotoStore } from "@/store/baloto.store";
import { GAMES } from "@/lib/baloto/games";
import LotteryBall from "./LotteryBall";

export default function CartPanel() {
  const plays = useBalotoStore((s) => s.plays);
  const removePlay = useBalotoStore((s) => s.removePlay);
  const openCheckout = useBalotoStore((s) => s.openCheckout);
  const cancelActivePlay = useBalotoStore((s) => s.cancelActivePlay);

  if (plays.length === 0) return null;

  const totalCOP = plays.reduce((sum, p) => sum + GAMES[p.gameId].price, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShoppingCart size={14} className="text-white/40" />
        <span className="text-white/30 text-xs font-medium uppercase tracking-widest">
          Cart — {plays.length} {plays.length === 1 ? "play" : "plays"}
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-3">
        <AnimatePresence initial={false}>
          {plays.map((play, idx) => {
            const game = GAMES[play.gameId];
            return (
              <motion.div
                key={play.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{
                  background: `${game.accentColor}12`,
                  border: `1px solid ${game.accentColor}20`,
                }}
              >
                {/* Game badge + numbers */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: `${game.accentColor}30`,
                      color: game.accentColor,
                    }}
                  >
                    {game.name}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {play.numbers.map((n, i) => (
                      <LotteryBall
                        key={i}
                        value={n}
                        accentColor={game.accentColor}
                        size="sm"
                      />
                    ))}
                    {play.bonusNumber !== undefined && (
                      <LotteryBall
                        value={play.bonusNumber}
                        accentColor={game.accentColor}
                        isBonus
                        size="sm"
                      />
                    )}
                    {play.zodiacSign && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full self-center"
                        style={{
                          background: `${game.accentColor}30`,
                          color: game.accentColor,
                        }}
                      >
                        {play.zodiacSign}
                      </span>
                    )}
                    {play.color && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full self-center font-medium"
                        style={{
                          background: `${game.accentColor}30`,
                          color: game.accentColor,
                        }}
                      >
                        {play.color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price + remove */}
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-white/40 text-xs">
                    ${game.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removePlay(play.id)}
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add another game */}
      <motion.button
        onClick={cancelActivePlay}
        className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}
        whileHover={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.2)" }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={12} />
        Add another game
      </motion.button>

      {/* Total + checkout */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div>
          <p className="text-white/30 text-xs">Total</p>
          <p className="text-white font-semibold text-sm">
            ${totalCOP.toLocaleString()} COP
          </p>
        </div>
        <motion.button
          onClick={openCheckout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            boxShadow: "0 0 20px rgba(239,68,68,0.3)",
          }}
          whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(239,68,68,0.5)" }}
          whileTap={{ scale: 0.97 }}
        >
          <ShoppingCart size={14} />
          Checkout
        </motion.button>
      </div>
    </motion.div>
  );
}
