# Development status

Statuses: **Not Started**, **In Progress**, **Implemented** (code exists, not yet verified by a
test), **Tested** (an automated or recorded manual test passed — the "Evidence" column says
which), **Blocked**.

Last updated: 2026-11-01 (Phase 3). Environment for automated tests: Node 22, Chromium (SwiftShader
WebGL), PixiJS 7.4.3. **No Foundry VTT instance was available**: every Foundry-dependent feature
below is at most *Implemented* (exercised only against a Foundry mock) until the checklist in
docs/TESTING.md is run in a real Foundry v13 world.

## Phase 1 — Research and architecture
| Feature | Status | Evidence |
| --- | --- | --- |
| Reference repositories studied (6), licenses reviewed | Tested | docs/PROJECT_KNOWLEDGE.md (source read, licenses checked) |
| Architecture, roadmap, risks | Tested | docs/ARCHITECTURE.md, docs/DEVELOPMENT_ROADMAP.md |
| Existing ecosystem inspected (fu-animations, fu-character-creator) | Tested | PROJECT_KNOWLEDGE §2, FOUNDRY_INTEGRATION coexistence table |

## Phase 2 — Functional prototype
| Feature | Status | Evidence |
| --- | --- | --- |
| Skeletal runtime: hierarchy, TRS, world/skin matrices | Tested | unit: core.test.ts |
| Keyframes, easing (named + Bézier), looping, speed | Tested | unit |
| World-angle keys (rest-pose independent strikes), mirroring for left-facing rigs | Tested | unit: core + presets |
| Phase retiming (anticipation/action/recovery) | Tested | unit: TimeWarp |
| Layered tracks, crossfades (short-way rotation), events, completion | Tested | unit: player |
| Variations (seeded) and intensity | Tested | unit |
| Mesh deformation (grid, weights, joint softness, stiffness) | Tested | unit + GPU strips; visual review of filmstrips |
| Pixel-art preservation (rest pose bit-identical, no new colours, snapping) | Tested | unit (CPU, 8 sprites) + GPU (7 pixel sprites exact) |
| Smooth mode for illustrations | Tested | GPU: opaque exact, edge drift ≤ 8/255 |
| Hidden-region fill | Tested | unit: fill rules, palette-exact, no hole when the arm lifts |
| Sprite import (PNG/WebP), original never modified | Tested (PNG) | e2e with PNG; WebP uses the same browser decode path — not separately tested |
| Humanoid template fitting, automatic pixel assignment | Tested | unit: accuracy floors (58–76 % vs ground truth; GM correction expected) |
| Manual rigging: move joint/tip/subtree, add, delete, rename, reparent, roles | Tested | unit + e2e |
| Region painting (brush, bucket, to-parent) | Tested (brush) | e2e brush + undo; bucket and right-click covered by unit functions only |
| Undo/redo (drag = one step) | Tested | unit + e2e |
| Rig validation ("never silently broken") | Tested | unit |
| Studio UI (Rig/Paint/Pose/Animate, inspector, library, transport, timeline) | Tested (test page) | e2e + screenshots; **not yet opened inside Foundry** |
| Clips: idle breathing, combat stance, sword slash, heavy slash, magic cast, light hit, heavy hit | Tested | unit (finite on all rigs), filmstrip review, GPU strips |
| Save / open / export / import | Tested (test page) | e2e; Foundry file storage only in mock |
| Foundry: Studio window, scene control, actor header/directory entries | Implemented | mock integration test |
| Foundry: world storage (rig files + index) | Implemented | mock integration test |
| Foundry: token animation (texture swap, size kept, idle fps, cap, cleanup) | Implemented | mock integration test + GPU trimmed-texture test with PIXI.Sprite; needs selfTest in Foundry (PrimarySpriteMesh) |
| Public API, socket broadcast, event hooks | Implemented | mock integration test |
| In-Foundry self-test | Implemented | passes in mock; awaits a Foundry run |
| Performance: 25 animated views | Tested (headless) | 1.65 ms/frame on software GL; real GPU in Foundry not measured |
| Testing inside Foundry VTT | Blocked | no Foundry license/instance in the build environment — GM to run docs/TESTING.md checklist |

## Phase 3 — Automatic rigging
| Feature | Status | Evidence |
| --- | --- | --- |
| Silhouette analysis: distance transform, Zhang–Suen skeleton, branch tracing (crossing number) | Tested | unit: phase3.test.ts |
| Weapon detection (thin or thick, any angle; legs and hands rejected) and facing from the weapon side | Tested | unit: 5 sprites incl. front-view swordsman on white; golem has none |
| Landmarks: head/neck (dip under a wide head or widening into broad shoulders), legs, feet, hands, shoulders; main body only | Tested | unit: anatomical order on 6 sprites; visual review sheet (`test/tools/landmarks.test.ts`) |
| Edge-aware geodesic pixel assignment | Tested | unit; with correct bones 88.6 % vs 83.3 % nearest-bone |
| Floating pieces adopted by the nearest part (no lost pixels) | Tested | unit on mage_front, ghost, dragon, swordsman |
| Full auto-rig accuracy | Tested | 9 humanoid fixtures: 66.6 % mean vs 56.3 % with proportions only; floors per sprite enforced |
| Background detection and removal on import (transparent copy; original untouched) | Tested | unit (art pixels unchanged) + e2e |
| Proposal banner (keep / proportions / discard), re-run button | Tested (test page) | e2e |
| Hidden-region hints ("Hidden" paint tool) | Tested | unit (rest pose still identical) + e2e |
| Web Worker for analysis | Not Started (not needed) | measured: 300 ms auto-rig for 576×480, 47 ms for 96 px; runs once per import |
| Clone-from-source hidden-region tool | Not Started | the hint brush + automatic fill cover the need so far |

## Later phases
| Feature | Status |
| --- | --- |
| Phase 4: keyframe editing, clip library management, IK, onion skin, Spine JSON export | Not Started |
| Phase 5: ability → clip mapping database, combat triggers from Project FU chat cards, fu-animations sync | Not Started (design in .claude/skills/fu-ability-mapping) |
| Phase 5: presets — movement, defence (block, dodge, parry, counter, guard), remaining attacks and magic, defeat | Not Started |
| Phase 6: quadruped, winged, serpentine, blob templates and creature clips | Not Started (custom rigs work today) |
| Phase 7: compatibility matrix, RotSprite option, profiling, release | Not Started |

## Known limitations (Phase 2)
- Automatic rigging is a starting point (42–84 % of pixels right on the fixtures; front-view
  robes and golems are hardest); expect to drag a few joints, press the wand and paint
  corrections. Capes and scarves at shoulder height can be taken for an arm.
- Tested on generated fixtures that imitate the user's example sprites (front view, white
  background, floating effects, heavy weapons, creatures); not yet on the user's own files.
- Animated tokens' hit-testing uses the still image's shape.
- fu-animations' element outlines fall back to a capsule shape on animated tokens.
- A token whose image differs in shape from the rig's sprite is not animated.
- On big-headed (chibi) sprites the raised front hand overlaps the face for a few frames of the
  slash wind-up: parts keep one draw order. Draw-order keys (the arm passing behind the head) are
  planned with the Phase 4 keyframe editor.
- The heavy slash raises both arms; shield bearers will want a one-handed variant (Phase 5).
- Bucket fill and right-click-to-parent are covered by unit tests of the underlying functions,
  not by the UI test.
