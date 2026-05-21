"use client";

import { useAgentStore } from "@/store/agent.store";

// Reads audio levels from the microphone stream and writes them to the store.
// The AgentOrb component reads audioLevel (0–1) to animate its pulse/scale.

let analyser: AnalyserNode | null = null;
let animationFrameId: number | null = null;
let audioContext: AudioContext | null = null;

export function startAudioVisualization(stream: MediaStream): void {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const tick = () => {
    animationFrameId = requestAnimationFrame(tick);
    analyser!.getByteFrequencyData(dataArray);

    // Compute RMS amplitude of the frequency data
    const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / dataArray.length);

    // Normalize to 0–1 (typical RMS range for voice is 0–80)
    const normalized = Math.min(rms / 80, 1);
    useAgentStore.getState().setAudioLevel(normalized);
  };

  tick();
}

export function stopAudioVisualization(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  audioContext?.close();
  audioContext = null;
  analyser = null;
  useAgentStore.getState().setAudioLevel(0);
}

// ─── Agent output analyser (drives avatar lip-sync) ───────────────────────────
// Separate from the mic analyser above. Reads the amplitude of the AI's spoken
// audio (the remote WebRTC stream) so the 3D host's mouth/head moves in time
// with the voice — and only while the agent is actually producing sound.

let agentAnalyser: AnalyserNode | null = null;
let agentFrameId: number | null = null;
let agentCtx: AudioContext | null = null;

export function startAgentAudioAnalysis(stream: MediaStream): void {
  stopAgentAudioAnalysis();
  try {
    agentCtx = new AudioContext();
    agentAnalyser = agentCtx.createAnalyser();
    agentAnalyser.fftSize = 256;
    const source = agentCtx.createMediaStreamSource(stream);
    source.connect(agentAnalyser);

    const dataArray = new Uint8Array(agentAnalyser.frequencyBinCount);
    const tick = () => {
      agentFrameId = requestAnimationFrame(tick);
      agentAnalyser!.getByteFrequencyData(dataArray);

      // Loudness (RMS) → mouth openness; low/high band ratio → spectral
      // brightness, which the avatar uses to pick a vowel mouth shape
      // (dark/round → O/U, bright → E/I). Bins (~172Hz each at fftSize 256):
      // low = <~1.4kHz (back vowels), high = ~1.4–6.9kHz (front vowels/fricatives).
      let sumSq = 0;
      let low = 0;
      let high = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i];
        sumSq += v * v;
        if (i < 8) low += v;
        else if (i < 40) high += v;
      }
      const rms = Math.sqrt(sumSq / dataArray.length);
      const level = Math.min(rms / 70, 1);
      const brightness = low + high > 0 ? high / (low + high) : 0;
      useAgentStore.getState().setAgentVoice(level, brightness);
    };
    tick();
  } catch {
    // Some browsers block analysing a WebRTC stream — the avatar then falls
    // back to a synthesized speaking rhythm gated on the "speaking" status.
  }
}

export function stopAgentAudioAnalysis(): void {
  if (agentFrameId !== null) {
    cancelAnimationFrame(agentFrameId);
    agentFrameId = null;
  }
  agentCtx?.close();
  agentCtx = null;
  agentAnalyser = null;
  useAgentStore.getState().setAgentVoice(0, 0);
}
