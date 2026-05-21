"use client";

import { Suspense, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { AVATAR_CONFIG, ANIMATION_CLIPS } from "@/lib/avatar/avatarConfig";
import { retargetClip } from "@/lib/avatar/retarget";
import { resolveAvatarState } from "@/lib/avatar/avatarStates";
import { useAvatarAnimation } from "@/hooks/useAvatarAnimation";
import { useAgentStore } from "@/store/agent.store";
import { useAvatarStore } from "@/store/avatar.store";

const ANIM_URLS = ANIMATION_CLIPS.map((c) => c.file);

// Warm prefetch so the host + its animations appear fast on first activation.
useGLTF.preload(AVATAR_CONFIG.modelUrl);
ANIM_URLS.forEach((u) => useGLTF.preload(u));

// ─── The character ────────────────────────────────────────────────────────────

function HostModel() {
  const { scene, animations: baseClips } = useGLTF(AVATAR_CONFIG.modelUrl);
  // Load the external animation GLBs (array form) and retarget them onto the
  // model's skeleton. These give the host its controllable, per-state movement.
  const animGltfs = useGLTF(ANIM_URLS);

  const status = useAgentStore((s) => s.status);
  const transient = useAvatarStore((s) => s.transient);

  const clips = useMemo(() => {
    const results = Array.isArray(animGltfs) ? animGltfs : [animGltfs];
    const external: THREE.AnimationClip[] = [];
    ANIMATION_CLIPS.forEach((entry, i) => {
      const src = results[i]?.animations?.[0];
      if (src) external.push(retargetClip(src, entry.name));
    });
    // External clips take priority; the model's own baked clips remain available
    // as fallbacks (e.g. the mascot's named clips when that asset is active).
    return external.length > 0 ? external : baseClips;
  }, [animGltfs, baseClips]);

  const state = resolveAvatarState(status, transient);
  useAvatarAnimation(scene, clips, state);

  return (
    <primitive
      object={scene}
      scale={AVATAR_CONFIG.scale}
      position={AVATAR_CONFIG.position}
      rotation={[0, AVATAR_CONFIG.rotationY, 0]}
    />
  );
}

// ─── Camera framing ───────────────────────────────────────────────────────────
// Static close-up aimed at the chest, giving a foreground "beside the stage"
// perspective rather than a small full-body figure.

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    const [tx, ty, tz] = AVATAR_CONFIG.camera.target;
    camera.lookAt(tx, ty, tz);
  }, [camera]);
  return null;
}

// ─── Premium stage lighting ───────────────────────────────────────────────────
// Soft warm key + cyan/magenta neon rims (casino theme) + violet hemisphere
// fill so the face stays readable. No shadow maps (avoids harsh shadows); the
// figure is grounded by a soft ContactShadow instead.

function StageLights() {
  return (
    <>
      <hemisphereLight args={["#b388ff", "#0a0517", 0.6]} />
      <ambientLight intensity={0.4} />
      {/* Key — warm, front-right */}
      <spotLight
        position={[3, 5, 5]}
        angle={0.6}
        penumbra={1}
        intensity={55}
        color="#fff3df"
        distance={22}
      />
      {/* Soft front fill for a readable face */}
      <directionalLight position={[0, 1.8, 5]} intensity={1.1} color="#ffffff" />
      {/* Cyan rim, back-left */}
      <directionalLight position={[-4, 2.5, -3]} intensity={2.4} color="#22d3ee" />
      {/* Magenta rim, back-right */}
      <pointLight position={[3.5, 1.8, -3]} intensity={32} color="#ff2d95" distance={16} />
    </>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export default function AvatarHost3D() {
  return (
    <Canvas
      camera={{ position: AVATAR_CONFIG.camera.position, fov: AVATAR_CONFIG.camera.fov }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <CameraRig />
      <StageLights />
      <Suspense fallback={null}>
        <HostModel />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.45}
          scale={6}
          blur={2.8}
          far={3.5}
          color="#000000"
        />
      </Suspense>
    </Canvas>
  );
}
