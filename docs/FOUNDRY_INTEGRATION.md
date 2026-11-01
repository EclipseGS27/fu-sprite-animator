# Foundry integration (v13)

## Loading
- `module.json` loads `dist/fu-sprite-animator.mjs` (bundled from `src/` with esbuild) and
  `styles/studio.css`. PixiJS is **not** bundled: the module uses Foundry's global `PIXI` (7.x).
- Requires the Project FU system (≥ 4.14). Recommends Fabula Ultima Battle Animations.

## Hooks used (all documented)
| Hook | Why |
| --- | --- |
| `init` | settings, settings menu, API (`game.modules.get('fu-sprite-animator').api`, `globalThis.SpriteAnimator`), token hooks |
| `ready` | socket listener; `Hooks.callAll('fu-sprite-animator.ready', api)` |
| `getSceneControlButtons` | Studio button in the token tools (GM), v13 record shape |
| `getHeaderControlsDocumentSheetV2` | "Sprite animation" in actor sheet headers (GM) |
| `getActorContextOptions` / `getActorDirectoryEntryContext` | "Sprite animation" in the Actors directory (GM) |
| `canvasReady` / `canvasTearDown` | start / dispose token animators |
| `drawToken` / `refreshToken` / `destroyToken` | attach, keep, release a token's animation |
| `updateActor` / `updateToken` / `updateSetting` | profile, token image or rig library changed |

Nothing replaces Foundry classes (`CONFIG.Token.objectClass` is untouched) and no private method
is wrapped; libWrapper is not needed.

## How a token is animated
1. A token animates when its actor (or the token) has the flag
   `fu-sprite-animator.profile = { rig, enabled, idle, intensity }` and the rig passes its check.
2. The rig is loaded once per revision; its parts are packed into one atlas texture shared by
   every token using it.
3. Each animated token gets a `RigView`: its own skeleton, animation player and a small render
   texture (sprite size + padding, at the sprite's native resolution).
4. Every frame (idle loops at the rig's idle frame rate) the pose is rendered into that texture,
   and `token.mesh.texture` points at it through a **trimmed texture**: `orig` = the token
   image's size (so Foundry keeps the token's size, anchor, fit and scale), `trim` = the padded
   area (so a sword can swing past the edge).
5. The token itself is never moved, hidden, scaled, tinted or filtered by this module.
6. Turning the profile off, disabling the module setting, or deleting the token restores the
   token's own texture and releases the GPU resources.

Settings: **Animate tokens** (client), **Most animated tokens** (client, default 40),
**Token texture** (world: *Padded* default / *Clipped* fallback).

The token's image should be the rig's sprite (the assign dialog offers to set it). A token
whose image has a different shape is left alone and a message is logged.

## Coexistence
| Module | Interaction | Status |
| --- | --- | --- |
| **Fabula Ultima Battle Animations** (fu-animations) | It moves `token.mesh` for dashes, hover, knockback and dodges, squashes it for anticipation, rotates it for stagger, adds filters for hit flashes and tints for conditions. All of these apply on top of our texture, because we change nothing else. | Compatible by design; verify in Foundry |
| fu-animations afterimages | Ghosts are sprites of `mesh.texture` — they show the live animated pose rather than a frozen one. | Cosmetic |
| fu-animations element outlines / feet detection | It reads pixels from `token.mesh.texture`'s image source; a render texture has none, so it falls back to its built-in capsule shape. Suggested one-line change there: read `token.texture` (the original image) instead. Not changed unasked. | Minor degradation |
| Fabula Ultima Battle UI / Enhanced Interface | HUD/UI layers; they do not change `token.mesh.texture`. | Expected compatible; verify |
| Automated Animations / Sequencer | Play effects on top of tokens; Sequencer effects that copy the token texture show the animated pose. | Expected compatible; verify |
| Dylan's Animated Tokens, other modules that swap `token.mesh.texture` | Both would fight over the texture. Use one or the other per token. | Conflict per token |

## Combat triggers (Phase 5, not yet active)
Planned: listen to `createChatMessage` like fu-animations, read the Project FU check flags,
classify with `fu-animations.api.resolve()` when available, play the attacker's clip and the
targets' reactions (hit, heavy hit on crits, dodge on misses). Proposed small addition to
fu-animations to land contact frames together: `Hooks.callAll('fu-animations.beat', { plan, beat, token })`.
Until then, use the API from macros, e.g. `SpriteAnimator.play(canvas.tokens.controlled[0], 'sword-slash')`.

## Permissions
- Opening the Studio and saving rigs: GM (or users allowed to upload files).
- Everyone loads rig files (world folder) and plays animations; `api.play` broadcasts over the
  module socket so all clients see the same performance (same seed).

## Self-test (run inside Foundry)
`await SpriteAnimator.selfTest()` in the console (F12). It checks: PixiJS 7, WebGL renderer,
pixel-exact rest pose in Foundry's renderer, a sword slash rendering, that a
`PrimarySpriteMesh` keeps its size with the padded texture, that limbs can draw past the edge
(if not, switch *Token texture* to *Clipped*), resource cleanup, and animated tokens on the scene.
