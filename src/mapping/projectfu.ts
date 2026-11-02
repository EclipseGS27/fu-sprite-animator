import { HEAL_WORDS, SUMMON_WORDS, normName, type AbilityInfo, type AbilityKind, type FuaStyle } from './index';

/*
 * Reading Project FU (system "projectfu") data into an AbilityInfo. Duck-typed: works on Foundry
 * documents and on plain objects in tests. Field names checked against Project FU 4.x data and the
 * fu-animations module (see docs/FOUNDRY_INTEGRATION.md).
 */

/** Project FU wraps many fields as { value }. */
export const val = <T = unknown>(x: unknown): T | undefined => ((x && typeof x === 'object' && 'value' in (x as object) ? (x as { value: T }).value : x) as T | undefined);

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = any;

/** The "Check" flag of a Project FU chat card. */
export interface FuCheck {
	itemUuid?: string;
	type?: string;
	critical?: boolean;
	fumble?: boolean;
	additionalData?: {
		targets?: { uuid?: string; result?: string }[];
		damage?: { type?: string };
		ruleDefinedAction?: string;
	};
}

export function isZeroPower(item: Doc): boolean {
	return item?.type === 'optionalFeature' && item?.system?.optionalType === 'projectfu.zeroPower';
}

export function kindOf(item: Doc): AbilityKind {
	if (!item) return 'other';
	if (isZeroPower(item)) return 'zeroPower';
	switch (item.type) {
		case 'weapon':
		case 'customWeapon':
			return 'weapon';
		case 'shield':
			return 'shield';
		case 'basic':
			return 'basic';
		case 'spell':
			return 'spell';
		case 'skill':
		case 'miscAbility':
			return 'skill';
		case 'heroic':
			return 'heroic';
		case 'consumable':
			return 'consumable';
		case 'ritual':
			return 'ritual';
		case 'classFeature':
		case 'optionalFeature':
			return 'feature';
		default:
			return 'other';
	}
}

/** Per-ability table key: the compendium id when the item has one, else type + name. */
export function abilityKeyOf(item: Doc): string | null {
	if (!item) return null;
	const fuid = item.system?.fuid ?? item.flags?.projectfu?.fuid;
	if (typeof fuid === 'string' && fuid) return fuid;
	const n = normName(item.name);
	return n ? `${item.type}:${n}` : null;
}

/** The category of the actor's main-hand weapon (sword, bow, …), if it has one equipped. */
export function mainHandCategory(actor: Doc): string | null {
	const items = actor?.items;
	if (!items) return null;
	const get = (id: unknown) => (typeof id === 'string' ? (items.get?.(id) ?? [...items].find((i: Doc) => i.id === id)) : null);
	const eq = actor.system?.equipped ?? {};
	for (const slot of ['mainHand', 'offHand']) {
		const it = get(eq[slot]);
		if (it && (it.type === 'weapon' || it.type === 'customWeapon')) return (val<string>(it.system?.category) as string) ?? null;
	}
	return null;
}

export interface DescribeContext {
	actor?: Doc;
	check?: FuCheck | null;
	/** Number of targets on the card (or user targets). */
	targets?: number;
	/** fu-animations' api.resolve(item, ctx).spec, when available. */
	fua?: { style?: FuaStyle; projectile?: string | null } | null;
}

function damageTypeOf(item: Doc, check?: FuCheck | null): string | null {
	const fromCheck = check?.additionalData?.damage?.type;
	if (fromCheck) return fromCheck;
	const d = item?.system?.damageType ?? item?.system?.damage?.type;
	const v = val<string>(d);
	return typeof v === 'string' && v ? v : null;
}

/** Describe one use of an item (or of a basic action when item is null) for the mapping. */
export function describeItem(item: Doc, ctx: DescribeContext = {}): AbilityInfo {
	const check = ctx.check ?? null;
	const action = check?.additionalData?.ruleDefinedAction ?? null;
	if (!item && action) return { kind: 'action', name: action, key: `act:${action}`, action };
	const kind = kindOf(item);
	const sys = item?.system ?? {};
	const name = String(item?.name ?? '');
	const damageType = damageTypeOf(item, check);
	const targets = ctx.targets ?? check?.additionalData?.targets?.length ?? 0;
	let weaponCategory: string | null = null;
	let ranged = false;
	if (kind === 'weapon' || kind === 'shield') {
		weaponCategory = kind === 'shield' ? 'shield' : ((val<string>(sys.category) as string) ?? null);
		ranged = val(sys.type) === 'ranged';
	} else if (kind === 'basic') {
		ranged = val(sys.type) === 'ranged';
	} else {
		weaponCategory = mainHandCategory(ctx.actor);
	}
	const isOffSpell = kind === 'spell' ? !!val(sys.isOffensive) : false;
	const offensive = isOffSpell || ['accuracy', 'magic'].includes(check?.type ?? '') || !!damageType || kind === 'weapon' || kind === 'basic';
	const text = `${name} ${typeof sys.description === 'string' ? sys.description.replace(/<[^>]+>/g, ' ').slice(0, 400) : ''}`;
	const healing = !offensive && HEAL_WORDS.test(text);
	const summon = SUMMON_WORDS.test(name);
	const rule = val<string>(sys.targeting?.rule);
	const area = offensive && (rule === 'multiple' || targets >= 2);
	const fuaStyle = (ctx.fua?.style ?? null) as FuaStyle | null;
	const projectile = ctx.fua?.projectile ?? null;
	return {
		kind,
		name,
		key: abilityKeyOf(item),
		weaponCategory,
		ranged,
		offensive,
		damageType,
		healing,
		summon,
		area,
		fuaStyle,
		projectile: typeof projectile === 'string' ? projectile : null,
		action: null,
	};
}
