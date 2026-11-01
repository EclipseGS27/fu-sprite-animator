# Public API (version 0.1.0)

```js
const api = game.modules.get('fu-sprite-animator').api; // also globalThis.SpriteAnimator
Hooks.once('fu-sprite-animator.ready', (api) => { /* safe to use */ });
```

`target` below is a Token (placeable), TokenDocument, Actor, UUID, token id, actor id or actor
name. Actors resolve to their tokens on the scene being viewed.

| Call | Does |
| --- | --- |
| `await api.play(target, clipId, options?)` | Plays a clip on the target's animated tokens on every client. Resolves to the number of tokens that played it here. Throws for an unknown clip. |
| `api.stop(target)` | Eases the current action back to the idle loop. |
| `api.isAnimated(target)` | Whether any of the target's tokens is animated now. |
| `api.clips()` | `[{ id, name, category, duration, loop }]`. |
| `api.getClip(id)` | A copy of the clip document. |
| `api.registerClip(clip)` | Adds or overrides a clip (validated; same format as docs/ANIMATION_FORMAT.md). |
| `api.getProfile(actorOrToken)` / `await api.setProfile(actor, profile \| null)` | Read / set / clear `{ rig, enabled, idle, intensity }`. |
| `api.rigs()` | Saved rigs: `[{ id, name, image, updated }]`. |
| `api.openStudio({ rigId?, actor? })` | Opens the Studio (GM). |
| `await api.assign(rigId, actorId?)` | Opens the "use this rig for an actor" dialog. |
| `await api.selfTest()` | Foundry-side checks; returns `[{ name, ok, detail }]`. |
| `api.version` | `'0.1.0'`. |

`options` for `play`: `intensity` (default 1), `speed` (1), `timing`
(`{ anticipation, action, recovery }` multipliers), `variation` (0–1, default 1), `seed`
(same seed → same performance), `broadcast` (default true).

Built-in clip ids: `idle-breathing`, `combat-stance`, `sword-slash`, `heavy-slash`,
`magic-cast`, `light-hit`, `heavy-hit`.

## Hooks emitted
- `fu-sprite-animator.ready` (api)
- `fu-sprite-animator.event` `{ token, clip, event }` — clip events on each client as they
  happen: `windup`, `release`, `contact`, `recover`, `end`. Use `contact` to sync impacts.

## Examples
```js
// Selected token swings its sword
await SpriteAnimator.play(canvas.tokens.controlled[0], 'sword-slash');

// Every token of an actor flinches, a bit stronger and slower to recover
await SpriteAnimator.play(game.actors.getName('Wolf'), 'heavy-hit', { intensity: 1.2, timing: { recovery: 1.4 } });

// React when a strike lands
Hooks.on('fu-sprite-animator.event', ({ token, clip, event }) => {
  if (event === 'contact') console.log(`${token.name} hit with ${clip}`);
});
```
