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

## Pipeline today (Phase 2)
1. `bodyBounds` (rows whose longest run ≥ 25% of the widest; 10th/90th percentile edges) — ignores thin weapons.
2. `fitTemplate` maps normalized template joints into those bounds (mirrored for left-facing).
3. `autoAssign`: nearest bone segment (minus per-part `reach` × body height), then `cleanIslands`.
4. `computeFills`: BFS from each part into eligible covered pixels within its convex hull and `0.15 × bodyHeight`.
5. `buildAtlas` packs own + fill pixels; `buildPartGeometry` grids them.

## Measuring (do this before and after any change)
- Ground truth: `test/sprites/<name>.parts.png` + `.parts.json` from `tools/gen_test_sprites.py`.
- `assignmentAccuracy(name, rig, image)` in `test/unit/groundtruth.ts`. Baseline (Phase 2): warrior 75.7%, mage 58.4%, greatsword 69.4%, knight 68.6%, tiny 72.1%, illustrated 74.2%. Floors are enforced in `test/unit/rig.test.ts` — raise them when you improve, never lower them silently.
- Don't overfit the template to the generator's sprites: change one thing, measure all six.

## Phase 3 directions
- Landmarks from the silhouette: row/column width profiles (neck = narrowest row under the head blob), distance transform + skeletonization (medial axis) for limb axes and extremities, long thin components for weapons.
- Colour/edge cues to separate a sleeve from the torso (pixels connected by similar colour to a limb's seed region).
- Run analysis in a Web Worker for large images (functions are pure and take typed arrays).
- Hidden-region clone tool (GM picks a source rectangle) and a fill brush.
