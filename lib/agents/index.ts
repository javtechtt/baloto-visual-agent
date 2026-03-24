// Agent registry — single source of configuration for all AI agents.
// client.ts reads from here; nothing else needs to know agent internals.

import { SALES_AGENT_PROMPT } from "./sales-prompt";
import { CHECKOUT_AGENT_PROMPT } from "./checkout-prompt";
import { SALES_TOOLS, CHECKOUT_TOOLS } from "@/lib/realtime/tools";

export type AgentType = "sales" | "checkout";

export const AGENTS = {
  sales: {
    prompt: SALES_AGENT_PROMPT,
    tools: SALES_TOOLS,
    voice: "coral" as const,
  },
  checkout: {
    prompt: CHECKOUT_AGENT_PROMPT,
    tools: CHECKOUT_TOOLS,
    voice: "shimmer" as const,
  },
} as const;

export function getAgentConfig(type: AgentType) {
  return AGENTS[type];
}
