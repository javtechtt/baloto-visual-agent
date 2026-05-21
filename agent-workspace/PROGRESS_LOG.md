# Progress Log — 3D Character Host System

Date: 2026-05-20

## Objective
A premium, voice-synced 3D character host for the Baloto AI voice experience —
alive, expressive, gamified, and central to the voice journey.

## What was built

### Tech
- React Three Fiber + three.js + @react-three/drei (R3F v9 / React 19).
- True 3D rigged GLB character (no CSS/SVG/flat/abstract placeholders).

### Character asset
- `public/avatar/host.glb` — three.js **RobotExpressive** (MIT), an intentionally
  designed expressive mascot. Verified contents:
  - Clips: Dance, Death, Idle, Jump, No, Punch, Running, Sitting, Standing,
    ThumbsUp, Walking, WalkJump, Wave, Yes.
  - Face morphs: Angry, Surprised, Sad. Skinned (bones present).
- Swappable via `lib/avatar/avatarConfig.ts` (`modelUrl` + clip-name map). Drop a
  Ready Player Me / Avaturn hostess at `/avatar/hostess.glb`, point the config at
  it, and the viseme/jaw lip-sync path activates automatically (see morphTargets).

### Modules (root-relative `@/` paths, matching the repo — no `src/`)
- `lib/avatar/avatarStates.ts` — AvatarState union + `resolveAvatarState(status, transient)`.
- `lib/avatar/avatarConfig.ts` — asset + framing + per-state clip plan + procedural tuning.
- `lib/avatar/morphTargets.ts` — morph plumbing; viseme/jaw discovery; emotion morphs.
- `store/avatar.store.ts` — transient reactions (greeting/guiding/celebration/caution), auto-expiring.
- `hooks/useAvatarAnimation.ts` — AnimationMixer state machine + procedural head/torso/mouth layer.
- `components/avatar/AvatarHost3D.tsx` — Canvas, premium lighting, ContactShadows, camera rig.
- `components/avatar/AvatarStage.tsx` — framed stage (glow + floor line), loads the Canvas with `ssr:false`.

### Voice sync
- New agent **output** audio analyser (`lib/audio/visualizer.ts` →
  `startAgentAudioAnalysis`) writes `agentAudioLevel` to the agent store. The host's
  mouth/head are driven by this level, so the face moves **only while the AI speaks**
  (level ≈ 0 otherwise). Separate from the existing mic analyser.
- States derived from voice status + transient triggers:
  - idle / listening / speaking / guiding share the **Idle** base clip (differentiated
    by the procedural layer → no restart pops, no animation stacking).
  - greeting → Wave, celebration → Dance, caution → Standing (crossfaded).
- Triggers wired in `lib/realtime/client.ts`:
  - connect → greeting (the AI also speaks first here — preserved).
  - show_games → guiding; confirm_play / jackpot / order success → celebration; error → caution.

### Staging
- The 3D host replaces the clipped orb in the ordering-scene dock (bottom-left),
  keeping the Talk/End button, transcript, and live indicator. Premium lighting:
  warm key + cyan/magenta neon rims + violet hemisphere fill + soft contact shadow.
- Checkout keeps the lightweight orb (one WebGL canvas, ordering scene only).

### No-T-pose guarantee
- The first clip (Idle) is played at full weight immediately on mount (no fade-in
  from the bind pose), so the bind/T-pose is never shown.

## Preserved
OpenAI Realtime (GA) voice, voice-controlled carousel, checkout flow, game
validation, one-screen non-scroll layout, no real payments, no API key exposure.

## Update — staging, framing, hostess swap (2026-05-20)
- **Right-side staging**: the host moved out of the bottom-left dock to a fixed,
  full-height stage on the RIGHT (`OrderingScene`). It fades/slides out when the
  games panel opens (they share the right edge). The dock is now controls-only
  (Talk/End + transcript + live).
- **Full-body framing**: `AvatarHost3D` now wraps the model in drei `<Bounds fit clip observe>`
  so the camera auto-fits the whole figure regardless of asset/scale — fixes the
  cropped/headless framing. Model sits at origin; ContactShadows at the feet (y=0).
- **Hostess GLB**: switched `AVATAR_CONFIG.modelUrl` to the user-provided
  `/avatar/hostess.glb` (4.7 MB, rigged). It ships ONE baked clip ("Action.004")
  and NO morph targets, so:
  - every state maps to "Action.004" (`HOSTESS_CLIPS`), differentiated by the
    procedural layer;
  - the hook gained a **first-clip fallback** (any single-clip model can't T-pose);
  - mouth is procedural: a **jaw bone** is rotated by the live audio level if the
    rig has one, else the head-bob carries the speaking rhythm (still gated to
    "AI speaking" via `agentAudioLevel`).
  - To revert to the bundled mascot: set `modelUrl` to `/avatar/host.glb`,
    `fallbackClip` to `Idle`, `clips` to `ROBOT_CLIPS`.

## Fix — T-pose freeze (2026-05-20)
- **Root cause (bug, not asset):** the hostess `Action.004` is a real 16.2s
  full-body clip (52 bones keyed). The hand-rolled `THREE.AnimationMixer` got
  `stopAllAction()`'d on the React StrictMode (dev) remount, and the "same clip,
  skip" guard then never restarted it → frozen at the bind/T-pose.
- **Fix:** `useAvatarAnimation` now uses drei `useAnimations` (correct mixer
  lifecycle; ticks the mixer itself — removed the manual `mixer.update`). The
  replay guard is identity-based (`currentAction === next`) and re-plays if the
  action isn't running, so it survives StrictMode remounts. First clip plays at
  full weight (no T-pose flash).
- **Asset limitation (documented):** this hostess GLB has **no jaw/face bones and
  no morph targets** (joints: Head → hands directly; no visemes). True lip-sync is
  therefore impossible with this asset — speech is a head/body presenter rhythm.
  For real mouth movement, use an avatar with ARKit visemes (Ready Player Me with
  blendshapes / Avaturn) or a jaw bone; the code already supports both paths.

## Controllable animation + lip-sync path (2026-05-20)

### Movement — now controllable (delivered)
The hostess shipped with one baked clip, so we bring our own retargetable set.
- `lib/avatar/retarget.ts` — strips `mixamorig:` prefixes + keeps rotation tracks
  so external clips bind to our skeleton at any source scale.
- `public/avatar/animations/{idle,talking,dance}.glb` — real Ready Player Me
  animation-library clips (bone names match the hostess exactly: Hips/Spine/...).
- `AVATAR_CONFIG.ANIMATION_CLIPS` manifest → loaded in `AvatarHost3D`, retargeted,
  fed into `useAvatarAnimation`. `HOSTESS_CLIPS` maps states: idle/listening→idle,
  speaking/greeting/guiding→talking, celebration→dance, caution→slow idle.
- **Add more movement:** drop a GLB in `public/avatar/animations/` and add an
  entry to `ANIMATION_CLIPS`. Mixamo gives FBX → export/convert to GLB (Blender
  glTF export, or an online FBX→glTF converter); the retargeter handles the rest.

### Lip-sync — needs a face-rigged avatar (asset limitation)
- The hostess GLB has **no jaw bone and no morph targets/visemes**, so true lip
  movement is impossible with it. Confirmed by inspection.
- Could not fetch a Ready Player Me avatar headlessly (model URLs need a real
  generated avatar id). The RPM **animation** library was fetchable; **avatars**
  were not.
- **To enable real lip-sync:** export the hostess WITH ARKit blendshapes
  (Avaturn "with blendshapes" / Ready Player Me with `morphTargets=ARKit`), save
  as `public/avatar/hostess.glb`. The code auto-detects visemes (jawOpen/mouthOpen/
  viseme_*) and drives the mouth from the agent audio level — no code change.
  Until then, "speaking" uses the talking body animation + head rhythm.

### Known risk (verify visually)
Retargeting assumes the hostess bind/bone-axis convention matches the RPM clips
(very likely, since bone names are identical). If arms look slightly twisted,
the bind poses differ and we'd need a per-bone offset or clips authored for her
exact rig.

## Notes / follow-ups
- Default host is a polished mascot for reliable out-of-the-box quality. For a
  realistic casino hostess with true visemes, drop an RPM/Avaturn GLB per config.
- Camera framing values in `avatarConfig.ts` are tunable if the figure needs
  re-centering for a different asset.
