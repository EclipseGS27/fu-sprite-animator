# Development roadmap

Each phase ends with a deliverable that is tested before the next phase starts. Status of every
feature lives in [DEVELOPMENT_STATUS.md](../DEVELOPMENT_STATUS.md).

## Phase 1 — Research and architecture ✅
Reference repositories, licenses, Foundry v13 constraints, existing modules, architecture, risks.
**Deliverable**: PROJECT_KNOWLEDGE.md, ARCHITECTURE.md, this roadmap, LICENSES_AND_DEPENDENCIES.md.

## Phase 2 — Functional prototype (built; awaiting the in-Foundry checklist)
**Definition of the first working prototype** — a GM can, inside Foundry:
1. Open the Sprite Animation Studio and import a PNG/WebP (the file is kept exactly as uploaded).
2. Place a humanoid skeleton fitted to the sprite, then move joints, change lengths, rename, add,
   delete and reparent bones, with undo/redo.
3. Assign pixels to bones automatically, correct them with a brush, choose rigid or mesh parts.
4. Switch to Pose mode and drag limbs: the original art moves, overlaps are backfilled.
5. Preview built-in clips — idle breathing, combat stance, sword slash, heavy slash, magic cast,
   light hit, heavy hit — with play/pause/scrub/loop/speed/intensity.
6. Save the rig, reopen it after a reload, export/import it as a file.
7. Assign the rig to an actor; its tokens idle on the canvas; `SpriteAnimator.play(actor, 'sword-slash')`
   plays the attack on the token.
8. Pixel art stays pixel-exact: the rest pose renders bit-identical to the source.

**Exit criteria**: unit tests and headless PixiJS 7 render tests pass for the test sprites; the in-Foundry
self-test passes on the GM's Foundry v13 world (we cannot run Foundry in CI).

## Phase 3 — Automatic rigging ✅ (see DEVELOPMENT_STATUS for what was measured)
- Silhouette analysis: row/column width profiles, distance transform, skeletonization (medial
  axis) to find head, neck, shoulders, hips, extremities; weapon detection (long thin component).
- Template fitting to those landmarks; confidence per bone; proposals shown for approval.
- Better ownership: joint-aware Voronoi + colour/edge cues; hidden-region clone tool; fill brush.
- Web Worker for analysis of large images.
- **Deliverable**: one-click rig proposal with manual correction, never auto-committed.

## Phase 4 — Animation editor ✅ (Spine export and a curve editor deferred)
- Keyframe editing on the timeline (per role/bone, rotate/translate/scale), easing picker, curve view.
- Clip library management (duplicate built-in → world clip), variations, per-phase timing editor.
- Two-bone IK for posing; onion skin; draw-order keys (a raised arm passes behind the head).
- Export/import clips; Spine 4.2 JSON export for interop with Rigby2D/other tools.
- **Deliverable**: a usable animation authoring environment.

## Phase 5 — Fabula Ultima integration ✅ (built and mock-tested; in-Foundry run pending)
- The rest of the preset library (30 clips) with rest keys and draw-order keys.
- Ability→clip mapping (world rules and per-ability entries, per-actor and per-item overrides,
  template-specific keys, fallbacks for rigs that lack roles) built on Project FU data and
  fu-animations' `api.resolve()` — see ABILITY_MAPPING.md.
- Combat triggers from chat cards: attacker clip, target hit/miss/crit/guarding reactions, held
  defeat at 0 HP; timing estimated to land with fu-animations' hits.
- Still open: a `fu-animations.contact` hook (one line in fu-animations, proposed, not made unasked)
  to replace the timing estimate.
- **Deliverable**: abilities trigger the right animation automatically.

## Phase 6 — Creature support ✅ (built and tested on generated creatures; in-Foundry run pending)
- Templates: quadruped, winged, serpentine, blob, floating; shared role vocabulary.
- Beast landmarks (legs, belly, snout, tail, wing tips, facing) for quadrupeds and winged creatures.
- 26 creature and any-rig clips; template-specific mapping defaults; root-only fallbacks so any
  rig plays something; template-appropriate idles and Studio previews.
- Not done: multi-limb bosses beyond these plans (use Custom and add bones), serpent landmarks.
- **Deliverable**: wolves, dragons, slimes and bosses rig and animate.

## Phase 7 — Testing and polish
- Matrix: resolutions, pixel vs illustrated, proportions, unusual anatomy, 20+ simultaneous tokens,
  reloads, resource disposal (texture counts), storage, compatibility with fu-animations, Battle UI,
  Enhanced Interface, Automated Animations.
- RotSprite-style rotation option for pixel art; performance profiling; accessibility.
- **Deliverable**: release-ready module.
