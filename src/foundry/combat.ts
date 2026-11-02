import { getClip } from '../presets';
import { parseTable, resolveClip, resolveReaction, type AbilityInfo, type MappingOverrides, type MappingTable, type ReactionOutcome } from '../mapping';
import { describeItem, val, type FuCheck } from '../mapping/projectfu';
import { contactTime, estimateFuaContact, timingForContact } from '../mapping/sync';
import { MODULE_ID, SOCKET, setting, type AnimationProfile } from './constants';
import { tokenAnimators, type TokenAnimator } from './tokens';

/*
 * Combat triggers. When a Project FU chat card is posted, the client that posted it describes the
 * action (item, targets, hit/miss, critical) and broadcasts it; every client then picks the clips
 * for its own copy of each token (same settings everywhere, so the same choice) and plays:
 * the attacker's clip at once, the targets' reactions at the moment of contact, and a held
 * defeat pose when an actor drops to 0 HP (from the actor update itself, on every client).
 *
 * fu-animations keeps doing its effects and token movement; this only changes token textures.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = any;
type Token = any;

export const ITEM_FLAG = 'clip';

/** What one chat card asks every client to play. Plain data: it goes over the socket. */
export interface ActionPlan {
	scene: string;
	source: string | null;
	info: AbilityInfo;
	/** The item's own choice (item flag), if any. */
	itemClip: string | null;
	critical: boolean;
	fumble: boolean;
	seed: number;
	targets: { id: string; result: ReactionOutcome }[];
	/** fu-animations' view of the action, for timing. */
	fua: { style: string | null; projectile: boolean; heavy: boolean } | null;
}

/* ------------------------------------------------------------------ */
/*  Settings and tables                                                */
/* ------------------------------------------------------------------ */

export function mappingTable(): MappingTable {
	return parseTable(setting('mapping'));
}

export async function setMappingTable(table: MappingTable): Promise<void> {
	await game.settings.set(MODULE_ID, 'mapping', parseTable(table));
}

const actorOverrides = (actor: Doc): MappingOverrides | null => (actor?.getFlag?.(MODULE_ID, 'profile') as AnimationProfile | undefined)?.map ?? null;

function itemClipOf(item: Doc): string | null {
	const c = item?.getFlag?.(MODULE_ID, ITEM_FLAG);
	return typeof c === 'string' && c ? c : null;
}

/** fu-animations is installed, active and playing on this client. */
export function fuaPlaying(): boolean {
	const mod = game.modules?.get?.('fu-animations');
	if (!mod?.active) return false;
	try {
		return game.settings.get('fu-animations', 'enabled') !== false;
	} catch {
		return true;
	}
}

function fuaSpec(item: Doc, ctx: Record<string, unknown>): { style?: string; projectile?: string | null; impact?: { power?: string } } | null {
	const api = game.modules?.get?.('fu-animations')?.active ? game.modules.get('fu-animations')?.api : null;
	if (!api?.resolve || !item) return null;
	try {
		return api.resolve(item, ctx)?.spec ?? null;
	} catch {
		return null;
	}
}

/* ------------------------------------------------------------------ */
/*  Reading chat cards                                                 */
/* ------------------------------------------------------------------ */

/** foundry.utils.fromUuidSync (v13), with the older global as a fallback. */
function fromUuid(uuid: string): Doc {
	const fn = foundry.utils?.fromUuidSync ?? (globalThis as { fromUuidSync?: (u: string) => Doc }).fromUuidSync;
	return fn ? fn(uuid) : null;
}

function tokenFromUuid(uuid: string | undefined): Token | null {
	if (!uuid || !canvas?.ready) return null;
	let doc: Doc = null;
	try {
		doc = fromUuid(uuid);
	} catch {
		return null;
	}
	if (doc?.documentName === 'Token') return canvas.tokens.get(doc.id) ?? null;
	const actor = doc?.documentName === 'Actor' ? doc : doc?.actor;
	if (actor?.isToken && actor.token) return canvas.tokens.get(actor.token.id) ?? null;
	return actor?.getActiveTokens?.(false, false)?.[0] ?? null;
}

function sourceToken(msg: Doc, item: Doc): Token | null {
	const sp = msg.speaker ?? {};
	if (sp.token && (!sp.scene || sp.scene === canvas.scene?.id)) {
		const t = canvas.tokens.get(sp.token);
		if (t) return t;
	}
	const actor = item?.actor ?? (sp.actor ? game.actors.get(sp.actor) : null);
	return actor?.getActiveTokens?.(false, false)?.[0] ?? null;
}

/** Turn a chat message into a plan, or null when it is not an action. */
export function planFromMessage(msg: Doc): ActionPlan | null {
	if (!canvas?.ready) return null;
	const check = (msg.getFlag?.('projectfu', 'Check') ?? null) as FuCheck | null;
	const itemUuid = check?.itemUuid ?? (msg.getFlag?.('projectfu', 'Item') as string | undefined);
	const action = check?.additionalData?.ruleDefinedAction ?? null;
	let item: Doc = null;
	if (itemUuid) {
		try {
			item = fromUuid(itemUuid);
		} catch {
			item = null;
		}
	}
	if (!item && !action) return null;
	const src = sourceToken(msg, item);
	const listed = Array.isArray(check?.additionalData?.targets) ? check!.additionalData!.targets! : null;
	const targets: { token: Token; result: ReactionOutcome }[] = listed?.length
		? listed.map((t) => ({ token: tokenFromUuid(t.uuid), result: (t.result === 'hit' || t.result === 'miss' ? t.result : 'none') as ReactionOutcome })).filter((t) => t.token)
		: [...(game.user?.targets ?? [])].map((t: Token) => ({ token: t, result: 'none' as ReactionOutcome }));
	const damageType = check?.additionalData?.damage?.type ?? null;
	const offensive = ['accuracy', 'magic'].includes(check?.type ?? '') || !!damageType;
	const spec = item ? fuaSpec(item, { offensive, hasTargets: targets.length > 0, damageType }) : null;
	const info = describeItem(item, { actor: item?.actor ?? src?.actor, check, targets: targets.length, fua: spec ? { style: spec.style as never, projectile: spec.projectile ?? null } : null });
	if (!src && !targets.length) return null;
	return {
		scene: canvas.scene.id,
		source: src?.id ?? null,
		info,
		itemClip: itemClipOf(item),
		critical: !!check?.critical,
		fumble: !!check?.fumble,
		seed: Math.floor(Math.random() * 1e9),
		targets: targets.filter((t) => t.token !== src).map((t) => ({ id: t.token.id, result: t.result })),
		fua: spec ? { style: spec.style ?? null, projectile: !!spec.projectile, heavy: spec.impact?.power === 'heavy' || info.kind === 'heroic' || info.kind === 'zeroPower' } : null,
	};
}

/* ------------------------------------------------------------------ */
/*  Playing                                                            */
/* ------------------------------------------------------------------ */

function guarding(actor: Doc): boolean {
	return !!actor?.statuses?.has?.('guard');
}

async function animatorFor(tokenId: string | null): Promise<TokenAnimator | null> {
	if (!tokenId) return null;
	const token = canvas.tokens?.get(tokenId);
	if (!token) return null;
	if (!tokenAnimators.get(tokenId)) await tokenAnimators.refresh(token);
	return tokenAnimators.get(tokenId) ?? null;
}

/** Clip candidates for one ability on one animated token (its template, its actor's overrides). */
export function clipsFor(a: TokenAnimator | null, info: AbilityInfo, itemClip: string | null): string[] {
	const res = resolveClip(info, { item: itemClip ? { '*': itemClip } : null, actor: actorOverrides(a?.token?.actor), world: mappingTable(), template: a?.template ?? null });
	return res.candidates;
}

/** Play a reaction on a target token. Returns the clip that played. */
export async function react(tokenId: string, o: { result: ReactionOutcome; critical?: boolean; seed?: number }): Promise<string | null> {
	const a = await animatorFor(tokenId);
	if (!a || a.defeatedBy) return null;
	const actor = a.token?.actor;
	const res = resolveReaction({ result: o.result, critical: o.critical, guarding: guarding(actor) }, { actor: actorOverrides(actor), world: mappingTable(), template: a.template });
	return res.candidates.length ? a.playFirst(res.candidates, { seed: o.seed, variation: 1 }) : null;
}

/** Run a plan on this client. */
export async function runPlan(plan: ActionPlan): Promise<void> {
	if (plan.scene !== canvas?.scene?.id || !tokenAnimators.enabled()) return;
	const src = await animatorFor(plan.source);
	const reactionsOn = setting<boolean>('reactions') !== false;
	const fua = fuaPlaying() && plan.fua && plan.fua.style !== 'none';
	let played: string | null = null;
	let reacted = false;
	const reactAll = () => {
		if (reacted || !reactionsOn) return;
		reacted = true;
		plan.targets.forEach((t, i) => {
			if (t.result === 'none') return;
			setTimeout(() => void react(t.id, { result: t.result, critical: plan.critical, seed: plan.seed + i + 1 }), i * 90);
		});
	};
	if (src && !src.defeatedBy) {
		const candidates = clipsFor(src, plan.info, plan.itemClip);
		const firstPlayable = candidates.find((c) => src.canPlay(c)) ?? null;
		const clip = firstPlayable ? getClip(firstPlayable) : null;
		if (clip) {
			// with fu-animations, stretch our wind-up so the strike lands when its hit does
			const target = fua ? estimateFuaContact(plan.fua!.style as never, { projectile: plan.fua!.projectile, heavy: plan.fua!.heavy, dash: dashes() }) : null;
			const timing = target !== null ? timingForContact(clip, target) : undefined;
			played = src.playFirst([clip.id], {
				seed: plan.seed,
				variation: 1,
				timing,
				intensity: plan.critical ? 1.15 : 1,
				onEvent: (name) => {
					if (name === 'contact' && !fua) reactAll();
				},
			});
		}
	}
	if (!plan.targets.length) return;
	// when no clip plays (or it has no contact), or fu-animations times the hit, use its timing
	const own = played ? getClip(played) : null;
	if (fua || !own || contactTime(own) === null) {
		const delay = fua ? estimateFuaContact(plan.fua!.style as never, { projectile: plan.fua!.projectile, heavy: plan.fua!.heavy, dash: dashes() }) : 0.35;
		setTimeout(reactAll, delay * 1000);
	}
}

function dashes(): boolean {
	try {
		return game.settings.get('fu-animations', 'moveMelee') !== false;
	} catch {
		return true;
	}
}

/* ------------------------------------------------------------------ */
/*  Defeat                                                             */
/* ------------------------------------------------------------------ */

function defeatClips(a: TokenAnimator): string[] {
	return resolveReaction({ result: 'hit', defeated: true }, { actor: actorOverrides(a.token?.actor), world: mappingTable(), template: a.template }).candidates;
}

function isDown(actor: Doc): boolean {
	const v = Number(val(actor?.system?.resources?.hp));
	return Number.isFinite(v) && v <= 0;
}

/** Put a token into (or out of) its defeated pose to match its actor's HP. */
export function syncDefeat(a: TokenAnimator, instant = false): void {
	if (setting<boolean>('defeat') === false) return a.setDefeated(null);
	const down = isDown(a.token?.actor);
	if (down && !a.defeatedBy) a.setDefeated(defeatClips(a), instant);
	else if (!down && a.defeatedBy) a.setDefeated(null);
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

export function onCombatSocket(msg: { type?: string; plan?: ActionPlan; scene?: string; tokens?: string[]; result?: ReactionOutcome; critical?: boolean; seed?: number }): boolean {
	if (msg?.type === 'action' && msg.plan) {
		void runPlan(msg.plan);
		return true;
	}
	if (msg?.type === 'react') {
		if (msg.scene === canvas?.scene?.id) for (const id of msg.tokens ?? []) void react(id, { result: msg.result ?? 'hit', critical: msg.critical, seed: msg.seed });
		return true;
	}
	return false;
}

export function registerCombatHooks(): void {
	Hooks.on('createChatMessage', (msg: Doc) => {
		if (setting<boolean>('combat') === false) return;
		const authorId = msg.author?.id ?? msg.user?.id ?? msg.author;
		if (authorId !== game.user?.id) return;
		let plan: ActionPlan | null = null;
		try {
			plan = planFromMessage(msg);
		} catch (e) {
			console.warn(`${MODULE_ID} | could not read the chat card`, e);
		}
		if (!plan) return;
		game.socket?.emit(SOCKET, { type: 'action', plan });
		void runPlan(plan);
	});
	// every client sees actor updates: no socket needed for defeat
	Hooks.on('updateActor', (actor: Doc, changes: Doc) => {
		if (foundry.utils.getProperty?.(changes, 'system.resources.hp') === undefined) return;
		for (const a of tokenAnimators.all()) if (a.token?.actor === actor || a.token?.actor?.id === actor?.id) syncDefeat(a);
	});
	tokenAnimators.created.push((a) => syncDefeat(a, true));
}
