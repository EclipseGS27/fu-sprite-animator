import { describe, expect, it } from 'vitest';
import { TimeWarp } from '../../src/core/clip';
import { CLIP_FALLBACKS, DEFAULT_RULES, NONE, RULE_GROUPS, parseTable, pickPlayable, reactionKeys, resolveClip, resolveReaction, ruleKeys, type AbilityInfo } from '../../src/mapping';
import { abilityKeyOf, describeItem, isZeroPower, mainHandCategory } from '../../src/mapping/projectfu';
import { contactTime, estimateFuaContact, timingForContact } from '../../src/mapping/sync';
import { getClip } from '../../src/presets';

/* Plain objects shaped like Project FU 4.x items (values wrapped as { value } where the system does). */
const weapon = (category: string, type = 'melee', name = `A ${category}`) => ({ type: 'weapon', name, system: { category: { value: category }, type: { value: type } } });
const spell = (name: string, o: { offensive?: boolean; rule?: string; damageType?: string; description?: string } = {}) => ({
	type: 'spell',
	name,
	system: { isOffensive: { value: !!o.offensive }, targeting: o.rule ? { rule: o.rule } : undefined, damageType: o.damageType ? { value: o.damageType } : undefined, description: o.description ?? '' },
});
const items = (list: { id: string; type: string; system: unknown }[]) => Object.assign(list, { get: (id: string) => list.find((i) => i.id === id) });
const actorWith = (mainHand: { id: string; type: string; system: unknown } | null) => ({ items: items(mainHand ? [mainHand] : []), system: { equipped: { mainHand: mainHand?.id ?? null } } });

const clipOf = (item: unknown, ctx = {}, layers = {}) => resolveClip(describeItem(item, ctx), layers).clip;

describe('reading Project FU items', () => {
	it('weapons by category, shields, NPC attacks', () => {
		expect(clipOf(weapon('sword'))).toBe('sword-slash');
		expect(clipOf(weapon('dagger'))).toBe('thrust');
		expect(clipOf(weapon('heavy'))).toBe('heavy-slash');
		expect(clipOf(weapon('spear'))).toBe('spear-attack');
		expect(clipOf(weapon('arcane'))).toBe('staff-attack');
		expect(clipOf(weapon('brawling'))).toBe('unarmed-attack');
		expect(clipOf(weapon('bow', 'ranged'))).toBe('bow-attack');
		expect(clipOf(weapon('firearm', 'ranged'))).toBe('firearm-shot');
		expect(clipOf(weapon('thrown', 'ranged'))).toBe('throw');
		expect(clipOf({ type: 'shield', name: 'Buckler', system: {} })).toBe('unarmed-attack');
		// an unknown category still animates as a melee or ranged attack
		expect(clipOf(weapon('whip'))).toBe('sword-slash');
		expect(clipOf(weapon('sling', 'ranged'))).toBe('throw');
		expect(clipOf({ type: 'basic', name: 'Claws', system: { type: { value: 'melee' } } })).toBe('sword-slash');
		expect(clipOf({ type: 'basic', name: 'Spit', system: { type: { value: 'ranged' } } })).toBe('projectile-cast');
		expect(clipOf({ type: 'basic', name: 'Volley', system: { type: { value: 'ranged' } } }, { fua: { style: 'ranged', projectile: 'arrow' } })).toBe('bow-attack');
	});

	it('spells: offensive, area, projectile, healing, summoning, support', () => {
		expect(clipOf(spell('Flare', { offensive: true, damageType: 'fire' }))).toBe('magic-cast');
		expect(clipOf(spell('Thunderstorm', { offensive: true, rule: 'multiple' }))).toBe('area-cast');
		expect(clipOf(spell('Flare', { offensive: true }), { targets: 3 })).toBe('area-cast');
		expect(clipOf(spell('Ice Lance', { offensive: true }), { fua: { style: 'spell', projectile: 'orb' } })).toBe('projectile-cast');
		expect(clipOf(spell('Heal'))).toBe('healing');
		expect(clipOf(spell('Mending Light', { description: '<p>The target recovers 40 Hit Points.</p>' }))).toBe('healing');
		expect(clipOf(spell('Summon Spirit'))).toBe('summoning');
		expect(clipOf(spell('Haste'))).toBe('channel');
		// a damaging spell is never "healing", whatever its text says
		expect(clipOf(spell('Life Drain', { offensive: true }))).toBe('magic-cast');
	});

	it('skills follow fu-animations’ style and the weapon in hand', () => {
		const spear = { id: 'w1', type: 'weapon', system: { category: { value: 'spear' } } };
		const skill = { type: 'skill', name: 'Piercing Strike', system: {} };
		expect(clipOf(skill, { actor: actorWith(spear), fua: { style: 'melee' } })).toBe('spear-attack');
		expect(clipOf(skill, { actor: actorWith(null), fua: { style: 'melee' } })).toBe('sword-slash');
		expect(clipOf(skill, { fua: { style: 'spell' } })).toBe('magic-cast');
		expect(clipOf(skill, { fua: { style: 'self' } })).toBe('charge');
		// without fu-animations: the card says it deals damage
		expect(clipOf(skill, { actor: actorWith(spear), check: { type: 'accuracy' } })).toBe('spear-attack');
		expect(clipOf(skill)).toBe('charge');
		expect(mainHandCategory(actorWith(spear))).toBe('spear');
	});

	it('heroics, Zero Powers, items, rituals and basic actions', () => {
		expect(clipOf({ type: 'heroic', name: 'Big Hit', system: {} }, { fua: { style: 'melee' } })).toBe('heavy-slash');
		expect(clipOf({ type: 'heroic', name: 'Arcane Burst', system: {} }, { fua: { style: 'spell' } })).toBe('area-cast');
		const zero = { type: 'optionalFeature', name: 'Zero Power', system: { optionalType: 'projectfu.zeroPower' } };
		expect(isZeroPower(zero)).toBe(true);
		expect(clipOf(zero)).toBe('charge');
		expect(clipOf({ type: 'consumable', name: 'Remedy', system: {} })).toBe('healing');
		expect(clipOf({ type: 'consumable', name: 'Fire Shard', system: {} }, { check: { type: 'accuracy', additionalData: { damage: { type: 'fire' } } } })).toBe('throw');
		expect(clipOf({ type: 'ritual', name: 'Ritual', system: {} })).toBe('channel');
		expect(clipOf(null, { check: { additionalData: { ruleDefinedAction: 'guard' } } })).toBe('guard');
		expect(clipOf(null, { check: { additionalData: { ruleDefinedAction: 'hinder' } } })).toBe('projectile-cast');
		expect(clipOf(null, { check: { additionalData: { ruleDefinedAction: 'study' } } })).toBeNull();
	});

	it('ability keys: the compendium id, else type and name', () => {
		expect(abilityKeyOf({ type: 'spell', name: 'Fire Ball!', system: { fuid: 'fireball' } })).toBe('fireball');
		expect(abilityKeyOf({ type: 'spell', name: 'Fíre  Ball!', system: {} })).toBe('spell:fire ball');
		expect(abilityKeyOf(null)).toBeNull();
	});
});

describe('resolution order', () => {
	const sword = describeItem(weapon('sword', 'melee', 'Bronze Sword'));
	const world = { rules: { 'weapon:sword': 'thrust' }, abilities: { 'weapon:bronze sword': 'dual-wield-attack' } };

	it('item → actor → world ability → world rule → built-in', () => {
		expect(resolveClip(sword).source).toBe('default');
		expect(resolveClip(sword, { world: { rules: world.rules, abilities: {} } })).toMatchObject({ clip: 'thrust', source: 'rule' });
		expect(resolveClip(sword, { world })).toMatchObject({ clip: 'dual-wield-attack', source: 'ability' });
		expect(resolveClip(sword, { world, actor: { 'weapon:sword': 'heavy-slash' } })).toMatchObject({ clip: 'heavy-slash', source: 'actor' });
		expect(resolveClip(sword, { world, actor: { 'weapon:sword': 'heavy-slash' }, item: { '*': 'spear-attack' } })).toMatchObject({ clip: 'spear-attack', source: 'item' });
	});

	it('"none" stops at its level', () => {
		expect(resolveClip(sword, { item: { '*': NONE } }).clip).toBeNull();
		expect(resolveClip(sword, { actor: { attack: NONE } }).clip).toBeNull();
		expect(resolveClip(sword, { world: { rules: { 'weapon:sword': NONE }, abilities: {} } }).candidates).toEqual([]);
	});

	it('template-specific entries win for rigs of that template', () => {
		const bite = { rules: { 'basic:melee@quadruped': 'bite' }, abilities: {} };
		const claws = describeItem({ type: 'basic', name: 'Claws', system: { type: { value: 'melee' } } });
		expect(resolveClip(claws, { world: bite, template: 'quadruped' }).clip).toBe('bite');
		expect(resolveClip(claws, { world: bite, template: 'humanoid' }).clip).toBe('sword-slash');
	});

	it('candidates continue with similar clips, so any rig plays something it can', () => {
		const bow = resolveClip(describeItem(weapon('bow', 'ranged')));
		expect(bow.candidates.slice(0, 3)).toEqual(['bow-attack', 'projectile-cast', 'magic-cast']);
		expect(pickPlayable(bow.candidates, (id) => id !== 'bow-attack')).toBe('projectile-cast');
		expect(pickPlayable(bow.candidates, () => false)).toBeNull();
	});

	it('rule keys go from specific to general', () => {
		const info: AbilityInfo = { kind: 'spell', name: 'x', key: null, offensive: true, area: true, projectile: 'orb' };
		expect(ruleKeys(info)).toEqual(['spell:area', 'spell:projectile', 'spell:offensive', 'magic']);
	});
});

describe('reactions', () => {
	it('hit, heavy, guarding, miss, defeat', () => {
		expect(resolveReaction({ result: 'hit' }).clip).toBe('light-hit');
		expect(resolveReaction({ result: 'hit', critical: true }).clip).toBe('heavy-hit');
		expect(resolveReaction({ result: 'hit', damageFraction: 0.4 }).clip).toBe('heavy-hit');
		expect(resolveReaction({ result: 'hit', guarding: true }).clip).toBe('block');
		expect(resolveReaction({ result: 'miss' }).clip).toBe('dodge');
		expect(resolveReaction({ result: 'hit', defeated: true }).clip).toBe('defeat');
		expect(reactionKeys({ result: 'none' })).toEqual([]);
		expect(resolveReaction({ result: 'none' }).clip).toBeNull();
		expect(resolveReaction({ result: 'miss' }, { actor: { 'react:miss': 'parry' } }).clip).toBe('parry');
	});
});

describe('tables', () => {
	it('every built-in choice and fallback is a real clip', () => {
		for (const [key, id] of Object.entries(DEFAULT_RULES)) if (id !== NONE) expect(getClip(id), `${key} → ${id}`).toBeTruthy();
		for (const [id, list] of Object.entries(CLIP_FALLBACKS)) {
			expect(getClip(id), id).toBeTruthy();
			for (const f of list) expect(getClip(f), `${id} → ${f}`).toBeTruthy();
		}
	});

	it('every key in the editor has a built-in choice', () => {
		for (const g of RULE_GROUPS) for (const [k] of g.keys) expect(DEFAULT_RULES[k], k).toBeDefined();
	});

	it('stored tables are cleaned', () => {
		expect(parseTable(null)).toEqual({ rules: {}, abilities: {} });
		expect(parseTable({ rules: { a: 'x', b: 3, c: '' }, abilities: 'nope', extra: 1 })).toEqual({ rules: { a: 'x' }, abilities: {} });
	});
});

describe('timing with fu-animations', () => {
	it('stretches only the wind-up so contact lands at the target time', () => {
		const clip = getClip('sword-slash')!;
		const c = contactTime(clip)!;
		expect(c).toBeGreaterThan(0);
		for (const target of [0.45, 0.58, c]) {
			const timing = timingForContact(clip, target);
			const warp = new TimeWarp(clip, timing);
			const landed = warp.toPlay(c);
			if (timing) expect(Math.abs(landed - target)).toBeLessThan(0.02);
			else expect(Math.abs(landed - target)).toBeLessThan(0.05);
		}
		// never stretched beyond sensible limits
		expect(timingForContact(clip, 10)!.anticipation).toBeLessThanOrEqual(2.5);
		expect(timingForContact(clip, 0)!.anticipation).toBeGreaterThanOrEqual(0.6);
		expect(estimateFuaContact('melee', { heavy: true })).toBeGreaterThan(estimateFuaContact('melee'));
	});
});
