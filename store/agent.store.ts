import { create } from "zustand";

export type AgentStatus =
  | "idle"        // Not started
  | "connecting"  // WebRTC handshake in progress
  | "listening"   // Mic open, waiting for user to speak
  | "thinking"    // Processing — VAD detected end of speech, model is working
  | "speaking"    // Model is outputting audio
  | "error";      // Something went wrong

export type ActiveAgent = "sales" | "checkout";

interface AgentStore {
  status: AgentStatus;
  activeAgent: ActiveAgent;
  transcript: string;        // Latest agent speech text (streamed)
  userTranscript: string;    // Latest user speech text (from input transcription)
  audioLevel: number;        // 0–1, mic input level (visualizer)
  agentAudioLevel: number;   // 0–1, agent OUTPUT loudness — drives mouth openness
  agentVoiceBrightness: number; // 0–1, spectral brightness — drives vowel shape
  error: string | null;

  setStatus: (status: AgentStatus) => void;
  setActiveAgent: (agent: ActiveAgent) => void;
  setTranscript: (text: string) => void;
  appendTranscript: (delta: string) => void;
  setUserTranscript: (text: string) => void;
  setAudioLevel: (level: number) => void;
  setAgentAudioLevel: (level: number) => void;
  setAgentVoice: (level: number, brightness: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  status: "idle",
  activeAgent: "sales",
  transcript: "",
  userTranscript: "",
  audioLevel: 0,
  agentAudioLevel: 0,
  agentVoiceBrightness: 0,
  error: null,

  setStatus: (status) => set({ status }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  setTranscript: (text) => set({ transcript: text }),
  appendTranscript: (delta) =>
    set((state) => ({ transcript: state.transcript + delta })),
  setUserTranscript: (text) => set({ userTranscript: text }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setAgentAudioLevel: (level) => set({ agentAudioLevel: level }),
  setAgentVoice: (level, brightness) =>
    set({ agentAudioLevel: level, agentVoiceBrightness: brightness }),
  setError: (error) => set({ error, status: error ? "error" : "idle" }),
  reset: () =>
    set({
      status: "idle",
      activeAgent: "sales",
      transcript: "",
      userTranscript: "",
      audioLevel: 0,
      agentAudioLevel: 0,
      agentVoiceBrightness: 0,
      error: null,
    }),
}));
