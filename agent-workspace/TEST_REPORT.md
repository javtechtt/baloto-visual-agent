# Test Report — 3D Character Host System

Date: 2026-05-20

## Automated checks

| Check | Command | Result |
|-------|---------|--------|
| Production build | `npx next build` | ✅ Compiled successfully; `/` still prerenders (static) |
| TypeScript | (part of build) | ✅ No type errors |
| Lint | `npm run lint` | ✅ 0 errors (9 warnings), exit 0 |
| Dev server | `npx next dev` | ✅ `GET /` → 200 |
| GLB served locally | `GET /avatar/host.glb` | ✅ 200, 463,988 bytes, `content-type: model/gltf-binary` |
| Favicon | `GET /icon.svg` | ✅ 200 |

### Lint note
The remaining 9 warnings are the experimental **React Compiler** rules in
`eslint-plugin-react-hooks` v6 (`set-state-in-effect`, `purity`, `immutability`),
intentionally downgraded from errors in `eslint.config.mjs`. They flag idiomatic
patterns (media-query/timeout effects, non-deterministic display values, and the
necessarily-imperative three.js animation layer) and several fire on pre-existing
files. No correctness issues.

## GLB asset verification
Parsed the binary glTF header + JSON chunk directly:
- Valid glTF v2, skinned (bones present).
- Animation clips include **Idle** (used as the base state — guarantees no T-pose),
  plus Wave / Dance / Standing / Yes / No / ThumbsUp / Jump used by states.
- Face morph targets: Angry / Surprised / Sad (emotion layer).

## Behavior verification (code-level)
Headless environment cannot render WebGL, so the following are verified by code
inspection + the asset/HTTP checks above:

| Requirement | Status | How it's met |
|-------------|--------|--------------|
| Character loads locally | ✅ | GLB served 200 with correct MIME; `useGLTF` + preload |
| Not T-posed | ✅ | Idle clip plays at full weight on mount (no bind-pose frame) |
| Responds to idle/listening/speaking | ✅ | `resolveAvatarState(status, transient)` → clip + procedural layer |
| Mouth/face only while AI speaks | ✅ | Driven by `agentAudioLevel` (≈0 unless AI outputs audio) |
| AI speaks first after activation | ✅ | `configureSession` sends greeting `response.create` on connect (preserved); host triggers greeting/Wave |
| Distinct states | ✅ | greeting=Wave, celebration=Dance, caution=Standing; idle/listen/speak/guide via procedural layer |
| No animation stacking | ✅ | Single base action crossfaded; procedural layer composed post-mixer onto bones |
| Premium staging/lighting | ✅ | Key + cyan/magenta rims + hemisphere fill + contact shadow; framed stage glow |
| Carousel preserved | ✅ | Untouched; host is a separate fixed stage (pointer-events: none) |
| Checkout preserved | ✅ | Unchanged; compact orb retained there |
| One-screen / non-scroll | ✅ | Host staged in the existing bottom-left dock; no layout rebuild |

## Re-verification after staging/framing/hostess swap (2026-05-20)
- `npx next build` ✅ (page still prerenders; WebGL is ssr:false)
- `npm run lint` ✅ 0 errors (9 warnings), exit 0
- `GET /` → 200; `GET /avatar/hostess.glb` → 200, 4,697,736 bytes, `model/gltf-binary`
- Hostess GLB parsed: 1 clip ("Action.004"), no morphs, skinned → first-clip
  fallback used (no T-pose); mouth via jaw bone / head-bob, gated to AI speaking.
- Host now staged full-height on the RIGHT, auto-framed via `<Bounds>`; fades when
  the games panel opens.

## Manual QA checklist (run `npm run dev`, then click once to allow mic/audio)
- [ ] Click "Talk to Loto": host waves (greeting) and the AI speaks first.
- [ ] While the AI speaks: head/mouth motion is active and tracks the voice.
- [ ] When you speak / AI is silent: host is attentive (listening), no mouth motion.
- [ ] Ask to see games: host turns toward the panel (guiding).
- [ ] Confirm a play / trigger jackpot: host celebrates (Dance).
- [ ] Carousel rotation and checkout flow still work; page does not scroll.
