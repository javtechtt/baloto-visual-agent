import * as THREE from "three";

// Retargets an external animation clip (Ready Player Me animation library,
// Mixamo, etc.) onto our standard humanoid skeleton. Two normalizations:
//   1. Strip any "mixamorig:" prefix from track names so they bind to bones
//      named Hips/Spine/Head/... (our hostess + RPM avatars use that naming).
//   2. Keep only rotation (.quaternion) tracks. Rotations are scale-independent,
//      so a Mixamo clip authored in centimetres and an RPM clip in metres both
//      apply cleanly without flinging the character around by its hips.
//
// Clips set absolute local bone rotations, so playing one overrides the bind
// (T-)pose entirely — which is how a single idle clip un-T-poses the model.

export function retargetClip(
  clip: THREE.AnimationClip,
  name: string
): THREE.AnimationClip {
  const tracks = clip.tracks
    .filter((t) => t.name.endsWith(".quaternion"))
    .map((t) => {
      const cloned = t.clone();
      cloned.name = cloned.name.replace(/mixamorig[:_]?/i, "");
      return cloned;
    });
  return new THREE.AnimationClip(name, clip.duration, tracks);
}
