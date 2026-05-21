import { create } from "zustand";
import type { TransientKind } from "@/lib/avatar/avatarStates";

// Holds the host's transient reaction (greeting / guiding / celebration /
// caution). The realtime client fires these on connect and on tool events;
// each auto-expires so the host returns to the voice-driven base state.

interface AvatarStore {
  transient: TransientKind | null;
  trigger: (kind: TransientKind, durationMs?: number) => void;
  clear: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useAvatarStore = create<AvatarStore>((set) => ({
  transient: null,
  trigger: (kind, durationMs = 3000) => {
    if (timer) clearTimeout(timer);
    set({ transient: kind });
    timer = setTimeout(() => {
      set({ transient: null });
      timer = null;
    }, durationMs);
  },
  clear: () => {
    if (timer) clearTimeout(timer);
    timer = null;
    set({ transient: null });
  },
}));
