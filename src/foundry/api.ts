import type { PlayOptions } from '../core/player';
import type { ClipDocument, PhaseTiming } from '../core/types';
import { getClip, listClips, registerClip } from '../presets';
import { MODULE_ID, SOCKET, type AnimationProfile } from './constants';
import { selfTest } from './selftest';
import * as storage from './storage';
import { StudioApp, assignRigToActor } from './studio-app';
import { profileOf, tokenAnimators } from './tokens';

type Token = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ApiPlayOptions {
	/** Amplitude multiplier (default 1). */
	intensity?: number;
	/** Play rate (default 1). */
	speed?: number;
	/** Phase duration multipliers. */
	timing?: PhaseTiming;
	/** 0 = identical every time; 1 = natural variation (default). */
	variation?: number;
	seed?: number;
	/** Send to every connected client (default true). */
	broadcast?: boolean;
}

/** Tokens on the current scene for an Actor, Token, TokenDocument, UUID, id or name. */
export function tokensFor(target: unknown): Token[] {
	if (!canvas?.ready || !target) return [];
	const t = target as { documentName?: string; object?: Token; getActiveTokens?: (a: boolean, b: boolean) => Token[]; mesh?: unknown };
	if (t.mesh) return [t];
	if (t.documentName === 'Token') return t.object ? [t.object] : [];
	// Actor#getActiveTokens: the actor's tokens on the scene being viewed
	if (t.documentName === 'Actor') return t.getActiveTokens?.(false, false) ?? [];
	if (typeof target === 'string') {
		const byId = canvas.tokens.get(target);
		if (byId) return [byId];
		try {
			const doc = foundry.utils.fromUuidSync?.(target) ?? (globalThis as { fromUuidSync?: (u: string) => unknown }).fromUuidSync?.(target);
			if (doc) return tokensFor(doc);
		} catch {
			/* not a uuid */
		}
		const actor = game.actors?.get(target) ?? game.actors?.getName?.(target);
		if (actor) return tokensFor(actor);
	}
	return [];
}

function playLocal(tokenIds: string[], clipId: string, o: ApiPlayOptions): number {
	let n = 0;
	for (const id of tokenIds) {
		const a = tokenAnimators.get(id);
		const opts: PlayOptions = { intensity: o.intensity, speed: o.speed, timing: o.timing, variation: o.variation ?? 1, seed: o.seed };
		if (a?.play(clipId, opts)) n++;
	}
	return n;
}

export function onSocket(msg: { type?: string; scene?: string; tokens?: string[]; clip?: string; opts?: ApiPlayOptions }): void {
	if (msg?.type !== 'play' || !msg.clip || msg.scene !== canvas?.scene?.id) return;
	playLocal(msg.tokens ?? [], msg.clip, msg.opts ?? {});
}

/**
 * The public API: game.modules.get('fu-sprite-animator').api, also available as
 * globalThis.SpriteAnimator. See docs/API.md.
 */
export function createApi() {
	return {
		/** API version (semver of this object's shape). */
		version: '0.1.0',

		/** Play a clip on every token of an actor/token on this scene. Resolves to how many tokens played it locally. */
		async play(target: unknown, clipId: string, options: ApiPlayOptions = {}): Promise<number> {
			if (!getClip(clipId)) throw new Error(`Unknown animation "${clipId}". See SpriteAnimator.clips().`);
			const tokens = tokensFor(target);
			for (const t of tokens) await tokenAnimators.refresh(t);
			const ids = tokens.map((t) => t.id);
			const seed = options.seed ?? Math.floor(Math.random() * 1e9);
			const opts = { ...options, seed };
			if (options.broadcast !== false && ids.length) game.socket?.emit(SOCKET, { type: 'play', scene: canvas.scene?.id, tokens: ids, clip: clipId, opts: { ...opts, broadcast: false } });
			return playLocal(ids, clipId, opts);
		},

		/** Stop the current action on those tokens (they ease back to their idle). */
		stop(target: unknown): void {
			for (const t of tokensFor(target)) tokenAnimators.get(t.id)?.stop();
		},

		/** Is this token/actor animated right now? */
		isAnimated(target: unknown): boolean {
			return tokensFor(target).some((t) => !!tokenAnimators.get(t.id));
		},

		/** Every available clip: id, name, category, duration, loop. */
		clips(): { id: string; name: string; category: string; duration: number; loop: boolean }[] {
			return listClips().map((c) => ({ id: c.id, name: c.name, category: c.category, duration: c.duration, loop: c.loop }));
		},

		getClip(id: string): ClipDocument | undefined {
			const c = getClip(id);
			return c ? (JSON.parse(JSON.stringify(c)) as ClipDocument) : undefined;
		},

		/** Add (or override) a clip at runtime, e.g. from another module. Same format as ANIMATION_FORMAT.md. */
		registerClip(clip: ClipDocument): void {
			registerClip(clip);
		},

		getProfile(actor: { getFlag?: (s: string, k: string) => AnimationProfile | undefined } | Token): AnimationProfile | null {
			return (actor as { mesh?: unknown }).mesh ? profileOf(actor) : ((actor as { getFlag?: (s: string, k: string) => AnimationProfile | undefined }).getFlag?.(MODULE_ID, 'profile') ?? null);
		},

		async setProfile(actor: { setFlag: (s: string, k: string, v: unknown) => Promise<unknown>; unsetFlag: (s: string, k: string) => Promise<unknown> }, profile: AnimationProfile | null): Promise<void> {
			if (!profile) await actor.unsetFlag(MODULE_ID, 'profile');
			else await actor.setFlag(MODULE_ID, 'profile', profile);
		},

		/** Saved rigs in this world. */
		rigs() {
			return storage.listRigs();
		},

		openStudio(o: { rigId?: string; actor?: { id: string } } = {}) {
			return StudioApp.open(o);
		},

		async assign(rigId: string, actorId?: string): Promise<void> {
			await assignRigToActor(await storage.loadRig(rigId), actorId);
		},

		/** Checks that need a real Foundry: PixiJS version, token texture strategy, rendering, cleanup. */
		selfTest,
	};
}

export type SpriteAnimatorApi = ReturnType<typeof createApi>;
