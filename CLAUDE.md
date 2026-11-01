# fu-sprite-animator — notes for Claude Code

2D skeletal animation of flat character sprites for Foundry VTT **v13** (Project FU system).
Read docs/PROJECT_KNOWLEDGE.md and docs/ARCHITECTURE.md before structural changes.

## Non-negotiables
- Foundry v13 runs **PixiJS 7**. Use `pixi()` from `src/render/pixi.ts`; never bundle or import
  `pixi.js` at runtime. The installed `pixijs-scene-mesh` skill is PixiJS 8 — translate with
  `.claude/skills/pixi-v7-foundry-rendering`.
- Never change visible artwork. The rest pose must render bit-identical to the source (tests
  enforce it on CPU and GPU). No AI repainting, no mandatory paid services.
- Manual rigging must always work; never assume humanoids; never hard-code abilities or actors.
- Only change `token.mesh.texture` on tokens — never their position, scale, alpha, visibility or
  filters (fu-animations and others rely on them).
- spine-animation-ai is PolyForm Noncommercial: do not copy its code. Dylan's Animated Tokens
  has no license: study only.
- Do not mark anything "Tested" in DEVELOPMENT_STATUS.md without a test that ran; Foundry
  features need a run inside Foundry.

## Layout
`src/core` runtime (pure TS) · `src/sprite` image analysis (pure) · `src/rig` rig documents,
templates, editing, validation, undo · `src/presets` clips · `src/render` PixiJS 7 adapter + CPU
reference renderer · `src/ui` Studio (plain DOM) · `src/foundry` hooks, storage, tokens, API.
`dist/` is the committed bundle Foundry loads. `test/unit` vitest, `test/render` browser suites,
`test/sprites` generated sprites with ground truth (`tools/gen_test_sprites.py`).

## Commands
`npm run typecheck` · `npm test` · `npm run build` (then commit `dist/`) · `npm run test:render`
· `npm run test:ui` · `npm run test:integration` · `npm run check` (all) ·
`SPRITE=… CLIP=… GT=1 npm run film` (look at the PNG it writes before claiming motion is good).
Playwright is pre-installed globally in the dev container; scripts load it with `createRequire`.

## Skills in this repo
skeletal-animation-runtime · sprite-segmentation · pixi-v7-foundry-rendering ·
foundry-v13-module · animation-presets · fu-ability-mapping · pixijs-scene-mesh (official, v8).
