import { sampleKeys, sampleKeys2 } from '../core/clip';
import { nearestTurn } from '../core/player';
import type { Skeleton } from '../core/skeleton';
import type { ClipDocument, Ease, Facing, Key, Key2, LayerKey, RoleId, RoleTrack } from '../core/types';

/** Clip editing: small, pure-ish operations on a clip document (they change the clip passed in). */

export type Channel = 'rotate' | 'translate' | 'scale' | 'layer';
export const CHANNELS: Channel[] = ['rotate', 'translate', 'scale', 'layer'];
const EPS = 1e-3;

export function cloneClip(clip: ClipDocument, id: string, name: string): ClipDocument {
	const c = JSON.parse(JSON.stringify(clip)) as ClipDocument;
	c.id = id;
	c.name = name;
	return c;
}

function track(clip: ClipDocument, role: RoleId): RoleTrack {
	return (clip.tracks[role] ??= {});
}

function upsert<K extends { t: number }>(keys: K[], key: K): number {
	const i = keys.findIndex((k) => Math.abs(k.t - key.t) < EPS);
	if (i >= 0) {
		// keep the easing that was on the key unless a new one is given
		keys[i] = { ...keys[i], ...key };
		return i;
	}
	keys.push(key);
	keys.sort((a, b) => a.t - b.t);
	return keys.indexOf(key);
}

const clampT = (clip: ClipDocument, t: number) => Math.max(0, Math.min(clip.duration, Math.round(t * 1000) / 1000));

export function setRotateKey(clip: ClipDocument, role: RoleId, t: number, v: number, ease?: Ease): number {
	const tr = track(clip, role);
	tr.rotate ??= [];
	const k: Key = { t: clampT(clip, t), v: Math.round(v * 100) / 100 };
	if (ease) k.e = ease;
	return upsert(tr.rotate, k);
}

export function setVectorKey(clip: ClipDocument, role: RoleId, channel: 'translate' | 'scale', t: number, x: number, y: number, ease?: Ease): number {
	const tr = track(clip, role);
	const keys = (tr[channel] ??= []);
	const k: Key2 = { t: clampT(clip, t), x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 };
	if (ease) k.e = ease;
	return upsert(keys, k);
}

/** Draw this role behind (or in front of) another from time t; no target = back to normal. */
export function setLayerKey(clip: ClipDocument, role: RoleId, t: number, behind?: RoleId, front?: RoleId): number {
	const tr = track(clip, role);
	tr.layer ??= [];
	const k: LayerKey = { t: clampT(clip, t) };
	if (behind) k.behind = behind;
	else if (front) k.front = front;
	const i = tr.layer.findIndex((x) => Math.abs(x.t - k.t) < EPS);
	if (i >= 0) {
		tr.layer[i] = k;
		return i;
	}
	tr.layer.push(k);
	tr.layer.sort((a, b) => a.t - b.t);
	return tr.layer.indexOf(k);
}

function keysOf(clip: ClipDocument, role: RoleId, channel: Channel): { t: number; e?: Ease }[] | undefined {
	return clip.tracks[role]?.[channel] as { t: number; e?: Ease }[] | undefined;
}

export function removeKey(clip: ClipDocument, role: RoleId, channel: Channel, index: number): void {
	const keys = keysOf(clip, role, channel);
	if (!keys || index < 0 || index >= keys.length) return;
	keys.splice(index, 1);
	const tr = clip.tracks[role]!;
	if (!keys.length) delete tr[channel];
	if (!tr.rotate && !tr.translate && !tr.scale && !tr.layer) delete clip.tracks[role];
}

/** Move a key in time; returns its new index (keys stay sorted). */
export function moveKey(clip: ClipDocument, role: RoleId, channel: Channel, index: number, t: number): number {
	const keys = keysOf(clip, role, channel);
	if (!keys?.[index]) return index;
	const k = keys[index]!;
	k.t = clampT(clip, t);
	keys.sort((a, b) => a.t - b.t);
	return keys.indexOf(k);
}

export function setKeyEase(clip: ClipDocument, role: RoleId, channel: Channel, index: number, ease: Ease | undefined): void {
	const k = keysOf(clip, role, channel)?.[index];
	if (!k) return;
	if (ease && ease !== 'linear') k.e = ease;
	else delete k.e;
}

export function addEvent(clip: ClipDocument, t: number, name: string): void {
	clip.events ??= [];
	clip.events.push({ t: clampT(clip, t), name: name.trim() || 'event' });
	clip.events.sort((a, b) => a.t - b.t);
}

export function removeEvent(clip: ClipDocument, index: number): void {
	clip.events?.splice(index, 1);
}

/** Change the duration; keys and events past the new end are moved onto it. */
export function setDuration(clip: ClipDocument, duration: number): void {
	clip.duration = Math.max(0.05, Math.round(duration * 1000) / 1000);
	for (const tr of Object.values(clip.tracks)) for (const ch of CHANNELS) for (const k of (tr[ch] as { t: number }[] | undefined) ?? []) k.t = Math.min(k.t, clip.duration);
	for (const e of clip.events ?? []) e.t = Math.min(e.t, clip.duration);
	const ph = clip.phases;
	if (ph) {
		for (const key of ['anticipation', 'action', 'recovery'] as const) {
			const r = ph[key];
			if (r) ph[key] = [Math.min(r[0], clip.duration), Math.min(r[1], clip.duration)];
		}
		if (ph.impact !== undefined) ph.impact = Math.min(ph.impact, clip.duration);
	}
}

/**
 * Turn the pose of one bone into key values for a clip, the inverse of clip evaluation
 * (intensity 1, no variation): offset rotations are local minus setup (sign flipped for
 * left-facing rigs); world rotations are the continuous on-screen angle (mirrored for left-facing
 * rigs), taken on the turn nearest the clip's current value so sweeps do not flip.
 */
export function keyFromPose(clip: ClipDocument, role: RoleId, sk: Skeleton, t: number, facing: Facing, bodyHeight: number): { rotate: number; translate: [number, number]; scale: [number, number] } | null {
	const i = sk.roles.get(role);
	if (i === undefined) return null;
	const mirror = facing === 'left';
	const local = sk.local[i]!;
	const setup = sk.setup[i]!;
	const tr = clip.tracks[role];
	let rotate: number;
	if (tr?.space === 'world') {
		// continuous world angle of this bone in the current pose
		let angle = 0;
		const chain: number[] = [];
		for (let b = i; b >= 0; b = sk.parent[b]!) {
			chain.push(b);
			if (sk.bones[b]!.inheritRotation === false) break;
		}
		for (const b of chain) angle += sk.local[b]!.rot;
		let v = mirror ? 180 - angle : angle;
		const current = tr.rotate?.length ? sampleKeys(tr.rotate, t) : v;
		v = nearestTurn(v, current);
		rotate = v;
	} else rotate = (local.rot - setup.rot) * (mirror ? -1 : 1);
	const sign = mirror ? -1 : 1;
	const translate: [number, number] = [((local.x - setup.x) / bodyHeight) * sign, (local.y - setup.y) / bodyHeight];
	const scale: [number, number] = [setup.sx ? local.sx / setup.sx : 1, setup.sy ? local.sy / setup.sy : 1];
	return { rotate, translate, scale };
}

/** The value a channel has at time t (for showing in the inspector). */
export function valueAt(clip: ClipDocument, role: RoleId, channel: 'rotate' | 'translate' | 'scale', t: number): number | [number, number] | null {
	const tr = clip.tracks[role];
	if (!tr) return null;
	if (channel === 'rotate') return tr.rotate?.length ? sampleKeys(tr.rotate, t) : null;
	const keys = tr[channel];
	return keys?.length ? sampleKeys2(keys, t, channel === 'scale' ? 1 : 0, channel === 'scale' ? 1 : 0) : null;
}

/** A clip id not yet used. */
export function uniqueClipId(base: string, taken: (id: string) => boolean): string {
	const stem = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clip';
	if (!taken(stem)) return stem;
	for (let n = 2; ; n++) if (!taken(`${stem}-${n}`)) return `${stem}-${n}`;
}
