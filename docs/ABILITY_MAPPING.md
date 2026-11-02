# Abilities → animations

When an attack, spell, skill or item card is posted in a Project FU world, characters with a
sprite rig play a matching animation; their targets react. Nothing here lists individual
abilities: the module reads what the system already records about the item and looks it up in
an editable table. GMs change the table for the whole world, for one character, or for one item.

## What is read from Project FU
| Data | Where | Used for |
| --- | --- | --- |
| Item type | `item.type` (weapon, customWeapon, shield, basic, spell, skill, miscAbility, heroic, classFeature, optionalFeature, consumable, ritual) | the family of animation |
| Zero Power | `type === 'optionalFeature'` and `system.optionalType === 'projectfu.zeroPower'` | `zeroPower` |
| Weapon category | `system.category.value` (arcane, bow, brawling, dagger, firearm, flail, heavy, spear, sword, thrown) | `weapon:<category>` |
| Melee / ranged | `system.type.value` (weapons, NPC attacks) | `weapon:melee` / `weapon:ranged`, `basic:melee` / `basic:ranged` |
| Weapon in hand | `actor.system.equipped.mainHand` (then `offHand`) | skills used like attacks play that weapon's animation |
| Offensive spell | `system.isOffensive.value`; or the card's check type `accuracy`/`magic`; or a damage type | offensive vs support |
| Several targets | `system.targeting.rule === 'multiple'`, or 2+ targets on the card | `spell:area` |
| Damage type | card `additionalData.damage.type`, else `system.damageType` | recorded (for later effects) |
| Healing / summoning | words in the name (and, for healing, the description): heal, cure, recover, restore, revive… / summon, conjure, familiar, invoke… | `spell:healing`, `spell:summon` |
| Basic actions | card `additionalData.ruleDefinedAction` (guard, study, hinder) | `act:<action>` |
| Targets and results | card `additionalData.targets[] { uuid, result: 'hit' | 'miss' }`, `critical` | reactions |
| Guarding | the target actor has the `guard` status | `react:guarding` |
| 0 HP | `actor.system.resources.hp.value` | `react:defeat` (held) |

When **Fabula Ultima Battle Animations** (fu-animations) is active, its own classification is
used too: `api.resolve(item)` gives a style (melee, ranged, spell, support, self) for 446
compendium abilities and 611 bestiary attacks, and a projectile (arrow, orb, beam…). Without it,
the card's check type and the item data decide.

## Rule keys
Each use of an item gives a list of keys from specific to general; the first key with an entry
wins. Examples:

| Item | Keys tried |
| --- | --- |
| Bronze Sword | `weapon:sword` → `weapon:melee` → `attack` |
| Longbow | `weapon:bow` → `weapon:ranged` → `attack` |
| NPC "Volley" (ranged, fu-animations: arrow) | `basic:ranged:arrow` → `basic:ranged` → `attack` |
| Offensive spell on 3 targets with an orb | `spell:area` → `spell:projectile` → `spell:offensive` → `magic` |
| Heal | `spell:healing` → `spell:support` → `support` |
| Skill used like a melee attack, spear in hand | `weapon:spear` → `style:melee` → `attack` |
| Heroic skill (melee) | `heroic` → `weapon:<in hand>` → `style:melee` → `attack` |
| Zero Power | `zeroPower` → … |
| Guard | `act:guard` |
| Target hit / critical / guarding / missed / 0 HP | `react:hit` / `react:heavy` / `react:guarding` / `react:miss` / `react:defeat` |

Built-in choices (humanoid clips): sword, flail → Sword slash · dagger → Thrust · heavy → Heavy
slash · spear → Spear attack · brawling, shield → Unarmed attack · arcane → Staff attack · bow →
Bow attack · firearm → Firearm shot · thrown → Throw · NPC melee → Sword slash · NPC ranged →
Projectile cast (arrows → Bow attack, shots → Firearm shot) · offensive spell → Magic cast
(projectile → Projectile cast, several targets → Area spell cast) · healing → Healing · summon →
Summoning · other spells → Channel · heroic → Heavy slash (spell-like → Area spell cast) · Zero
Power → Charge · items → Healing (thrown at enemies → Throw) · ritual → Channel · Guard → Guard ·
Study → none · Hinder → Projectile cast · reactions → Light hit, Heavy hit, Block, Dodge, Defeat.
The full table is `DEFAULT_RULES` in `src/mapping/index.ts`.

## Who decides (first match wins)
1. **The item** — item sheet header menu → *Sprite animation*: one animation for this item.
   The same dialog can set it for *every item with this name (or compendium id)* in the world.
2. **The character** — actor sheet header menu → *Sprite animation choices*: any rule for this
   actor only (e.g. this knight blocks instead of dodging; this archer's skills use Bow attack).
3. **The world, per ability** — entries made from the item dialog ("every …").
4. **The world, per rule** — Settings → *Sprite animations for abilities*.
5. **Built-in**.

*No animation* at any level stops there. Keys can be made template-specific with `@template`
(`basic:melee@quadruped`), which wins for rigs of that template (Phase 6 creature clips use this).

## When a rig cannot play the choice
Each clip lists the roles it needs (`requires`). If the character's rig lacks them, the next
candidate plays: similar clips first (Bow attack → Projectile cast → Magic cast), then the
choices of the more general keys. A wolf told to "Bow attack" still does something sensible.

## Timing
- The attacker's clip starts when the card is posted, on every client (same seed, same motion).
- Targets react when the attacker's clip reaches its `contact` event.
- With fu-animations playing, its dash and projectiles decide when the hit lands. It has no
  signal for that yet, so its timing is estimated from its own sequence (melee: wind-up + dash ≈
  0.45 s, heavy ≈ 0.58 s; projectiles ≈ 0.62 s); the attacker's wind-up is stretched or shortened
  to land then, and reactions play then. Cut-ins and boss scenes add time that cannot be seen
  from outside, so for those the reactions come early. A one-line hook in fu-animations would
  make this exact (see FOUNDRY_INTEGRATION.md).
- At 0 HP the character plays *Defeat* and holds the last frame (also for tokens drawn later),
  takes no hit reactions while down, and returns to its idle when healed.

## Settings
| Setting | Default | |
| --- | --- | --- |
| Animate actions from chat cards | on | world |
| Targets react | on | world |
| Defeated pose at 0 HP | on | world |
| Sprite animations for abilities | — | the table editor (GM) |

## API
```js
SpriteAnimator.resolveClip(item)            // { clip, source, key, candidates } — what would play
SpriteAnimator.describe(item)               // how the item was read (for debugging a mapping)
SpriteAnimator.mapping.get() / .set(table)  // { rules: {key: clip}, abilities: {key: clip} }
SpriteAnimator.mapping.defaults()           // the built-in rules
await SpriteAnimator.playAction(item, { targets: [{ target: actor, result: 'hit' }] })
await SpriteAnimator.react(actor, 'miss')   // or 'hit', { critical: true }
```
