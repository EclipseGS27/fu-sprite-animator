---
name: pixi-v7-foundry-rendering
description: Use when writing or changing rendering code in fu-sprite-animator (src/render, src/ui/viewport.ts, src/foundry/tokens.ts) — anything touching PIXI, meshes, render textures, texture sampling, token.mesh, or pixel-art crispness. Foundry v13 ships PixiJS 7; the installed pixijs-scene-mesh skill describes PixiJS 8 and must be translated using this skill.
---

# PixiJS 7 rendering for Foundry v13

## Ground rules
- **Foundry v13 = PixiJS 7.x** (test against 7.4.3). Never import `pixi.js` at runtime: use `pixi()` from `src/render/pixi.ts` (reads `globalThis.PIXI`). `pixi.js` is a dev dependency for types and headless tests only. `import type * as PIXINS from 'pixi.js'` is fine.
- `src/render/pixi.ts` is the only place that creates PIXI objects for rigs. Keep `core/`, `rig/`, `sprite/` PIXI-free.
- The `pixijs-scene-mesh` skill in this repo is **v8**. Translate:

| v8 (skill) | v7 (use this) |
| --- | --- |
| `new MeshSimple({ texture, vertices, uvs, indices })` | `new PIXI.SimpleMesh(texture, vertices, uvs, indices)` |
| `new MeshGeometry({ positions, uvs, indices })` | `new PIXI.MeshGeometry(vertices, uvs, indices)` |
| `mesh.geometry.positions = …` | write into `mesh.vertices` (Float32Array) then `mesh.geometry.getBuffer('aVertexPosition').update()` |
| `texture.source.scaleMode = 'nearest'` | `baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST` |
| `RenderTexture.create({ width, height })` | same, plus `scaleMode`, `resolution: 1` |
| `renderer.render({ container, target })` | `renderer.render(container, { renderTexture, clear: true })` |
| `Texture.from(buffer)` | `PIXI.BaseTexture.fromBuffer(uint8, w, h, { scaleMode, mipmap: PIXI.MIPMAP_MODES.OFF, alphaMode: PIXI.ALPHA_MODES.UNPACK })` |
| `new Application(); await app.init({...})` | `new PIXI.Application({...})` (synchronous) |
| `graphics.rect().fill()` | `graphics.beginFill(c).drawRect(...).endFill()` |

## Pixel fidelity recipe (do not break)
1. Atlas texture from the raw RGBA bytes (`fromBuffer`, `ALPHA_MODES.UNPACK`), `NEAREST` in pixel mode, no mipmaps.
2. Mesh vertices at whole sprite pixels in the setup pose (grid cells are integers) → rest pose samples texel centres exactly.
3. Render the rig at **native resolution** into a `RenderTexture` (`NEAREST`), then scale that texture up. Never render pixel art directly at screen scale (rotated limbs would show mixels).
4. Snap pure translations to whole pixels (`snapSkins`) in pixel mode.
5. Smooth mode (illustrations) uses `LINEAR`; semi-transparent edge pixels may drift a few /255 — expected.

## Tokens (Foundry)
- `token.mesh` is a `PrimarySpriteMesh` (Foundry `SpriteMesh`) in `canvas.primary`. We only **swap its texture** (`trimmedTexture`: `orig` = token texture size, `trim` = padded area) so size/anchor stay and limbs may draw past the edge. Fallback `clippedTexture` (setting "Token texture: Clipped").
- Never set `mesh.alpha = 0`, `visible = false` or move/scale the mesh: fu-animations moves, scales, rotates, filters and tints it, and its condition loops check `mesh.visible`/`worldAlpha`.
- Re-apply the texture in `refreshToken`; restore `token.texture` on dispose.
- One `RigAsset` (atlas) per rig revision shared by all tokens; one `RigView` (render texture) per token. Always `destroy()`.

## Verify
- `npm run test:render` — real WebGL + PixiJS 7.4.3 in headless Chromium: rest pose pixel-exact on GPU, GPU vs CPU reference, trimmed texture keeps sprite size, 25 views clean up.
- `npm run test:integration` — the built bundle against the Foundry mock.
- In Foundry: `await SpriteAnimator.selfTest()`.
