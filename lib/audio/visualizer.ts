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
