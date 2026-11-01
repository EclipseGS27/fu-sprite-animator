# Project knowledge

What we learned before writing code: the reference projects, the Foundry facts that constrain the
design, and how the existing Fabula Ultima modules behave. Read this before changing the architecture.

Research date: 2026-11-01. Each repository was cloned and its source read (not only its README).

---

## 1. Facts that shape everything

| Fact | Evidence | Consequence |
| --- | --- | --- |
| **Foundry v13 runs PixiJS 7, not 8.** The PixiJS 8 move was postponed out of v13; v14 runs PixiJS 8. | v13 API docs use v7 types (`Texture<Resource>`, `IPointData`); Foundry's v13 prototype notes; module authors porting to v14 report "v7 → v8" changes. | Any PixiJS 8 runtime (IceBones, the official PixiJS skills) does not drop into v13. Our renderer must use the v7 API (`PIXI.SimpleMesh`, `PIXI.RenderTexture`, `baseTexture.scaleMode`). Keep the renderer behind an adapter so a v8 adapter can be added for v14. |
| The module must use Foundry's global `PIXI`, never bundle its own. | Two PixiJS copies cannot share textures or the WebGL context. | `pixi.js@7.4.3` is a **dev** dependency only (types and headless tests). |
| A token's picture is `token.mesh`, a `PrimarySpriteMesh` (Foundry's `SpriteMesh`), living in `canvas.primary`, not inside the Token. | v13 API docs; fu-animations and Dylan's Animated Tokens both drive it. | To animate a token we render the rig into a `RenderTexture` and give that texture to `token.mesh`. |
| Foundry's `SpriteMesh` supports trimmed textures (`calculateTrimmedVertices`, `vertexTrimmedData`) like `PIXI.Sprite`. | v13 API docs for `foundry.canvas.containers.SpriteMesh`. | A texture whose `orig` is the sprite's size and whose `trim` is the larger padded render area lets a sword swing past the sprite's edges **without Foundry resizing the token**. Must be confirmed inside Foundry (self-test, see FOUNDRY_INTEGRATION.md). |
| Swapping `token.mesh.texture` works in v13. | Dylan's Animated Tokens does it every frame for spritesheets. | Our token integration uses the same, documented-by-practice route instead of replacing `CONFIG.Token.objectClass` (which collides with other modules). |
| fu-animations moves `token.mesh` (x/y offsets for dashes, hover, knockback), scales it (anticipation squash), rotates it (stagger), adds filters (hit flash), tints it (conditions) and reads `mesh.visible`/`worldAlpha` (condition loops). | `fu-animations/scripts/player.mjs`, `impact.mjs`, `statuses.mjs`. | Because we only change the **texture**, every fu-animations effect keeps working on an animated token. We must never hide the mesh with `alpha = 0` or `visible = false` (conditions would vanish). |

## 2. The existing ecosystem

### fu-animations (Fabula Ultima Battle Animations, v1.11.0)
- ~25k lines of hand-written `.mjs` plus vendored MIT effect libraries (Sprite Fusion VFX, pixelfx). No build step; installed from the GitHub `main` zip.
- **Trigger**: `createChatMessage` on the rolling client → `planFromMessage(msg)` reads Project FU flags (`projectfu.Check`, `itemUuid`, `additionalData.targets` with `result: hit|miss`, `critical`, `fumble`, `damage.type`) → the plan is sent over the module socket and every client runs `runPlan(plan)`.
- **Classification already exists**: `game.modules.get('fu-animations').api.resolve(item, ctx)` returns `{spec: {style: 'melee'|'ranged'|'spell'|'support'|'self'|'none', cast, hit, projectile, element, ...}, source}` for every class ability, spell, NPC spell and Core item in the Project FU compendium (446 entries keyed by Fabula Ultima ID) and 611 bestiary attacks, with world and per-item overrides. Weapons expose `system.category.value` (`arcane, bow, brawling, dagger, firearm, flail, heavy, spear, sword, thrown`) and shields.
- **Timing of a melee move**: optional boss wind-up → cut-in → `anticipate` (200–320 ms squash and pull-back) → dash (110–260 ms) → hit (`contact`) → return (200–420 ms). Ranged/spell: cast effect, ~260–650 ms hold, projectile, hit.
- No hooks are emitted around playback today. The cleanest future integration is a small additive change to fu-animations: `Hooks.callAll('fu-animations.beat', {plan, beat: 'start'|'windup'|'contact'|'end', token})`. Until then we listen to the same chat messages and use the same Project FU flags.
- Visual language: dark navy `#0b1220`, gold `#f2c45a`, pale blue lines `rgba(159,208,255,.28)`, Antonio for headings. The Studio follows it.

### fu-character-creator (v1.4.0)
- Character creation wizard reading classes, skills, spells and equipment from compendiums. No canvas code. Relevant only as a source of conventions (ApplicationV2, release workflow that zips the repo when `module.json` version changes).

### Project FU system (`projectfu` ≥ 4.14)
- Item types that act: `weapon`, `customWeapon`, `shield`, `basic` (NPC attacks), `spell`, `skill`, `heroic`, `miscAbility`, `classFeature`, `optionalFeature` (Zero Powers), `consumable`, `ritual`.
- NPC rank (`system.rank.value`: soldier/elite/champion) and `system.villain.value`.
- Basic actions Guard/Study/Hinder arrive as Checks with `additionalData.ruleDefinedAction`.
- We do not invent abilities: mapping reads the system's data and the fu-animations table.

## 3. Reference repositories

Legend for the verdict: **Use** (as a dependency), **Adapt** (copy specific code under its license, with attribution), **Study** (ideas only, no code).

### 3.1 Rigby2D — jaisurya-dev-art/rigby2d (v0.4.3, public beta)
- **Architecture**: Tauri desktop + web editor. `src/core` (8.5k lines, plain JS, zero dependencies): data model, Spine-style skeleton JSON 3.8/4.2/4.3 and binary `.skel` I/O, pose evaluation, IK/transform/path/physics constraints, `AnimationState` with layered tracks and crossfades, retargeting, lip-sync. `src/webgl/renderer.js` reference renderer. Runtimes for Phaser, Unity, Godot, Cocos, Rust.
- **License**: MIT OR Apache-2.0. Names/logos/mascots (Rigby2D, NILA, Rigbytron) are trademarks, not licensed. Bundles Pyodide (MPL-2.0) and Transformers.js only in the editor.
- **AutoRig** (`src/core/autorig.js`, `bodyparts.js`): works on **layered** artwork (one image per body part, from a PSD). It names parts from layer names (rich synonym table: "L_UpperArm", "shoe_right", "beak"…) or position, measures each part with PCA on its opaque pixels (centroid, main axis, thickness), places joints where parts meet, builds spine/neck/head/arms/legs/tail/wings, meshes bending parts, adds two-bone IK. **It does not split a single flat sprite into parts** — which is our main input.
- **Mesh** (`meshgeom.js`): ear clipping + Delaunay flips for hull+interior points, inverse-distance-to-segment auto weights (`1/(d+1)^4`, normalized, max 4 influences), weight painting with smoothstep falloff.
- **Animation data**: Spine-style: bone timelines (rotate/translate/scale/shear) with Bézier curves, deform timelines, events, draw order. Coordinates Y-up.
- **MCP server** (`src/mcp/server.js`, stdio, Node 20, no install needed for most tools): `inspect_project`, `describe_rig`, `describe_animation`, `sample_pose`, `validate_project`, `convert_project`, `add_bone`, `set_bone_setup`, `add_animation`, `set_bone_key`, `delete_bone_key`, `set_attachment_key`, `set_event_key`, `batch_edit`, `detect_parts`, `autorig`, `map_bones`, `retarget_animation`, `camera`, `run_script`. Works on `.rigby`/Spine JSON files inside `--root` folders.
- **Reusable?** Yes, legally. The JS runtime could even run in Foundry (no dependencies; `pose.quads()` gives vertices + UVs for any renderer).
- **Integration cost**: Spine-format centric (attachments, slots, skins, atlases, Y-up), 8.5k lines of which we would use a fraction; a fast-moving beta; its authoring model (layered PSD) differs from ours (single flat sprite cut by a pixel ownership map).
- **Incompatibilities**: none technical; conceptual mismatch with flat sprites.
- **Verdict: Study + optional interop.** We study its weight formula, PCA part measurement, body-part synonym list and track/crossfade semantics, and we write our own small runtime. A later "Export to Spine 4.2 JSON" lets GMs open a rig in Rigby2D for heavy editing.
- **MCP for Claude Code**: useful as an **offline authoring and validation tool** (e.g. Claude authoring or sampling a Spine-format animation, or validating an export) via `claude mcp add rigby2d -- node <rigby2d>/src/mcp/server.js --root <dir>`. It cannot see inside Foundry and it does not understand our format, so it is **not needed for Phase 2** and must never be a runtime dependency. Revisit when the Spine export exists (Phase 4).

### 3.2 Spine Animation AI — GenielabsOpenSource/spine-animation-ai
- **Architecture**: a Claude skill (`SKILL.md` with four embedded Python scripts) + a Gemini-powered "Reskin Studio" web app.
- **License**: **PolyForm Noncommercial 1.0.0.** No commercial use; code may not be incorporated into a module that could be used commercially. **We copy nothing.**
- **Techniques (studied)**:
  - `split_character.py`: asks **Google Gemini** to redraw a flat character as a "deconstructed atlas" of parts, then cuts it with OpenCV connected components. This **regenerates the artwork with AI** and needs an API key — it violates our rules (never repaint original art, no mandatory paid AI).
  - `position_parts.py`: SIFT + FLANN + RANSAC (4-DOF affine) to find where separately drawn parts sit on an assembled reference; template-matching fallback; z-order by pairwise occlusion voting. A generic, well-known CV method — relevant only if a GM supplies separate part images.
  - Animation guidance: three-phase attack (wind-up → strike → follow-through ≈ 0.6 s), offsetting related bones by ~0.1 s for follow-through. These are the classic principles of animation, not proprietary.
- **Verdict: Study only.** Its flat-sprite path is not acceptable for us; its part-alignment idea may inform a Phase 3 "import separate part images" option, implemented independently.

### 3.3 IceBones — jwp72/icebones
- **Architecture**: monorepo: `@icebones/core` (~1k lines TS), `@icebones/pixi` (PixiJS 8 renderer), React editor, a RAG chat API (FastAPI + Voyage + Claude).
- **License**: README says MIT; **there is no LICENSE file** in the repository. Treat as unclear until a license file exists.
- **Capabilities**: bone hierarchy, rotate/translate/scale timelines, **linear interpolation only**, skins, Spine 4.2-superset JSON. **No meshes, no weights, no deformation, no IK.** One commit (April 2026).
- **Incompatibility**: the renderer is PixiJS 8 only → does not run on Foundry v13.
- **Verdict: Study only.** Too small and too young to be a foundation, and the wrong PixiJS major version.

### 3.4 SpriteForge — Wilson-Cheng/SpriteForge (v0.8.0)
- **Architecture**: vanilla TypeScript + Canvas + WebGL2, esbuild, no framework; ~13k lines. Editor with Edit/Pose/Animate modes, timeline with easing presets and curve display, mesh attachments with GPU skinning (4 influences in a vertex shader), auto-weights, subdivision, two-bone IK, Spine 4.1 JSON export/import, MP4 export via ffmpeg.wasm.
- **License**: MIT. One commit.
- **Useful ideas**: **snapshot-based undo/redo** with 150 ms debounce and *drag transactions* (no history entries while a drag is in progress) — simple and correct for small documents like rigs; three editor modes; inheritance flag `noRotationOrReflection` for weapons/feet.
- **Incompatibility**: its renderer is raw WebGL2, separate from PixiJS; adopting it would mean a second renderer in Foundry.
- **Verdict: Study** (editor patterns). No code copied.

### 3.5 Dylan's Animated Tokens — righthandofvecna/dylans-animated-tokens (v2.1.2, v13–v14)
- **Architecture**: replaces `CONFIG.Token.objectClass` with a subclass that swaps `token.mesh.texture` per frame for directional spritesheets; requires libWrapper, Sequencer, socketlib.
- **License**: **none in the repository** → all rights reserved. Also ships `js/foundry/token-v13.mjs` / `token-v14.mjs` (≈3k lines each) that appear to reproduce Foundry's own Token class to reach private members — fragile across Foundry versions.
- **Techniques (studied)**: per-frame `mesh.texture` swap + `renderFlags.set({refreshMesh: true})`; pixel-art crispness by wrapping `PIXI.TextureSystem.prototype.setStyle` to force `NEAREST` globally (affects *every* texture — too broad for us).
- **Verdict: Study only.** We take the texture-swap idea, but drive it from documented hooks (`drawToken`, `refreshToken`, `destroyToken`) without replacing the Token class, and set `NEAREST` only on our own textures.

### 3.6 PixiJS — pixijs/pixijs
- **License**: MIT. Foundry v13 ships PixiJS **7.x** (latest 7.x on npm: 7.4.3).
- **v7 mesh API** (what we use): `PIXI.SimpleMesh(texture, vertices, uvs, indices)` with `mesh.vertices = Float32Array` (updates the vertex buffer), `PIXI.Mesh(geometry, PIXI.MeshMaterial)`, `PIXI.MeshGeometry`. v8 renamed these (`MeshSimple`, `MeshGeometry` with options objects).
- **Texture sampling**: `baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST` per texture; `PIXI.RenderTexture.create({width, height, scaleMode, resolution: 1})`; `renderer.render(container, {renderTexture, clear: true})`.
- **Pixel-art rule we adopt**: render the rig at the sprite's **native resolution** into a render texture with nearest sampling, then let that texture be scaled up with nearest sampling. Rotated limbs are then resampled on the original pixel grid — no "mixels" (rotated, half-size or blurred pixels) — and colours are never interpolated.
- **Official PixiJS agent skills** (`pixijs/pixijs-skills`, MIT): 25 skills including `pixijs-scene-mesh`, all written for **PixiJS v8**. Install command verified: `npx skills add pixijs/pixijs-skills --skill pixijs-scene-mesh --agent claude-code` (the `skills` CLI from vercel-labs). Installed in this repo for the v14 port and for concepts; our own `pixi-v7-foundry-rendering` skill states the v7 equivalents that apply today.

## 4. Comparison table

| | Rigby2D | spine-animation-ai | IceBones | SpriteForge | Dylan's Tokens | PixiJS |
| --- | --- | --- | --- | --- | --- | --- |
| License | MIT / Apache-2.0 | PolyForm **Noncommercial** | MIT claimed, no file | MIT | **None** | MIT |
| Language | JS (+Rust, C#) | Python + skill | TS | TS | JS | TS |
| Meshes + weights | Yes | Via Spine | No | Yes (GPU) | n/a | Primitive |
| IK | Yes | Via Spine | No | 2-bone | n/a | n/a |
| Easing / curves | Bézier | Spine curves | Linear only | Presets + curves | n/a | n/a |
| Layered tracks / crossfade | Yes | Spine runtime | Basic | Partial | n/a | n/a |
| Auto-rig from a **flat** sprite | No (needs layers) | Only via Gemini repaint | No | No | No | n/a |
| Runs on Foundry v13 (PIXI 7) | Core yes, renderer no | No | No (PIXI 8) | No (own WebGL2) | Yes | Yes (is it) |
| Verdict | Study + later interop | Study only | Study only | Study | Study only | **Use** (Foundry's) |

## 5. Automatic rigging: what works for flat sprites (no paid AI)

None of the references solve "one flat PNG → parts + skeleton". Our approach (detailed in RIGGING_GUIDE.md):
1. **Silhouette** from alpha (with a background-colour key for sprites without transparency).
2. **Template fitting**: a rig template (humanoid, quadruped, winged, serpentine, custom) is scaled to the silhouette's bounds and refined with row/column width profiles (head = top blob above the narrowest upper row, feet = bottom contacts, weapon = long thin component beyond the body). Phase 2 ships bounds-based fitting; profiles and skeletonization are Phase 3.
3. **Pixel ownership map**: every opaque pixel is assigned to the nearest bone segment (Voronoi on segments, with joint-aware tie-breaking), then corrected with a brush. Parts are therefore pixel-exact cuts of the original — no resampling, no repainting.
4. **Hidden regions**: under every part that overlaps a lower part, the lower part is extended by copying its own nearest pixels into the covered area (palette-exact, deterministic), only under fully opaque pixels. At rest the result is **bit-identical** to the original image; when a limb moves away, the revealed area shows plausible body pixels instead of a hole.
5. **Validation** after every step: unassigned pixels, bones without art, cycles, missing roles needed by a clip. The Studio refuses to call a broken rig "ready".
6. Optional, never required: segmentation models (e.g. SAM-class models running locally via ONNX/WebGPU) can be evaluated in Phase 3 as an *assistant* that proposes ownership maps.

## 6. Hidden-region strategies considered

| Strategy | Keeps original pixels | Effort for GM | Chosen |
| --- | --- | --- | --- |
| Manual region separation (brush) | Yes | Medium | Yes (correction tool) |
| Automatic nearest-pixel backfill under overlapping parts | Yes (fill only where hidden) | None | **Yes (default)** |
| Hidden-region cloning from a GM-chosen source rect | Yes | Low | Phase 3 |
| Mesh-only deformation (no cut, stretch joints) | Yes, but stretches | None | Yes, per part (`mesh` mode) |
| AI inpainting | No (invents art) | None | Never mandatory; not planned |

## 7. Learned while building Phase 2
- **Trimmed textures work for sizing** (`orig` = sprite size, `trim` = padded render area):
  verified with `PIXI.Sprite` in PixiJS 7.4.3; Foundry's `SpriteMesh` documents the same trim
  members. Confirm with `SpriteAnimator.selfTest()` in Foundry.
- **Rest-pose identity holds on the GPU**: atlas uploaded with `BaseTexture.fromBuffer` +
  `ALPHA_MODES.UNPACK`, integer vertices, `NEAREST`, native-resolution render texture →
  pixel-exact for opaque and pixel-art sprites. Linear (smooth) mode drifts ≤ 8/255 on
  semi-transparent edges.
- **Strikes need world-angle keys**, including the blade: with offsets only, a blade kept its
  rest angle relative to the forearm and pointed up at impact.
- **Rotation blending must go the short way** or attacks spin 300°+ when fading back to idle.
- **The near arm crosses the face** in side-view sprites when raised overhead; the slash cocks
  the elbow behind the shoulder instead.
- **Automatic assignment baseline**: 58–76 % of pixels match the ground truth on the test set
  with a bounds-fitted template and nearest-segment assignment. Widening the bounds or shrinking
  the torso's reach made it worse; real gains need silhouette landmarks (Phase 3).
- **fu-animations reads `token.mesh.texture`'s image source** for element outlines and feet;
  render textures have none, so it falls back to a capsule shape (no error).
- Foundry's `Actor#getActiveTokens()` already returns only the viewed scene's tokens; filtering
  by `token.scene` broke the mock and is unnecessary.
