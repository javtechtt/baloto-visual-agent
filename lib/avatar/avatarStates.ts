import type { AgentStatus } from "@/store/agent.store";

// The host's behavioral states. Each maps to a distinct visual behavior
// (animation clip + procedural layer) in useAvatarAnimation.
export type AvatarState =
  | "idle"
  | "greeting"
  | "listening"
  | "speaking"
  | "guiding"
  | "celebration"
  | "caution";

// Transient states are triggered by events (a tool call, a connect, an error)
// and auto-expire; the rest are derived continuously from the voice status.
export type TransientKind = "greeting" | "guiding" | "celebration" | "caution";

export const AVATAR_STATES: AvatarState[] = [
  "idle",
  "greeting",
  "listening",
  "speaking",
  "guiding",
  "celebration",
  "caution",
];

// Resolve the single active state. A live transient (greeting/celebration/etc.)
// wins; otherwise the voice status drives speaking / listening / idle. An error
// surfaces the calmer "caution" posture.
export function resolveAvatarState(
  status: AgentStatus,
  transient: TransientKind | null
): AvatarState {
  if (transient) return transient;
  if (status === "error") return "caution";
  if (status === "speaking") return "speaking";
  if (status === "listening" || status === "thinking") return "listening";
  return "idle";
}
