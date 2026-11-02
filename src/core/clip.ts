import { easeFn } from './easing';
import { wrapDeg } from './math';
import type { Skeleton } from './skeleton';
import type { ClipDocument, Key, Key2, PhaseTiming } from './types';

/** Values per bone in a pose delta: rotation (deg), x, y (px), scaleX − 1, scaleY − 1. */
export const STRIDE = 5;

function segmentIndex(keys: { t: number }[], t: number): number {
	let lo = 0;
	let hi = keys.length - 1;
	while (lo < hi) {
		const mid = (lo + hi + 1) >> 1;
		if (keys[mid]!.t <= t) lo = mid;
		else hi = mid - 1;
	}
	return lo;
}

/**
 * Value of a key list at time t (clamped at both ends). `rest` is the value of keys marked
 * `rest` (the bone's own pose); without it those keys use their stored v.
 */
export function sampleKeys(keys: Key[] | undefined, t: number, fallback = 0, rest?: number): number {
	if (!keys || keys.length === 0) return fallback;
	const val = (key: Key) => (key.rest && rest !== undefined ? rest : key.v);
	const first = keys[0]!;
	if (keys.length === 1 || t <= first.t) return val(first);
	const last = keys[keys.length - 1]!;
	if (t >= last.t) return val(last);
	const i = segmentIndex(keys, t);
	const a = keys[i]!;
	const b = keys[i + 1]!;
	const span = b.t - a.t;
	const k = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
	return val(a) + (val(b) - val(a)) * k;
}

/** The authored-space angle of a bone's drawn pose, on the same turn as the track's own keys. */
function restAngle(keys: Key[], setupWorld: number, mirror: boolean): number {
	const a = mirror ? 180 - setupWorld : setupWorld;
	const ref = keys.find((key) => !key.rest);
	return ref ? ref.v + wrapDeg(a - ref.v) : a;
}

export function sampleKeys2(keys: Key2[] | undefined, t: number, fx = 0, fy = 0): [number, number] {
	if (!keys || keys.length === 0) return [fx, fy];
	const first = keys[0]!;
	if (keys.length === 1 || t <= first.t) return [first.x, first.y];
	const last = keys[keys.length - 1]!;
	if (t >= last.t) return [last.x, last.y];
	const i = segmentIndex(keys, t);
	const a = keys[i]!;
	const b = keys[i + 1]!;
	const span = b.t - a.t;
	const k = span > 0 ? easeFn(a.e)((t - a.t) / span) : 1;
	return [a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k];
}

/**
 * Maps play time to clip time so the GM can stretch or shorten the anticipation, action and
 * recovery phases independently. Piecewise linear and monotonic.
 */
export class TimeWarp {
	private readonly segs: { c0: number; c1: number; p0: number; p1: number }[] = [];
	readonly duration: number;

	constructor(clip: ClipDocument, timing: PhaseTiming = {}, actionJitter = 1) {
		const ph = clip.phases ?? {};
		const ranges: { r: [number, number]; m: number }[] = [];
		const add = (r: [number, number] | undefined, m: number | undefined) => {
			if (!r) return;
			const lo = Math.max(0, Math.min(r[0], r[1]));
			const hi = Math.min(clip.duration, Math.max(r[0], r[1]));
			if (hi > lo) ranges.push({ r: [lo, hi], m: Math.max(0.05, m ?? 1) });
		};
		add(ph.anticipation, timing.anticipation);
		add(ph.action, (timing.action ?? 1) * actionJitter);
		add(ph.recovery, timing.recovery);
		const cuts = new Set<number>([0, clip.duration]);
		for (const { r } of ranges) {
			cuts.add(r[0]);
			cuts.add(r[1]);
		}
		const points = [...cuts].sort((a, b) => a - b);
		let p = 0;
		for (let i = 0; i < points.length - 1; i++) {
			const c0 = points[i]!;
			const c1 = points[i + 1]!;
			const mid = (c0 + c1) / 2;
			const m = ranges.find(({ r }) => mid > r[0] && mid < r[1])?.m ?? 1;
			const len = (c1 - c0) * m;
			this.segs.push({ c0, c1, p0: p, p1: p + len });
			p += len;
		}
		this.duration = p;
	}

	toClip(p: number): number {
		if (!this.segs.length) return 0;
		if (p <= 0) return 0;
		for (const s of this.segs) {
			if (p <= s.p1) return s.p1 > s.p0 ? s.c0 + ((p - s.p0) / (s.p1 - s.p0)) * (s.c1 - s.c0) : s.c1;
		}
		return this.segs[this.segs.length - 1]!.c1;
	}

	toPlay(c: number): number {
		if (!this.segs.length || c <= 0) return 0;
		for (const s of this.segs) {
			if (c <= s.c1) return s.c1 > s.c0 ? s.p0 + ((c - s.c0) / (s.c1 - s.c0)) * (s.p1 - s.p0) : s.p1;
		}
		return this.duration;
	}
}

export interface EvalContext {
	skeleton: Skeleton;
	bodyHeight: number;
	/** True when the rig faces left (clips are authored facing right). */
	mirror: boolean;
	intensity: number;
	/** Amplitude multiplier per role (rig adjustments × variation jitter). */
	amp?: (role: string) => number;
}

/**
 * Evaluate a clip at clip time t into a pose delta (STRIDE values per bone) and a mask of the
 * bones it touched. Bones are processed parent-first so world-space rotation keys can account for
 * the parent's pose under this same clip. `angles` is scratch space (one per bone): the bone's
 * continuous world angle (sum of local rotations), which never jumps at ±180°.
 */
export function evaluateClip(clip: ClipDocument, t: number, ctx: EvalContext, out: Float64Array, mask: Uint8Array, angles: Float64Array): void {
	const sk = ctx.skeleton;
	const n = sk.size;
	out.fill(0);
	mask.fill(0);
	const H = ctx.bodyHeight;
	const sign = ctx.mirror ? -1 : 1;
	const mirrorAngle = (a: number) => (ctx.mirror ? 180 - a : a);
	for (let i = 0; i < n; i++) {
		const bone = sk.bones[i]!;
		const role = bone.role;
		const track = role ? clip.tracks[role] : undefined;
		const s = sk.setup[i]!;
		const o = i * STRIDE;
		const p = sk.parent[i]!;
		const inherits = p >= 0 && bone.inheritRotation !== false;
		const parentAngle = inherits ? angles[p]! : 0;
		if (track && sk.roles.get(role!) === i) {
			const k = ctx.intensity * (ctx.amp ? ctx.amp(role!) : 1);
			mask[i] = 1;
			if (track.translate) {
				const [x, y] = sampleKeys2(track.translate, t);
				out[o + 1] = x * H * k * sign;
				out[o + 2] = y * H * k;
			}
			if (track.scale) {
				const [x, y] = sampleKeys2(track.scale, t, 1, 1);
				out[o + 3] = (x - 1) * k;
				out[o + 4] = (y - 1) * k;
			}
			if (track.rotate && track.rotate.length) {
				if (track.space === 'world') {
					const parentSetup = inherits ? sk.setupAngle[p]! : 0;
					const rest = restAngle(track.rotate, parentSetup + s.rot, ctx.mirror);
					// Pick the turn count once, so the first key is the short way round from the setup pose.
					const first = mirrorAngle(sampleKeys(track.rotate, -1, 0, rest)) - parentSetup - s.rot;
					const turns = wrapDeg(first) - first;
					const d = mirrorAngle(sampleKeys(track.rotate, t, 0, rest)) - parentAngle - s.rot + turns;
					out[o] = d * k;
				} else {
					out[o] = sampleKeys(track.rotate, t, 0, 0) * k * sign;
				}
			}
		}
		angles[i] = parentAngle + s.rot + out[o]!;
	}
}

/** Roles a clip animates that the skeleton does not have. */
export function missingRoles(clip: ClipDocument, skeleton: Skeleton): string[] {
	const need = clip.requires ?? Object.keys(clip.tracks);
	return need.filter((r) => !skeleton.roles.has(r));
}
