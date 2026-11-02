---
name: animation-presets
description: Use when creating or tuning animation clips for fu-sprite-animator (src/presets, world clips, clips registered by other modules) — idle loops, attacks, spells, defence, reactions, creature moves, timing and variations.
---

# Authoring animation presets

## Format reminders (docs/ANIMATION_FORMAT.md)
- Key tracks by **role** (`torso`, `arm.upper.front`, `weapon`, …), never bone names.
- Author for a character **facing right**. Offsets: + leans the torso forward and swings a hanging arm/leg backward.
- Use `space: 'world'` for limbs that must reach a screen direction whatever the rest pose (arms and blade in strikes): 0 forward, 90 down, 180 back, 270/−90 up. Keep values continuous in the sweep direction (e.g. blade −200 → 42 sweeps up and over the head).
- Start and end world tracks on **rest keys** (`R(t, typical)` in library.ts → `{ t, v, rest: true }`): the bone holds the sprite's own drawn angle there, so the clip begins and ends exactly on the art.
- When the weapon arm goes overhead or past the face, set `overHead: [t0, t1]` (library.ts) — the whole front chain (upper/lower arm, hand, weapon) draws behind the head in that span. When the forearm turns a lot (casting, blocking, running), give `weapon` its own world track (or a counter-rotating offset in loops) so a held staff or blade stays clear of the face.
- Translations in body heights; keep in place (≤ ~0.08): fu-animations moves the token for dashes.
- Every one-shot needs `phases` (anticipation/action/impact/recovery) and events: `windup`, `release`, `contact`, `recover`, `end`. Set `requires` to the roles it needs.

## Motion rules
- Anticipation → fast action (`[0.55, 0, 0.9, 0.35]`) → small overshoot (`outBack`) → recovery (`inOutQuad`). Offset secondary parts (head follows torso ~0.04–0.1 s later).
- Prefer fidelity over exaggeration: modest angles, no limbs crossing the face during wind-ups (the slash cocks the elbow behind the shoulder for this reason).
- Shield bearers and two-handed moves: avoid moving `arm.upper.back` overhead when an `offhand` exists; per-actor mapping choices pick variants.
- Events at `t: 0` fire on the first frame (reactions put `contact` there).
- End one-shots near a neutral pose; the player fades back to the idle loop.

## Workflow
1. Add the clip to `src/presets/*.ts` (or register a world clip with the same shape).
2. `SPRITE=warrior CLIP=<id> GT=1 N=12 npm run film`, open `test/render/out/film_warrior_<id>_gt.png`, look at every frame. Try `SPRITE=knight`, `mage`, `tiny`, and a left-facing rig. Several clips at once: `OUT=<dir>/ CLIPS=a,b,c N=8 S=2 SPRITE=mage npx vitest run -c vitest.tools.config.ts test/tools/sheet.test.ts` (one row per clip). Check especially: blade or staff across the face, arms through the head, feet sliding.
3. If it should be chosen automatically, add it to `DEFAULT_RULES` / `CLIP_FALLBACKS` in `src/mapping/index.ts` (mapping.test.ts checks every entry is a real clip).
4. `npm test` (presets tests check key order, finiteness on every test rig, mirroring).
5. `npm run test:render` for GPU strips of the main attacks.
