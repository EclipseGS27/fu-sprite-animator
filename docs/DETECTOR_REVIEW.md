# Automatic rigging: first improvement pass

This pass addresses reproducible failures in the owner's uploaded Cloud and Barret
sprites. It does not replace silhouette analysis with an anatomy model.

The before/after overlays and the owner's uploaded images were reviewed locally and
are not distributed in this repository.

## Changes

- Track paired foot silhouettes upward, allowing legs to spread beyond the torso's
  column. Use the existing fallback for short, merged or implausibly positioned tracks.
- Accept a sufficiently long broad blade even when its thickness resembles the body
  core. Reject short, thick second-pass candidates such as Barret's arm, and reject
  curved prefixes that stray too far from the proposed weapon axis.
- For broad blades, fit an axis to the blade pixels and find the grip before the
  silhouette widens into the body. Smooth cross-section widths so blade holes do not
  become the hilt. A nearby low grip can suggest a second hand; the report explicitly
  marks this as uncertain. This does not add a two-hand animation constraint.
- Recognise opaque slate-blue floor shadows with stricter width/aspect checks than
  the existing black-shadow test. Keep these pixels on the root part. Remove detached
  shadow fringes from the landmark mask without deleting any source pixels.
- Lower arm confidence when a hand falls back to proportions.

## Validation

`npm run typecheck`, all 159 unit tests (including 16 opt-in private-corpus tests),
and `npm run build` passed locally. Without the private corpus, CI runs the existing
143 tests and skips those 16.
Existing labelled accuracy floors were not lowered. The eleven newly uploaded PNGs
all retain every visible pixel and have a bit-identical CPU-rendered rest pose.

The new regression tests check Cloud's blade/grip against broad visually identified
regions, both boot positions, root ownership of the blue shadow, Barret's false weapon,
and Cloud reflected horizontally. These location checks are not an overall accuracy
percentage for the eleven sprites.

Browser rendering/editor/integration checks could not launch locally because Chromium
was unavailable. They remain in the repository's CI workflow. This has not been tested
in a real Foundry world.

To reproduce overlays with the existing visual-review tool after providing the local
files described in `test/sprites/review/README.md`:

```sh
SPRITES=review/cloud,review/barret,review/tifa,review/aerith npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts
SPRITES=review/hero_sword,review/hero_mage,review/hero_ranger,review/golem npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts
SPRITES=review/wolf:quadruped,review/dragon:winged,review/wraith:floating npx vitest run -c vitest.tools.config.ts test/tools/landmarks.test.ts
```

## Remaining limits

Scarves and ribbons can still be mistaken for arms. Raised fists, armour and hair can
confuse the head/neck estimate. The mage's decorated staff, Aerith's complete staff,
hidden legs under robes, and overlapping creature limbs still need manual checking.
The creature detector itself is unchanged. Users still select the creature template.

Only fresh automatic proposals use this logic. Existing saved rigs keep their manual
edits until the user explicitly requests another proposal in the Studio.
