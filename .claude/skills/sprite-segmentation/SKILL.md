---
name: sprite-segmentation
description: Use when working on automatic rigging or sprite analysis in fu-sprite-animator (src/sprite, src/rig/templates.ts, createRig, assignPixels) — body-part detection, joint proposals, ownership maps, hidden-region fill, or improving auto-assignment accuracy.
---

# Sprite segmentation and auto-rigging

## Hard rules
- **Never alter visible artwork.** Parts are exact pixel cuts (ownership map: 1 byte per pixel, label → part). Fill pixels only go under *fully opaque* pixels of parts drawn *above*, copied from the part's own pixels (palette-exact). The rest pose must stay bit-identical to the source.
- No paid or remote AI is required. Optional local models may *propose* ownership maps; the GM always confirms.
- Never assume humanoid: templates are data (`src/rig/templates.ts`); `custom` must always work.
- Never silently produce a broken rig: run `validateRig` and surface issues.

## Creatures (Phase 6)
- Templates: `quadruped`, `winged`, `serpentine`, `floating`, `blob` (+ `humanoid`, `custom`); shared roles (torso, neck, head, tail, tail.tip, leg.front|hind.near|far, wing.near|far, crest). Creatures are fitted to `mainBounds` (largest piece + big pieces; sparks ignored).
- `src/sprite/creatures.ts` `detectBeast` (quadruped/winged only): belly = first row from the bottom with a run ≥ 50 % of the width; legs = foot runs whose column stays ≥ 60 % solid up to the belly (a curled tail touching the ground fails this); near/far = more/fewer leg pixels; free skeleton ends → wings (highest, ≥ 25 % width apart), head (thickest end, also gives facing), tail (behind the hips, low ones first; with wings, only below the back). `beastFromLandmarks` places bones; missing pieces keep proportions.
- Score creatures with `test/tools/creatures.test.ts`; ground-truth names map to template roles in `test/unit/groundtruth.ts` (SPRITE_MERGE, coarse rig roles). Visual check: `SPRITES=wolf:quadruped,dragon:winged OWN=1 npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts`.
- Do not auto-pick the template: both detectors fire on the other's sprites. The GM chooses ("What is it?").

## Pipeline today (Phase 3)
1. Optional `detectBackground` / `removeBackground` (import step, writes a transparent copy).
2. `detectHumanoid` (src/sprite/landmarks.ts) on the **main body** (components ≥ 15 % of the largest):
   weapon = longest straight stretch from a free skeleton tip that is far from the thick core and
   not standing on the ground; facing = side of the body the weapon is on; neck = narrowest row
   below the first widest row (hat brim/hair/head), else the biggest widening (narrow head on
   broad shoulders); legs = longest span of rows with two runs under the torso; hands = furthest
   protrusions (sanity-checked) or the weapon hilt.
3. `humanoidFromLandmarks` places the humanoid template's bones; `fitTemplate` (proportions)
   is the fallback and the "Use proportions instead" option.
4. `geodesicAssign` (edge weight 8): Dijkstra from each bone's segment core through opaque
   pixels, step cost × (1 + λ·colour difference); then `cleanIslands` and `adoptStrays`
   (floating pieces go to the nearest part across empty space).
5. `computeFills` (+ GM hints from the Hidden tool), `buildAtlas`, `buildPartGeometry`.

## Measuring (do this before and after any change)
- Ground truth: `test/sprites/<name>.parts.png` + `.parts.json` from `tools/gen_test_sprites.py`
  (unknown roles such as floating effects are not scored).
- `assignmentAccuracy` / `labelsAccuracy` / `oracleSegments` in `test/unit/groundtruth.ts`.
  Phase 3 numbers: warrior 82, mage 57, greatsword 84, knight 77, tiny 74, illustrated 75,
  swordsman_white 62, mage_front 46, golem 42 (mean 66.6 vs 56.3 proportions-only). Floors in
  `test/unit/rig.test.ts`; never lower them silently.
- Visual review: `SPRITES=swordsman_white,golem npm run film`-style tool:
  `OUT=… SPRITES=… npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts`.
- The fixtures imitate the user's examples (front view, white background, floating effects,
  heavy weapons, creatures). Test on the user's real sprites when they are in the repo.

## Next directions
- Landmarks from the silhouette: row/column width profiles (neck = narrowest row under the head blob), distance transform + skeletonization (medial axis) for limb axes and extremities, long thin components for weapons.
- Colour/edge cues to separate a sleeve from the torso (pixels connected by similar colour to a limb's seed region).
- A Web Worker only if real sprites above ~1000 px make import slow (576×480 takes 300 ms).
- Cape/scarf detection (thin attached flaps at shoulder height) so they are not taken for arms.
- A clone-from-source hidden-region tool if hints + automatic fill are not enough.
