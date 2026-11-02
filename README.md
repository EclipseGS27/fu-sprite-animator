# Fabula Ultima Sprite Animator

2D skeletal animation for character sprites in Foundry VTT v13 (Project FU system). Rig any PNG
or WebP sprite in the **Fabula Ultima — Sprite Animation Studio**, preview reusable animations,
and let actors' tokens play them on the map. Pixel art stays pixel-exact: the original artwork is
never resized, recoloured or repainted.

![The Studio animating a sword slash](docs/studio.png)

**Status: Phases 2–7 built** (prototype, automatic rigging, animation editor, Fabula Ultima
combat integration, creatures, automated testing and polish). Tested in Node and headless Chromium (WebGL, PixiJS 7.4.3) and against a
Foundry mock; **not yet run in a real Foundry world** — see
[DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) and the checklist in [docs/TESTING.md](docs/TESTING.md).

## Install
Add-on Modules → Install Module → Manifest URL:
`https://raw.githubusercontent.com/EclipseGS27/fu-sprite-animator/main/module.json`

Requires Foundry v13 and Project FU 4.14+. Works alongside
[Fabula Ultima Battle Animations](https://github.com/EclipseGS27/fu-animations).

## Quick start
1. Token controls → running-figure button (GM) opens the Studio.
2. **Choose sprite**. The Studio finds the head, legs, hands and weapon and proposes a skeleton
   (keep it, or start from plain proportions). Solid backgrounds are made transparent on a copy.
3. **Rig** (1): drag joints onto shoulders, elbows, hips, knees; the weapon bone along the blade.
4. Press the **wand** to reassign pixels, then **Paint** (2) to fix regions.
5. **Pose** (3): drag limbs to check. **Animate** (4): try the animations; **Edit keys** to make
   your own.
6. **Save**, then **Use this rig for an actor**. Its tokens idle on the map, and attacks, spells,
   skills and items used from the character sheet play the matching animation; targets flinch,
   block or dodge; characters at 0 HP fall.

Full walkthrough: [docs/RIGGING_GUIDE.md](docs/RIGGING_GUIDE.md) · which animation plays when:
[docs/ABILITY_MAPPING.md](docs/ABILITY_MAPPING.md).

## What's in it
- **Studio**: automatic rig proposal; Rig, Paint, Pose and Animate modes; bone tree; inspector;
  rig check; undo/redo; save, open, export and import.
- **Animation editor**: pose a bone to key it, key rows on the timeline, easing, two-bone IK,
  onion skin, draw-order keys, events and phases; your own clips are saved in the world.
- **63 built-in animations**: idles (breathing, combat stance, magical, heavy weapon), movement
  (walk, run, jump, dash, teleport), attacks (sword, heavy, thrust, spear, dual-wield, bow, staff,
  unarmed, firearm, throw), magic (cast, channel, charge, projectile, area, healing, summoning),
  defence (block, dodge, parry, counterattack, guard), reactions (light and heavy hit, stagger,
  knockback, knockdown, defeat); creatures (bite, claw, pounce, tail swipe, roar, breath, wing
  beat, hover, crouch, beast hit and defeat, blob attack/hit/melt, spirit float and defeat); and
  root-only moves that work on any rig.
- **Creatures**: four-legged beasts, winged creatures, serpents, floating spirits and blobs, with
  their own skeletons, automatic landmarks for beasts and dragons, and their own animations in
  combat.
- **Fabula Ultima**: chat cards trigger the attacker's animation and the targets' reactions,
  chosen from Project FU data (weapon category, offensive/healing/area spells, skills, Zero
  Powers, Guard…) through an editable table — world, per character, per item.
- **Runtime**: world-angle strikes that work with any rest pose, layered tracks, crossfades,
  events, bending meshes, hidden-region fill, pixel snapping.
- **Tokens**: animated in place through their texture only, so dashes, flashes and condition
  tints from other modules (fu-animations) keep working. Public API and socket sync.

Still to do: the in-Foundry checklist (docs/TESTING.md) with fu-animations and the other UI
modules, real-GPU measurements, and a license choice before public release. See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md).

## Documentation
[Project knowledge and research](docs/PROJECT_KNOWLEDGE.md) ·
[Architecture](docs/ARCHITECTURE.md) ·
[Animation format](docs/ANIMATION_FORMAT.md) ·
[Rigging guide](docs/RIGGING_GUIDE.md) ·
[Foundry integration](docs/FOUNDRY_INTEGRATION.md) ·
[Abilities → animations](docs/ABILITY_MAPPING.md) ·
[API](docs/API.md) ·
[Testing](docs/TESTING.md) ·
[Troubleshooting](docs/TROUBLESHOOTING.md) ·
[Roadmap](docs/DEVELOPMENT_ROADMAP.md) ·
[Changelog](CHANGELOG.md) ·
[Licenses and dependencies](docs/LICENSES_AND_DEPENDENCIES.md)

## Development
```bash
npm install
npm run check          # typecheck, unit tests, build, GPU render tests, Studio UI test, mock integration
npm run build          # src/ → dist/fu-sprite-animator.mjs (commit dist/: installs use the main branch zip)
SPRITE=warrior CLIP=sword-slash GT=1 npm run film   # filmstrip → test/render/out/
```
The module ships no third-party code; it uses Foundry's own PixiJS. A license for public release
has not been chosen yet.
