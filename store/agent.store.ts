import { create } from "zustand";

export type AgentStatus =
  | "idle"        // Not started
  | "connecting"  // WebRTC handshake in progress
  | "listening"   // Mic open, waiting for user to speak
  | "thinking"    // Processing — VAD detected end of speech, model is working
  | "speaking"    // Model is outputting audio
  | "error";      // Something went wrong

interface AgentStore {
  status: AgentStatus;
  transcript: string;        // Latest agent speech text (streamed)
  userTranscript: string;    // Latest user speech text (from input transcription)
  audioLevel: number;        // 0–1, used by the visualizer
  error: string | null;

  setStatus: (status: AgentStatus) => void;
  setTranscript: (text: string) => void;
  appendTranscript: (delta: string) => void;
  setUserTranscript: (text: string) => void;
  setAudioLevel: (level: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  status: "idle",
  transcript: "",
  userTranscript: "",
  audioLevel: 0,
  error: null,

  setStatus: (status) => set({ status }),
  setTranscript: (text) => set({ transcript: text }),
  appendTranscript: (delta) =>
    set((state) => ({ transcript: state.transcript + delta })),
  setUserTranscript: (text) => set({ userTranscript: text }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setError: (error) => set({ error, status: error ? "error" : "idle" }),
  reset: () =>
    set({
      status: "idle",
      transcript: "",
      userTranscript: "",
      audioLevel: 0,
      error: null,
    }),
}));
