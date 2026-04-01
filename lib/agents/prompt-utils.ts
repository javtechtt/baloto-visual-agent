// Prompt documentation generators — auto-serialize game rules and checkout flow
// from the actual configs so the AI reads system truth, not hardcoded prose
// that can diverge.
//
// Tool schemas are NOT duplicated here — the model receives them via the
// OpenAI function-calling schema, which is the authoritative source.

import {
  GAMES,
  GAME_LIST,
  CHECKOUT_STEPS,
  type BalotoGame,
} from "@/lib/baloto/games";

// ─── Game rules ──────────────────────────────────────────────────────────────

function serializeOneGame(game: BalotoGame): string {
  const min = game.mainPoolMin ?? 1;
  const isDigit = min === 0;
  const numberWord = isDigit ? "digits" : "numbers";

  const lines: string[] = [];

  // Header
  const addon = game.requiresBase
    ? ` [add-on to ${GAMES[game.requiresBase].name}]`
    : "";
  lines.push(`${game.name.toUpperCase()}${addon}`);

  // Number picking
  if (game.requiresBase) {
    lines.push(
      `- Reuses the customer's ${GAMES[game.requiresBase].name} numbers — do NOT collect new numbers. Read the previous ${GAMES[game.requiresBase].name} play from the cart in the state snapshot and pass those exact numbers.`
    );
    lines.push(
      `- Same format: ${game.pickCount} ${numberWord} from ${min}–${game.mainPoolMax}` +
        (game.bonusPickCount
          ? ` + ${game.bonusPickCount} bonus from 1–${game.bonusPoolMax}`
          : "")
    );
  } else {
    let pickLine = `- Pick ${game.pickCount} ${numberWord} from ${min}–${game.mainPoolMax}`;
    if (game.bonusPickCount) {
      pickLine += `, plus ${game.bonusPickCount} bonus (balotico) from 1–${game.bonusPoolMax}`;
    }
    lines.push(pickLine);
  }

  // Extra pick (zodiac, color, etc.) — driven by config, not hardcoded game IDs
  if (game.extraPick) {
    const label = game.extraPick.type === "zodiac" ? "a zodiac sign" : "a color";
    lines.push(`- Plus ${label}: ${game.extraPick.options.join(", ")}`);
  }

  // Draw days & price
  lines.push(
    `- Draws: ${game.drawDays.join(", ")} | Price: $${game.price.toLocaleString()} COP`
  );

  return lines.join("\n");
}

export function serializeGameRules(): string {
  const blocks = GAME_LIST.map(serializeOneGame);
  return blocks.join("\n\n");
}

// ─── Checkout flow ───────────────────────────────────────────────────────────

export function serializeCheckoutFlow(): string {
  const steps = CHECKOUT_STEPS.join(" → ");
  return (
    `Checkout steps: ${steps}\n` +
    `- "details" requires detailsReady=true to advance\n` +
    `- "payment" requires paymentReady=true to advance\n` +
    `- The system enforces step ordering — the agent cannot skip steps`
  );
}
