import type * as PIXINS from 'pixi.js';
import { missingRoles } from '../core/clip';
import type { PlayOptions } from '../core/player';
import type { RigDocument } from '../core/types';
import { defaultIdleFor, getClip } from '../presets';
import { buildRig } from '../rig/build';
import { isUsable, validateRig } from '../rig/validate';
import { RigAsset, RigView, clippedTexture, loadImageData, trimmedTexture } from '../render/pixi';
import { MODULE_ID, log, setting, type AnimationProfile } from './constants';
import { loadRig, revisionOf } from './storage';

/**
 * Animated tokens. For every token whose actor (or the token itself) has an enabled animation
 * profile, a TokenAnimator renders the rig into a texture each frame and gives it to
 * `token.mesh`. The token is never moved, hidden or resized: other modules that move, tint,
 * flash or filter `token.mesh` (fu-animations, conditions, Battle UI) keep working on top.
 */

type Token = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export type TextureMode = 'padded' | 'clipped';

export function profileOf(token: Token): AnimationProfile | null {
	const own = token?.document?.getFlag?.(MODULE_ID, 'profile') as AnimationProfile | undefined;
	const actor = token?.actor?.getFlag?.(MODULE_ID, 'profile') as AnimationProfile | undefined;
	const p = own?.rig ? own : actor;
	return p?.rig && p.enabled !== false ? p : null;
}

/* ------------------------------------------------------------------ */
/*  Shared rig assets                                                  */
/* ------------------------------------------------------------------ */

const assets = new Map<string, Promise<RigAsset>>();

async function assetFor(rigId: string): Promise<RigAsset> {
	const key = `${rigId}@${revisionOf(rigId)}`;
	let p = assets.get(key);
	if (!p) {
		p = (async () => {
			const rig: RigDocument = await loadRig(rigId);
			const { data } = await loadImageData(rig.image.src);
			const build = buildRig(rig, data);
			if (!isUsable(validateRig(rig, { image: data, labels: build.labels }))) throw new Error(`Rig "${rig.name}" has problems; open it in the Studio.`);
			return new RigAsset(build, () => assets.delete(key));
		})();
		assets.set(key, p);
		p.catch(() => assets.delete(key));
	}
	return p;
}

/* ------------------------------------------------------------------ */
/*  One token                                                          */
/* ------------------------------------------------------------------ */

export class TokenAnimator {
	readonly token: Token;
	readonly view: RigView;
	readonly profile: AnimationProfile;
	readonly rigKey: string;
	private texture: PIXINS.Texture | null = null;
	private idleAcc = 0;
	private destroyed = false;
	/** The clip holding a defeated pose on the base track, or null. */
	defeatedBy: string | null = null;
	mode: TextureMode;

	constructor(token: Token, asset: RigAsset, profile: AnimationProfile, mode: TextureMode) {
		this.token = token;
		this.profile = profile;
		this.rigKey = `${profile.rig}@${revisionOf(profile.rig)}`;
		this.view = new RigView(asset);
		this.mode = mode;
		this.startIdle();
	}

	/** The base loop: the profile's choice if this rig can play it, else the template's own idle. '' = none. */
	idleId(): string | null {
		const want = this.profile.idle;
		if (want === '') return null;
		const tpl = this.view.build.rig.template;
		for (const id of [want, defaultIdleFor(tpl), 'generic-idle']) if (id && this.canPlay(id)) return id;
		return null;
	}

	startIdle(): void {
		const id = this.idleId();
		const clip = id ? getClip(id) : undefined;
		if (clip) this.view.player.play(clip, { track: 0, mixIn: 0, intensity: this.profile.intensity ?? 1 });
		this.view.player.update(Math.random() * 2); // stagger idles so a party does not breathe in unison
	}

	/** What the token is showing: its base loop (or held pose) and the action on top, as clip ids. */
	current(): { base: string | null; action: string | null } {
		const p = this.view.player;
		return { base: p.trackInfo(0)?.clip.id ?? null, action: p.trackInfo(1)?.clip.id ?? null };
	}

	/** The rig's template (humanoid, quadruped, …), for template-specific mappings. */
	get template(): string {
		return this.view.build.rig.template;
	}

	/** The clip exists and this rig has every role it needs. */
	canPlay(clipId: string): boolean {
		const clip = getClip(clipId);
		return !!clip && missingRoles(clip, this.view.skeleton).length === 0;
	}

	/** Play the first clip of the list this rig can play. Returns its id, or null. */
	playFirst(clipIds: string[], o: PlayOptions = {}): string | null {
		for (const id of clipIds) if (this.canPlay(id) && this.play(id, o)) return id;
		return null;
	}

	/**
	 * Hold a defeated pose (the clip plays once on the base track and stays on its last frame), or
	 * get back up into the idle. `instant` skips straight to the held pose (token drawn while down).
	 */
	setDefeated(clipIds: string[] | null, instant = false): void {
		const p = this.view.player;
		if (!clipIds) {
			if (!this.defeatedBy) return;
			this.defeatedBy = null;
			const id = this.idleId();
			const clip = id ? getClip(id) : undefined;
			if (clip) p.play(clip, { track: 0, mixIn: 0.5, intensity: this.profile.intensity ?? 1 });
			else p.stop(0, 0.5);
			this.idleAcc = Infinity;
			return;
		}
		const id = clipIds.find((c) => this.canPlay(c));
		if (!id || this.defeatedBy === id) return;
		this.defeatedBy = id;
		p.stop(1, 0.1);
		p.play(getClip(id)!, { track: 0, loop: false, mixIn: instant ? 0 : 0.1, intensity: this.profile.intensity ?? 1 });
		if (instant) {
			p.seek(0, p.trackInfo(0)?.duration ?? 0);
			p.stop(1, 0);
		}
		this.idleAcc = Infinity;
	}

	/** Give the token our texture. Returns false (and leaves the token alone) when it cannot. */
	attach(): boolean {
		const mesh = this.token.mesh;
		const own = this.token.texture as PIXINS.Texture | undefined;
		if (!mesh || mesh.destroyed || !own?.baseTexture) return false;
		const rig = this.view.build.rig;
		const ow = own.orig?.width ?? own.width;
		const oh = own.orig?.height ?? own.height;
		if (Math.abs(ow / oh - rig.image.width / rig.image.height) > 0.02) {
			log(`token "${this.token.name}" uses an image with a different shape than rig "${rig.name}"; not animated.`);
			return false;
		}
		const scale = ow / rig.image.width;
		this.texture = this.mode === 'clipped' ? clippedTexture(this.view, scale) : trimmedTexture(this.view, scale);
		this.render(true);
		mesh.texture = this.texture;
		return true;
	}

	/** Foundry can put the token's own texture back on refresh; take it again. */
	enforce(): void {
		const mesh = this.token.mesh;
		if (this.texture && mesh && !mesh.destroyed && mesh.texture !== this.texture) mesh.texture = this.texture;
	}

	play(clipId: string, o: PlayOptions = {}): boolean {
		const clip = getClip(clipId);
		if (!clip) return false;
		this.view.player.play(clip, {
			track: clip.loop ? 0 : 1,
			intensity: (o.intensity ?? 1) * (this.profile.intensity ?? 1),
			...o,
			onEvent: (name, c) => {
				o.onEvent?.(name, c);
				Hooks.callAll(`${MODULE_ID}.event`, { token: this.token, clip: c.id, event: name });
			},
		});
		this.idleAcc = Infinity; // render now
		return true;
	}

	stop(): void {
		this.view.player.stop(1, 0.15);
	}

	private visible(): boolean {
		const t = this.token;
		return !!t && !t.destroyed && t.visible !== false && !!t.mesh && t.mesh.visible !== false && (t.mesh.worldAlpha ?? 1) > 0.01;
	}

	private render(force = false): void {
		if (this.destroyed) return;
		if (force || this.visible()) this.view.render(canvas.app.renderer);
	}

	update(dt: number): void {
		if (this.destroyed) return;
		const fps = this.view.build.rig.render.idleFps;
		if (!this.view.player.busy && fps > 0) {
			// idle: step at a pixel-art frame rate instead of every display frame
			this.idleAcc += dt;
			if (this.idleAcc < 1 / fps) return;
			dt = Math.min(this.idleAcc, 0.25);
			this.idleAcc = 0;
		}
		this.view.update(dt);
		this.render();
		this.enforce();
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		const mesh = this.token?.mesh;
		const own = this.token?.texture;
		if (mesh && !mesh.destroyed && mesh.texture === this.texture && own?.baseTexture) mesh.texture = own;
		this.texture?.destroy(false);
		this.texture = null;
		this.view.destroy();
	}
}

/* ------------------------------------------------------------------ */
/*  All tokens on the canvas                                           */
/* ------------------------------------------------------------------ */

class TokenAnimators {
	private readonly animators = new Map<string, TokenAnimator>();
	private readonly pending = new Map<string, Promise<void>>();
	private ticking = false;
	private warned = new Set<string>();
	/** Called for every new animator (e.g. to put a token at 0 HP straight into its defeated pose). */
	readonly created: ((a: TokenAnimator) => void)[] = [];

	all(): IterableIterator<TokenAnimator> {
		return this.animators.values();
	}

	get count(): number {
		return this.animators.size;
	}

	get(tokenId: string): TokenAnimator | undefined {
		return this.animators.get(tokenId);
	}

	enabled(): boolean {
		return setting<boolean>('animateTokens') !== false && !!canvas?.ready;
	}

	private tick = () => {
		const dt = Math.min(0.1, (canvas?.app?.ticker?.deltaMS ?? 16) / 1000);
		for (const a of this.animators.values()) {
			try {
				a.update(dt);
			} catch (e) {
				console.error(`${MODULE_ID} | animation failed on a token; it goes back to its still image`, e);
				this.dispose(a.token.id);
			}
		}
	};

	private ensureTicker(): void {
		if (this.ticking || !canvas?.app) return;
		canvas.app.ticker.add(this.tick);
		this.ticking = true;
	}

	/** Start, refresh or stop the animator of one token. */
	async refresh(token: Token): Promise<void> {
		if (!token?.id) return;
		const profile = this.enabled() ? profileOf(token) : null;
		const current = this.animators.get(token.id);
		if (!profile) return this.dispose(token.id);
		const key = `${profile.rig}@${revisionOf(profile.rig)}`;
		if (current && current.rigKey === key && current.profile.idle === profile.idle && current.profile.intensity === profile.intensity) return current.enforce();
		if (this.pending.has(token.id)) return this.pending.get(token.id);
		const max = setting<number>('maxAnimated') ?? 40;
		if (!current && this.animators.size >= max) return;
		const job = (async () => {
			try {
				const asset = await assetFor(profile.rig);
				if (token.destroyed || !canvas?.ready) return;
				this.dispose(token.id);
				const mode = (setting<TextureMode>('textureMode') ?? 'padded') as TextureMode;
				const a = new TokenAnimator(token, asset, profile, mode);
				if (!a.attach()) {
					a.destroy();
					return;
				}
				this.animators.set(token.id, a);
				this.ensureTicker();
				for (const fn of this.created) {
					try {
						fn(a);
					} catch (e) {
						console.warn(`${MODULE_ID} |`, e);
					}
				}
			} catch (e) {
				const msg = (e as Error).message;
				if (!this.warned.has(msg)) {
					this.warned.add(msg);
					if (game.user?.isGM) ui.notifications?.warn(`Sprite Animator: ${msg}`);
					console.warn(`${MODULE_ID} |`, e);
				}
			} finally {
				this.pending.delete(token.id);
			}
		})();
		this.pending.set(token.id, job);
		return job;
	}

	refreshAll(): void {
		for (const t of canvas?.tokens?.placeables ?? []) void this.refresh(t);
	}

	refreshActor(actor: unknown): void {
		for (const t of canvas?.tokens?.placeables ?? []) if (t.actor === actor || t.actor?.id === (actor as { id?: string })?.id) void this.refresh(t);
	}

	dispose(tokenId: string): void {
		const a = this.animators.get(tokenId);
		if (!a) return;
		this.animators.delete(tokenId);
		a.destroy();
	}

	disposeAll(): void {
		for (const id of [...this.animators.keys()]) this.dispose(id);
		if (this.ticking) canvas?.app?.ticker?.remove(this.tick);
		this.ticking = false;
	}

	/** Restart everything (after a setting or rig change). */
	reset(): void {
		this.disposeAll();
		this.refreshAll();
	}
}

export const tokenAnimators = new TokenAnimators();

export function registerTokenHooks(): void {
	Hooks.on('canvasReady', () => tokenAnimators.refreshAll());
	Hooks.on('canvasTearDown', () => tokenAnimators.disposeAll());
	Hooks.on('drawToken', (token: Token) => setTimeout(() => void tokenAnimators.refresh(token), 0));
	Hooks.on('refreshToken', (token: Token) => tokenAnimators.get(token.id)?.enforce());
	Hooks.on('destroyToken', (token: Token) => tokenAnimators.dispose(token.id));
	Hooks.on('updateActor', (actor: unknown, changes: { flags?: Record<string, unknown> }) => {
		if (changes?.flags?.[MODULE_ID] !== undefined) tokenAnimators.refreshActor(actor);
	});
	Hooks.on('updateToken', (doc: { object?: Token }, changes: { flags?: Record<string, unknown>; texture?: unknown }) => {
		if (changes?.flags?.[MODULE_ID] !== undefined || changes?.texture !== undefined) setTimeout(() => doc.object && void tokenAnimators.refresh(doc.object), 0);
	});
	Hooks.on('updateSetting', (s: { key?: string }) => {
		if (s?.key === `${MODULE_ID}.rigs`) tokenAnimators.refreshAll();
	});
}
