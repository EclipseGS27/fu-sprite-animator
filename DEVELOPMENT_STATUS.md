# Development status

Statuses: **Not Started**, **In Progress**, **Implemented** (code exists, not yet verified by a
test), **Tested** (an automated or recorded manual test passed — the "Evidence" column says
which), **Blocked**.

Last updated: 2026-11-02 (Phase 6). Environment for automated tests: Node 22, Chromium (SwiftShader
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

## Phase 4 — Animation editor
| Feature | Status | Evidence |
| --- | --- | --- |
| Keyframe editing: pose a bone to key it (turn/position), key rows on the timeline, select, retime, delete, easing per key | Tested (test page) | e2e: editor-e2e.mjs |
| Pose → key inverse of evaluation (relative and screen-angle keys, both facings) | Tested | unit: phase4.test.ts round trip |
| Clip properties (name, category, length, loop), events, phases | Tested | unit + e2e |
| Draw-order (layer) keys in clips, player, GPU and CPU renderers | Tested | unit (order + switching); slash wind-up now passes the arm behind the head (filmstrip reviewed) |
| Two-bone IK (Pose mode and key editing) | Tested | unit (reaches targets, keeps bend) + e2e |
| Onion skin (ghost frames) | Tested (test page) | e2e |
| Clip undo/redo while editing | Tested | e2e |
| World clip library: duplicate, delete (own only), import (never overrides), export; built-ins read-only | Tested (test page) | e2e; Foundry world setting only in mock |
| Spine 4.2 JSON export | Not Started | not needed so far; clips export as JSON in our format |
| Curve (graph) editor | Not Started | easing presets + Bézier values in files cover it for now |

## Phase 5 — Fabula Ultima integration
| Feature | Status | Evidence |
| --- | --- | --- |
| Presets: magical and heavy-weapon idles; walk, run, jump, dash, teleport; thrust, spear, dual-wield, bow, staff, unarmed, firearm, throw; channel, charge, projectile, area, healing, summoning; block, dodge, parry, counterattack, guard; stagger, knockback, knockdown, defeat (30 clips) | Tested | unit (finite poses on every test rig, both facings; keys inside duration); contact sheets reviewed on warrior, mage and greatsword (`test/tools/sheet.test.ts`) |
| Rest keys (world tracks start and end on the sprite's own drawn angle) | Tested | unit: zero offset at start and end for 4 rest angles × both facings |
| Events at t = 0 fire (was a bug: never fired) | Tested | unit |
| Reading Project FU items: weapons by category, shields, NPC attacks, spells (offensive, area, projectile, healing, summoning, support), skills by style and weapon in hand, heroics, Zero Powers, consumables, rituals, basic actions | Tested | unit: mapping.test.ts on objects shaped like Project FU 4.x data — **not yet on a real world's items** |
| Mapping: rule keys, resolution order item → actor → world ability → world rule → built-in, "none", template-specific keys, fallbacks when a rig lacks roles | Tested | unit |
| Reactions: hit, critical/heavy, hit while guarding, miss, defeat | Tested | unit + mock integration |
| Combat triggers from chat cards (author's client → socket → every client) | Implemented | mock integration: 9 card scenarios; needs the in-Foundry checklist (TESTING.md 11–13) |
| Defeat pose held at 0 HP, no reactions while down, back to idle when healed; tokens drawn while down start down | Implemented | mock integration (all four) |
| Timing with fu-animations (strike and reactions at its estimated hit) | Implemented | mock integration with a stand-in fu-animations (0.45 s); real timing unverified, estimates only — cut-ins make reactions early |
| World editor (*Sprite animations for abilities*), per-actor editor, item dialog (this item / every item with this name) | Implemented | mock integration (rows, saving, inheritance, header controls); screenshot reviewed; item dialog form itself not exercised (mock DialogV2) |
| API 0.2.0: current, resolveClip, describe, mapping, playAction, react | Implemented | mock integration |
| `fu-animations.contact` hook for exact timing | Not Started | proposal only; fu-animations not changed unasked |

## Phase 6 — Creature support
| Feature | Status | Evidence |
| --- | --- | --- |
| Templates: four-legged beast, winged, serpent, floating spirit, blob (+ humanoid, custom), shared roles | Tested | unit: structure, every template's idle and a clip per family playable; rest pose bit-identical on CPU and GPU for wolf, dragon, ghost, slime |
| Beast landmarks: legs (solid columns up to the belly), belly line, body thickness, snout, tail, wing tips, facing (thickest end = head) | Tested | unit: wolf, dragon, both mirrored (face left), legless sprites rejected |
| Creature auto-rig accuracy | Tested | unit floors: wolf 69.7 %, dragon 75.6 % (landmarks beat proportions by > 3 points), ghost 83.4 %, slime 97.2 % (proportions) |
| Serpent landmarks | Not Started | serpents use proportions; no serpent test sprite yet |
| Guessing the template automatically | Not Started | the detectors fire on humanoids too, so the GM picks it ("What is it?" on the proposal banner) |
| Creature clips: beast idle, bite, claw, pounce, tail swipe, roar, breath, crouch, beast dodge/hit/defeat, hover, wing beat, serpent idle, blob idle/attack/hit/defeat, float idle, spirit defeat | Tested | unit (finite on every template, both facings; keys in range; mirror test); contact sheets reviewed on wolf, dragon, ghost, slime; GPU matches CPU for bite, wing beat, blob attack, spirit defeat |
| Any-rig clips (root only): breathe, lunge, gather power, recoil, hop back, collapse | Tested | unit (custom rig plays one of each family); contact sheet (stays inside the frame) |
| Template-specific mapping defaults; root-only last resort | Tested | unit (wolf bites, dragon breathes, slime splats, spirit sinks; world choice still wins) + mock integration (wolf token idles, bites, flinches) |
| Studio: template menu, "What is it?" on the proposal banner, preview idle/action suited to the rig, library lists playable clips first | Tested (test page) | screenshots reviewed; mock integration; UI suites still pass |
| Assign dialog offers the rig's own idles; tokens fall back to the template's idle | Implemented | mock integration (token idle); dialog form not exercised |

## Later phases
| Feature | Status |
| --- | --- |
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
- The heavy slash raises both arms; shield bearers can be given Sword slash for heavy weapons in
  their *Sprite animation choices*.
- Reactions to fu-animations' hits are timed by estimate; cut-ins and boss scenes delay its
  hits, so reactions come early for those.
- Movement clips play in place (fu-animations moves the token); they are not triggered
  automatically by token movement yet.
- Creatures: near and far legs that overlap in a side view share one place; curled tails that
  touch a leg are placed by proportion; serpents, spirits and blobs are placed by proportion.
  Tested on generated creatures shaped like the user's examples, not on the user's files.
- Bucket fill and right-click-to-parent are covered by unit tests of the underlying functions,
  not by the UI test.
