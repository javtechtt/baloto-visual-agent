"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { AVATAR_CONFIG } from "@/lib/avatar/avatarConfig";
import type { AvatarState } from "@/lib/avatar/avatarStates";
import {
  collectMorphMeshes,
  findMouthMorph,
  easeMorph,
  setMorph,
  hasVisemes,
  VISEMES,
  EXPRESSIONS,
  BLINK_MORPHS,
} from "@/lib/avatar/morphTargets";
import { useAgentStore } from "@/store/agent.store";

// Drives the loaded character. The animation mixer is owned by drei's
// `useAnimations` (handles StrictMode/lifecycle correctly — a hand-rolled mixer
// here previously got stopped on the StrictMode remount and froze the model in
// its bind/T-pose). On top of the active clip we compose a procedural layer
// every frame (head/torso presenter motion + mouth) driven by the AI's live
// audio level, so the face/head move ONLY while the AI speaks.
//
// State machine: idle/listening/speaking/guiding share one continuous base clip
// (differentiated by the procedural layer → no restart pops, no stacking);
// greeting/celebration/caution crossfade to their own clips when the asset has
// them. If a clip is missing, it falls back to the first clip in the asset, so a
// single-clip model (like the hostess) is always animated and never T-poses.

export function useAvatarAnimation(
  scene: THREE.Object3D,
  animations: THREE.AnimationClip[],
  state: AvatarState
) {
  const { actions } = useAnimations(animations, scene);

  const morphs = useMemo(() => collectMorphMeshes(scene), [scene]);
  const mouthMorph = useMemo(() => findMouthMorph(morphs), [morphs]);
  const useVisemeBlend = useMemo(() => hasVisemes(morphs), [morphs]);

  const bones = useMemo(() => {
    let head: THREE.Object3D | null = null;
    let spine: THREE.Object3D | null = null;
    let jaw: THREE.Object3D | null = null;
    scene.traverse((o) => {
      if (!(o as THREE.Bone).isBone) return;
      const n = o.name.toLowerCase();
      if (!jaw && n.includes("jaw")) jaw = o;
      if (!head && n.includes("head")) head = o;
      if (!spine && (n.includes("spine") || n.includes("chest"))) spine = o;
    });
    return { head, spine, jaw } as {
      head: THREE.Object3D | null;
      spine: THREE.Object3D | null;
      jaw: THREE.Object3D | null;
    };
  }, [scene]);

  const currentAction = useRef<THREE.AnimationAction | null>(null);

  // ── State → clip ────────────────────────────────────────────────────────────
  useEffect(() => {
    const plan = AVATAR_CONFIG.clips[state];
    // Resolve a clip that exists: configured → fallback → first clip in the asset.
    const clipName =
      (actions[plan.clip] && plan.clip) ||
      (actions[AVATAR_CONFIG.fallbackClip] && AVATAR_CONFIG.fallbackClip) ||
      animations[0]?.name;
    if (!clipName) return;
    const next = actions[clipName];
    if (!next) return;

    if (plan.loop === "once") {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.setEffectiveTimeScale(plan.timeScale ?? 1);

    if (!currentAction.current) {
      // First clip: full weight immediately (no fade from the bind/T-pose).
      next.reset().setEffectiveWeight(1).play();
      currentAction.current = next;
    } else if (currentAction.current === next) {
      // Same underlying action (e.g. idle↔speaking). Just make sure it's running
      // — this is what re-arms it after a StrictMode remount.
      if (!next.isRunning()) next.reset().setEffectiveWeight(1).play();
    } else {
      next.reset().setEffectiveWeight(1).fadeIn(plan.fade).play();
      currentAction.current.fadeOut(plan.fade);
      currentAction.current = next;
    }
  }, [state, actions, animations]);

  // Reusable temp objects (avoid per-frame allocation)
  const tmpEuler = useRef(new THREE.Euler());
  const tmpQuat = useRef(new THREE.Quaternion());

  // NOTE: do NOT call mixer.update here — useAnimations already ticks it. This
  // callback runs after that, so the procedural layer composes on the clip pose.
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    // Read live voice without subscribing (avoids per-frame React re-renders).
    const { agentAudioLevel: speak, agentVoiceBrightness: bright } =
      useAgentStore.getState();
    // speak: 0..1 loudness (mouth openness). bright: 0..1 spectral brightness
    // (vowel shape). Both ~0 unless the AI is speaking → mouth moves only then.

    // Lip-sync: a vowel-viseme blend reads as real speech (not a jaw flap).
    // Amplitude opens the mouth; brightness slides the shape dark→bright.
    // Fallbacks: a single mouth morph, then a jaw bone, then the head-bob below.
    if (useVisemeBlend) {
      // `speak` is ~1 during most speech, so the cap (mouthMax) sets how far the
      // mouth opens; it stays proportional to loudness below the cap.
      const open = speak * AVATAR_CONFIG.speak.mouthMax;
      const round = Math.max(0, 1 - bright * 2.2); // dark / low  → O, U
      const spread = Math.max(0, (bright - 0.4) * 2.2); // bright / high → E, I
      const mid = Math.max(0, 1 - round - spread); // mid → aa
      const a = 0.4; // per-frame smoothing
      easeMorph(morphs, VISEMES.aa, open * mid, a);
      easeMorph(morphs, VISEMES.O, open * round, a);
      easeMorph(morphs, VISEMES.U, open * round * 0.45, a);
      easeMorph(morphs, VISEMES.E, open * spread, a);
      easeMorph(morphs, VISEMES.I, open * spread * 0.45, a);
      easeMorph(morphs, "jawOpen", open * 0.4, a); // a little physical jaw
    } else if (mouthMorph) {
      easeMorph(morphs, mouthMorph, speak * AVATAR_CONFIG.mouthOpenMax, 0.4);
    } else if (bones.jaw) {
      const open = Math.sin(t * AVATAR_CONFIG.speak.rate * 1.4) * 0.5 + 0.5;
      tmpEuler.current.set(open * AVATAR_CONFIG.speak.jaw * speak, 0, 0);
      tmpQuat.current.setFromEuler(tmpEuler.current);
      bones.jaw.quaternion.multiply(tmpQuat.current);
    }

    // Expression morphs by state. A gentle resting smile keeps her warm and
    // approachable (a flat neutral face reads as "off"); bigger on celebration,
    // off during caution. Tune the 0.16 baseline to taste.
    const happy =
      state === "celebration" ? 0.6 : state === "caution" ? 0 : 0.16;
    for (const n of EXPRESSIONS.happy) easeMorph(morphs, n, happy, 0.08);
    const sad = state === "caution" ? 0.32 : 0;
    for (const n of EXPRESSIONS.sad) easeMorph(morphs, n, sad, 0.06);

    // Eye blink — a quick natural pulse every ~4.2s (people blink while talking)
    const cyc = t % 4.2;
    const blink = cyc < 0.14 ? Math.sin((cyc / 0.14) * Math.PI) : 0;
    for (const n of BLINK_MORPHS) setMorph(morphs, n, blink);

    // Procedural head layer, composed onto whatever the clip set this frame.
    const head = bones.head;
    if (head) {
      let nodX = 0;
      let yawY = 0;
      let rollZ = 0;

      if (speak > 0.02) {
        const s = AVATAR_CONFIG.speak;
        const amp = Math.min(1, speak + 0.15);
        nodX += s.headPitch + Math.sin(t * s.rate) * s.headNod * amp;
        yawY += Math.sin(t * s.rate * 0.5) * s.headYaw * amp;
      }
      if (state === "listening" && speak < 0.05) {
        const l = AVATAR_CONFIG.listen;
        yawY += Math.sin(t * l.rate) * l.headYaw;
        rollZ += Math.sin(t * l.rate * 0.6) * 0.02;
      }
      if (state === "guiding") {
        yawY += 0.18;
        nodX += 0.05;
      }

      tmpEuler.current.set(nodX, yawY, rollZ);
      tmpQuat.current.setFromEuler(tmpEuler.current);
      head.quaternion.multiply(tmpQuat.current);
    }

    // Subtle torso/presenter sway
    const spine = bones.spine;
    if (spine) {
      let lean = 0;
      let yaw = 0;
      if (speak > 0.02) {
        lean +=
          Math.sin(t * AVATAR_CONFIG.speak.rate * 0.5) *
          AVATAR_CONFIG.speak.torso *
          Math.min(1, speak);
      }
      if (state === "guiding") yaw += 0.12;
      tmpEuler.current.set(lean, yaw, 0);
      tmpQuat.current.setFromEuler(tmpEuler.current);
      spine.quaternion.multiply(tmpQuat.current);
    }
  });
}
