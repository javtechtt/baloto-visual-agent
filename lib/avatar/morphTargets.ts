import * as THREE from "three";

// Morph-target (blendshape) plumbing. Works with whatever the loaded GLB
// exposes: the default mascot has emotion morphs (Angry/Surprised/Sad); a
// premium hostess GLB (RPM/ARKit) would expose visemes/jawOpen — both are
// handled. If no mouth morph exists, the speaking motion is procedural
// (see useAvatarAnimation), so the face never distorts or flaps robotically.

export interface MorphMesh {
  mesh: THREE.Mesh;
  dict: Record<string, number>; // morph name -> index
}

export function collectMorphMeshes(root: THREE.Object3D): MorphMesh[] {
  const out: MorphMesh[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.morphTargetDictionary && m.morphTargetInfluences) {
      out.push({ mesh: m, dict: m.morphTargetDictionary });
    }
  });
  return out;
}

export function setMorph(meshes: MorphMesh[], name: string, value: number): void {
  for (const { mesh, dict } of meshes) {
    const idx = dict[name];
    if (idx !== undefined && mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences[idx] = value;
    }
  }
}

// Smoothly approach a target influence (per-frame lerp).
export function easeMorph(
  meshes: MorphMesh[],
  name: string,
  target: number,
  alpha: number
): void {
  for (const { mesh, dict } of meshes) {
    const idx = dict[name];
    if (idx !== undefined && mesh.morphTargetInfluences) {
      const cur = mesh.morphTargetInfluences[idx] ?? 0;
      mesh.morphTargetInfluences[idx] = cur + (target - cur) * alpha;
    }
  }
}

// Candidate mouth/jaw morph names across asset conventions (ARKit, RPM/Oculus
// visemes, VRChat). The first one present is used for amplitude-driven lip-sync.
export const MOUTH_MORPH_CANDIDATES = [
  "jawOpen",
  "mouthOpen",
  "viseme_aa",
  "viseme_AA",
  "viseme_O",
  "mouthFunnel",
  "JawOpen",
  "vrc.v_aa",
  "v_aa",
];

export function findMouthMorph(meshes: MorphMesh[]): string | null {
  for (const name of MOUTH_MORPH_CANDIDATES) {
    if (meshes.some((m) => m.dict[name] !== undefined)) return name;
  }
  return null;
}

// Oculus/RPM viseme set (vowel-shape lip-sync) — present on Avaturn/RPM exports.
// We blend these by amplitude (openness) + spectral brightness (vowel shape)
// rather than just dropping the jaw, which looks far more like speech.
export const VISEMES = {
  aa: "viseme_aa",
  E: "viseme_E",
  I: "viseme_I",
  O: "viseme_O",
  U: "viseme_U",
} as const;

export function hasVisemes(meshes: MorphMesh[]): boolean {
  return meshes.some((m) => m.dict[VISEMES.aa] !== undefined);
}

// Expression morphs by state. Arrays so we cover ARKit names (Avaturn/RPM:
// mouthSmileLeft/Right, mouthFrownLeft/Right) and the mascot's emotion morphs
// (Surprised/Sad). Names not present on the asset are silently skipped.
export const EXPRESSIONS = {
  happy: ["mouthSmileLeft", "mouthSmileRight", "Surprised"],
  sad: ["mouthFrownLeft", "mouthFrownRight", "Sad"],
} as const;

// Eye-blink morphs (ARKit) — driven procedurally for liveliness.
export const BLINK_MORPHS = ["eyeBlinkLeft", "eyeBlinkRight"] as const;
