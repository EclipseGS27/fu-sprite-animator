import type { ClipDocument, PhaseTiming } from '../core/types';

/*
 * Landing the sprite's strike together with fu-animations' hit. fu-animations has no "contact"
 * signal yet (a small hook is proposed in docs/FOUNDRY_INTEGRATION.md), so its timing is
 * estimated from its own sequence (scripts/sequence.mjs): melee = wind-up 200–320 ms + dash
 * 110–260 ms; ranged and spells = cast hold (≤ 260 ms with a projectile, ≤ 650 ms without) +
 * flight. Cut-ins and boss scenes add time we cannot see; those reactions land early.
 */

/** When a clip lands its hit, in clip seconds: the contact event, else the impact phase. */
export function contactTime(clip: ClipDocument): number | null {
	const ev = clip.events?.find((e) => e.name === 'contact');
	if (ev) return ev.t;
	return clip.phases?.impact ?? null;
}

/**
 * Phase timing that moves a clip's contact to `target` seconds (at speed 1) by stretching or
 * shortening its anticipation only, within sensible limits. Undefined when the clip has no
 * anticipation phase or contact before it ends.
 */
export function timingForContact(clip: ClipDocument, target: number): PhaseTiming | undefined {
	const c = contactTime(clip);
	const a = clip.phases?.anticipation;
	if (c === null || !a) return undefined;
	const len = a[1] - a[0];
	if (!(len > 0) || c < a[1] - 1e-6) return undefined;
	const m = Math.min(2.5, Math.max(0.6, 1 + (target - c) / len));
	return Math.abs(m - 1) < 0.02 ? undefined : { anticipation: m };
}

export type FuaStyleLite = 'melee' | 'ranged' | 'spell' | 'support' | 'self' | 'none' | null | undefined;

/** Estimated seconds from the chat card until fu-animations shows the hit on the first target. */
export function estimateFuaContact(style: FuaStyleLite, o: { projectile?: boolean; heavy?: boolean; dash?: boolean } = {}): number {
	switch (style) {
		case 'melee':
			return o.dash === false ? 0.15 : o.heavy ? 0.58 : 0.45;
		case 'ranged':
			return o.projectile === false ? 0.45 : 0.62;
		case 'spell':
			return o.projectile ? 0.62 : o.heavy ? 0.95 : 0.55;
		case 'support':
			return 0.55;
		default:
			return 0.45;
	}
}
