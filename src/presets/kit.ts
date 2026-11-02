import type { ClipCategory, ClipDocument, ClipEvent, ClipPhases, Ease, Key, Key2, RoleTrack, TemplateId } from '../core/types';

/** Shared helpers for writing built-in clips (library.ts, creatures.ts). */

export const k = (t: number, v: number, e?: Ease): Key => (e ? { t, v, e } : { t, v });
export const k2 = (t: number, x: number, y: number, e?: Ease): Key2 => (e ? { t, x, y, e } : { t, x, y });
/** A world-space key on the bone's own drawn angle (v is only a typical value for tools). */
export const R = (t: number, v: number, e?: Ease): Key => ({ ...k(t, v, e), rest: true });
export const SNAP: Ease = [0.55, 0, 0.9, 0.35];
export const OUT: Ease = 'outCubic';
export const SET: Ease = 'inOutQuad';
export const SINE: Ease = 'inOutSine';
export const BACK: Ease = 'outBack';

export interface Spec {
	id: string;
	name: string;
	category: ClipCategory;
	description: string;
	duration: number;
	loop?: boolean;
	phases?: ClipPhases;
	events?: ClipEvent[];
	requires?: string[];
	mixIn?: number;
	mixOut?: number;
	/** The weapon arm passes over the head between these times: draw it behind the head then. */
	overHead?: [number, number];
	/** Templates the clip was written for (informational; `requires` decides what can play it). */
	templates?: TemplateId[];
	tracks: Record<string, RoleTrack>;
}

const FRONT_CHAIN = ['arm.upper.front', 'arm.lower.front', 'hand.front', 'weapon'];
function withOverHead(tracks: Record<string, RoleTrack>, span?: [number, number]): Record<string, RoleTrack> {
	if (!span) return tracks;
	const out = { ...tracks };
	for (const role of FRONT_CHAIN) out[role] = { ...out[role], layer: [{ t: span[0], behind: 'head' }, { t: span[1] }] };
	return out;
}

export const clip = (s: Spec): ClipDocument => ({
	format: 'fusa-clip',
	version: 1,
	id: s.id,
	name: s.name,
	category: s.category,
	description: s.description,
	duration: s.duration,
	loop: !!s.loop,
	tracks: withOverHead(s.tracks, s.overHead),
	...(s.phases ? { phases: s.phases } : {}),
	...(s.events ? { events: s.events } : {}),
	requires: s.requires ?? ['torso'],
	templates: s.templates ?? ['humanoid'],
	defaults: { mixIn: s.mixIn ?? (s.loop ? 0.25 : 0.08), mixOut: s.mixOut ?? 0.25 },
});
export const ev = (t: number, name: string): ClipEvent => ({ t, name });
/** A loop key list: values at evenly spaced times, ending on the first value. */
export const cycle = (dur: number, values: number[], e: Ease = SINE): Key[] => [...values, values[0]!].map((v, i) => k((dur * i) / values.length, v, e));
export const cycle2 = (dur: number, values: [number, number][], e: Ease = SINE): Key2[] => [...values, values[0]!].map(([x, y], i) => k2((dur * i) / values.length, x, y, e));
/** A shaking key list between t0 and t1 around `base`. */
export const tremble = (t0: number, t1: number, amp: number, base = 0): Key[] => {
	const keys: Key[] = [];
	const n = Math.max(2, Math.round((t1 - t0) / 0.05));
	for (let i = 0; i <= n; i++) keys.push(k(t0 + ((t1 - t0) * i) / n, base + (i % 2 ? amp : -amp) * (0.6 + 0.4 * Math.sin(i))));
	return keys;
};
