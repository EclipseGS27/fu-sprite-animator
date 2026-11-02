# Architecture

## Goals in one paragraph
Take one flat PNG/WebP character, cut it into parts **without changing a single visible pixel**,
drive the parts with a bone hierarchy, play reusable, role-based animation clips on it, and show
the result in an editor (the Sprite Animation Studio) and on Foundry tokens, next to the existing
Fabula Ultima modules. The simplest design that does this is a small purpose-built runtime on
Foundry's own PixiJS, not an imported engine (see PROJECT_KNOWLEDGE.md §3–4 for why).

## Layers

```
┌───────────────────────────── Foundry VTT v13 ─────────────────────────────┐
│ src/foundry   module entry, settings, storage, token bridge, combat hook,  │
│               public API (game.modules.get('fu-sprite-animator').api)      │
├──────────────────────────────┬─────────────────────────────────────────────┤
│ src/ui   Studio, mapping     │ src/mapping   Project FU data → rule keys → │
│          editor (plain DOM)  │   clip (pure; world/actor/item/template)    │
├──────────────────────────────┴─────────────────────────────────────────────┤
│ src/render   PIXI v7 adapter: atlas texture, part meshes, render-to-texture │
├────────────────────────────────────────────────────────────────────────────┤
│ src/core     math, skeleton, clips, easing, player (tracks, blending,       │
│              events), skinning   — pure TypeScript, no DOM, no PIXI         │
│ src/rig      rig document, templates, validation, history, serialization    │
│ src/sprite   image analysis on typed arrays: silhouette, ownership map,     │
│              hidden-region fill, RLE                                         │
│ src/presets  built-in role-based clips (idle, attack, cast, hit…)           │
└────────────────────────────────────────────────────────────────────────────┘
```

Dependency rule: arrows only point down. `core`, `rig`, `sprite` and `presets` never import PIXI,
the DOM or Foundry; they run in Node (unit tests) and could run in a Web Worker. `render` only
imports `core`/`rig` and reads `globalThis.PIXI`. `ui` uses `render` and is mounted by a thin
Foundry `ApplicationV2` — the same view also mounts in a plain browser page for automated tests.

## Data model (summary — full spec in ANIMATION_FORMAT.md)

- **Rig** (`fusa-rig`): image reference (never modified), bones (with *roles* such as
  `arm.upper.front`), parts (which bone, draw order, rigid or mesh, joint softness), the pixel
  ownership map (RLE), render settings (pixel/smooth, padding, fps), facing.
- **Clip** (`fusa-clip`): keyed **by role**, values are *offsets from the rig's setup pose*,
  translations in body heights. So one "sword-slash" plays on a 32 px sprite and a 600 px
  illustration, facing left or right. Phase markers (anticipation/action/impact/recovery) let the
  GM retime phases; `intensity` scales amplitudes; a seed adds controlled variation.
- **Profile** (actor flag): which rig, idle clip, per-role amplitude tweaks, mapping overrides.

## Runtime (src/core)

- `Affine` 2D matrices; bones compose `T·R·S` local transforms parent-first.
- `Skeleton`: setup pose, current pose, world matrices, skin matrices
  (`world · setupWorld⁻¹`).
- `Clip` sampling: per-key easing (linear, step, quad/cubic/back/elastic in/out, cubic Bézier);
  loop; time warp from phase multipliers.
- `AnimationPlayer`: tracks. Track 0 = base loop (idle); higher tracks override per role with a
  weight; crossfades blend from a snapshot of the outgoing pose; additive tracks add on top;
  events fire once when the play head crosses them (also across loop wraps); finished one-shot
  clips fade back to the base track.
- `buildPartMesh` / `deform`: each part is a grid over its pixels (rigid parts: one quad).
  Vertices carry up to 4 weights (own bone, parent at the root joint, children at their joints);
  `softness` widens the joint band; `stiffness` blends linear-blend skinning toward rigid motion.

## Rendering (src/render) and pixel fidelity

1. **Atlas**: the parts' pixels (own pixels + hidden fill) are packed into one canvas with
   transparent gutters → one `BaseTexture` per rig, **shared** by every token and preview using
   that rig.
2. **Part meshes**: one `PIXI.SimpleMesh` per part, vertices updated from the skeleton each frame,
   in draw order inside a container.
3. **Render to texture at native resolution**: the container is rendered into a `RenderTexture`
   the size of the sprite plus padding (room for weapons swinging out), resolution 1.
4. **Display**: that texture is shown scaled up.
   - *Pixel mode*: `NEAREST` everywhere, translations snapped to whole sprite pixels. The output is
     always a clean grid of original-size pixels in original colours — no blur, no mixels.
   - *Smooth mode* (illustrations): `LINEAR`, optional higher render resolution.
5. **Rest pose is bit-identical** to the source image: parts are disjoint pixel sets, fills sit only
   under fully opaque pixels of higher parts, vertices sit on whole pixels. This is an automated test.

## Foundry integration (summary — details in FOUNDRY_INTEGRATION.md)

- **Studio**: `ApplicationV2` window hosting the Studio view (its own small PIXI v7
  `Application` for the viewport; destroyed when the window closes).
- **Storage**: rig JSON files in `worlds/<world>/fu-sprite-animator/rigs/` (via `FilePicker.upload`),
  an index in a hidden world setting, the profile in actor flags. Original images are referenced,
  never rewritten. Import/export as a single portable JSON bundle (image embedded).
- **Tokens**: for a token whose actor has an enabled profile, a `TokenAnimator` renders the rig
  each frame into its render texture and gives it to `token.mesh` (trimmed texture, so size and
  anchor do not change). Driven by documented hooks: `drawToken`, `refreshToken`, `destroyToken`,
  `canvasReady`, `canvasTearDown`. One shared ticker callback for all animated tokens.
- **API**: `SpriteAnimator.play(actorOrToken, clipId, options)` etc. (API.md).
- **Combat** (`src/foundry/combat.ts`): the posting client turns a Project FU chat card into a
  plan (an `AbilityInfo` from `src/mapping/projectfu.ts`, the item's own choice, targets with
  hit/miss, critical) and broadcasts it; each client resolves clips for its own tokens with
  `src/mapping` (item → actor → world ability → world rule → built-in; template-specific keys;
  fallbacks for rigs lacking roles) and plays the attacker's clip and, at contact, the targets'
  reactions. `updateActor` holds a defeat pose at 0 HP. Editors: `MappingApp` (world),
  `ActorMappingApp` (per actor), item dialog (per item or per ability name). ABILITY_MAPPING.md.

## Performance rules

- Image analysis (ownership map, fills, atlas) runs once per rig save and is cached in memory by
  rig id + revision; never per frame, never per token. Large images: moved to a Web Worker in
  Phase 3 (the functions are already pure and transferable).
- One atlas texture per rig, shared. One render texture per animated token (small: sprite size).
- Animated tokens skip work when hidden, not visible on screen, or when their pose did not change;
  idle loops can run at a reduced frame rate (e.g. 12 fps, pixel-art style), actions at display rate.
- Everything created is destroyed: render textures and meshes on token destroy / canvas teardown,
  the Studio's PIXI application on window close, atlas textures when no user remains (ref count).

## Extension points
- **Rig templates** (`src/rig/templates.ts`): data, not code — add quadruped/winged/serpentine.
- **Renderer adapter**: `render/` is the only PIXI-aware code; a PIXI 8 adapter for Foundry v14 is a
  parallel folder.
- **Clips**: built-ins in `src/presets`, world clips as JSON; same format.
- **Mapping rules**: data tables, not engine code.

## Biggest technical risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Trimmed-texture swap behaves differently in Foundry's `SpriteMesh` than in `PIXI.Sprite` | Token art jumps or shrinks while animating | Built-in self-test compares mesh bounds before/after swap and falls back to a no-padding texture (clipped swing) automatically; GM sees a warning, never a broken token. |
| Foundry refreshes reset `mesh.texture` | Animation flickers back to the still image | Re-apply in `refreshToken`; texture identity check each frame. |
| Hit-testing uses texture alpha data | Click area follows the rest pose | Accepted; documented. |
| Flat sprites hide body parts behind others | Holes when limbs move | Automatic palette-exact backfill; mesh mode at joints; presets keep motion moderate; manual fill tools later. |
| Auto-rig quality on unusual sprites | Bad proposals | Template + brush workflow always available; validation; never auto-commit without the GM seeing the result. |
| Many animated tokens | GPU/CPU cost | Shared atlas, small render targets, skip unchanged/off-screen, reduced idle fps, max-active cap setting. |
| Interplay with fu-animations motion | Double motion or desync | We never move the token, only its texture; clips are in-place. A `fu-animations.beat` hook (proposed) will sync contact frames. |
| PixiJS 8 in Foundry v14 | Renderer breaks on upgrade | Renderer isolated in one folder; v8 adapter planned. |
