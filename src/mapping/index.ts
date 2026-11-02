/*
 * Fabula Ultima ability → animation mapping. Pure: no Foundry globals, so it is unit-tested with
 * plain objects shaped like Project FU data.
 *
 * Nothing here knows individual abilities. An item is described by what the system already
 * records (item type, weapon category, offensive flag, targeting, damage type, fu-animations'
 * classification); the description gives rule keys from specific to general ("weapon:sword",
 * "weapon:melee", "attack"); an editable table maps keys to clips. GMs override per world, per
 * actor and per item.
 */

/** "No animation" in any table. */
export const NONE = 'none';

export type AbilityKind =
	| 'weapon'
	| 'shield'
	| 'basic'
	| 'spell'
	| 'skill'
	| 'heroic'
	| 'zeroPower'
	| 'consumable'
	| 'ritual'
	| 'feature'
	| 'action'
	| 'other';

/** fu-animations' style for an ability (its api.resolve), when that module is active. */
export type FuaStyle = 'melee' | 'ranged' | 'spell' | 'support' | 'self' | 'none';

/** Everything the mapping needs to know about one use of an ability. */
export interface AbilityInfo {
	kind: AbilityKind;
	name: string;
	/** Stable key for the per-ability table: the Project FU id (fuid), or "type:normalised name", or "act:guard". */
	key: string | null;
	/** Project FU weapon category (sword, bow, …) of the weapon used, or of the user's main-hand weapon. */
	weaponCategory?: string | null;
	ranged?: boolean;
	offensive?: boolean;
	damageType?: string | null;
	healing?: boolean;
	summon?: boolean;
	/** Area spells: targets several creatures (targeting rule "multiple" or several targets on the card). */
	area?: boolean;
	/** fu-animations classification, if available. */
	fuaStyle?: FuaStyle | null;
	/** fu-animations projectile (arrow, orb, beam, …), if any. */
	projectile?: string | null;
	/** Basic actions without an item: guard, study, hinder. */
	action?: string | null;
}

/** World table: every key → clip id. Missing keys fall back to DEFAULT_RULES. */
export interface MappingTable {
	/** Rule keys ("weapon:sword", "spell:healing", "react:hit", …). */
	rules: Record<string, string>;
	/** Per-ability keys (fuid or "type:name"). */
	abilities: Record<string, string>;
}

/** Overrides at one level (actor profile or item flag): any rule or ability key, or "*" for everything. */
export type MappingOverrides = Record<string, string>;

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

/** Labels for the mapping editor, in display order, grouped. */
export const RULE_GROUPS: { title: string; keys: [string, string][] }[] = [
	{
		title: 'Weapons (by Project FU category)',
		keys: [
			['weapon:sword', 'Sword'],
			['weapon:dagger', 'Dagger'],
			['weapon:flail', 'Flail'],
			['weapon:heavy', 'Heavy'],
			['weapon:spear', 'Spear'],
			['weapon:brawling', 'Brawling'],
			['weapon:arcane', 'Arcane'],
			['weapon:bow', 'Bow'],
			['weapon:firearm', 'Firearm'],
			['weapon:thrown', 'Thrown'],
			['weapon:shield', 'Shield'],
			['weapon:melee', 'Other melee weapon'],
			['weapon:ranged', 'Other ranged weapon'],
		],
	},
	{
		title: 'NPC attacks',
		keys: [
			['basic:melee', 'Melee attack'],
			['basic:ranged', 'Ranged attack'],
			['basic:ranged:arrow', 'Ranged attack with arrows'],
			['basic:ranged:bullet', 'Ranged attack with shots'],
		],
	},
	{
		title: 'Spells',
		keys: [
			['spell:offensive', 'Offensive spell'],
			['spell:projectile', 'Offensive spell with a projectile'],
			['spell:area', 'Offensive spell on several targets'],
			['spell:healing', 'Healing spell'],
			['spell:summon', 'Summoning spell'],
			['spell:support', 'Other spell'],
		],
	},
	{
		title: 'Skills, features and items',
		keys: [
			['style:melee', 'Skill used like a melee attack'],
			['style:ranged', 'Skill used like a ranged attack'],
			['style:spell', 'Skill used like a spell'],
			['style:support', 'Skill that helps others'],
			['style:self', 'Skill on oneself'],
			['heroic', 'Heroic skill'],
			['zeroPower', 'Zero Power'],
			['consumable', 'Item (potion, elixir…)'],
			['consumable:offensive', 'Item thrown at enemies'],
			['ritual', 'Ritual'],
		],
	},
	{
		title: 'Basic actions',
		keys: [
			['act:guard', 'Guard'],
			['act:study', 'Study'],
			['act:hinder', 'Hinder'],
		],
	},
	{
		title: 'Reactions of the target',
		keys: [
			['react:hit', 'Hit'],
			['react:heavy', 'Critical or big hit'],
			['react:guarding', 'Hit while guarding'],
			['react:miss', 'Missed'],
			['react:defeat', 'Reduced to 0 HP'],
		],
	},
];

/** The built-in table (humanoid clips). Phase 6 adds template-specific keys ("basic:melee@quadruped"). */
export const DEFAULT_RULES: Record<string, string> = {
	'weapon:sword': 'sword-slash',
	'weapon:dagger': 'thrust',
	'weapon:flail': 'sword-slash',
	'weapon:heavy': 'heavy-slash',
	'weapon:spear': 'spear-attack',
	'weapon:brawling': 'unarmed-attack',
	'weapon:arcane': 'staff-attack',
	'weapon:bow': 'bow-attack',
	'weapon:firearm': 'firearm-shot',
	'weapon:thrown': 'throw',
	'weapon:shield': 'unarmed-attack',
	'weapon:melee': 'sword-slash',
	'weapon:ranged': 'throw',
	'basic:melee': 'sword-slash',
	'basic:ranged': 'projectile-cast',
	'basic:ranged:arrow': 'bow-attack',
	'basic:ranged:bullet': 'firearm-shot',
	'spell:offensive': 'magic-cast',
	'spell:projectile': 'projectile-cast',
	'spell:area': 'area-cast',
	'spell:healing': 'healing',
	'spell:summon': 'summoning',
	'spell:support': 'channel',
	'style:melee': 'sword-slash',
	'style:ranged': 'projectile-cast',
	'style:spell': 'magic-cast',
	'style:support': 'channel',
	'style:self': 'charge',
	heroic: 'heavy-slash',
	'heroic:spell': 'area-cast',
	zeroPower: 'charge',
	consumable: 'healing',
	'consumable:offensive': 'throw',
	ritual: 'channel',
	'act:guard': 'guard',
	'act:study': NONE,
	'act:hinder': 'projectile-cast',
	'react:hit': 'light-hit',
	'react:heavy': 'heavy-hit',
	'react:guarding': 'block',
	'react:miss': 'dodge',
	'react:defeat': 'defeat',
	// last resorts by family, when nothing more specific matches or the rig lacks the roles
	attack: 'sword-slash',
	magic: 'magic-cast',
	support: 'channel',
};

/**
 * Clips to try when the chosen clip cannot play on a rig (it lacks the roles), most similar first.
 * Phase 6 creature clips add their own.
 */
export const CLIP_FALLBACKS: Record<string, string[]> = {
	'bow-attack': ['projectile-cast', 'magic-cast'],
	'firearm-shot': ['projectile-cast', 'magic-cast'],
	throw: ['projectile-cast', 'magic-cast'],
	'spear-attack': ['thrust', 'sword-slash'],
	thrust: ['sword-slash'],
	'dual-wield-attack': ['sword-slash'],
	'staff-attack': ['sword-slash'],
	'unarmed-attack': ['thrust', 'sword-slash'],
	'heavy-slash': ['sword-slash'],
	'projectile-cast': ['magic-cast'],
	'area-cast': ['magic-cast'],
	summoning: ['area-cast', 'magic-cast'],
	healing: ['channel', 'magic-cast'],
	channel: ['magic-cast'],
	charge: ['magic-cast'],
	block: ['guard', 'light-hit'],
	guard: ['block'],
	dodge: ['light-hit'],
	'heavy-hit': ['light-hit'],
	stagger: ['heavy-hit', 'light-hit'],
	knockback: ['heavy-hit', 'light-hit'],
	knockdown: ['heavy-hit', 'light-hit'],
	defeat: ['knockdown', 'heavy-hit'],
};

export function emptyTable(): MappingTable {
	return { rules: {}, abilities: {} };
}

/** Accept a stored table, dropping anything malformed. */
export function parseTable(raw: unknown): MappingTable {
	const out = emptyTable();
	const r = raw as Partial<MappingTable> | null;
	for (const k of ['rules', 'abilities'] as const) {
		const src = r?.[k];
		if (!src || typeof src !== 'object') continue;
		for (const [key, clip] of Object.entries(src)) if (typeof key === 'string' && typeof clip === 'string' && clip) out[k][key] = clip;
	}
	return out;
}

/* ------------------------------------------------------------------ */
/*  Classification                                                     */
/* ------------------------------------------------------------------ */

const HEAL_WORDS = /\b(heal|healing|cure|recover|recovery|regen|regenerat|restor|revive|resurrect|life|mend|remedy|aid)/i;
const SUMMON_WORDS = /\b(summon|conjur|familiar|invoc|invok|call forth)/i;
const ARROWS = /arrow|bolt/i;
const BULLETS = /bullet|shot|gun/i;
const RANGED_CATS = new Set(['bow', 'firearm', 'thrown']);

export { HEAL_WORDS, SUMMON_WORDS };

/** Rule keys for an ability, most specific first. Reactions use reactionKeys(). */
export function ruleKeys(a: AbilityInfo): string[] {
	const keys: string[] = [];
	const cat = a.weaponCategory ?? null;
	const style = a.fuaStyle && a.fuaStyle !== 'none' ? a.fuaStyle : null;
	switch (a.kind) {
		case 'weapon':
		case 'shield': {
			if (a.kind === 'shield') keys.push('weapon:shield');
			else if (cat) keys.push(`weapon:${cat}`);
			keys.push(a.ranged || RANGED_CATS.has(cat ?? '') ? 'weapon:ranged' : 'weapon:melee', 'attack');
			break;
		}
		case 'basic': {
			if (a.ranged) {
				if (a.projectile && ARROWS.test(a.projectile)) keys.push('basic:ranged:arrow');
				else if (a.projectile && BULLETS.test(a.projectile)) keys.push('basic:ranged:bullet');
				keys.push('basic:ranged');
			} else keys.push('basic:melee');
			keys.push('attack');
			break;
		}
		case 'spell': {
			if (a.summon) keys.push('spell:summon');
			if (a.offensive) {
				if (a.area) keys.push('spell:area');
				if (a.projectile) keys.push('spell:projectile');
				keys.push('spell:offensive', 'magic');
			} else {
				if (a.healing) keys.push('spell:healing');
				keys.push('spell:support', 'support');
			}
			break;
		}
		case 'heroic': {
			if (style === 'spell' || style === 'support') keys.push('heroic:spell');
			keys.push('heroic');
			keys.push(...styleKeys(a, style));
			break;
		}
		case 'zeroPower':
			keys.push('zeroPower', ...styleKeys(a, style));
			break;
		case 'consumable':
			if (a.offensive) keys.push('consumable:offensive');
			keys.push('consumable', 'support');
			break;
		case 'ritual':
			keys.push('ritual', 'support');
			break;
		case 'action':
			if (a.action) keys.push(`act:${a.action}`);
			break;
		default:
			keys.push(...styleKeys(a, style));
	}
	return [...new Set(keys)];
}

/** Skills and features: by fu-animations' style, else by what the card says. */
function styleKeys(a: AbilityInfo, style: FuaStyle | null): string[] {
	const s: FuaStyle = style ?? (a.offensive ? (a.weaponCategory ? (RANGED_CATS.has(a.weaponCategory) ? 'ranged' : 'melee') : 'spell') : a.healing ? 'support' : 'self');
	const keys: string[] = [];
	if (s === 'melee' || s === 'ranged') {
		// a weapon skill looks like an attack with the weapon in hand
		if (a.weaponCategory) keys.push(`weapon:${a.weaponCategory}`);
		keys.push(`style:${s}`, 'attack');
	} else if (s === 'spell') keys.push('style:spell', 'magic');
	else if (s === 'support') keys.push(...(a.healing ? ['spell:healing'] : []), 'style:support', 'support');
	else if (s === 'self') keys.push('style:self', 'support');
	return keys;
}

export type ReactionOutcome = 'hit' | 'miss' | 'none';

export interface ReactionInfo {
	result: ReactionOutcome;
	critical?: boolean;
	/** The target is guarding (Guard action this round). */
	guarding?: boolean;
	/** Damage as a fraction of the target's max HP, when known. */
	damageFraction?: number;
	/** Reduced to 0 HP. */
	defeated?: boolean;
}

/** Rule keys for a target's reaction, most specific first; empty when nothing should play. */
export function reactionKeys(r: ReactionInfo): string[] {
	if (r.defeated) return ['react:defeat', 'react:heavy', 'react:hit'];
	if (r.result === 'miss') return ['react:miss'];
	if (r.result !== 'hit') return [];
	if (r.guarding) return ['react:guarding', 'react:hit'];
	if (r.critical || (r.damageFraction ?? 0) >= 0.3) return ['react:heavy', 'react:hit'];
	return ['react:hit'];
}

/* ------------------------------------------------------------------ */
/*  Resolution                                                         */
/* ------------------------------------------------------------------ */

export type MappingSource = 'item' | 'actor' | 'ability' | 'rule' | 'default';

export interface Resolution {
	/** The clip to play, or null for "no animation". */
	clip: string | null;
	source: MappingSource | null;
	/** The key that decided it. */
	key: string | null;
	/** Every clip worth trying, in order (the first one the rig can play wins). */
	candidates: string[];
}

export interface ResolveLayers {
	/** Item flag: one clip for this item (key "*"), or per rule key. */
	item?: MappingOverrides | null;
	/** Actor profile overrides: per ability key or rule key. */
	actor?: MappingOverrides | null;
	/** World table. */
	world?: MappingTable | null;
	/** Rig template (humanoid, quadruped, …): "key@template" entries win over "key". */
	template?: string | null;
}

/**
 * Pick the clip for an ability use. Order: item → actor → world ability entry → world rules →
 * built-in rules; within each, template-specific keys first. "none" anywhere stops with no animation.
 */
export function resolveClip(a: AbilityInfo, layers: ResolveLayers = {}): Resolution {
	return resolveKeys(a.key, ruleKeys(a), layers);
}

/** Pick the reaction clip for a target. */
export function resolveReaction(r: ReactionInfo, layers: ResolveLayers = {}): Resolution {
	const keys = reactionKeys(r);
	if (!keys.length) return { clip: null, source: null, key: null, candidates: [] };
	return resolveKeys(null, keys, { ...layers, item: null });
}

function resolveKeys(abilityKey: string | null, rules: string[], layers: ResolveLayers): Resolution {
	const tpl = layers.template ?? null;
	const variants = (k: string) => (tpl ? [`${k}@${tpl}`, k] : [k]);
	const chosen: { clip: string; source: MappingSource; key: string }[] = [];
	const look = (table: Record<string, string> | null | undefined, keys: string[], source: MappingSource) => {
		if (!table) return;
		for (const k of keys) for (const kv of variants(k)) if (table[kv]) chosen.push({ clip: table[kv]!, source, key: kv });
	};
	const allKeys = [...(abilityKey ? [abilityKey] : []), ...rules];
	if (layers.item) look(layers.item, ['*', ...allKeys], 'item');
	look(layers.actor, allKeys, 'actor');
	if (abilityKey) look(layers.world?.abilities, [abilityKey], 'ability');
	look(layers.world?.rules, rules, 'rule');
	look(DEFAULT_RULES, rules, 'default');
	const first = chosen[0];
	if (!first || first.clip === NONE) return { clip: null, source: first?.source ?? null, key: first?.key ?? null, candidates: [] };
	const candidates: string[] = [];
	const add = (c: string) => {
		if (c && c !== NONE && !candidates.includes(c)) candidates.push(c);
	};
	add(first.clip);
	for (const c of CLIP_FALLBACKS[first.clip] ?? []) add(c);
	for (const c of chosen.slice(1)) {
		if (c.clip === NONE) break;
		add(c.clip);
	}
	return { clip: first.clip, source: first.source, key: first.key, candidates };
}

/**
 * The first candidate a rig can play: the clip exists and the rig has the roles it requires.
 * `has(clipId)` answers both; returns null when none fits.
 */
export function pickPlayable(candidates: string[], playable: (clipId: string) => boolean): string | null {
	for (const c of candidates) if (playable(c)) return c;
	return null;
}

/* ------------------------------------------------------------------ */
/*  Keys                                                               */
/* ------------------------------------------------------------------ */

export function normName(s: string | null | undefined): string {
	return String(s ?? '')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/** Human label for a rule key ("weapon:sword" → "Sword"). */
export function ruleLabel(key: string): string {
	const [base, tpl] = key.split('@');
	for (const g of RULE_GROUPS) for (const [k, label] of g.keys) if (k === base) return tpl ? `${label} (${tpl})` : label;
	return key;
}
