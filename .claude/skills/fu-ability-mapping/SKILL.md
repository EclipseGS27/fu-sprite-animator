---
name: fu-ability-mapping
description: Use for Phase 5 work in fu-sprite-animator — connecting Fabula Ultima (Project FU system) abilities, weapons, spells and reactions to animation clips, combat triggers from chat cards, and the editable mapping database.
---

# Fabula Ultima ability → animation mapping

**Implemented (Phase 5).** Code: `src/mapping/index.ts` (rule keys, DEFAULT_RULES, CLIP_FALLBACKS, resolveClip/resolveReaction — pure), `src/mapping/projectfu.ts` (describeItem: Project FU data → AbilityInfo — pure, duck-typed), `src/mapping/sync.ts` (timing with fu-animations), `src/foundry/combat.ts` (chat cards → plan → socket → runPlan on every client; defeat on updateActor), `src/foundry/mapping-app.ts` (world editor, per-actor editor, item dialog), `src/ui/mapping-view.ts`. User doc: docs/ABILITY_MAPPING.md. Tests: test/unit/mapping.test.ts, test/render/integration.mjs (Phase 5 section).

Adding a rule: add the key to `RULE_GROUPS` (editor label) and `DEFAULT_RULES`, emit it from `ruleKeys()` in the right specificity order, test in mapping.test.ts. Template-specific defaults use `key@template` (Phase 6 creature rules go there, e.g. `basic:melee@quadruped`).

## Do not invent
- Read the system's data. Never hard-code individual abilities in the engine; mappings are an editable data table (world setting) with per-actor and per-item overrides.
- Reuse fu-animations' classification when present: `game.modules.get('fu-animations')?.api.resolve(item, ctx)` → `{ spec: { style: 'melee'|'ranged'|'spell'|'support'|'self'|'none', … }, source }` covers 446 compendium entries and 611 bestiary attacks.

## Project FU data (system `projectfu` ≥ 4.14)
- Chat trigger: `createChatMessage` on the author's client. Flags: `msg.getFlag('projectfu', 'Check')` → `itemUuid`, `type` ('accuracy' | 'magic' | …), `critical`, `fumble`, `additionalData.targets[] { uuid, result: 'hit'|'miss' }`, `additionalData.damage.type`, `additionalData.ruleDefinedAction` ('guard' | 'study' | 'hinder'). Items without checks: `msg.getFlag('projectfu', 'Item')`.
- Item types: weapon, customWeapon, shield, basic (NPC attacks), spell, skill, heroic, miscAbility, classFeature, optionalFeature (Zero Powers: `system.optionalType === 'projectfu.zeroPower'`), consumable, ritual.
- Weapon category `system.category.value`: arcane, bow, brawling, dagger, firearm, flail, heavy, spear, sword, thrown; `system.type.value` melee/ranged.
- NPC rank `system.rank.value` (soldier/elite/champion), `system.villain.value`.

## Proposed default rules (data, editable)
- weapon sword/dagger/flail → `sword-slash`; heavy → `heavy-slash`; spear → `thrust`; bow → `bow-attack`; firearm/thrown → ranged clips; brawling → `unarmed-attack`; arcane → `staff-attack`.
- spell offensive → `magic-cast` (projectile/area variants); healing/support → `healing`; summon words → `summoning`.
- Guard → `guard`; target result hit → `light-hit`/`heavy-hit` by damage or crit; miss → `dodge`; HP 0 → `defeat`.
- Resolution order: item override → actor profile → world ability entry → weapon category → classifier.

## Timing with fu-animations
- Its melee: anticipation 200–320 ms, dash 110–260 ms, contact, return. Start the attacker's clip when the plan starts; play target reactions at contact.
- Best: a small additive hook in fu-animations (`fu-animations.beat`) — propose it to the user; do not edit that module unasked.
