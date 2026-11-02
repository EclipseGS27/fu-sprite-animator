import type { ClipDocument, Key, Key2 } from '../core/types';

/*
 * Built-in clips for the humanoid template. Conventions (see docs/ANIMATION_FORMAT.md):
 *  - authored for a character facing RIGHT; +rotation turns clockwise on screen, so a positive
 *    offset leans the torso forward, swings a hanging arm or leg backward;
 *  - "world" tracks give absolute screen angles (0 = forward, 90 = down, 180 = back, 270 = up)
 *    so a strike reaches the same arc whatever the sprite's rest pose; values keep increasing
 *    through 360 to sweep in one direction;
 *  - translations are fractions of body height; clips stay in place (fu-animations moves the
 *    token for dashes), with at most a small step;
 *  - motion is kept moderate: visual fidelity over exaggeration. Intensity scales it.
 */

const k = (t: number, v: number, e?: Key['e']): Key => (e ? { t, v, e } : { t, v });
const k2 = (t: number, x: number, y: number, e?: Key2['e']): Key2 => (e ? { t, x, y, e } : { t, x, y });

const SNAP: Key['e'] = [0.55, 0, 0.9, 0.35]; // fast, accelerating strike
const SETTLE: Key['e'] = 'inOutQuad';
const BREATH: Key['e'] = 'inOutSine';

const base = (c: Omit<ClipDocument, 'format' | 'version' | 'templates'>): ClipDocument => ({ format: 'fusa-clip', version: 1, templates: ['humanoid'], ...c });

export const IDLE_BREATHING = base({
	id: 'idle-breathing',
	name: 'Idle breathing',
	category: 'idle',
	description: 'Calm breathing: the chest rises, the head follows a beat later, arms sway a little.',
	duration: 2.4,
	loop: true,
	tracks: {
		pelvis: { translate: [k2(0, 0, 0, BREATH), k2(1.2, 0, -0.008, BREATH), k2(2.4, 0, 0)] },
		torso: { rotate: [k(0, 0, BREATH), k(1.2, -1.5, BREATH), k(2.4, 0)], scale: [k2(0, 1, 1, BREATH), k2(1.2, 1.01, 1.025, BREATH), k2(2.4, 1, 1)] },
		head: { rotate: [k(0, 0.5, BREATH), k(1.4, -1, BREATH), k(2.4, 0.5)] },
		'arm.upper.front': { rotate: [k(0, 0, BREATH), k(1.2, -2, BREATH), k(2.4, 0)] },
		'arm.upper.back': { rotate: [k(0, 0, BREATH), k(1.2, 2, BREATH), k(2.4, 0)] },
	},
	defaults: { mixIn: 0.3 },
});

export const COMBAT_STANCE = base({
	id: 'combat-stance',
	name: 'Combat stance',
	category: 'idle',
	description: 'Ready to fight: knees bent, weight bouncing, weapon arm raised and leaning in.',
	duration: 1.2,
	loop: true,
	tracks: {
		pelvis: { translate: [k2(0, 0, 0.015, BREATH), k2(0.6, 0, 0.03, BREATH), k2(1.2, 0, 0.015)] },
		torso: { rotate: [k(0, 6, BREATH), k(0.6, 8, BREATH), k(1.2, 6)] },
		head: { rotate: [k(0, -4, BREATH), k(0.7, -5, BREATH), k(1.2, -4)] },
		'arm.upper.front': { rotate: [k(0, -18, BREATH), k(0.6, -14, BREATH), k(1.2, -18)] },
		'arm.lower.front': { rotate: [k(0, -28, BREATH), k(0.65, -24, BREATH), k(1.2, -28)] },
		'arm.upper.back': { rotate: [k(0, -12, BREATH), k(0.6, -9, BREATH), k(1.2, -12)] },
		'arm.lower.back': { rotate: [k(0, -20, BREATH), k(1.2, -20)] },
		'leg.upper.front': { rotate: [k(0, -8, BREATH), k(0.6, -11, BREATH), k(1.2, -8)] },
		'leg.lower.front': { rotate: [k(0, 8, BREATH), k(0.6, 13, BREATH), k(1.2, 8)] },
		'leg.upper.back': { rotate: [k(0, 8, BREATH), k(0.6, 10, BREATH), k(1.2, 8)] },
		'leg.lower.back': { rotate: [k(0, 5, BREATH), k(0.6, 9, BREATH), k(1.2, 5)] },
		'foot.front': { rotate: [k(0, 0, BREATH), k(0.6, -2, BREATH), k(1.2, 0)] },
	},
	defaults: { mixIn: 0.25 },
});

export const SWORD_SLASH = base({
	id: 'sword-slash',
	name: 'Sword slash',
	category: 'attack',
	description: 'Raise the blade behind the head, step in and cut down across the front, follow through and recover.',
	duration: 0.9,
	loop: false,
	phases: { anticipation: [0, 0.32], action: [0.32, 0.44], impact: 0.44, recovery: [0.5, 0.9] },
	events: [
		{ t: 0, name: 'windup' },
		{ t: 0.32, name: 'release' },
		{ t: 0.42, name: 'contact' },
		{ t: 0.6, name: 'recover' },
		{ t: 0.9, name: 'end' },
	],
	requires: ['arm.upper.front', 'arm.lower.front', 'weapon', 'torso'],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outCubic'), k2(0.3, -0.035, 0), k2(0.32, -0.035, 0, SNAP), k2(0.44, 0.07, 0, 'outQuad'), k2(0.6, 0.075, 0, SETTLE), k2(0.9, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0, 'outCubic'), k2(0.3, 0, 0.025), k2(0.44, 0, 0.035, 'outQuad'), k2(0.6, 0, 0.03, SETTLE), k2(0.9, 0, 0)] },
		torso: {
			rotate: [k(0, 0, 'outCubic'), k(0.3, -11), k(0.32, -11, SNAP), k(0.44, 17, 'outBack'), k(0.6, 13, SETTLE), k(0.9, 0)],
			scale: [k2(0, 1, 1, 'outCubic'), k2(0.3, 1.02, 0.97), k2(0.32, 1.02, 0.97, SNAP), k2(0.44, 0.98, 1.03, 'outQuad'), k2(0.7, 1, 1)],
		},
		head: { rotate: [k(0, 0, 'outCubic'), k(0.34, -7), k(0.48, 8, 'outQuad'), k(0.66, 5, SETTLE), k(0.9, 0)] },
		'arm.upper.front': {
			space: 'world',
			rotate: [k(0, 100, 'outCubic'), k(0.28, 168), k(0.32, 174, SNAP), k(0.44, 40, 'outBack'), k(0.52, 46, SETTLE), k(0.9, 82)],
			layer: [{ t: 0.05, behind: 'head' }, { t: 0.37 }],
		},
		'arm.lower.front': {
			space: 'world',
			rotate: [k(0, 70, 'outCubic'), k(0.3, -112), k(0.33, -116, SNAP), k(0.45, 38, 'outBack'), k(0.53, 44, SETTLE), k(0.9, 50)],
			layer: [{ t: 0.05, behind: 'head' }, { t: 0.37 }],
		},
		'hand.front': { rotate: [k(0, 0, 'outCubic'), k(0.3, 10), k(0.34, 10, SNAP), k(0.45, -8, 'outQuad'), k(0.9, 0, SETTLE)], layer: [{ t: 0.05, behind: 'head' }, { t: 0.37 }] },
		weapon: {
			space: 'world',
			rotate: [k(0, -60, 'outCubic'), k(0.3, -196), k(0.33, -200, SNAP), k(0.45, 42, 'outBack'), k(0.54, 50, SETTLE), k(0.9, -50)],
			layer: [{ t: 0.05, behind: 'head' }, { t: 0.37 }],
		},
		'arm.upper.back': { rotate: [k(0, 0, 'outCubic'), k(0.3, -22), k(0.34, -22, SNAP), k(0.46, 34, 'outQuad'), k(0.64, 24, SETTLE), k(0.9, 0)] },
		'arm.lower.back': { rotate: [k(0, 0, 'outCubic'), k(0.3, -25), k(0.46, 10, 'outQuad'), k(0.9, 0, SETTLE)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outCubic'), k(0.3, 6), k(0.32, 6, SNAP), k(0.44, -20, 'outQuad'), k(0.62, -16, SETTLE), k(0.9, 0)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outCubic'), k(0.3, 4), k(0.44, 18, 'outQuad'), k(0.62, 14, SETTLE), k(0.9, 0)] },
		'foot.front': { rotate: [k(0, 0), k(0.44, 4, 'outQuad'), k(0.9, 0, SETTLE)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outCubic'), k(0.3, -6), k(0.32, -6, SNAP), k(0.44, 14, 'outQuad'), k(0.62, 11, SETTLE), k(0.9, 0)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outCubic'), k(0.3, 8), k(0.44, 4, 'outQuad'), k(0.9, 0, SETTLE)] },
	},
	defaults: { mixIn: 0.08, mixOut: 0.25 },
});

export const HEAVY_SLASH = base({
	id: 'heavy-slash',
	name: 'Heavy slash',
	category: 'attack',
	description: 'A slow, heavy overhead chop: long wind-up, a short hold, a crushing blow and a weighty recovery.',
	duration: 1.35,
	loop: false,
	phases: { anticipation: [0, 0.55], action: [0.62, 0.74], impact: 0.74, recovery: [0.84, 1.35] },
	events: [
		{ t: 0, name: 'windup' },
		{ t: 0.62, name: 'release' },
		{ t: 0.72, name: 'contact' },
		{ t: 0.95, name: 'recover' },
		{ t: 1.35, name: 'end' },
	],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outCubic'), k2(0.55, -0.05, 0), k2(0.62, -0.05, 0, SNAP), k2(0.74, 0.09, 0, 'outQuad'), k2(0.95, 0.09, 0, SETTLE), k2(1.35, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0, 'outCubic'), k2(0.55, 0, 0.01), k2(0.62, 0, 0.01, SNAP), k2(0.74, 0, 0.06, 'outQuad'), k2(0.95, 0, 0.05, SETTLE), k2(1.35, 0, 0)] },
		torso: {
			rotate: [k(0, 0, 'outCubic'), k(0.55, -15), k(0.62, -16, SNAP), k(0.74, 24, 'outBack'), k(0.95, 20, SETTLE), k(1.35, 0)],
			scale: [k2(0, 1, 1, 'outCubic'), k2(0.55, 0.98, 1.04), k2(0.62, 0.98, 1.04, SNAP), k2(0.74, 1.03, 0.95, 'outQuad'), k2(1.0, 1, 1)],
		},
		head: { rotate: [k(0, 0, 'outCubic'), k(0.58, -10), k(0.78, 10, 'outQuad'), k(1.0, 7, SETTLE), k(1.35, 0)] },
		'arm.upper.front': {
			space: 'world',
			rotate: [k(0, 100, 'outCubic'), k(0.5, -78), k(0.62, -84, SNAP), k(0.74, 62, 'outBack'), k(0.86, 66, SETTLE), k(1.35, 85)],
			layer: [{ t: 0.12, behind: 'head' }, { t: 0.68 }],
		},
		'arm.lower.front': {
			space: 'world',
			rotate: [k(0, 70, 'outCubic'), k(0.5, -150), k(0.62, -156, SNAP), k(0.75, 62, 'outBack'), k(0.86, 64, SETTLE), k(1.35, 55)],
			layer: [{ t: 0.12, behind: 'head' }, { t: 0.68 }],
		},
		'hand.front': { rotate: [k(0, 0, 'outCubic'), k(0.55, 8), k(0.62, 8, SNAP), k(0.75, -6, 'outQuad'), k(1.35, 0, SETTLE)], layer: [{ t: 0.12, behind: 'head' }, { t: 0.68 }] },
		weapon: {
			space: 'world',
			rotate: [k(0, -60, 'outCubic'), k(0.5, -175), k(0.62, -182, SNAP), k(0.75, 70, 'outBack'), k(0.88, 74, SETTLE), k(1.35, -45)],
			layer: [{ t: 0.12, behind: 'head' }, { t: 0.68 }],
		},
		'arm.upper.back': {
			space: 'world',
			rotate: [k(0, 100, 'outCubic'), k(0.5, -95), k(0.62, -100, SNAP), k(0.75, 58, 'outBack'), k(0.9, 62, SETTLE), k(1.35, 90)],
		},
		'arm.lower.back': { rotate: [k(0, 0, 'outCubic'), k(0.55, -30), k(0.75, -10, 'outQuad'), k(1.35, 0, SETTLE)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outCubic'), k(0.55, 8), k(0.62, 8, SNAP), k(0.74, -24, 'outQuad'), k(0.95, -20, SETTLE), k(1.35, 0)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outCubic'), k(0.55, 4), k(0.74, 26, 'outQuad'), k(0.95, 22, SETTLE), k(1.35, 0)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outCubic'), k(0.55, -8), k(0.62, -8, SNAP), k(0.74, 18, 'outQuad'), k(0.95, 15, SETTLE), k(1.35, 0)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outCubic'), k(0.55, 10), k(0.74, 12, 'outQuad'), k(1.35, 0, SETTLE)] },
	},
	defaults: { mixIn: 0.1, mixOut: 0.3 },
});

export const MAGIC_CAST = base({
	id: 'magic-cast',
	name: 'Magic cast',
	category: 'magic',
	description: 'Draw power in close to the body, then thrust the casting hand forward and up, hold while the spell flies, and settle.',
	duration: 1.4,
	loop: false,
	phases: { anticipation: [0, 0.5], action: [0.5, 0.62], impact: 0.62, recovery: [1.0, 1.4] },
	events: [
		{ t: 0, name: 'windup' },
		{ t: 0.6, name: 'release' },
		{ t: 1.0, name: 'recover' },
		{ t: 1.4, name: 'end' },
	],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	tracks: {
		pelvis: { translate: [k2(0, 0, 0, 'outCubic'), k2(0.5, 0, 0.025), k2(0.62, 0, -0.01, 'outBack'), k2(1.0, 0, -0.005, SETTLE), k2(1.4, 0, 0)] },
		torso: {
			rotate: [k(0, 0, 'outCubic'), k(0.5, -7), k(0.62, 9, 'outBack'), k(0.8, 8), k(1.0, 7, SETTLE), k(1.4, 0)],
			scale: [k2(0, 1, 1, 'outCubic'), k2(0.5, 1.02, 0.97), k2(0.62, 0.99, 1.03, 'outQuad'), k2(1.0, 1, 1.02, SETTLE), k2(1.4, 1, 1)],
		},
		head: { rotate: [k(0, 0, 'outCubic'), k(0.5, 5), k(0.65, -6, 'outQuad'), k(1.0, -5, SETTLE), k(1.4, 0)] },
		'arm.upper.front': { space: 'world', rotate: [k(0, 95, 'outCubic'), k(0.5, 135), k(0.62, -25, 'outBack'), k(0.8, -22), k(0.9, -26), k(1.0, -24, SETTLE), k(1.4, 80)] },
		'arm.lower.front': { space: 'world', rotate: [k(0, 70, 'outCubic'), k(0.5, -95), k(0.62, -20, 'outBack'), k(0.8, -16), k(0.9, -21), k(1.0, -18, SETTLE), k(1.4, 50)] },
		'hand.front': { rotate: [k(0, 0, 'outCubic'), k(0.5, 20), k(0.62, -20, 'outQuad'), k(1.0, -18, SETTLE), k(1.4, 0)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outCubic'), k(0.5, -28), k(0.62, -45, 'outBack'), k(1.0, -40, SETTLE), k(1.4, 0)] },
		'arm.lower.back': { rotate: [k(0, 0, 'outCubic'), k(0.5, -40), k(0.62, -30, 'outQuad'), k(1.4, 0, SETTLE)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outCubic'), k(0.5, -4), k(0.62, -10, 'outQuad'), k(1.0, -8, SETTLE), k(1.4, 0)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outCubic'), k(0.5, 8), k(0.62, 6, 'outQuad'), k(1.4, 0, SETTLE)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outCubic'), k(0.5, 4), k(0.62, 9, 'outQuad'), k(1.0, 7, SETTLE), k(1.4, 0)] },
	},
	defaults: { mixIn: 0.12, mixOut: 0.3 },
});

export const LIGHT_HIT = base({
	id: 'light-hit',
	name: 'Light hit',
	category: 'reaction',
	description: 'A flinch: the body snaps back from the blow, the head whips a moment later, then everything settles.',
	duration: 0.5,
	loop: false,
	phases: { impact: 0, action: [0, 0.08], recovery: [0.08, 0.5] },
	events: [
		{ t: 0, name: 'contact' },
		{ t: 0.5, name: 'end' },
	],
	requires: ['torso'],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.07, -0.035, 0), k2(0.18, -0.03, 0, SETTLE), k2(0.5, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.07, -12), k(0.2, -8, 'outBack'), k(0.5, 0)] },
		head: { rotate: [k(0, 0), k(0.05, 0, 'outQuad'), k(0.12, -12), k(0.26, -6, SETTLE), k(0.5, 0)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.08, 12), k(0.5, 0, SETTLE)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.08, 14), k(0.5, 0, SETTLE)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.08, 5), k(0.5, 0, SETTLE)] },
	},
	defaults: { mixIn: 0.03, mixOut: 0.2 },
});

export const HEAVY_HIT = base({
	id: 'heavy-hit',
	name: 'Heavy hit',
	category: 'reaction',
	description: 'Knocked off balance: thrown back, knees buckle, arms fly out, a wobble, then a heavy recovery.',
	duration: 0.9,
	loop: false,
	phases: { impact: 0, action: [0, 0.1], recovery: [0.1, 0.9] },
	events: [
		{ t: 0, name: 'contact' },
		{ t: 0.9, name: 'end' },
	],
	requires: ['torso'],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.1, -0.08, 0), k2(0.3, -0.07, 0, SETTLE), k2(0.9, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.12, 0, 0.04), k2(0.4, 0, 0.03, SETTLE), k2(0.9, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.1, -22), k(0.25, -14, BREATH), k(0.4, -19, BREATH), k(0.9, 0, SETTLE)] },
		head: { rotate: [k(0, 0), k(0.06, 0, 'outQuad'), k(0.16, -18), k(0.32, -8, BREATH), k(0.48, -12, BREATH), k(0.9, 0, SETTLE)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.1, -35), k(0.4, -20, SETTLE), k(0.9, 0)] },
		'arm.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.12, -25), k(0.9, 0, SETTLE)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.1, 30), k(0.4, 18, SETTLE), k(0.9, 0)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.12, -10), k(0.4, -8, SETTLE), k(0.9, 0)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.12, 18), k(0.4, 14, SETTLE), k(0.9, 0)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.12, 10), k(0.9, 0, SETTLE)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.12, 12), k(0.9, 0, SETTLE)] },
	},
	defaults: { mixIn: 0.03, mixOut: 0.25 },
});

export const HUMANOID_CLIPS: ClipDocument[] = [IDLE_BREATHING, COMBAT_STANCE, SWORD_SLASH, HEAVY_SLASH, MAGIC_CAST, LIGHT_HIT, HEAVY_HIT];
