# Automatic rigging: shared analysis and body-plan fitting

Automatic proposals now use a shared analysis stage and explicit body-plan fitters.
No detector reads a sprite filename or recognises a particular character. The uploaded
images are an optional private regression corpus, not a lookup table.

## Pipeline

| Stage | Behaviour |
| --- | --- |
| Analysis view | Crop transparent margins; add a clear border; bound the working image to 512 pixels plus border; preserve thin features when reducing the analysis copy. Rendering uses the untouched source. |
| Foreground | Relative alpha threshold supports translucent sprites as well as opaque pixel art. |
| Humanoid fitting | Find a head/torso bottleneck when present, evaluate arm branches by their attachment and thickness, follow connected limb paths for wrists/elbows, and track paired feet beyond a fixed torso column. |
| Beast fitting | Quadrupeds and winged creatures use the same bounded, transparency-aware analysis before their body, head, legs, wings and tail fitter. |
| Other body plans | Floating, blob and custom plans fit thickness-weighted body centres. Serpents follow a connected silhouette path and propose the thicker end as the head. Missing or ambiguous evidence falls back to proportions. |
| Assignment | Undetected weapons do not seed the ownership map, including after save/load and another wand operation. Manual painting remains available, and the Inspector can enable automatic assignment for that part. |
| Review | Groups whose bones mostly miss the silhouette have their strength reduced. The UI describes geometric support rather than presenting an accuracy probability. |

The earlier broad-blade, grip and floor-shadow improvements remain. A possible shared
grip is an uncertain proposal, not a two-hand animation constraint. Creature type is
still chosen explicitly; the detector does not silently change the selected body plan.

## Generalization checks

`test/unit/detector-generalization.test.ts` is public and needs no uploaded images.
It covers 32 independently drawn bent-arm poses, eight curved/tapered serpents,
mirroring, arbitrary margins, translucent copies, 1x/2x/4x resolution, bounded working
images, non-legged plans, and assignment behaviour after save/load/manual painting.
The generator records its joints before detection runs.

On the 32 capsule figures (64 elbows, 256-pixel canvases), mean Euclidean elbow error:

| Detector | Mean error |
| --- | ---: |
| Earlier PR commit `ce25b50` | 26.20 px |
| Shared analysis and limb fitting | 16.76 px |

This is a synthetic geometry benchmark, **not** an accuracy estimate for arbitrary
illustrations. It tests articulated silhouettes and does not model every artistic
style or occlusion. Existing labelled pixel-assignment accuracy floors were preserved.

Local validation: typecheck, 187 unit tests and the rebuilt Foundry bundle passed.
With no private corpus installed, CI runs 171 tests and skips the 16 optional ones.
The private corpus additionally verifies preservation and exact CPU rest poses for
all eleven uploaded PNGs. Those images and their overlays are not published.

Browser rendering/editor/mock-integration checks cannot launch in this local
container because Chromium is unavailable. The existing GitHub Actions workflow runs
them separately. No real Foundry-world test has been performed.

```sh
npm run typecheck
npm test
npm run build
npx vitest run test/unit/detector-generalization.test.ts
```

For optional private-image overlays, put local copies in the locations described in
`test/sprites/review/README.md`, then use the existing visual-review tool:

```sh
SPRITES=review/cloud,review/barret,review/tifa,review/aerith npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts
SPRITES=review/wolf:quadruped,review/dragon:winged,review/wraith:floating npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts
```

## Limits

This remains geometric analysis, not a learned visual anatomy model. Overlapping or
hidden limbs, elaborate clothing, horns, decorated staffs and effects connected to
the body can remain ambiguous. Near/far identity and facing can also need correction.
A low-support group is a reason to inspect the proposal; a high-support group is not
proof of anatomical correctness. Every proposal can be edited or discarded.

Only new automatic proposals use these changes. Existing saved skeletons keep their
manual edits. The optional `parts[].autoAssign` flag defaults to true for older files.
