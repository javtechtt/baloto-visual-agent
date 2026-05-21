"use client";

import { useEffect } from "react";
import { useSoundStore } from "@/store/sound.store";
import { loadSoundPref, unlockAudio, startAmbient } from "@/lib/audio/sfx";

// Logic-only component. On mount it (1) loads the persisted mute preference and
// syncs it into the store, and (2) arms a one-time gesture listener that unlocks
// the AudioContext (browsers block audio until a user interacts) and starts the
// ambient casino bed. Renders nothing.

export default function SoundManager() {
  const setEnabled = useSoundStore((s) => s.setEnabled);

  useEffect(() => {
    // Reflect the saved preference (default stays `true` if none saved).
    const pref = loadSoundPref();
    useSoundStore.setState({ enabled: pref });

    const unlock = () => {
      unlockAudio();
      if (useSoundStore.getState().enabled) startAmbient();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: false });
    window.addEventListener("keydown", unlock, { once: false });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // setEnabled is stable (zustand) — run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setEnabled]);

  return null;
}
