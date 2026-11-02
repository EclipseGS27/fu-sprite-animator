# Public API (version 0.2.0)

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
| `api.current(target)` | What the first animated token shows: `{ base, action }` clip ids (base = idle or a held defeat). |
| `api.resolveClip(item, { actor?, targets? })` | Which clip an item would play: `{ clip, source, key, candidates }` (see ABILITY_MAPPING.md). Plays nothing. |
| `api.describe(item)` | How the item's Project FU data was read (kind, category, offensive, area…). |
| `api.mapping.get()` / `await api.mapping.set(table)` / `api.mapping.defaults()` / `api.mapping.open()` | The world's ability → animation table `{ rules, abilities }`. |
| `await api.playAction(item, { source?, targets?: [{ target, result }], critical? })` | Plays an item's animation as if its card was posted (attacker + reactions), on every client. |
| `await api.react(target, 'hit' \| 'miss', { critical? })` | Plays the target's reaction (Light hit, Heavy hit, Block when guarding, Dodge) on every client. |
| `api.version` | `'0.2.0'`. |

`options` for `play`: `intensity` (default 1), `speed` (1), `timing`
(`{ anticipation, action, recovery }` multipliers), `variation` (0–1, default 1), `seed`
(same seed → same performance), `broadcast` (default true).

Built-in clip ids (`api.clips()` lists them with names):
- idle: `idle-breathing`, `combat-stance`, `magical-idle`, `heavy-weapon-idle`
- movement (in place): `walk`, `run`, `jump`, `dash`, `teleport`
- attacks: `sword-slash`, `heavy-slash`, `thrust`, `spear-attack`, `dual-wield-attack`,
  `bow-attack`, `staff-attack`, `unarmed-attack`, `firearm-shot`, `throw`
- magic: `magic-cast`, `channel`, `charge`, `projectile-cast`, `area-cast`, `healing`, `summoning`
- defence: `block`, `dodge`, `parry`, `counterattack`, `guard`
- reactions: `light-hit`, `heavy-hit`, `stagger`, `knockback`, `knockdown`, `defeat`
- creatures: `beast-idle`, `bite`, `claw`, `pounce`, `tail-swipe`, `roar`, `breath`, `crouch`,
  `beast-dodge`, `beast-hit`, `beast-defeat`, `wing-idle` (hover), `wing-beat`, `serpent-idle`,
  `blob-idle`, `blob-attack`, `blob-hit`, `blob-defeat`, `float-idle`, `float-defeat`
- any rig (root only): `generic-idle`, `generic-attack`, `generic-cast`, `generic-hit`,
  `generic-dodge`, `generic-defeat`

The actor profile `{ rig, enabled, idle, intensity, map }` also holds `map`: this character's own
choices, rule or ability key → clip id.

## Hooks emitted
- `fu-sprite-animator.ready` (api)
- `fu-sprite-animator.event` `{ token, clip, event }` — clip events on each client as they
  happen: `windup`, `release`, `contact`, `recover`, `end`. Use `contact` to sync impacts.

Changes since 0.1.0: added `current`, `resolveClip`, `describe`, `mapping`, `playAction`,
`react`; `play` unchanged. Events at time 0 of a clip now fire (reactions use them).

## Examples
```js
// What would this spell play for its owner?
SpriteAnimator.resolveClip(game.items.getName('Fire Ball'));

// Every sword in the world thrusts instead
const t = SpriteAnimator.mapping.get();
t.rules['weapon:sword'] = 'thrust';
await SpriteAnimator.mapping.set(t);

// Selected token swings its sword
await SpriteAnimator.play(canvas.tokens.controlled[0], 'sword-slash');

// Every token of an actor flinches, a bit stronger and slower to recover
await SpriteAnimator.play(game.actors.getName('Wolf'), 'heavy-hit', { intensity: 1.2, timing: { recovery: 1.4 } });

// React when a strike lands
Hooks.on('fu-sprite-animator.event', ({ token, clip, event }) => {
  if (event === 'contact') console.log(`${token.name} hit with ${clip}`);
});
```
