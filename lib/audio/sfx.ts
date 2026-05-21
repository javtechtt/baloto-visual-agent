// Synthesized casino sound engine. Everything is generated live via the Web
// Audio API — no audio files to ship. One shared AudioContext + master gain,
// gated by a persisted mute flag. Calls are no-ops on the server and before the
// context is unlocked by a user gesture (see SoundManager).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let ambient: { stop: () => void } | null = null;

const STORAGE_KEY = "baloto.sound";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// ─── Mute state + persistence ─────────────────────────────────────────────────

export function isSoundEnabled(): boolean {
  return enabled;
}

export function loadSoundPref(): boolean {
  if (typeof window !== "undefined") {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "off") enabled = false;
    else if (v === "on") enabled = true;
  }
  return enabled;
}

export function setSoundEnabled(v: boolean): void {
  enabled = v;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, v ? "on" : "off");
  }
  if (!v) stopAmbient();
  else startAmbient();
}

// ─── Primitive generators ─────────────────────────────────────────────────────

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  attack?: number;
  slideTo?: number;
  when?: number; // seconds from now
}

function tone({
  freq,
  type = "sine",
  dur = 0.12,
  gain = 0.2,
  attack = 0.005,
  slideTo,
  when = 0,
}: ToneOpts): void {
  const c = getCtx();
  if (!c || !enabled || !master) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noiseSweep({
  dur = 0.3,
  gain = 0.12,
  type = "lowpass" as BiquadFilterType,
  from = 400,
  to = 4000,
}): void {
  const c = getCtx();
  if (!c || !enabled || !master) return;
  const t0 = c.currentTime;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

// ─── Public sound effects ─────────────────────────────────────────────────────

export const sfx = {
  // Soft UI blip on hover
  hover: () => tone({ freq: 720, type: "sine", dur: 0.045, gain: 0.05 }),

  // Tactile button press
  click: () => tone({ freq: 340, type: "square", dur: 0.06, gain: 0.1, slideTo: 190 }),

  // Confirmation / selection — a bright two-note rise
  select: () => {
    tone({ freq: 523, type: "triangle", dur: 0.1, gain: 0.14 });
    tone({ freq: 784, type: "triangle", dur: 0.16, gain: 0.12, when: 0.08 });
  },

  // Lottery ball drop
  ball: () => tone({ freq: 880, type: "sine", dur: 0.13, gain: 0.12, slideTo: 320 }),

  // Single coin ping
  coin: () => tone({ freq: 1760, type: "triangle", dur: 0.18, gain: 0.11, slideTo: 2640 }),

  // Cascading coins (cart add / cash-in)
  coins: () => {
    [1046, 1319, 1568, 2093, 2637].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.28, gain: 0.1, when: i * 0.06 })
    );
  },

  // Cash register ka-ching
  cash: () => {
    tone({ freq: 1200, type: "triangle", dur: 0.4, gain: 0.16 });
    tone({ freq: 1800, type: "triangle", dur: 0.5, gain: 0.14, when: 0.08 });
  },

  // Panel / scene swipe
  whoosh: () => noiseSweep({ dur: 0.34, gain: 0.09, from: 300, to: 3200 }),

  // Negative / blocked action
  error: () => tone({ freq: 170, type: "sawtooth", dur: 0.26, gain: 0.12, slideTo: 90 }),

  // Big win fanfare — ascending arpeggio with a shimmer tail
  win: () => {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.55, gain: 0.16, when: i * 0.1 })
    );
    tone({ freq: 2093, type: "sine", dur: 0.9, gain: 0.08, when: 0.5 });
  },

  // Spinning reel / draw — accelerating then settling ticks
  reel: () => {
    for (let i = 0; i < 16; i++) {
      const when = i < 8 ? i * 0.04 : 0.32 + (i - 8) * 0.07;
      tone({ freq: 1300, type: "square", dur: 0.025, gain: 0.07, when });
    }
  },
};

// ─── Ambient casino bed ───────────────────────────────────────────────────────
// A soft warm pad + faint, randomly-timed distant coin sparkles. Very low gain —
// it should sit under everything as "the floor," not draw attention.

let sparkleTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSparkle(): void {
  if (!enabled) return;
  const delay = 2200 + Math.random() * 4200;
  sparkleTimer = setTimeout(() => {
    const f = 1400 + Math.random() * 1600;
    tone({ freq: f, type: "triangle", dur: 0.16, gain: 0.025, slideTo: f * 1.4 });
    scheduleSparkle();
  }, delay);
}

export function startAmbient(): void {
  const c = getCtx();
  if (!c || !enabled || !master || ambient) return;

  const g = c.createGain();
  g.gain.value = 0;
  g.connect(master);
  g.gain.linearRampToValueAtTime(0.05, c.currentTime + 2.5);

  // Warm major-ish pad: A2 + E3 + A3, slightly detuned for movement
  const freqs = [110, 164.81, 220, 220.6];
  const oscs = freqs.map((f, i) => {
    const o = c.createOscillator();
    o.type = i === 3 ? "triangle" : "sine";
    o.frequency.value = f;
    return o;
  });

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 650;
  filter.Q.value = 0.6;

  // Slow filter sweep gives the pad gentle life
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 280;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  oscs.forEach((o) => o.connect(filter));
  filter.connect(g);
  [...oscs, lfo].forEach((o) => o.start());

  scheduleSparkle();

  ambient = {
    stop: () => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => {
        [...oscs, lfo].forEach((o) => {
          try {
            o.stop();
          } catch {
            /* already stopped */
          }
        });
        try {
          g.disconnect();
        } catch {
          /* already disconnected */
        }
      }, 700);
      if (sparkleTimer) clearTimeout(sparkleTimer);
      sparkleTimer = null;
    },
  };
}

export function stopAmbient(): void {
  ambient?.stop();
  ambient = null;
}

// Resume the context after a user gesture (autoplay policy). Safe to call often.
export function unlockAudio(): void {
  getCtx();
}
