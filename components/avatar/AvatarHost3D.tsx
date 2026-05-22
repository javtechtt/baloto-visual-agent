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

  // Clean up the GLB for our (non-IBL) stage: zero default morph weights (the
  // Avaturn face rig defaults the tongue to 0.6 → sticks out) and make skin/eyes
  // non-metallic (exported as metalness=1, which renders dark/dead without an
  // environment map — the classic "black eyes" look).
  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.morphTargetInfluences) mesh.morphTargetInfluences.fill(0);
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m && "metalness" in m) {
          m.metalness = 0;
          if ((m.name || "").toLowerCase().includes("eye")) {
            m.roughness = Math.min(m.roughness ?? 1, 0.45); // catch-light → lively eyes
          }
          m.needsUpdate = true;
        }
      });
    });
  }, [scene]);

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

function StageLights({ lite = false }: { lite?: boolean }) {
  return (
    <>
      <hemisphereLight args={["#b388ff", "#0a0517", 0.55]} />
      <ambientLight intensity={0.45} />
      {/* Key — warm, front-right (softened: skin is diffuse now, not metallic) */}
      <spotLight
        position={[3, 5, 5]}
        angle={0.6}
        penumbra={1}
        intensity={26}
        color="#fff3df"
        distance={22}
      />
      {/* Soft front fill for a readable face */}
      <directionalLight position={[0, 1.8, 5]} intensity={0.9} color="#fff6ec" />
      {/* Neon rim lights — skipped on low-power devices to save fragment cost */}
      {!lite && (
        <>
          <directionalLight position={[-4, 2.5, -3]} intensity={1.4} color="#22d3ee" />
          <pointLight position={[3.5, 1.8, -3]} intensity={16} color="#ff2d95" distance={16} />
        </>
      )}
    </>
  );
}

// ─── Canvas ───────────────────────────────────────────────────────────────────

export default function AvatarHost3D() {
  // This component is only mounted client-side (ssr:false), so window is safe.
  // Low-power = phones: cap pixel density at 1, drop antialiasing + rim lights,
  // and render the contact shadow once instead of every frame. Big FPS win on
  // Android GPUs (the iPhone could brute-force the heavier path).
  const lowPower =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      window.matchMedia?.("(pointer: coarse)").matches);

  return (
    <Canvas
      camera={{ position: AVATAR_CONFIG.camera.position, fov: AVATAR_CONFIG.camera.fov }}
      dpr={lowPower ? 1 : [1, 2]}
      gl={{ alpha: true, antialias: !lowPower, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <CameraRig />
      <StageLights lite={lowPower} />
      <Suspense fallback={null}>
        <HostModel />
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.45}
          scale={6}
          blur={2.8}
          far={3.5}
          resolution={lowPower ? 128 : 256}
          frames={lowPower ? 1 : Infinity}
          color="#000000"
        />
      </Suspense>
    </Canvas>
  );
}
