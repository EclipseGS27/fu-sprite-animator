---
name: foundry-v13-module
description: Use when changing Foundry VTT integration in fu-sprite-animator (src/foundry: hooks, settings, storage, Studio window, token animators, socket, public API, self-test) or module.json/release packaging.
---

# Foundry v13 module work

## Structure
- Source is TypeScript in `src/`; Foundry loads the bundle `dist/fu-sprite-animator.mjs` (built by `npm run build`, **committed**, because installs download the `main` branch zip). Always rebuild and commit `dist/` with source changes.
- `src/foundry/globals.d.ts` declares Foundry globals loosely; keep Foundry-specific code inside `src/foundry`.

## APIs used (documented, v13)
- Hooks: `init`, `ready`, `canvasReady`, `canvasTearDown`, `drawToken`, `refreshToken`, `destroyToken`, `updateActor`, `updateToken`, `updateSetting`, `getSceneControlButtons` (v13 record shape: `controls.tokens.tools.<name> = { …, button: true, onChange }`), `getHeaderControlsDocumentSheetV2`, `getActorContextOptions`.
- `foundry.applications.api.ApplicationV2` with `_renderHTML` → element and `_replaceHTML(result, content)` (mount once); `DialogV2.confirm/prompt`.
- Files: `foundry.applications.apps.FilePicker.implementation` (`upload(source, dir, file, {}, { notify: false })`, `createDirectory`, `new FP({ type: 'image', callback }).render(true)`).
- Settings (`game.settings.register`, `registerMenu`), flags (`actor.setFlag('fu-sprite-animator', 'profile', …)`), socket (`module.fu-sprite-animator`, `"socket": true` in module.json).
- Do not replace `CONFIG.Token.objectClass`, do not wrap private methods, do not depend on libWrapper.

## Ecosystem rules
- Do not break fu-animations, Battle UI, Enhanced Interface or Automated Animations. Only change `token.mesh.texture`; never its position, scale, visibility, alpha or filters.
- Integrate with fu-animations through `game.modules.get('fu-animations')?.api` (e.g. `api.resolve(item)`), feature-detected.
- Emit `Hooks.callAll('fu-sprite-animator.event', { token, clip, event })` for others; keep the API shape in docs/API.md in sync (bump `api.version`).

## Testing
- `npm run test:integration` runs the bundle against `test/render/foundry-mock.js` (catches wiring errors only).
- The real check is in Foundry: `await SpriteAnimator.selfTest()` plus the manual checklist in docs/TESTING.md. Never mark Foundry features "Tested" in DEVELOPMENT_STATUS.md without a run inside Foundry.
