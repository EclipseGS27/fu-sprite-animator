---
name: skeletal-animation-runtime
description: Use when changing the 2D skeletal runtime of fu-sprite-animator (src/core: math, skeleton, clip sampling, easing, AnimationPlayer, skinning) — adding transforms, constraints/IK, blending modes, events, or debugging poses that look wrong.
---

# Skeletal runtime (src/core)

## Conventions (never change silently — documents depend on them)
- Sprite pixels, **+y down**, angles in degrees, **positive = clockwise on screen**. Bone length lies along local +x.
- Local transform = `T(x,y) · R(rot) · S(sx,sy)`; world = parent world · local. `inheritRotation: false` keeps translation only.
- `Skeleton.skin[i] = world[i] · setupWorld[i]⁻¹` maps setup-pose vertices to the current pose.
- `Skeleton.setupAngle` / clip `angles` are **continuous** world angles (sums of local rotations) — use them, not `atan2`, wherever an angle must not jump at ±180°.
- Pose deltas: `STRIDE = 5` per bone: `[rot°, x px, y px, sx−1, sy−1]`.

## Clips (see docs/ANIMATION_FORMAT.md)
- Tracks are keyed by **role**; values are offsets from the setup pose; translations are fractions of `metrics.bodyHeight`.
- `space: 'world'` rotation keys give absolute screen angles (authored facing right; mirrored `θ → 180 − θ` for left-facing rigs). The first key picks the turn count (`wrapDeg`), later keys stay continuous — keep key values monotonic in the direction you want the limb to sweep.
- `TimeWarp` maps play time → clip time with per-phase multipliers.

## Player rules
- Track 0 = base loop; higher tracks override (or add, if `additive`) only the bones they animate.
- Crossfades blend from a snapshot of the outgoing pose; **rotation blending uses `nearestTurn`** (short way round). If you add a blend path, keep that.
- Events fire once when the play head crosses them (also across loop wraps); `onComplete` once.

## Workflow when changing the runtime
1. Write/adjust unit tests in `test/unit/core.test.ts` first (math, sampling, blending, events).
2. `npm test` and `npm run typecheck`.
3. Render filmstrips to eyeball motion: `SPRITE=warrior CLIP=sword-slash GT=1 npm run film` → `test/render/out/film_*.png` (GT=1 uses ground-truth parts).
4. `npm run test:render` to confirm GPU output still matches the CPU reference.
5. Never trade the rest-pose identity (rest render == source image) for a feature.
