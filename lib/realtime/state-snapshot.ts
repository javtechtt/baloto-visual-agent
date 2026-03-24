"use client";

// The single source of truth for all AI tool results.
// Every tool handler appends this snapshot to its response so the agent never
// needs to remember, calculate, or guess state between calls.

import { useBalotoStore } from "@/store/baloto.store";
import { GAMES } from "@/lib/baloto/games";
import type { GameId } from "@/lib/baloto/games";

export interface StateSnapshot {
  activePlay: {
    gameId: GameId;
    numbers: number[];
    bonusNumber?: number;
    zodiacSign?: string;
    color?: string;
    /** How many more main numbers are still needed */
    numbersNeeded: number;
    /** Whether the bonus ball / zodiac / color is still missing */
    bonusNeeded: boolean;
    /** true when the play is fully complete and ready to confirm */
    complete: boolean;
  } | null;
  cart: Array<{
    gameId: GameId;
    numbers: number[];
    bonusNumber?: number;
    zodiacSign?: string;
    color?: string;
    /** Price in COP — always computed by the system, never by the AI */
    priceCOP: number;
  }>;
  playsCount: number;
  /** Total in COP — computed from GAMES config, never trusted from the AI */
  totalCOP: number;
  checkoutStep: string | null;
  detailsReady: boolean;
  paymentReady: boolean;
  paymentMethod: string;
  panelVisible: boolean;
}

export function getStateSnapshot(): StateSnapshot {
  const {
    activePlay,
    plays,
    checkoutStep,
    detailsReady,
    paymentReady,
    paymentMethod,
    panelVisible,
  } = useBalotoStore.getState();

  const cart = plays.map((p) => ({
    gameId: p.gameId,
    numbers: p.numbers,
    ...(p.bonusNumber !== undefined ? { bonusNumber: p.bonusNumber } : {}),
    ...(p.zodiacSign ? { zodiacSign: p.zodiacSign } : {}),
    ...(p.color ? { color: p.color } : {}),
    priceCOP: GAMES[p.gameId]?.price ?? 0,
  }));

  const totalCOP = cart.reduce((sum, p) => sum + p.priceCOP, 0);

  let activePlaySnapshot: StateSnapshot["activePlay"] = null;
  if (activePlay?.gameId) {
    const game = GAMES[activePlay.gameId as GameId];
    const currentCount = activePlay.numbers?.length ?? 0;
    const numbersNeeded = game ? game.pickCount - currentCount : 0;
    // bonusNeeded: true if game requires a bonus and it hasn't been set yet
    const bonusNeeded = !!(
      game?.bonusPickCount && activePlay.bonusNumber === undefined
    );
    activePlaySnapshot = {
      gameId: activePlay.gameId as GameId,
      numbers: activePlay.numbers ?? [],
      ...(activePlay.bonusNumber !== undefined
        ? { bonusNumber: activePlay.bonusNumber }
        : {}),
      ...(activePlay.zodiacSign ? { zodiacSign: activePlay.zodiacSign } : {}),
      ...(activePlay.color ? { color: activePlay.color } : {}),
      numbersNeeded,
      bonusNeeded,
      complete: numbersNeeded === 0 && !bonusNeeded,
    };
  }

  return {
    activePlay: activePlaySnapshot,
    cart,
    playsCount: plays.length,
    totalCOP,
    checkoutStep: checkoutStep ?? null,
    detailsReady,
    paymentReady,
    paymentMethod,
    panelVisible,
  };
}
