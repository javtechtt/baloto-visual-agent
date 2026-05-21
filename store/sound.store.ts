import { create } from "zustand";
import { setSoundEnabled } from "@/lib/audio/sfx";

// Reactive mirror of the SFX engine's mute flag, so the UI (toggle button) can
// re-render. Default is `true` on both server and client — the persisted
// preference is loaded after mount in SoundManager to avoid hydration drift.

interface SoundStore {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
}

export const useSoundStore = create<SoundStore>((set, get) => ({
  enabled: true,
  setEnabled: (v) => {
    setSoundEnabled(v);
    set({ enabled: v });
  },
  toggle: () => get().setEnabled(!get().enabled),
}));
