import type { AvatarState } from "./avatarStates";

// Single source of truth for the character asset + how each state is staged.
// Swapping the GLB is a config change: point `modelUrl` at the new file and map
// its clip names. If a clip is missing the hook falls back to the first clip in
// the asset and the procedural layer keeps the character alive (no T-pose).

export interface ClipPlan {
  clip: string;
  loop: "loop" | "once";
  fade: number; // crossfade seconds
  timeScale?: number;
}

// Mascot (three.js RobotExpressive) — rich clip set.
export const ROBOT_CLIPS: Record<AvatarState, ClipPlan> = {
  idle: { clip: "Idle", loop: "loop", fade: 0.45 },
  listening: { clip: "Idle", loop: "loop", fade: 0.4 },
  speaking: { clip: "Idle", loop: "loop", fade: 0.3 },
  greeting: { clip: "Wave", loop: "once", fade: 0.25 },
  guiding: { clip: "Idle", loop: "loop", fade: 0.3 },
  celebration: { clip: "Dance", loop: "loop", fade: 0.3 },
  caution: { clip: "Standing", loop: "loop", fade: 0.45 },
};

// External animation clips retargeted onto the skeleton (the hostess ships only
// one baked clip, so we bring our own controllable set). These are real
// Ready Player Me animation-library clips — RPM/Mixamo/Avaturn share the same
// humanoid skeleton, so they bind by bone name. ADD MORE: drop a GLB in
// public/avatar/animations and add an entry here (Mixamo FBX → export/convert to
// GLB first; the retargeter strips the mixamorig: prefix automatically).
export const ANIMATION_CLIPS: { file: string; name: string }[] = [
  { file: "/avatar/animations/idle.glb", name: "idle" },
  { file: "/avatar/animations/talking.glb", name: "talking" },
  { file: "/avatar/animations/dance.glb", name: "dance" },
];

// Hostess state → clip. Uses the retargeted clip names above. Body language now
// changes per state (calm idle, talking gestures while the AI speaks, a
// celebration dance).
export const HOSTESS_CLIPS: Record<AvatarState, ClipPlan> = {
  idle: { clip: "idle", loop: "loop", fade: 0.45 },
  listening: { clip: "idle", loop: "loop", fade: 0.4 },
  speaking: { clip: "talking", loop: "loop", fade: 0.3 },
  greeting: { clip: "talking", loop: "loop", fade: 0.3 },
  guiding: { clip: "talking", loop: "loop", fade: 0.3 },
  celebration: { clip: "dance", loop: "loop", fade: 0.3 },
  caution: { clip: "idle", loop: "loop", fade: 0.45, timeScale: 0.85 },
};

export const AVATAR_CONFIG = {
  // Active host: the user-provided hostess + retargeted animation clips above.
  // To switch back to the bundled mascot (which has its own clips), set modelUrl
  // to "/avatar/host.glb", fallbackClip to "Idle", clips to ROBOT_CLIPS, and
  // ANIMATION_CLIPS to [] (the mascot doesn't need external clips).
  // For real lip-sync: drop in a hostess GLB exported WITH ARKit blendshapes
  // (Avaturn / Ready Player Me) — visemes are detected and driven automatically.
  modelUrl: "/avatar/hostess.glb",
  fallbackClip: "idle",
  clips: HOSTESS_CLIPS,

  // Framing. Manual close-up so she reads as a foreground presence beside the
  // carousel (waist-up, slight 3/4 angle) rather than a small full-body figure
  // at the back. Tweak `rotationY` to Math.PI if the asset faces away.
  scale: 1,
  position: [0, 0, 0] as [number, number, number],
  rotationY: 0,

  // Camera pulled in close; offset x gives a perspective (3/4) view. To reveal
  // more of her (head-top → knees) WITHOUT moving back, widen `fov` (shows more
  // vertically) and grow the stage canvas in OrderingScene by the same amount so
  // she stays the same apparent size. z = distance (unchanged = same closeness);
  // `target.y` re-centers the crop vertically.
  camera: {
    position: [0.5, 1.22, 2.65] as [number, number, number],
    fov: 34,
    target: [0, 1.05, 0] as [number, number, number],
  },

  // Procedural speaking layer (head/jaw/torso rhythm, scaled by live audio).
  speak: { headNod: 0.16, headYaw: 0.06, jaw: 0.32, torso: 0.05, rate: 9 },

  // Procedural listening layer — slow attentive sway.
  listen: { headYaw: 0.045, rate: 0.9 },

  // Mouth morph open amount when a viseme/jaw blendshape IS present.
  mouthOpenMax: 0.85,
} as const;
