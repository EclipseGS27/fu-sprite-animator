# Development roadmap

Each phase ends with a deliverable that is tested before the next phase starts. Status of every
feature lives in [DEVELOPMENT_STATUS.md](../DEVELOPMENT_STATUS.md).

## Phase 1 — Research and architecture ✅
Reference repositories, licenses, Foundry v13 constraints, existing modules, architecture, risks.
**Deliverable**: PROJECT_KNOWLEDGE.md, ARCHITECTURE.md, this roadmap, LICENSES_AND_DEPENDENCIES.md.

## Phase 2 — Functional prototype (current)
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

## Phase 3 — Automatic rigging
- Silhouette analysis: row/column width profiles, distance transform, skeletonization (medial
  axis) to find head, neck, shoulders, hips, extremities; weapon detection (long thin component).
- Template fitting to those landmarks; confidence per bone; proposals shown for approval.
- Better ownership: joint-aware Voronoi + colour/edge cues; hidden-region clone tool; fill brush.
- Web Worker for analysis of large images.
- **Deliverable**: one-click rig proposal with manual correction, never auto-committed.

## Phase 4 — Animation editor
- Keyframe editing on the timeline (per role/bone, rotate/translate/scale), easing picker, curve view.
- Clip library management (duplicate built-in → world clip), variations, per-phase timing editor.
- Two-bone IK for posing; onion skin.
- Export/import clips; Spine 4.2 JSON export for interop with Rigby2D/other tools.
- **Deliverable**: a usable animation authoring environment.

## Phase 5 — Fabula Ultima integration
- Actor profiles UI; ability→clip mapping database (world defaults, weapon categories, per-actor,
  per-item overrides) built on Project FU data and fu-animations' `api.resolve()`.
- Combat triggers from chat cards: attacker clip, target hit/miss/crit reactions, defeat.
- Optional `fu-animations.beat` hook (small PR to fu-animations) to land contact frames together.
- Public API documented and versioned.
- **Deliverable**: abilities trigger the right animation automatically.

## Phase 6 — Creature support
- Templates: quadruped, winged, serpentine, slime/blob (squash-stretch lattice), floating (ghost),
  multi-limb; role vocabularies per template; creature presets (bite, claw, tail swipe, wing beat).
- **Deliverable**: wolves, dragons, slimes and bosses rig and animate.

## Phase 7 — Testing and polish
- Matrix: resolutions, pixel vs illustrated, proportions, unusual anatomy, 20+ simultaneous tokens,
  reloads, resource disposal (texture counts), storage, compatibility with fu-animations, Battle UI,
  Enhanced Interface, Automated Animations.
- RotSprite-style rotation option for pixel art; performance profiling; accessibility.
- **Deliverable**: release-ready module.
