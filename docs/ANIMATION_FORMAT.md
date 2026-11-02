# Animation format

Three JSON documents: a **rig** (one per character sprite), **clips** (reusable animations,
independent of any rig or actor) and a **profile** (which rig an actor uses). Types live in
`src/core/types.ts`; keep this page in sync with them.

## Conventions
- Units are **sprite pixels** of the original image. Origin top-left, **+y points down**.
- Angles are **degrees**; **positive turns clockwise on screen**. 0° points right (+x), 90° down,
  180° left, 270° (or −90°) up.
- A bone's length lies along its local +x axis.
- Clips are authored for a character **facing right**. A rig that faces left mirrors them
  (offset rotations and x translations change sign; world angles θ become 180° − θ).

## Rig (`fusa-rig`, version 1)

```jsonc
{
  "format": "fusa-rig", "version": 1,
  "id": "rigk2…", "name": "Warrior",
  "template": "humanoid",            // humanoid | quadruped | winged | serpentine | floating | blob | custom
  "facing": "right",
  "image": { "src": "worlds/my-world/sprites/warrior.png", "width": 64, "height": 64 },
  "metrics": { "bodyHeight": 52, "bounds": { "x": 17, "y": 8, "width": 42, "height": 54 } },
  "bones": [
    { "id": "root", "name": "Root", "parent": null, "role": "root",
      "x": 29.5, "y": 62, "rotation": 0, "scaleX": 1, "scaleY": 1, "length": 2.8, "color": "#9aa4b8" },
    { "id": "torso", "name": "Torso", "parent": "pelvis", "role": "torso",
      "x": 3.6, "y": 0, "rotation": 0, "scaleX": 1, "scaleY": 1, "length": 12 }
    // … parent before child; x/y/rotation are relative to the parent
  ],
  "parts": [                           // draw order: first is furthest back
    { "id": "part_torso", "name": "Torso", "bone": "torso", "label": 11,
      "deform": "mesh",                // rigid | mesh
      "softness": 0.04,                // joint blend band, × body height (mesh)
      "stiffness": 0,                  // 0 = full skinning … 1 = rigid (mesh)
      "cell": 0,                       // grid cell px, 0 = automatic (body height / 12)
      "fill": true,                    // synthesise hidden pixels under higher parts
      "reach": 0.05 }                  // extra reach for automatic assignment, × body height
  ],
  "ownership": "AAEB…",                // pixel → part label map, RLE + base64 (see below)
  "render": { "mode": "pixel", "padding": 0.35, "snap": true, "idleFps": 12, "resolution": 1 },
  "roleScale": { "arm.upper.front": 0.8 },   // optional per-character amplitude tweaks
  "created": 1793563139392, "updated": 1793563139392, "revision": 3
}
```

- **Ownership map**: one byte per sprite pixel, row-major, value = part `label` (0 = nobody).
  Encoded as (value, run length as LEB128 varint) pairs, then base64 (`src/sprite/rle.ts`).
  Decoding must yield exactly `width × height` values or the rig is rejected.
- **Parts** are exact pixel cuts of the original image. Hidden-region fill pixels are *derived*
  at load time (not stored), so the original image is the single source of colour.
- **render.padding**: transparent room around the sprite in the output, as a fraction of
  `max(width, height)`, for weapons and limbs that swing past the edges.
- **render.idleFps**: idle loops step at this rate on tokens (pixel-art "on twos/threes");
  actions always run at display rate. 0 = every frame.

### Roles
**Humanoid**: `root`, `pelvis`, `torso`, `head`, `arm.upper.front`, `arm.lower.front`,
`hand.front`, `weapon`, `arm.upper.back`, `arm.lower.back`, `hand.back`, `leg.upper.front`,
`leg.lower.front`, `foot.front`, `leg.upper.back`, `leg.lower.back`, `foot.back`; extras: `neck`,
`hair`, `cape`, `tail`, `offhand`, `accessory`. "Front" means nearer the viewer — it does not
change when the character faces the other way.

**Creatures** share roles wherever the body part is the same thing, so one clip serves several
body plans:

| Template | Roles |
| --- | --- |
| quadruped (four-legged beast) | `root`, `torso` (the body, from hips to shoulders), `neck`, `head`, `tail`, `tail.tip`, `leg.hind.near`, `leg.hind.far`, `leg.front.near`, `leg.front.far` |
| winged | the quadruped roles + `wing.near`, `wing.far` (the neck has its own part) |
| serpentine | `root`, `torso`, `neck`, `head`, `tail`, `tail.tip` |
| floating (spirits) | `root`, `torso`, `head`, `arm.upper.front`, `arm.lower.front`, `arm.upper.back`, `arm.lower.back`, `tail`, `tail.tip` (the trailing lower body) |
| blob | `root`, `torso` (the soft body), `crest` (what sits on top) |
| custom | `root`, `torso`; add any roles |

"Near" is the side facing the viewer (drawn in front). For beasts, offsets turn clockwise: `torso`
+ dips the front, − rears up; legs + swing the foot back; `neck`/`head` + lower toward the
ground; back-pointing bones (`tail`, the near wing) + lift.

## Clip (`fusa-clip`, version 1)

```jsonc
{
  "format": "fusa-clip", "version": 1,
  "id": "sword-slash", "name": "Sword slash", "category": "attack",
  "duration": 0.9, "loop": false,
  "phases": { "anticipation": [0, 0.32], "action": [0.32, 0.44], "impact": 0.44, "recovery": [0.5, 0.9] },
  "events": [ { "t": 0, "name": "windup" }, { "t": 0.32, "name": "release" },
              { "t": 0.42, "name": "contact" }, { "t": 0.6, "name": "recover" }, { "t": 0.9, "name": "end" } ],
  "requires": ["arm.upper.front", "arm.lower.front", "weapon", "torso"],
  "templates": ["humanoid"],
  "tracks": {
    "torso": { "rotate": [ { "t": 0, "v": 0, "e": "outCubic" }, { "t": 0.3, "v": -11 }, { "t": 0.44, "v": 17, "e": "outBack" }, { "t": 0.9, "v": 0 } ] },
    "root":  { "translate": [ { "t": 0, "x": 0, "y": 0 }, { "t": 0.44, "x": 0.07, "y": 0 }, { "t": 0.9, "x": 0, "y": 0 } ] },
    "weapon": { "space": "world", "rotate": [ { "t": 0, "v": -60 }, { "t": 0.33, "v": -200, "e": [0.55, 0, 0.9, 0.35] }, { "t": 0.45, "v": 42 } ] }
  },
  "defaults": { "mixIn": 0.08, "mixOut": 0.25 }
}
```

- **Keys**: `t` seconds, `v` value (rotate) or `x`,`y` (translate, scale). `e` is the easing from
  this key to the next: `linear`, `step`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`,
  `outCubic`, `inOutCubic`, `inQuart`, `outQuart`, `inExpo`, `outExpo`, `inBack`, `outBack`,
  `inOutBack`, `outElastic`, `inOutSine`, or a cubic Bézier `[x1, y1, x2, y2]` (CSS style).
- **rotate**: `space: "offset"` (default) — degrees added to the bone's setup rotation.
  `space: "world"` — the absolute screen angle the bone should point at. The first key is taken the
  short way round from the setup pose; later keys continue numerically, so `-200 → 42` sweeps
  *up and over*, `160 → 42` would sweep *down and under*.
  A key with `"rest": true` holds the bone's **own drawn angle** instead of `v` (`v` stays as a
  typical value for tools). Built-in world tracks start and end on rest keys, so an attack
  begins and finishes exactly on the sprite's pose whatever angle its weapon was drawn at.
- **translate**: offsets in **body heights** (`metrics.bodyHeight`) in the parent's space.
- **scale**: multipliers of the setup scale.
- **phases** let the GM retime anticipation/action/recovery independently (piecewise time warp).
- **layer** keys change the draw order from their time until the next layer key:
  `{ "t": 0.05, "behind": "head" }` draws this role's parts just behind the head's,
  `{ "t": 0.2, "front": "torso" }` just in front of the torso's, `{ "t": 0.37 }` restores the
  rig's own order. The sword slash uses them so the sword arm passes behind the head while
  winding up.
- **events** fire once as the play head passes them (an event at `t: 0` fires on the first
  frame); tokens forward them to
  `Hooks.callAll('fu-sprite-animator.event', { token, clip, event })`.
- **additive** clips add their offsets on top of lower tracks instead of overriding.
- Roles a rig lacks are ignored (the Studio's rig check lists them).

### Playback parameters (not stored in the clip)
`intensity` (amplitude ×), `speed` (rate ×), `timing` (phase multipliers), `variation`
(0–1; ±12 % amplitude per role and ±10 % action speed, seeded), `seed`, `mixIn`, `mixOut`.

## Profile (actor or token flag `fu-sprite-animator.profile`)
```json
{ "rig": "rigk2…", "enabled": true, "idle": "idle-breathing", "intensity": 1 }
```
A token flag overrides its actor's.

## Bundle (`fusa-bundle`) — export/import
```json
{ "format": "fusa-bundle", "version": 1, "rig": { …rig… }, "image": "data:image/png;base64,…" }
```
Importing stores the image in the world folder and points the rig at it.

## World clips
Animations made or changed in the Studio (and imported ones) are stored in the world setting
`fu-sprite-animator.clips` (`{ id: clip }`) and registered on every client at start-up and
whenever the setting changes. Built-in clips are never modified: editing one makes a copy
(`sword-slash-custom`); importing a file whose id exists gives it a new id.

## Storage in a world
- `worlds/<world>/fu-sprite-animator/rigs/<rig id>.json` — rig documents.
- `worlds/<world>/fu-sprite-animator/images/` — images from imported bundles.
- World setting `fu-sprite-animator.rigs` — index `{ id: { name, file, image, updated, revision } }`.
