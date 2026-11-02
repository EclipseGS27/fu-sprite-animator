import type { ClipDocument, TemplateId } from '../core/types';
import { BACK, OUT, SET, SINE, SNAP, clip, cycle, cycle2, ev, k, k2, tremble } from './kit';

/*
 * Creature clips (Phase 6). Roles are shared between templates (see rig/templates.ts): torso is
 * the body (for beasts it points forward, from hips to shoulders), neck, head, tail, tail.tip,
 * leg.front|hind.near|far, wing.near|far, crest (blob top). Facing right; offsets turn clockwise:
 *   torso +  front dips, −  front rears up       legs +  foot swings back, −  forward
 *   neck/head +  lower toward the ground          tail +  lifts (any back-pointing bone)
 *   wing.near +  up and forward, −  down and back  wing.far +  forward and down, −  up and back
 * Generic clips use only the root, so they play on any rig (custom rigs, unknown creatures).
 */

const BEASTS: TemplateId[] = ['quadruped', 'winged', 'serpentine'];

/* ------------------------------------------------------------------ */
/*  Beasts: idle, attacks, magic, defence, reactions                   */
/* ------------------------------------------------------------------ */

const BEAST_IDLE = clip({
	id: 'beast-idle',
	name: 'Beast idle',
	category: 'idle',
	description: 'Slow breathing through the body, the head and neck shifting, the tail swaying.',
	duration: 2.4,
	loop: true,
	templates: BEASTS,
	tracks: {
		root: { translate: cycle2(2.4, [[0, 0], [0, 0.006]]) },
		torso: { scale: cycle2(2.4, [[1, 1], [1, 1.03]]) },
		neck: { rotate: cycle(2.4, [0, 2, 3, 1]) },
		head: { rotate: cycle(2.4, [0, -1.5, -2.5, -1]) },
		tail: { rotate: cycle(2.4, [-4, 2, 6, 0]) },
		'tail.tip': { rotate: cycle(2.4, [0, -8, 0, 10]) },
		'wing.near': { rotate: cycle(2.4, [0, -3]) },
		'wing.far': { rotate: cycle(2.4, [0, 3]) },
	},
});

const BITE = clip({
	id: 'bite',
	name: 'Bite',
	category: 'attack',
	description: 'Rear the head back with the jaws open, then lunge and snap down on the target.',
	duration: 0.85,
	phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.4, recovery: [0.5, 0.85] },
	events: [ev(0, 'windup'), ev(0.3, 'release'), ev(0.4, 'contact'), ev(0.5, 'recover'), ev(0.85, 'end')],
	requires: ['neck', 'head'],
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.3, -0.04, 0, SNAP), k2(0.4, 0.1, 0, 'outQuad'), k2(0.55, 0.09, 0, SET), k2(0.85, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.3, -6, SNAP), k(0.4, 7, BACK), k(0.55, 5, SET), k(0.85, 0)] },
		neck: { rotate: [k(0, 0, OUT), k(0.3, -22, SNAP), k(0.4, 18, BACK), k(0.55, 14, SET), k(0.85, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, -16, SNAP), k(0.4, 14, 'outQuad'), k(0.5, 8, SET), k(0.85, 0)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.3, -8, SNAP), k(0.4, 18, 'outQuad'), k(0.85, 0, SET)] },
		'leg.hind.far': { rotate: [k(0, 0, OUT), k(0.3, -6, SNAP), k(0.42, 15, 'outQuad'), k(0.85, 0, SET)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.3, 6, SNAP), k(0.4, -20, 'outQuad'), k(0.85, 0, SET)] },
		'leg.front.far': { rotate: [k(0, 0, OUT), k(0.3, 5, SNAP), k(0.42, -16, 'outQuad'), k(0.85, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.3, 10, SNAP), k(0.42, -14, 'outQuad'), k(0.85, 0, SET)] },
		'tail.tip': { rotate: [k(0, 0, OUT), k(0.34, 14, SNAP), k(0.48, -16, 'outQuad'), k(0.85, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.3, 10, SNAP), k(0.42, -12, 'outQuad'), k(0.85, 0, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.3, -8, SNAP), k(0.42, 10, 'outQuad'), k(0.85, 0, SET)] },
	},
});

const CLAW = clip({
	id: 'claw',
	name: 'Claw',
	category: 'attack',
	description: 'Rear up on the hind legs, raise a foreleg high and rake it down.',
	duration: 0.9,
	phases: { anticipation: [0, 0.32], action: [0.32, 0.42], impact: 0.42, recovery: [0.5, 0.9] },
	events: [ev(0, 'windup'), ev(0.32, 'release'), ev(0.42, 'contact'), ev(0.5, 'recover'), ev(0.9, 'end')],
	requires: ['torso', 'leg.front.near'],
	templates: ['quadruped', 'winged'],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.32, -0.02, 0, SNAP), k2(0.42, 0.07, 0, 'outQuad'), k2(0.9, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.32, -22, SNAP), k(0.42, 4, BACK), k(0.6, 2, SET), k(0.9, 0)] },
		// the hind legs turn against the body so the feet stay planted while it rears
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.32, 22, SNAP), k(0.42, -4, BACK), k(0.6, -2, SET), k(0.9, 0)] },
		'leg.hind.far': { rotate: [k(0, 0, OUT), k(0.32, 22, SNAP), k(0.42, -4, BACK), k(0.6, -2, SET), k(0.9, 0)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.32, -78, SNAP), k(0.42, 18, BACK), k(0.6, 8, SET), k(0.9, 0)] },
		'leg.front.far': { rotate: [k(0, 0, OUT), k(0.32, -14, SNAP), k(0.44, 4, 'outQuad'), k(0.9, 0, SET)] },
		neck: { rotate: [k(0, 0, OUT), k(0.32, -10, SNAP), k(0.42, 15, 'outQuad'), k(0.9, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.32, -10, SNAP), k(0.44, 10, 'outQuad'), k(0.9, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.32, -15, SNAP), k(0.42, 10, 'outQuad'), k(0.9, 0, SET)] },
		'tail.tip': { rotate: [k(0, 0, OUT), k(0.36, -12, SNAP), k(0.48, 12, 'outQuad'), k(0.9, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.32, 18, SNAP), k(0.44, -10, 'outQuad'), k(0.9, 0, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.32, -14, SNAP), k(0.44, 8, 'outQuad'), k(0.9, 0, SET)] },
	},
});

const POUNCE = clip({
	id: 'pounce',
	name: 'Pounce',
	category: 'attack',
	description: 'Crouch low, spring forward with the forelegs reaching, land on the target and push back.',
	duration: 1.05,
	phases: { anticipation: [0, 0.35], action: [0.35, 0.6], impact: 0.6, recovery: [0.68, 1.05] },
	events: [ev(0, 'windup'), ev(0.36, 'release'), ev(0.6, 'contact'), ev(0.68, 'recover'), ev(1.05, 'end')],
	requires: ['torso'],
	templates: BEASTS,
	tracks: {
		root: {
			translate: [k2(0, 0, 0, OUT), k2(0.35, -0.03, 0.03, SNAP), k2(0.48, 0.1, -0.16, 'outQuad'), k2(0.6, 0.15, 0, 'inQuad'), k2(0.72, 0.14, 0.01, SET), k2(1.05, 0, 0)],
			scale: [k2(0, 1, 1, OUT), k2(0.35, 1.05, 0.92, SNAP), k2(0.45, 0.97, 1.04, OUT), k2(0.6, 1.05, 0.94, OUT), k2(0.75, 1, 1, SET)],
		},
		torso: { rotate: [k(0, 0, OUT), k(0.35, 6, SNAP), k(0.47, -12, 'outQuad'), k(0.6, 10, OUT), k(0.75, 4, SET), k(1.05, 0)] },
		neck: { rotate: [k(0, 0, OUT), k(0.35, 12, SNAP), k(0.48, -10), k(0.6, 14, OUT), k(1.05, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.35, -6, SNAP), k(0.5, -10), k(0.62, 10, OUT), k(1.05, 0, SET)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.35, -20, SNAP), k(0.48, -45, 'outQuad'), k(0.6, -10, OUT), k(1.05, 0, SET)] },
		'leg.front.far': { rotate: [k(0, 0, OUT), k(0.35, -18, SNAP), k(0.5, -40, 'outQuad'), k(0.62, -8, OUT), k(1.05, 0, SET)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.35, 20, SNAP), k(0.48, 45, 'outQuad'), k(0.6, 15, OUT), k(1.05, 0, SET)] },
		'leg.hind.far': { rotate: [k(0, 0, OUT), k(0.35, 18, SNAP), k(0.5, 40, 'outQuad'), k(0.62, 12, OUT), k(1.05, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.35, -10, SNAP), k(0.5, 18, 'outQuad'), k(0.65, -6, OUT), k(1.05, 0, SET)] },
		'tail.tip': { rotate: [k(0, 0, OUT), k(0.4, -12, SNAP), k(0.55, 20, 'outQuad'), k(0.7, -8, OUT), k(1.05, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.35, 20, SNAP), k(0.5, -30, 'outQuad'), k(1.05, 0, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.35, -16, SNAP), k(0.5, 26, 'outQuad'), k(1.05, 0, SET)] },
	},
});

const TAIL_SWIPE = clip({
	id: 'tail-swipe',
	name: 'Tail swipe',
	category: 'attack',
	description: 'Lift the tail high, then whip it down across the target, the tip lashing a moment later.',
	duration: 0.95,
	phases: { anticipation: [0, 0.35], action: [0.35, 0.47], impact: 0.45, recovery: [0.55, 0.95] },
	events: [ev(0, 'windup'), ev(0.35, 'release'), ev(0.45, 'contact'), ev(0.55, 'recover'), ev(0.95, 'end')],
	requires: ['tail'],
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.35, 0.03, 0, SNAP), k2(0.47, -0.04, 0, 'outQuad'), k2(0.95, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.35, 5, SNAP), k(0.47, -6, 'outQuad'), k(0.95, 0, SET)] },
		neck: { rotate: [k(0, 0, OUT), k(0.35, 8, SNAP), k(0.5, -6, 'outQuad'), k(0.95, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.35, 35, SNAP), k(0.47, -50, 'outQuad'), k(0.6, -40, SET), k(0.95, 0)] },
		'tail.tip': { rotate: [k(0, 0, OUT), k(0.38, 25, SNAP), k(0.52, -45, 'outQuad'), k(0.65, -30, SET), k(0.95, 0)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.35, -6, SNAP), k(0.47, 8, 'outQuad'), k(0.95, 0, SET)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.35, -6, SNAP), k(0.47, 6, 'outQuad'), k(0.95, 0, SET)] },
	},
});

const ROAR = clip({
	id: 'roar',
	name: 'Roar',
	category: 'magic',
	description: 'Gather with the head low, then throw it up and roar, the body shaking; wings spread.',
	duration: 1.3,
	phases: { anticipation: [0, 0.35], action: [0.35, 0.45], impact: 0.6, recovery: [1.0, 1.3] },
	events: [ev(0, 'windup'), ev(0.42, 'release'), ev(0.6, 'contact'), ev(1.0, 'recover'), ev(1.3, 'end')],
	requires: ['head'],
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.35, 0.02, 0, SNAP), k2(0.45, -0.025, 0, 'outQuad'), k2(1.0, -0.02, 0, SET), k2(1.3, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.35, 4, SNAP), k(0.45, -8, 'outQuad'), ...tremble(0.5, 1.0, 1, -8), k(1.3, 0, SET)] },
		neck: { rotate: [k(0, 0, OUT), k(0.35, 12, SNAP), k(0.45, -30, BACK), ...tremble(0.5, 1.0, 1.5, -28), k(1.3, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.35, 8, SNAP), k(0.45, -28, BACK), k(1.0, -24, SET), k(1.3, 0)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.45, -8, 'outQuad'), k(1.0, -6), k(1.3, 0, SET)] },
		'leg.front.far': { rotate: [k(0, 0, OUT), k(0.45, -6, 'outQuad'), k(1.0, -5), k(1.3, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.35, -6, SNAP), k(0.5, 16, 'outQuad'), k(1.0, 12), k(1.3, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.35, -6, SNAP), k(0.5, 25, 'outQuad'), k(1.0, 22), k(1.3, 0, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.35, 6, SNAP), k(0.5, -20, 'outQuad'), k(1.0, -18), k(1.3, 0, SET)] },
	},
});

const BREATH = clip({
	id: 'breath',
	name: 'Breath attack',
	category: 'magic',
	description: 'Rear the head back and fill up, then thrust it forward and hold the breath on the target.',
	duration: 1.4,
	phases: { anticipation: [0, 0.45], action: [0.45, 0.6], impact: 0.62, recovery: [1.05, 1.4] },
	events: [ev(0, 'windup'), ev(0.5, 'release'), ev(0.62, 'contact'), ev(1.05, 'recover'), ev(1.4, 'end')],
	requires: ['neck', 'head'],
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.45, -0.03, 0, SNAP), k2(0.6, 0.04, 0, 'outQuad'), k2(1.05, 0.03, 0, SET), k2(1.4, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.45, -8, SNAP), k(0.6, 6, 'outQuad'), k(1.05, 4, SET), k(1.4, 0)], scale: [k2(0, 1, 1, OUT), k2(0.45, 1, 1.05, SNAP), k2(0.6, 1, 0.98), k2(1.4, 1, 1, SET)] },
		neck: { rotate: [k(0, 0, OUT), k(0.45, -30, SNAP), k(0.6, 20, BACK), ...tremble(0.65, 1.05, 1.2, 18), k(1.4, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.45, -20, SNAP), k(0.6, 12, 'outQuad'), ...tremble(0.65, 1.05, 1, 10), k(1.4, 0, SET)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.45, 6, SNAP), k(0.6, -10, 'outQuad'), k(1.05, -8), k(1.4, 0, SET)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.45, -4, SNAP), k(0.6, 8, 'outQuad'), k(1.05, 6), k(1.4, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.45, 12, SNAP), k(0.6, -8, 'outQuad'), k(1.4, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.45, 15, SNAP), k(0.6, -10, 'outQuad'), k(1.4, 0, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.45, -12, SNAP), k(0.6, 8, 'outQuad'), k(1.4, 0, SET)] },
	},
});

const CROUCH = clip({
	id: 'crouch',
	name: 'Crouch',
	category: 'defence',
	description: 'Sink low with the head down and the legs braced, and hold it (a beast’s guard).',
	duration: 1.0,
	phases: { action: [0, 0.3] },
	events: [ev(0.3, 'contact'), ev(1.0, 'end')],
	mixOut: 0.45,
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.3, -0.015, 0.035), k2(1.0, -0.015, 0.03, SINE)] },
		torso: { rotate: [k(0, 0, OUT), k(0.3, 4), k(1.0, 3, SINE)] },
		neck: { rotate: [k(0, 0, OUT), k(0.3, 16), k(1.0, 15, SINE)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, -10), k(1.0, -9, SINE)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.3, -12), k(1.0, -12)] },
		'leg.front.far': { rotate: [k(0, 0, OUT), k(0.3, -10), k(1.0, -10)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.3, 12), k(1.0, 12)] },
		'leg.hind.far': { rotate: [k(0, 0, OUT), k(0.3, 10), k(1.0, 10)] },
		tail: { rotate: [k(0, 0, OUT), k(0.3, -12), k(1.0, -10, SINE)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.3, -15), k(1.0, -14, SINE)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.3, 12), k(1.0, 11, SINE)] },
	},
});

const BEAST_DODGE = clip({
	id: 'beast-dodge',
	name: 'Beast dodge',
	category: 'defence',
	description: 'A quick hop back with the legs tucked, landing ready.',
	duration: 0.65,
	phases: { action: [0, 0.18], recovery: [0.3, 0.65] },
	events: [ev(0, 'contact'), ev(0.65, 'end')],
	mixIn: 0.03,
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.16, -0.1, -0.06), k2(0.3, -0.12, 0, 'inQuad'), k2(0.4, -0.11, 0.005, SET), k2(0.65, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.16, -10), k(0.3, 4, OUT), k(0.65, 0, SET)] },
		neck: { rotate: [k(0, 0, 'outQuad'), k(0.18, -12), k(0.32, 4, OUT), k(0.65, 0, SET)] },
		'leg.front.near': { rotate: [k(0, 0, 'outQuad'), k(0.16, -20), k(0.3, 0, OUT), k(0.65, 0)] },
		'leg.front.far': { rotate: [k(0, 0, 'outQuad'), k(0.16, -18), k(0.3, 0, OUT), k(0.65, 0)] },
		'leg.hind.near': { rotate: [k(0, 0, 'outQuad'), k(0.16, 20), k(0.3, 0, OUT), k(0.65, 0)] },
		'leg.hind.far': { rotate: [k(0, 0, 'outQuad'), k(0.16, 18), k(0.3, 0, OUT), k(0.65, 0)] },
		tail: { rotate: [k(0, 0, 'outQuad'), k(0.18, 14), k(0.35, -4, OUT), k(0.65, 0, SET)] },
	},
});

const BEAST_HIT = clip({
	id: 'beast-hit',
	name: 'Beast hit',
	category: 'reaction',
	description: 'The body jolts back and the front lifts, the head whips up, the tail flicks.',
	duration: 0.55,
	phases: { impact: 0, action: [0, 0.08], recovery: [0.08, 0.55] },
	events: [ev(0, 'contact'), ev(0.55, 'end')],
	mixIn: 0.03,
	mixOut: 0.2,
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.07, -0.04, 0), k2(0.18, -0.03, 0, SET), k2(0.55, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.07, -10), k(0.2, -6, BACK), k(0.55, 0, SET)] },
		neck: { rotate: [k(0, 0), k(0.04, 0, 'outQuad'), k(0.11, -14), k(0.26, -6, SET), k(0.55, 0)] },
		head: { rotate: [k(0, 0), k(0.06, 0, 'outQuad'), k(0.13, -10), k(0.3, -4, SET), k(0.55, 0)] },
		tail: { rotate: [k(0, 0, 'outQuad'), k(0.1, 15), k(0.3, -4, SET), k(0.55, 0)] },
		'tail.tip': { rotate: [k(0, 0), k(0.04, 0, 'outQuad'), k(0.14, 20), k(0.34, -6, SET), k(0.55, 0)] },
		'leg.front.near': { rotate: [k(0, 0, 'outQuad'), k(0.08, -8), k(0.55, 0, SET)] },
		'leg.front.far': { rotate: [k(0, 0, 'outQuad'), k(0.08, -6), k(0.55, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, 'outQuad'), k(0.08, 12), k(0.3, -4, SET), k(0.55, 0)] },
		'wing.far': { rotate: [k(0, 0, 'outQuad'), k(0.08, -10), k(0.3, 3, SET), k(0.55, 0)] },
	},
});

const BEAST_DEFEAT = clip({
	id: 'beast-defeat',
	name: 'Beast defeat',
	category: 'reaction',
	description: 'The legs give way and the body sinks to the ground, the head drops last. Stays down.',
	duration: 1.5,
	phases: { impact: 0, action: [0, 0.5], recovery: [0.5, 1.5] },
	events: [ev(0, 'contact'), ev(1.5, 'end')],
	mixIn: 0.05,
	templates: BEASTS,
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.12, -0.03, 0), k2(0.55, -0.02, 0.17, 'inQuad'), k2(0.62, -0.02, 0.15, OUT), k2(0.75, -0.02, 0.17, SET)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.12, -8), k(0.55, 5, 'inQuad'), k(0.7, 3, SET)] },
		neck: { rotate: [k(0, 0, 'outQuad'), k(0.15, -12), k(0.7, 45, 'inQuad'), k(0.78, 40, OUT), k(0.9, 44, SET)] },
		head: { rotate: [k(0, 0, 'outQuad'), k(0.2, -8), k(0.8, 35, 'inQuad'), k(0.88, 30, OUT), k(1.0, 33, SET)] },
		'leg.front.near': { rotate: [k(0, 0, 'outQuad'), k(0.12, -6), k(0.55, -55, 'inQuad'), k(0.7, -50, SET)] },
		'leg.front.far': { rotate: [k(0, 0, 'outQuad'), k(0.12, -5), k(0.58, -48, 'inQuad'), k(0.72, -45, SET)] },
		'leg.hind.near': { rotate: [k(0, 0, 'outQuad'), k(0.12, 6), k(0.55, 58, 'inQuad'), k(0.7, 52, SET)] },
		'leg.hind.far': { rotate: [k(0, 0, 'outQuad'), k(0.12, 5), k(0.58, 50, 'inQuad'), k(0.72, 46, SET)] },
		tail: { rotate: [k(0, 0, 'outQuad'), k(0.15, 10), k(0.8, -22, 'inQuad'), k(1.0, -20, SET)] },
		'tail.tip': { rotate: [k(0, 0, 'outQuad'), k(0.2, 12), k(0.9, -20, 'inQuad'), k(1.1, -18, SET)] },
		'wing.near': { rotate: [k(0, 0, 'outQuad'), k(0.15, 15), k(0.8, -35, 'inQuad'), k(1.0, -32, SET)] },
		'wing.far': { rotate: [k(0, 0, 'outQuad'), k(0.15, -12), k(0.8, 30, 'inQuad'), k(1.0, 28, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Winged                                                             */
/* ------------------------------------------------------------------ */

const WING_IDLE = clip({
	id: 'wing-idle',
	name: 'Hover',
	category: 'idle',
	description: 'Slow wing beats that keep the body bobbing in the air.',
	duration: 1.1,
	loop: true,
	requires: ['wing.near'],
	templates: ['winged'],
	tracks: {
		root: { translate: cycle2(1.1, [[0, -0.022], [0, 0.008]]) },
		torso: { rotate: cycle(1.1, [-1.5, 1]) },
		neck: { rotate: cycle(1.1, [1.5, -1]) },
		'wing.near': { rotate: cycle(1.1, [10, -26]), scale: cycle2(1.1, [[1, 1], [0.9, 1]]) },
		'wing.far': { rotate: cycle(1.1, [-9, 24]), scale: cycle2(1.1, [[1, 1], [0.9, 1]]) },
		tail: { rotate: cycle(1.1, [3, -3]) },
		'tail.tip': { rotate: cycle(1.1, [0, 5, 0, -5]) },
	},
});

const WING_BEAT = clip({
	id: 'wing-beat',
	name: 'Wing beat',
	category: 'attack',
	description: 'Raise both wings high, then drive them down in one great beat that blasts the field.',
	duration: 1.15,
	phases: { anticipation: [0, 0.42], action: [0.42, 0.54], impact: 0.54, recovery: [0.62, 1.15] },
	events: [ev(0, 'windup'), ev(0.44, 'release'), ev(0.54, 'contact'), ev(0.62, 'recover'), ev(1.15, 'end')],
	requires: ['wing.near'],
	templates: ['winged'],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.42, 0, 0.02, SNAP), k2(0.54, 0.03, -0.08, 'outQuad'), k2(0.75, 0.02, -0.06, SET), k2(1.15, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.42, -6, SNAP), k(0.54, 4, 'outQuad'), k(1.15, 0, SET)] },
		neck: { rotate: [k(0, 0, OUT), k(0.42, -10, SNAP), k(0.56, 8, 'outQuad'), k(1.15, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.42, -6, SNAP), k(0.58, 6, 'outQuad'), k(1.15, 0, SET)] },
		'wing.near': { rotate: [k(0, 0, OUT), k(0.42, 30, SNAP), k(0.54, -45, 'outQuad'), k(0.75, -35, SET), k(1.15, 0)], scale: [k2(0, 1, 1), k2(0.42, 1.04, 1, SNAP), k2(0.54, 0.82, 1, 'outQuad'), k2(1.15, 1, 1, SET)] },
		'wing.far': { rotate: [k(0, 0, OUT), k(0.42, -25, SNAP), k(0.54, 40, 'outQuad'), k(0.75, 32, SET), k(1.15, 0)], scale: [k2(0, 1, 1), k2(0.42, 1.04, 1, SNAP), k2(0.54, 0.82, 1, 'outQuad'), k2(1.15, 1, 1, SET)] },
		'leg.front.near': { rotate: [k(0, 0, OUT), k(0.54, -15, 'outQuad'), k(1.15, 0, SET)] },
		'leg.hind.near': { rotate: [k(0, 0, OUT), k(0.54, 15, 'outQuad'), k(1.15, 0, SET)] },
		tail: { rotate: [k(0, 0, OUT), k(0.42, -8, SNAP), k(0.58, 12, 'outQuad'), k(1.15, 0, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Serpents                                                           */
/* ------------------------------------------------------------------ */

const SERPENT_IDLE = clip({
	id: 'serpent-idle',
	name: 'Serpent idle',
	category: 'idle',
	description: 'A slow sway passing down the raised neck and along the body to the tail tip.',
	duration: 2.0,
	loop: true,
	requires: ['neck'],
	templates: ['serpentine'],
	tracks: {
		root: { translate: cycle2(2.0, [[0, 0], [0, 0.004]]) },
		torso: { rotate: cycle(2.0, [0, 2.5, 0, -2.5]) },
		neck: { rotate: cycle(2.0, [-5, 0, 5, 0]) },
		head: { rotate: cycle(2.0, [4, 0, -4, 0]) },
		tail: { rotate: cycle(2.0, [0, -6, 0, 6]) },
		'tail.tip': { rotate: cycle(2.0, [10, 0, -10, 0]) },
	},
});

/* ------------------------------------------------------------------ */
/*  Blobs (slimes, puddings)                                           */
/* ------------------------------------------------------------------ */

const BLOB_IDLE = clip({
	id: 'blob-idle',
	name: 'Blob idle',
	category: 'idle',
	description: 'A soft squash and stretch, the top wobbling a beat behind.',
	duration: 1.6,
	loop: true,
	requires: ['root'],
	templates: ['blob'],
	tracks: {
		root: { scale: cycle2(1.6, [[1.03, 0.97], [0.98, 1.025]]) },
		crest: { rotate: cycle(1.6, [0, -4, 0, 4]) },
	},
});

const BLOB_ATTACK = clip({
	id: 'blob-attack',
	name: 'Blob attack',
	category: 'attack',
	description: 'Squash flat, then spring forward stretched tall and splat onto the target.',
	duration: 0.95,
	phases: { anticipation: [0, 0.3], action: [0.3, 0.45], impact: 0.45, recovery: [0.52, 0.95] },
	events: [ev(0, 'windup'), ev(0.3, 'release'), ev(0.45, 'contact'), ev(0.52, 'recover'), ev(0.95, 'end')],
	requires: ['root'],
	templates: ['blob'],
	tracks: {
		root: {
			translate: [k2(0, 0, 0, OUT), k2(0.3, -0.03, 0, SNAP), k2(0.38, 0.08, -0.12, 'outQuad'), k2(0.45, 0.15, 0, 'inQuad'), k2(0.6, 0.14, 0, SET), k2(0.95, 0, 0)],
			scale: [k2(0, 1, 1, OUT), k2(0.3, 1.2, 0.78, SNAP), k2(0.38, 0.86, 1.18, 'outQuad'), k2(0.45, 1.18, 0.84, OUT), k2(0.58, 0.96, 1.05, SET), k2(0.72, 1.02, 0.98, SET), k2(0.95, 1, 1)],
		},
		crest: { rotate: [k(0, 0, OUT), k(0.3, 10, SNAP), k(0.4, -14, 'outQuad'), k(0.5, 12, OUT), k(0.95, 0, SET)] },
	},
});

const BLOB_HIT = clip({
	id: 'blob-hit',
	name: 'Blob hit',
	category: 'reaction',
	description: 'The whole body jiggles from the blow and settles.',
	duration: 0.6,
	phases: { impact: 0, action: [0, 0.05], recovery: [0.05, 0.6] },
	events: [ev(0, 'contact'), ev(0.6, 'end')],
	mixIn: 0.02,
	requires: ['root'],
	templates: ['blob'],
	tracks: {
		root: {
			translate: [k2(0, 0, 0, 'outQuad'), k2(0.05, -0.04, 0), k2(0.25, -0.02, 0, SET), k2(0.6, 0, 0)],
			scale: [k2(0, 1, 1, 'outQuad'), k2(0.05, 0.88, 1.1, SINE), k2(0.15, 1.08, 0.92, SINE), k2(0.27, 0.96, 1.04, SINE), k2(0.4, 1.02, 0.98, SINE), k2(0.6, 1, 1)],
		},
		crest: { rotate: [k(0, 0), k(0.04, 0, 'outQuad'), k(0.12, -14, SINE), k(0.26, 9, SINE), k(0.4, -4, SINE), k(0.6, 0)] },
	},
});

const BLOB_DEFEAT = clip({
	id: 'blob-defeat',
	name: 'Blob defeat',
	category: 'reaction',
	description: 'A last wobble, then the body melts into a puddle. Stays down.',
	duration: 1.3,
	phases: { impact: 0, recovery: [0.1, 1.3] },
	events: [ev(0, 'contact'), ev(1.3, 'end')],
	requires: ['root'],
	templates: ['blob'],
	tracks: {
		root: { scale: [k2(0, 1, 1, 'outQuad'), k2(0.1, 1.1, 0.9, SINE), k2(0.25, 0.92, 1.08, SINE), k2(1.0, 1.4, 0.32, 'inOutCubic'), k2(1.15, 1.35, 0.36, SET)] },
		crest: { rotate: [k(0, 0, 'outQuad'), k(0.25, -10, SINE), k(0.95, 60, 'inQuad'), k(1.1, 55, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Floating spirits                                                   */
/* ------------------------------------------------------------------ */

const FLOAT_IDLE = clip({
	id: 'float-idle',
	name: 'Float',
	category: 'idle',
	description: 'Drifting up and down, the arms swaying and the trailing body rippling.',
	duration: 2.6,
	loop: true,
	templates: ['floating'],
	tracks: {
		root: { translate: cycle2(2.6, [[0, 0], [0, -0.03]]) },
		torso: { rotate: cycle(2.6, [-2, 2]) },
		head: { rotate: cycle(2.6, [2, -2]) },
		'arm.upper.front': { rotate: cycle(2.6, [-6, -2, 2, -2]) },
		'arm.lower.front': { rotate: cycle(2.6, [-4, -10, -4, 2]) },
		'arm.upper.back': { rotate: cycle(2.6, [4, 0, -4, 0]) },
		'arm.lower.back': { rotate: cycle(2.6, [8, 2, -4, 2]) },
		tail: { rotate: cycle(2.6, [-6, 0, 6, 0]) },
		'tail.tip': { rotate: cycle(2.6, [0, -10, 0, 10]) },
	},
});

/* ------------------------------------------------------------------ */
/*  Generic: the root only — any rig                                   */
/* ------------------------------------------------------------------ */

const ANY: TemplateId[] = ['custom', 'humanoid', 'quadruped', 'winged', 'serpentine', 'floating', 'blob'];

const GENERIC_IDLE = clip({
	id: 'generic-idle',
	name: 'Breathe (any rig)',
	category: 'idle',
	description: 'A gentle swell and settle of the whole sprite. Works on any rig.',
	duration: 2.2,
	loop: true,
	requires: ['root'],
	templates: ANY,
	tracks: { root: { scale: cycle2(2.2, [[1, 1], [1, 1.02]]), translate: cycle2(2.2, [[0, 0], [0, -0.004]]) } },
});

const GENERIC_ATTACK = clip({
	id: 'generic-attack',
	name: 'Lunge (any rig)',
	category: 'attack',
	description: 'Lean back, then lunge forward at the target and return. Works on any rig.',
	duration: 0.75,
	phases: { anticipation: [0, 0.25], action: [0.25, 0.33], impact: 0.33, recovery: [0.45, 0.75] },
	events: [ev(0, 'windup'), ev(0.25, 'release'), ev(0.33, 'contact'), ev(0.45, 'recover'), ev(0.75, 'end')],
	requires: ['root'],
	templates: ANY,
	tracks: {
		root: {
			translate: [k2(0, 0, 0, OUT), k2(0.25, -0.04, 0, SNAP), k2(0.33, 0.1, 0, 'outQuad'), k2(0.45, 0.09, 0, SET), k2(0.75, 0, 0)],
			rotate: [k(0, 0, OUT), k(0.25, -5, SNAP), k(0.33, 6, 'outQuad'), k(0.45, 4, SET), k(0.75, 0)],
			scale: [k2(0, 1, 1, OUT), k2(0.25, 0.96, 1.03, SNAP), k2(0.33, 1.06, 0.96, 'outQuad'), k2(0.5, 1, 1, SET)],
		},
	},
});

const GENERIC_CAST = clip({
	id: 'generic-cast',
	name: 'Gather power (any rig)',
	category: 'magic',
	description: 'Rise and swell while trembling, then release. Works on any rig.',
	duration: 1.1,
	phases: { anticipation: [0, 0.42], action: [0.42, 0.5], impact: 0.6, recovery: [0.6, 1.1] },
	events: [ev(0, 'windup'), ev(0.45, 'release'), ev(0.6, 'contact'), ev(1.1, 'end')],
	requires: ['root'],
	templates: ANY,
	tracks: {
		root: {
			translate: [k2(0, 0, 0, OUT), k2(0.42, 0, -0.03, SET), k2(0.5, 0.02, -0.02, 'outQuad'), k2(1.1, 0, 0, SET)],
			scale: [k2(0, 1, 1, OUT), k2(0.42, 1.04, 1.04, SET), k2(0.5, 0.98, 1.02, 'outQuad'), k2(0.7, 1, 1, SET)],
			rotate: [k(0, 0), ...tremble(0.1, 0.42, 1.2), k(0.5, 2, 'outQuad'), k(1.1, 0, SET)],
		},
	},
});

const GENERIC_HIT = clip({
	id: 'generic-hit',
	name: 'Recoil (any rig)',
	category: 'reaction',
	description: 'Knocked back a little, rocking, then settling. Works on any rig.',
	duration: 0.5,
	phases: { impact: 0, action: [0, 0.06], recovery: [0.06, 0.5] },
	events: [ev(0, 'contact'), ev(0.5, 'end')],
	mixIn: 0.02,
	requires: ['root'],
	templates: ANY,
	tracks: {
		root: {
			translate: [k2(0, 0, 0, 'outQuad'), k2(0.06, -0.05, 0), k2(0.2, -0.03, 0, SET), k2(0.5, 0, 0)],
			rotate: [k(0, 0, 'outQuad'), k(0.06, -7), k(0.16, 3, SINE), k(0.28, -1.5, SINE), k(0.5, 0)],
		},
	},
});

const GENERIC_DODGE = clip({
	id: 'generic-dodge',
	name: 'Hop back (any rig)',
	category: 'defence',
	description: 'A quick hop away from the attack. Works on any rig.',
	duration: 0.55,
	phases: { action: [0, 0.18], recovery: [0.3, 0.55] },
	events: [ev(0, 'contact'), ev(0.55, 'end')],
	mixIn: 0.03,
	requires: ['root'],
	templates: ANY,
	tracks: { root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.16, -0.12, -0.05), k2(0.3, -0.12, 0, 'inQuad'), k2(0.55, 0, 0, SET)] } },
});

const GENERIC_DEFEAT = clip({
	id: 'generic-defeat',
	name: 'Collapse (any rig)',
	category: 'reaction',
	description: 'Reel, then slump down and stay down. Works on any rig; stays inside the sprite’s frame.',
	duration: 1.2,
	phases: { impact: 0, recovery: [0.2, 1.2] },
	events: [ev(0, 'contact'), ev(1.2, 'end')],
	requires: ['root'],
	templates: ANY,
	tracks: {
		root: {
			rotate: [k(0, 0, 'outQuad'), k(0.2, -8, SINE), k(0.8, 16, 'inQuad'), k(0.9, 13, OUT), k(1.0, 14, SET)],
			scale: [k2(0, 1, 1), k2(0.2, 0.98, 1.02, SINE), k2(0.8, 1.08, 0.7, 'inQuad'), k2(0.9, 1.05, 0.74, OUT), k2(1.0, 1.06, 0.72, SET)],
			translate: [k2(0, 0, 0), k2(0.2, -0.03, 0, SINE), k2(0.8, 0.02, 0, 'inQuad')],
		},
	},
});

const FLOAT_DEFEAT = clip({
	id: 'float-defeat',
	name: 'Spirit defeat',
	category: 'reaction',
	description: 'The spirit shudders, sinks and folds in on itself, arms hanging. Stays down.',
	duration: 1.4,
	phases: { impact: 0, recovery: [0.15, 1.4] },
	events: [ev(0, 'contact'), ev(1.4, 'end')],
	templates: ['floating'],
	tracks: {
		root: {
			translate: [k2(0, 0, 0, 'outQuad'), k2(0.15, -0.03, -0.02), k2(1.1, 0, 0.12, 'inOutCubic'), k2(1.25, 0, 0.11, SET)],
			scale: [k2(0, 1, 1), k2(0.15, 0.96, 1.04, SINE), k2(1.1, 1.08, 0.72, 'inOutCubic'), k2(1.25, 1.06, 0.74, SET)],
			rotate: [k(0, 0), ...tremble(0.05, 0.4, 2), k(1.1, 4, SET)],
		},
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.15, -6), k(1.1, 14, 'inQuad'), k(1.25, 12, SET)] },
		head: { rotate: [k(0, 0, 'outQuad'), k(0.2, -8), k(1.2, 25, 'inQuad'), k(1.3, 22, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.15, -15), k(1.1, 30, 'inQuad'), k(1.25, 26, SET)] },
		'arm.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.2, -10), k(1.15, 25, 'inQuad'), k(1.3, 22, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.15, 15), k(1.1, -30, 'inQuad'), k(1.25, -26, SET)] },
		'arm.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.2, 10), k(1.15, -25, 'inQuad'), k(1.3, -22, SET)] },
		tail: { rotate: [k(0, 0, 'outQuad'), k(0.3, 10), k(1.2, -8, SINE)] },
		'tail.tip': { rotate: [k(0, 0, 'outQuad'), k(0.35, -14), k(1.25, 10, SINE)] },
	},
});

export const CREATURE_CLIPS: ClipDocument[] = [
	BEAST_IDLE,
	BITE,
	CLAW,
	POUNCE,
	TAIL_SWIPE,
	ROAR,
	BREATH,
	CROUCH,
	BEAST_DODGE,
	BEAST_HIT,
	BEAST_DEFEAT,
	WING_IDLE,
	WING_BEAT,
	SERPENT_IDLE,
	BLOB_IDLE,
	BLOB_ATTACK,
	BLOB_HIT,
	BLOB_DEFEAT,
	FLOAT_IDLE,
	GENERIC_IDLE,
	GENERIC_ATTACK,
	GENERIC_CAST,
	GENERIC_HIT,
	GENERIC_DODGE,
	GENERIC_DEFEAT,
	FLOAT_DEFEAT,
];

/** The idle loop a new character of this template starts with. */
export const DEFAULT_IDLE: Record<TemplateId, string> = {
	humanoid: 'idle-breathing',
	quadruped: 'beast-idle',
	winged: 'wing-idle',
	serpentine: 'serpent-idle',
	floating: 'float-idle',
	blob: 'blob-idle',
	custom: 'generic-idle',
};

/** The action the Studio previews first for a character of this template. */
export const DEFAULT_ACTION: Record<TemplateId, string> = {
	humanoid: 'sword-slash',
	quadruped: 'bite',
	winged: 'wing-beat',
	serpentine: 'bite',
	floating: 'magic-cast',
	blob: 'blob-attack',
	custom: 'generic-attack',
};
