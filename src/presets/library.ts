import type { ClipDocument, RoleTrack } from '../core/types';
import { BACK, OUT, R, SET, SINE, SNAP, clip, cycle, cycle2, ev, k, k2, tremble } from './kit';

/*
 * The rest of the humanoid preset library (Phase 5). Same conventions as humanoid.ts: facing
 * right; offsets: + leans the torso forward and swings a hanging limb backward; world angles:
 * 0 forward, 90 down, 180 back, −90 up (values continue past ±180 to keep a sweep's direction);
 * translations in body heights, kept small (fu-animations moves the token itself).
 */

/* ------------------------------------------------------------------ */
/*  Idle                                                               */
/* ------------------------------------------------------------------ */

const MAGICAL_IDLE = clip({
	id: 'magical-idle',
	name: 'Magical idle',
	category: 'idle',
	description: 'Floating slightly, hands held out with gathered power, a slow sway.',
	duration: 2.4,
	loop: true,
	tracks: {
		root: { translate: cycle2(2.4, [[0, 0], [0, -0.025]]) },
		torso: { rotate: cycle(2.4, [-2, 1]) },
		head: { rotate: cycle(2.4, [1.5, -1]) },
		'arm.upper.front': { rotate: cycle(2.4, [-22, -27]) },
		'arm.lower.front': { rotate: cycle(2.4, [-30, -36]) },
		'arm.upper.back': { rotate: cycle(2.4, [-14, -19]) },
		'arm.lower.back': { rotate: cycle(2.4, [-24, -30]) },
		'leg.lower.front': { rotate: cycle(2.4, [6, 9]) },
		'leg.lower.back': { rotate: cycle(2.4, [8, 11]) },
	},
});

const HEAVY_IDLE = clip({
	id: 'heavy-weapon-idle',
	name: 'Heavy weapon idle',
	category: 'idle',
	description: 'Slow, heavy breathing with the weight on the legs and the weapon resting low.',
	duration: 3,
	loop: true,
	tracks: {
		pelvis: { translate: cycle2(3, [[0, 0.012], [0, 0.026]]) },
		torso: { rotate: cycle(3, [5, 7]), scale: cycle2(3, [[1, 1], [1.01, 1.02]]) },
		head: { rotate: cycle(3, [-3, -1.5]) },
		'arm.upper.front': { rotate: cycle(3, [8, 10]) },
		'arm.lower.front': { rotate: cycle(3, [-6, -4]) },
		weapon: { rotate: cycle(3, [12, 14]) },
		'leg.upper.front': { rotate: cycle(3, [-7, -9]) },
		'leg.lower.front': { rotate: cycle(3, [9, 13]) },
		'leg.upper.back': { rotate: cycle(3, [7, 8]) },
		'leg.lower.back': { rotate: cycle(3, [5, 8]) },
	},
});

/* ------------------------------------------------------------------ */
/*  Movement (in place)                                                */
/* ------------------------------------------------------------------ */

const WALK = clip({
	id: 'walk',
	name: 'Walk',
	category: 'movement',
	description: 'An in-place walk cycle: legs stride, arms counter-swing, the body bobs on each step.',
	duration: 0.9,
	loop: true,
	events: [ev(0, 'step'), ev(0.45, 'step')],
	tracks: {
		pelvis: { translate: cycle2(0.9, [[0, 0], [0, -0.018], [0, 0], [0, -0.018]]) },
		torso: { rotate: cycle(0.9, [4, 3, 4, 3]) },
		head: { rotate: cycle(0.9, [-2, -1, -2, -1]) },
		'leg.upper.front': { rotate: cycle(0.9, [-22, 0, 18, 0]) },
		'leg.lower.front': { rotate: cycle(0.9, [4, 6, 10, 32]) },
		'foot.front': { rotate: cycle(0.9, [-8, 0, 8, 0]) },
		'leg.upper.back': { rotate: cycle(0.9, [18, 0, -22, 0]) },
		'leg.lower.back': { rotate: cycle(0.9, [10, 32, 4, 6]) },
		'foot.back': { rotate: cycle(0.9, [8, 0, -8, 0]) },
		'arm.upper.front': { rotate: cycle(0.9, [16, 0, -16, 0]) },
		'arm.upper.back': { rotate: cycle(0.9, [-16, 0, 16, 0]) },
		'arm.lower.front': { rotate: cycle(0.9, [-10, -14, -18, -14]) },
		'arm.lower.back': { rotate: cycle(0.9, [-18, -14, -10, -14]) },
	},
});

const RUN = clip({
	id: 'run',
	name: 'Run',
	category: 'movement',
	description: 'An in-place run: a strong forward lean, long strides, bent arms pumping.',
	duration: 0.56,
	loop: true,
	events: [ev(0, 'step'), ev(0.28, 'step')],
	tracks: {
		pelvis: { translate: cycle2(0.56, [[0, 0.01], [0, -0.035], [0, 0.01], [0, -0.035]]) },
		torso: { rotate: cycle(0.56, [13, 11, 13, 11]) },
		head: { rotate: cycle(0.56, [-9, -8, -9, -8]) },
		'leg.upper.front': { rotate: cycle(0.56, [-38, -8, 30, 4]) },
		'leg.lower.front': { rotate: cycle(0.56, [10, 20, 18, 70]) },
		'leg.upper.back': { rotate: cycle(0.56, [30, 4, -38, -8]) },
		'leg.lower.back': { rotate: cycle(0.56, [18, 70, 10, 20]) },
		// The front arm usually holds the weapon: a smaller swing and bend keep the blade off the face.
		'arm.upper.front': { rotate: cycle(0.56, [22, 0, -26, 0]) },
		'arm.upper.back': { rotate: cycle(0.56, [-36, 0, 32, 0]) },
		'arm.lower.front': { rotate: cycle(0.56, [-28, -32, -40, -32]) },
		// Counter-turn a held weapon so a staff or blade stays roughly upright while the arm pumps.
		weapon: { rotate: cycle(0.56, [-4, 18, 46, 18]) },
		'arm.lower.back': { rotate: cycle(0.56, [-70, -60, -55, -60]) },
	},
});

const JUMP = clip({
	id: 'jump',
	name: 'Jump',
	category: 'movement',
	description: 'Crouch, spring up with the legs tucked, land and absorb the weight.',
	duration: 1.05,
	phases: { anticipation: [0, 0.24], action: [0.24, 0.34], impact: 0.82, recovery: [0.82, 1.05] },
	events: [ev(0.28, 'release'), ev(0.82, 'land'), ev(1.05, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0), k2(0.24, 0, 0, 'outQuad'), k2(0.52, 0, -0.32, 'inQuad'), k2(0.82, 0, 0), k2(1.05, 0, 0)], scale: [k2(0, 1, 1, OUT), k2(0.22, 1.04, 0.94, SNAP), k2(0.34, 0.96, 1.06, OUT), k2(0.52, 1, 1), k2(0.82, 1.05, 0.93, OUT), k2(1.05, 1, 1)] },
		pelvis: { translate: [k2(0, 0, 0, OUT), k2(0.22, 0, 0.06, SNAP), k2(0.34, 0, 0), k2(0.82, 0, 0.05, OUT), k2(1.05, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.22, 12, SNAP), k(0.34, -4), k(0.55, 4), k(0.82, 14, OUT), k(1.05, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0, OUT), k(0.22, -25, SNAP), k(0.34, 5), k(0.5, -50, OUT), k(0.82, -22, OUT), k(1.05, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0, OUT), k(0.22, 45, SNAP), k(0.34, 0), k(0.5, 70, OUT), k(0.82, 40, OUT), k(1.05, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0, OUT), k(0.22, -20, SNAP), k(0.34, 10), k(0.5, -35, OUT), k(0.82, -18, OUT), k(1.05, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0, OUT), k(0.22, 40, SNAP), k(0.34, 0), k(0.5, 60, OUT), k(0.82, 36, OUT), k(1.05, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, OUT), k(0.22, 30, SNAP), k(0.34, -60, OUT), k(0.6, -40), k(0.82, 10, OUT), k(1.05, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.22, 30, SNAP), k(0.34, -50, OUT), k(0.6, -35), k(0.82, 10, OUT), k(1.05, 0, SET)] },
	},
});

const DASH = clip({
	id: 'dash',
	name: 'Dash',
	category: 'movement',
	description: 'A burst forward: low lean, arms trailing, a long stride, then settle.',
	duration: 0.65,
	phases: { anticipation: [0, 0.12], action: [0.12, 0.26], recovery: [0.4, 0.65] },
	events: [ev(0.12, 'release'), ev(0.65, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.12, -0.03, 0, SNAP), k2(0.26, 0.12, 0, OUT), k2(0.42, 0.12, 0, SET), k2(0.65, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0), k2(0.12, 0, 0.03, SNAP), k2(0.26, 0, 0.04), k2(0.65, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.12, 8, SNAP), k(0.26, 26, OUT), k(0.42, 22, SET), k(0.65, 0)] },
		head: { rotate: [k(0, 0), k(0.26, -18, OUT), k(0.65, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0), k(0.26, 45, OUT), k(0.65, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0), k(0.26, 55, OUT), k(0.65, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.26, -34, OUT), k(0.65, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0), k(0.26, 20, OUT), k(0.65, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0), k(0.26, 36, OUT), k(0.65, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0), k(0.26, 18, OUT), k(0.65, 0, SET)] },
	},
});

const TELEPORT = clip({
	id: 'teleport',
	name: 'Teleport',
	category: 'movement',
	description: 'Squash, stretch into a thin line and snap back: pair it with a flash effect.',
	duration: 0.8,
	phases: { anticipation: [0, 0.2], action: [0.2, 0.36], recovery: [0.46, 0.8] },
	events: [ev(0.36, 'vanish'), ev(0.46, 'appear'), ev(0.8, 'end')],
	tracks: {
		root: { scale: [k2(0, 1, 1, OUT), k2(0.2, 1.12, 0.86, SNAP), k2(0.36, 0.12, 1.45, 'linear'), k2(0.46, 0.12, 1.45, BACK), k2(0.62, 1.06, 0.96, OUT), k2(0.8, 1, 1)] },
		torso: { rotate: [k(0, 0, OUT), k(0.2, 6), k(0.36, 0), k(0.8, 0)] },
		'arm.upper.front': { rotate: [k(0, 0, OUT), k(0.2, -40, SNAP), k(0.36, -140), k(0.46, -140, OUT), k(0.8, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.2, -30, SNAP), k(0.36, -140), k(0.46, -140, OUT), k(0.8, 0, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Physical attacks                                                   */
/* ------------------------------------------------------------------ */

/** Lunge with the front leg on the strike and step back on recovery. */
const lunge = (a: number, i: number, r: number, depth = 1): Record<string, RoleTrack> => ({
	root: { translate: [k2(0, 0, 0, OUT), k2(a, -0.03 * depth, 0, SNAP), k2(i, 0.08 * depth, 0, 'outQuad'), k2(r, 0.08 * depth, 0, SET), k2(r + 0.3, 0, 0)] },
	pelvis: { translate: [k2(0, 0, 0, OUT), k2(a, 0, 0.02 * depth, SNAP), k2(i, 0, 0.035 * depth, 'outQuad'), k2(r + 0.3, 0, 0, SET)] },
	'leg.upper.front': { rotate: [k(0, 0, OUT), k(a, 6, SNAP), k(i, -24 * depth, 'outQuad'), k(r, -20 * depth, SET), k(r + 0.3, 0)] },
	'leg.lower.front': { rotate: [k(0, 0, OUT), k(a, 4, SNAP), k(i, 20 * depth, 'outQuad'), k(r, 16 * depth, SET), k(r + 0.3, 0)] },
	'leg.upper.back': { rotate: [k(0, 0, OUT), k(a, -6, SNAP), k(i, 16 * depth, 'outQuad'), k(r, 12 * depth, SET), k(r + 0.3, 0)] },
	'leg.lower.back': { rotate: [k(0, 0, OUT), k(a, 8, SNAP), k(i, 6, 'outQuad'), k(r + 0.3, 0, SET)] },
});

const THRUST = clip({
	id: 'thrust',
	name: 'Thrust',
	category: 'attack',
	description: 'Draw the blade back at the hip, then drive it straight forward with a lunge.',
	duration: 0.85,
	phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.4, recovery: [0.5, 0.85] },
	events: [ev(0, 'windup'), ev(0.3, 'release'), ev(0.4, 'contact'), ev(0.6, 'recover'), ev(0.85, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	tracks: {
		...lunge(0.3, 0.4, 0.55, 1.2),
		torso: { rotate: [k(0, 0, OUT), k(0.3, -9, SNAP), k(0.4, 16, BACK), k(0.55, 13, SET), k(0.85, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, -4), k(0.42, 6, 'outQuad'), k(0.85, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.28, 150), k(0.3, 152, SNAP), k(0.4, 8, BACK), k(0.55, 10, SET), R(0.85, 70)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.28, 20), k(0.3, 18, SNAP), k(0.4, 0, BACK), k(0.55, 2, SET), R(0.85, 40)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.28, -2), k(0.3, 0, SNAP), k(0.4, 0), k(0.55, 0, SET), R(0.85, -50)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, -15), k(0.4, 30, 'outQuad'), k(0.85, 0, SET)] },
	},
});

const SPEAR = clip({
	id: 'spear-attack',
	name: 'Spear attack',
	category: 'attack',
	description: 'Both hands on the shaft: pull back low, then a long two-handed thrust with a deep lunge.',
	duration: 1,
	phases: { anticipation: [0, 0.36], action: [0.36, 0.48], impact: 0.48, recovery: [0.6, 1] },
	events: [ev(0, 'windup'), ev(0.36, 'release'), ev(0.47, 'contact'), ev(0.7, 'recover'), ev(1, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'weapon', 'torso'],
	tracks: {
		...lunge(0.36, 0.48, 0.65, 1.5),
		torso: { rotate: [k(0, 0, OUT), k(0.36, -12, SNAP), k(0.48, 20, BACK), k(0.65, 16, SET), k(1, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.36, -6), k(0.5, 8, 'outQuad'), k(1, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.34, 140), k(0.36, 142, SNAP), k(0.48, 10, BACK), k(0.65, 12, SET), R(1, 75)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.34, 10), k(0.36, 8, SNAP), k(0.48, -2, BACK), k(0.65, 0, SET), R(1, 40)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.34, 160), k(0.36, 162, SNAP), k(0.48, 30, BACK), k(0.65, 32, SET), R(1, 95)] },
		'arm.lower.back': { space: 'world', rotate: [R(0, 80, OUT), k(0.34, 20), k(0.36, 18, SNAP), k(0.48, 0, BACK), k(0.65, 2, SET), R(1, 70)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.34, 8), k(0.36, 8, SNAP), k(0.48, -3), k(0.65, -2, SET), R(1, -50)] },
	},
});

const DUAL = clip({
	id: 'dual-wield-attack',
	name: 'Dual-wield attack',
	category: 'attack',
	description: 'Two quick cuts: the front blade slashes down, then the back blade follows across.',
	duration: 1.1,
	phases: { anticipation: [0, 0.2], action: [0.2, 0.3], impact: 0.3, recovery: [0.75, 1.1] },
	events: [ev(0, 'windup'), ev(0.2, 'release'), ev(0.29, 'contact'), ev(0.62, 'contact'), ev(0.8, 'recover'), ev(1.1, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'arm.upper.back', 'torso'],
	overHead: [0.04, 0.26],
	tracks: {
		...lunge(0.2, 0.3, 0.7, 0.9),
		torso: { rotate: [k(0, 0, OUT), k(0.2, -8, SNAP), k(0.3, 12, 'outQuad'), k(0.45, -4, SNAP), k(0.62, 16, 'outQuad'), k(0.8, 10, SET), k(1.1, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, 5), k(0.62, 7, 'outQuad'), k(1.1, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.18, 168), k(0.2, 172, SNAP), k(0.3, 40, BACK), k(0.62, 60, SET), R(1.1, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.18, -110), k(0.2, -114, SNAP), k(0.3, 38, BACK), k(0.62, 50, SET), R(1.1, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.18, -190), k(0.2, -196, SNAP), k(0.3, 40, BACK), k(0.62, 50, SET), R(1.1, -50)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 110), k(0.45, 200, SNAP), k(0.62, 20, BACK), k(0.8, 30, SET), R(1.1, 95)] },
		'arm.lower.back': { space: 'world', rotate: [R(0, 80, OUT), k(0.3, 90), k(0.45, -100, SNAP), k(0.62, 20, BACK), k(0.8, 30, SET), R(1.1, 75)] },
		'hand.back': { rotate: [k(0, 0), k(0.45, 15, SNAP), k(0.62, -10, 'outQuad'), k(1.1, 0, SET)] },
	},
});

const BOW = clip({
	id: 'bow-attack',
	name: 'Bow attack',
	category: 'attack',
	description: 'Raise the bow, draw the string to the cheek, hold, loose, and let the arms recoil.',
	duration: 1.25,
	phases: { anticipation: [0, 0.65], action: [0.72, 0.8], impact: 0.95, recovery: [0.95, 1.25] },
	events: [ev(0, 'windup'), ev(0.72, 'release'), ev(0.95, 'contact'), ev(1.25, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'arm.upper.back', 'arm.lower.back'],
	tracks: {
		torso: { rotate: [k(0, 0, OUT), k(0.3, -5), k(0.7, -7, SNAP), k(0.8, -2, 'outQuad'), k(1.25, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, 3), k(1.25, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 2), k(0.7, 0, SNAP), k(0.8, -6, 'outQuad'), k(0.95, -3, SET), R(1.25, 90)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.3, 0), k(0.7, -1, SNAP), k(0.8, -8, 'outQuad'), k(0.95, -4, SET), R(1.25, 60)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, -90), R(1.25, -60, SET)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 10), k(0.65, 185, OUT), k(0.72, 186, SNAP), k(0.8, 200, 'outQuad'), R(1.25, 95, SET)] },
		'arm.lower.back': { space: 'world', rotate: [R(0, 80, OUT), k(0.3, 6), k(0.65, -2, OUT), k(0.72, -2, SNAP), k(0.8, 200, 'outQuad'), R(1.25, 80, SET)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.3, -12, OUT), k(1.25, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0), k(0.3, 10, OUT), k(1.25, 0, SET)] },
	},
});

const STAFF = clip({
	id: 'staff-attack',
	name: 'Staff attack',
	category: 'attack',
	description: 'A quick two-handed overhead swing of a staff or rod.',
	duration: 0.95,
	phases: { anticipation: [0, 0.3], action: [0.3, 0.42], impact: 0.42, recovery: [0.55, 0.95] },
	events: [ev(0, 'windup'), ev(0.3, 'release'), ev(0.41, 'contact'), ev(0.6, 'recover'), ev(0.95, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	overHead: [0.08, 0.38],
	tracks: {
		...lunge(0.3, 0.42, 0.6, 0.8),
		torso: { rotate: [k(0, 0, OUT), k(0.3, -10, SNAP), k(0.42, 15, BACK), k(0.6, 11, SET), k(0.95, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, -6), k(0.45, 7, 'outQuad'), k(0.95, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.28, -80), k(0.3, -84, SNAP), k(0.42, 45, BACK), k(0.6, 50, SET), R(0.95, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.28, -120), k(0.3, -124, SNAP), k(0.42, 40, BACK), k(0.6, 44, SET), R(0.95, 55)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.28, -70), k(0.3, -74, SNAP), k(0.42, 55, BACK), k(0.6, 60, SET), R(0.95, 95)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.28, -150), k(0.3, -156, SNAP), k(0.42, 30, BACK), k(0.6, 34, SET), R(0.95, -50)] },
	},
});

const UNARMED = clip({
	id: 'unarmed-attack',
	name: 'Unarmed attack',
	category: 'attack',
	description: 'Twist back with the fist cocked at the shoulder, then a straight punch with the weight behind it.',
	duration: 0.75,
	phases: { anticipation: [0, 0.22], action: [0.22, 0.3], impact: 0.3, recovery: [0.42, 0.75] },
	events: [ev(0, 'windup'), ev(0.22, 'release'), ev(0.3, 'contact'), ev(0.45, 'recover'), ev(0.75, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	overHead: [0.06, 0.28],
	tracks: {
		...lunge(0.22, 0.3, 0.42, 0.8),
		torso: { rotate: [k(0, 0, OUT), k(0.22, -10, SNAP), k(0.3, 14, BACK), k(0.42, 10, SET), k(0.7, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.22, -3), k(0.32, 5), k(0.7, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.2, 160), k(0.22, 162, SNAP), k(0.3, 2, BACK), k(0.42, 4, SET), R(0.7, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.2, -45), k(0.22, -48, SNAP), k(0.3, 0, BACK), k(0.42, 2, SET), R(0.7, 55)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.22, -30), k(0.3, 28, 'outQuad'), k(0.7, 0, SET)] },
		'arm.lower.back': { rotate: [k(0, 0, OUT), k(0.22, -50), k(0.3, -40), k(0.7, 0, SET)] },
	},
});

const FIREARM = clip({
	id: 'firearm-shot',
	name: 'Firearm shot',
	category: 'attack',
	description: 'Bring the weapon up to aim, fire with a sharp recoil, lower it.',
	duration: 0.9,
	phases: { anticipation: [0, 0.32], action: [0.4, 0.46], impact: 0.48, recovery: [0.55, 0.9] },
	events: [ev(0, 'windup'), ev(0.4, 'release'), ev(0.48, 'contact'), ev(0.9, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front'],
	tracks: {
		torso: { rotate: [k(0, 0, OUT), k(0.32, -3), k(0.4, -3, SNAP), k(0.46, -8, 'outQuad'), k(0.9, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 4), k(0.4, 2, SNAP), k(0.46, -10, 'outQuad'), k(0.6, 0, SET), R(0.9, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.3, 0), k(0.4, -1, SNAP), k(0.46, -22, 'outQuad'), k(0.6, -2, SET), R(0.9, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, 0), k(0.4, 0, SNAP), k(0.46, -18, 'outQuad'), k(0.6, -2, SET), R(0.9, -50)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, -20), k(0.9, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.3, -10, OUT), k(0.9, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0), k(0.3, 8, OUT), k(0.9, 0, SET)] },
	},
});

const THROW = clip({
	id: 'throw',
	name: 'Throw',
	category: 'attack',
	description: 'An overhand throw: reach back and up, step in and whip the arm through.',
	duration: 0.85,
	phases: { anticipation: [0, 0.3], action: [0.3, 0.4], impact: 0.55, recovery: [0.45, 0.85] },
	events: [ev(0, 'windup'), ev(0.38, 'release'), ev(0.55, 'contact'), ev(0.85, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front', 'torso'],
	overHead: [0.08, 0.4],
	tracks: {
		...lunge(0.3, 0.4, 0.5, 0.7),
		torso: { rotate: [k(0, 0, OUT), k(0.3, -14, SNAP), k(0.4, 18, BACK), k(0.5, 14, SET), k(0.85, 0)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.28, 200), k(0.3, 202, SNAP), k(0.4, 30, BACK), k(0.5, 40, SET), R(0.85, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.28, -110), k(0.3, -112, SNAP), k(0.4, 20, BACK), k(0.5, 40, SET), R(0.85, 55)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, -35), k(0.4, 30, 'outQuad'), k(0.85, 0, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Magic                                                              */
/* ------------------------------------------------------------------ */

const CHANNEL = clip({
	id: 'channel',
	name: 'Channel',
	category: 'magic',
	description: 'Both hands raised forward, holding the spell with a faint tremble, then lowered.',
	duration: 1.5,
	phases: { anticipation: [0, 0.3], action: [0.3, 1.1], recovery: [1.1, 1.5] },
	events: [ev(0.3, 'release'), ev(1.5, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.3, 0, -0.015), k2(1.1, 0, -0.02, SET), k2(1.5, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.3, -4), k(0.5, -3), k(0.7, -4.5), k(0.9, -3), k(1.1, -4, SET), k(1.5, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, -4), k(1.1, -4, SET), k(1.5, 0)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, -20), k(0.5, -22), k(0.7, -19), k(0.9, -22), k(1.1, -20, SET), R(1.5, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.3, -30), k(0.5, -27), k(0.7, -31), k(0.9, -28), k(1.1, -30, SET), R(1.5, 55)] },
		// A held staff or sword stays upright, clear of the face.
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, -78), k(1.1, -76, SET), R(1.5, -60)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, -60), k(1.1, -58, SET), k(1.5, 0)] },
		'arm.lower.back': { rotate: [k(0, 0, OUT), k(0.3, -40), k(1.1, -40, SET), k(1.5, 0)] },
	},
});


const CHARGE = clip({
	id: 'charge',
	name: 'Charge',
	category: 'magic',
	description: 'Crouch and pull the power in with clenched fists, trembling, then burst open.',
	duration: 1.5,
	phases: { anticipation: [0, 1.1], action: [1.1, 1.22], impact: 1.22, recovery: [1.22, 1.5] },
	events: [ev(0, 'windup'), ev(1.15, 'release'), ev(1.5, 'end')],
	tracks: {
		pelvis: { translate: [k2(0, 0, 0, OUT), k2(0.3, 0, 0.04), k2(1.1, 0, 0.05, SNAP), k2(1.22, 0, -0.02, BACK), k2(1.5, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), ...tremble(0.3, 1.1, 1.2, 9), k(1.22, -10, BACK), k(1.5, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, 8), k(1.1, 10, SNAP), k(1.22, -12, BACK), k(1.5, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, OUT), k(0.3, 20), k(1.1, 22, SNAP), k(1.22, -80, BACK), k(1.5, 0, SET)] },
		'arm.lower.front': { rotate: [k(0, 0, OUT), k(0.3, -70), k(1.1, -75, SNAP), k(1.22, -10, BACK), k(1.5, 0, SET)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, -35), k(1.1, -38, SNAP), k(1.22, -72, BACK), R(1.5, -60, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, 15), k(1.1, 18, SNAP), k(1.22, 70, BACK), k(1.5, 0, SET)] },
		'arm.lower.back': { rotate: [k(0, 0, OUT), k(0.3, -70), k(1.1, -75, SNAP), k(1.22, -10, BACK), k(1.5, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0, OUT), k(0.3, -14), k(1.1, -16), k(1.5, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0, OUT), k(0.3, 24), k(1.1, 26), k(1.5, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0, OUT), k(0.3, 12), k(1.1, 14), k(1.5, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0, OUT), k(0.3, 18), k(1.1, 20), k(1.5, 0, SET)] },
	},
});

const PROJECTILE = clip({
	id: 'projectile-cast',
	name: 'Projectile cast',
	category: 'magic',
	description: 'Pull the hand back by the shoulder, then thrust it straight at the target to launch the spell.',
	duration: 1,
	phases: { anticipation: [0, 0.32], action: [0.32, 0.4], impact: 0.6, recovery: [0.5, 1] },
	events: [ev(0, 'windup'), ev(0.38, 'release'), ev(0.6, 'contact'), ev(1, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front'],
	overHead: [0.05, 0.38],
	tracks: {
		...lunge(0.32, 0.4, 0.55, 0.6),
		torso: { rotate: [k(0, 0, OUT), k(0.32, -10, SNAP), k(0.4, 10, BACK), k(0.55, 8, SET), k(1, 0)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 165), k(0.32, 166, SNAP), k(0.4, -4, BACK), k(0.6, -2, SET), R(1, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.3, -60), k(0.32, -62, SNAP), k(0.4, -6, BACK), k(0.6, -4, SET), R(1, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, -105), k(0.32, -106, SNAP), k(0.4, -18, BACK), k(0.6, -22, SET), R(1, -60)] },
		'hand.front': { rotate: [k(0, 0), k(0.32, 10, SNAP), k(0.4, -25, 'outQuad'), k(1, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.32, -25), k(0.4, 25, 'outQuad'), k(1, 0, SET)] },
	},
});

const AREA = clip({
	id: 'area-cast',
	name: 'Area spell cast',
	category: 'magic',
	description: 'Raise both hands high, then sweep them down and out as the spell spreads over the field.',
	duration: 1.4,
	phases: { anticipation: [0, 0.6], action: [0.6, 0.74], impact: 0.8, recovery: [0.9, 1.4] },
	events: [ev(0, 'windup'), ev(0.7, 'release'), ev(0.8, 'contact'), ev(1.4, 'end')],
	overHead: [0.15, 0.7],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.6, 0, -0.03, SNAP), k2(0.74, 0, 0.01, BACK), k2(1.4, 0, 0, SET)] },
		pelvis: { translate: [k2(0, 0, 0), k2(0.74, 0, 0.04, 'outQuad'), k2(1.4, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.6, -12, SNAP), k(0.74, 12, BACK), k(0.9, 9, SET), k(1.4, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.6, -12), k(0.76, 8, 'outQuad'), k(1.4, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.55, -92), k(0.6, -95, SNAP), k(0.74, 50, BACK), k(0.9, 48, SET), R(1.4, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.55, -95), k(0.6, -96, SNAP), k(0.74, 35, BACK), k(0.9, 35, SET), R(1.4, 55)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.55, -88), k(0.6, -90, SNAP), k(0.74, 140, BACK), k(0.9, 138, SET), R(1.4, 95)] },
		'arm.lower.back': { space: 'world', rotate: [R(0, 80, OUT), k(0.55, -90), k(0.6, -92, SNAP), k(0.74, 150, BACK), k(0.9, 150, SET), R(1.4, 80)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.74, -12, 'outQuad'), k(1.4, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0), k(0.74, 18, 'outQuad'), k(1.4, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0), k(0.74, 10, 'outQuad'), k(1.4, 0, SET)] },
	},
});

const HEALING = clip({
	id: 'healing',
	name: 'Healing',
	category: 'magic',
	description: 'A gentle lift: hands open upward and forward, the head rises, light pours out, then a calm return.',
	duration: 1.5,
	phases: { anticipation: [0, 0.5], action: [0.5, 0.65], recovery: [1.05, 1.5] },
	events: [ev(0.6, 'release'), ev(0.8, 'contact'), ev(1.5, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, SINE), k2(0.6, 0, -0.03, SINE), k2(1.05, 0, -0.03, SINE), k2(1.5, 0, 0)] },
		torso: { rotate: [k(0, 0, SINE), k(0.6, -7, SINE), k(1.05, -6, SINE), k(1.5, 0)] },
		head: { rotate: [k(0, 0, SINE), k(0.6, -10, SINE), k(1.05, -8, SINE), k(1.5, 0)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, SINE), k(0.6, -40, SINE), k(1.05, -38, SINE), R(1.5, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, SINE), k(0.6, -55, SINE), k(1.05, -52, SINE), R(1.5, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, SINE), k(0.6, -82, SINE), k(1.05, -80, SINE), R(1.5, -60)] },
		'hand.front': { rotate: [k(0, 0, SINE), k(0.6, -20, SINE), k(1.5, 0)] },
		'arm.upper.back': { rotate: [k(0, 0, SINE), k(0.6, -70, SINE), k(1.05, -68, SINE), k(1.5, 0)] },
		'arm.lower.back': { rotate: [k(0, 0, SINE), k(0.6, -40, SINE), k(1.5, 0)] },
	},
});

const SUMMON = clip({
	id: 'summoning',
	name: 'Summoning',
	category: 'magic',
	description: 'Arms raised high and leaning back as the call goes out, then a sweeping gesture forward to bring the summon in.',
	duration: 1.7,
	phases: { anticipation: [0, 0.9], action: [0.9, 1.05], impact: 1.1, recovery: [1.2, 1.7] },
	events: [ev(0, 'windup'), ev(1, 'release'), ev(1.1, 'contact'), ev(1.7, 'end')],
	overHead: [0.2, 0.98],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.9, 0, -0.04, SNAP), k2(1.05, 0, 0, BACK), k2(1.7, 0, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.9, -14, SNAP), k(1.05, 12, BACK), k(1.2, 9, SET), k(1.7, 0)] },
		head: { rotate: [k(0, 0, OUT), k(0.9, -15), k(1.1, 6, 'outQuad'), k(1.7, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.85, -100), k(0.9, -102, SNAP), k(1.05, 25, BACK), k(1.2, 25, SET), R(1.7, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.85, -100), k(0.9, -102, SNAP), k(1.05, 10, BACK), k(1.2, 12, SET), R(1.7, 55)] },
		'arm.upper.back': { space: 'world', rotate: [R(0, 100, OUT), k(0.85, -80), k(0.9, -82, SNAP), k(1.05, 160, BACK), R(1.7, 95, SET)] },
		'arm.lower.back': { space: 'world', rotate: [R(0, 80, OUT), k(0.85, -85), k(0.9, -86, SNAP), k(1.05, 170, BACK), R(1.7, 80, SET)] },
		'leg.upper.front': { rotate: [k(0, 0), k(1.05, -14, 'outQuad'), k(1.7, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0), k(1.05, 16, 'outQuad'), k(1.7, 0, SET)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Defence                                                            */
/* ------------------------------------------------------------------ */

const BLOCK = clip({
	id: 'block',
	name: 'Block',
	category: 'defence',
	description: 'Brace: the forearm (or shield) comes up in front of the body and takes the blow.',
	duration: 0.75,
	phases: { anticipation: [0, 0.12], action: [0.12, 0.2], impact: 0.24, recovery: [0.4, 0.75] },
	events: [ev(0.24, 'contact'), ev(0.75, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, OUT), k2(0.2, 0, 0), k2(0.24, -0.025, 0, 'outQuad'), k2(0.4, -0.02, 0, SET), k2(0.75, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0, OUT), k2(0.2, 0, 0.03), k2(0.75, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, OUT), k(0.2, -4), k(0.26, -9, 'outQuad'), k(0.75, 0, SET)] },
		head: { rotate: [k(0, 0, OUT), k(0.2, 6), k(0.75, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.18, 30), k(0.26, 36, 'outQuad'), k(0.45, 32, SET), R(0.75, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.18, -45), k(0.26, -40, 'outQuad'), k(0.45, -42, SET), R(0.75, 55)] },
		// The blade (if any) slants up and forward in front of the body, not across the face.
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.18, -64), k(0.26, -58, 'outQuad'), k(0.45, -61, SET), R(0.75, -60)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.18, -25), k(0.75, 0, SET)] },
		'arm.lower.back': { rotate: [k(0, 0, OUT), k(0.18, -45), k(0.75, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.2, -10, OUT), k(0.75, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0), k(0.2, 12, OUT), k(0.75, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0), k(0.2, 10, OUT), k(0.75, 0, SET)] },
	},
});

const DODGE = clip({
	id: 'dodge',
	name: 'Dodge',
	category: 'defence',
	description: 'A quick hop back out of reach, leaning away, then a light return.',
	duration: 0.6,
	phases: { action: [0, 0.14], recovery: [0.3, 0.6] },
	events: [ev(0.08, 'evade'), ev(0.6, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.14, -0.13, -0.03, 'inQuad'), k2(0.24, -0.15, 0, SET), k2(0.6, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.14, -16), k(0.3, -10, SET), k(0.6, 0)] },
		head: { rotate: [k(0, 0), k(0.1, 0, 'outQuad'), k(0.2, -10), k(0.6, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.14, -25), k(0.6, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.14, 25), k(0.6, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.14, -22), k(0.3, -12, SET), k(0.6, 0)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.14, 14), k(0.6, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.14, 20), k(0.6, 0, SET)] },
	},
});

const PARRY = clip({
	id: 'parry',
	name: 'Parry',
	category: 'defence',
	description: 'The blade sweeps up and across to knock the attack aside.',
	duration: 0.65,
	phases: { anticipation: [0, 0.1], action: [0.1, 0.2], impact: 0.2, recovery: [0.3, 0.65] },
	events: [ev(0.2, 'contact'), ev(0.65, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front'],
	tracks: {
		torso: { rotate: [k(0, 0, OUT), k(0.1, 4, SNAP), k(0.2, -8, 'outQuad'), k(0.65, 0, SET)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.1, 60, SNAP), k(0.2, -10, BACK), k(0.35, -6, SET), R(0.65, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.1, 20, SNAP), k(0.2, -60, BACK), k(0.35, -55, SET), R(0.65, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.1, -10, SNAP), k(0.2, -110, BACK), k(0.35, -100, SET), R(0.65, -50)] },
		'leg.upper.front': { rotate: [k(0, 0), k(0.2, -8, 'outQuad'), k(0.65, 0, SET)] },
	},
});

const COUNTER = clip({
	id: 'counterattack',
	name: 'Counterattack',
	category: 'defence',
	description: 'Parry the blow, then answer at once with a fast cut.',
	duration: 1.05,
	phases: { anticipation: [0.2, 0.36], action: [0.36, 0.46], impact: 0.46, recovery: [0.6, 1.05] },
	events: [ev(0.18, 'parry'), ev(0.46, 'contact'), ev(1.05, 'end')],
	requires: ['arm.upper.front', 'arm.lower.front'],
	overHead: [0.3, 0.42],
	tracks: {
		...lunge(0.36, 0.46, 0.65, 0.9),
		torso: { rotate: [k(0, 0, OUT), k(0.18, -8, 'outQuad'), k(0.36, -10, SNAP), k(0.46, 16, BACK), k(0.65, 11, SET), k(1.05, 0)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.18, -10, BACK), k(0.36, -40, SNAP), k(0.46, 45, BACK), k(0.65, 50, SET), R(1.05, 85)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.18, -60, BACK), k(0.36, -100, SNAP), k(0.46, 40, BACK), k(0.65, 44, SET), R(1.05, 55)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.18, -110, BACK), k(0.36, -150, SNAP), k(0.46, 42, BACK), k(0.65, 48, SET), R(1.05, -50)] },
	},
});

const GUARD = clip({
	id: 'guard',
	name: 'Guard',
	category: 'defence',
	description: 'Settle into a low defensive stance with the arms up, and hold it.',
	duration: 1.2,
	phases: { action: [0, 0.3] },
	events: [ev(0.3, 'contact'), ev(1.2, 'end')],
	mixOut: 0.45,
	tracks: {
		pelvis: { translate: [k2(0, 0, 0, OUT), k2(0.3, 0, 0.035), k2(1.2, 0, 0.03, SINE)] },
		torso: { rotate: [k(0, 0, OUT), k(0.3, 4), k(1.2, 3, SINE)] },
		head: { rotate: [k(0, 0, OUT), k(0.3, 5), k(1.2, 5)] },
		'arm.upper.front': { space: 'world', rotate: [R(0, 100, OUT), k(0.3, 30), k(1.2, 32, SINE)] },
		'arm.lower.front': { space: 'world', rotate: [R(0, 70, OUT), k(0.3, -40), k(1.2, -38, SINE)] },
		weapon: { space: 'world', rotate: [R(0, -60, OUT), k(0.3, -52), k(1.2, -54, SINE)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.3, -40), k(1.2, -38, SINE)] },
		'arm.lower.back': { rotate: [k(0, 0, OUT), k(0.3, -60), k(1.2, -60)] },
		'leg.upper.front': { rotate: [k(0, 0, OUT), k(0.3, -14), k(1.2, -14)] },
		'leg.lower.front': { rotate: [k(0, 0, OUT), k(0.3, 20), k(1.2, 20)] },
		'leg.upper.back': { rotate: [k(0, 0, OUT), k(0.3, 14), k(1.2, 14)] },
		'leg.lower.back': { rotate: [k(0, 0, OUT), k(0.3, 16), k(1.2, 16)] },
	},
});

/* ------------------------------------------------------------------ */
/*  Reactions                                                          */
/* ------------------------------------------------------------------ */

const STAGGER = clip({
	id: 'stagger',
	name: 'Stagger',
	category: 'reaction',
	description: 'Rocked off balance: the body wobbles back and forth on unsteady knees, then steadies.',
	duration: 1,
	phases: { impact: 0, recovery: [0.15, 1] },
	events: [ev(0, 'contact'), ev(1, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.12, -0.04, 0), k2(0.35, 0.015, 0, SINE), k2(0.55, -0.015, 0, SINE), k2(0.75, 0.005, 0, SINE), k2(1, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0), k2(0.15, 0, 0.04, 'outQuad'), k2(0.6, 0, 0.03, SINE), k2(1, 0, 0, SET)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.12, -14), k(0.35, 9, SINE), k(0.55, -6, SINE), k(0.75, 3, SINE), k(1, 0)] },
		head: { rotate: [k(0, 0), k(0.08, 0, 'outQuad'), k(0.2, -14), k(0.42, 10, SINE), k(0.62, -5, SINE), k(1, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.15, -30), k(0.4, 10, SINE), k(1, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.15, 25), k(0.4, -8, SINE), k(1, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.15, -12), k(0.5, -6, SINE), k(1, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.15, 22), k(0.5, 12, SINE), k(1, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.15, 16), k(1, 0, SET)] },
	},
});

const KNOCKBACK = clip({
	id: 'knockback',
	name: 'Knockback',
	category: 'reaction',
	description: 'Hurled backward: the feet leave the ground, a skid on landing, then a stumbling recovery.',
	duration: 1.1,
	phases: { impact: 0, action: [0, 0.18], recovery: [0.45, 1.1] },
	events: [ev(0, 'contact'), ev(0.32, 'land'), ev(1.1, 'end')],
	tracks: {
		root: { translate: [k2(0, 0, 0, 'outQuad'), k2(0.16, -0.12, -0.06, 'inQuad'), k2(0.32, -0.17, 0, 'outQuad'), k2(0.48, -0.19, 0, SET), k2(1.1, 0, 0)] },
		pelvis: { translate: [k2(0, 0, 0), k2(0.32, 0, 0), k2(0.36, 0, 0.05, 'outQuad'), k2(0.6, 0, 0.03, SET), k2(1.1, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.16, -28), k(0.36, 10, 'outQuad'), k(0.6, 6, SET), k(1.1, 0)] },
		head: { rotate: [k(0, 0), k(0.06, 0, 'outQuad'), k(0.2, -20), k(0.4, 12, SINE), k(1.1, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.16, -60), k(0.36, -10, SINE), k(1.1, 0, SET)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.16, -50), k(0.36, 10, SINE), k(1.1, 0, SET)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.16, -35), k(0.36, -14, 'outQuad'), k(1.1, 0, SET)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.16, 30), k(0.36, 24, 'outQuad'), k(1.1, 0, SET)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.16, -10), k(0.36, 14, 'outQuad'), k(1.1, 0, SET)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.16, 40), k(0.36, 20, 'outQuad'), k(1.1, 0, SET)] },
	},
});

const KNOCKDOWN = clip({
	id: 'knockdown',
	name: 'Knockdown',
	category: 'reaction',
	description: 'Swept off the feet and falling flat on the back, a moment on the ground, then back up.',
	duration: 2,
	phases: { impact: 0, action: [0, 0.35], recovery: [1.1, 2] },
	events: [ev(0, 'contact'), ev(0.38, 'land'), ev(1.1, 'rise'), ev(2, 'end')],
	tracks: {
		root: { rotate: [k(0, 0, 'inQuad'), k(0.35, -82, 'outBack'), k(0.5, -78), k(1.1, -80, 'inOutCubic'), k(1.7, -6, 'outQuad'), k(2, 0)], translate: [k2(0, 0, 0, 'outQuad'), k2(0.35, -0.12, 0, SET), k2(1.1, -0.12, 0, 'inOutCubic'), k2(2, 0, 0)] },
		torso: { rotate: [k(0, 0, 'outQuad'), k(0.2, -15), k(0.4, 6, SET), k(1.1, 4), k(1.4, 20, SET), k(2, 0)] },
		head: { rotate: [k(0, 0), k(0.1, -20, 'outQuad'), k(0.42, 18, 'outQuad'), k(1.1, 10), k(2, 0, SET)] },
		'arm.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.2, -70), k(0.42, -20, 'outQuad'), k(1.1, -15), k(1.5, 30, SET), k(2, 0)] },
		'arm.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.2, -60), k(0.42, -10, 'outQuad'), k(1.1, -10), k(1.5, 25, SET), k(2, 0)] },
		'leg.upper.front': { rotate: [k(0, 0, 'outQuad'), k(0.25, -40), k(0.45, -10, 'outQuad'), k(1.1, -15), k(1.5, -50, SET), k(2, 0)] },
		'leg.lower.front': { rotate: [k(0, 0, 'outQuad'), k(0.25, 30), k(0.45, 8, 'outQuad'), k(1.1, 10), k(1.5, 70, SET), k(2, 0)] },
		'leg.upper.back': { rotate: [k(0, 0, 'outQuad'), k(0.25, -25), k(0.45, 0, 'outQuad'), k(1.1, 0), k(1.5, -30, SET), k(2, 0)] },
		'leg.lower.back': { rotate: [k(0, 0, 'outQuad'), k(0.25, 15), k(0.45, 0), k(1.1, 0), k(1.5, 50, SET), k(2, 0)] },
	},
});

const DEFEAT = clip({
	id: 'defeat',
	name: 'Defeat',
	category: 'reaction',
	description: 'The knees give way, the body slumps forward and topples to the ground, and stays down.',
	duration: 1.6,
	phases: { action: [0, 0.6], recovery: [0.6, 1.3] },
	events: [ev(0.55, 'kneel'), ev(1.25, 'fall'), ev(1.6, 'end')],
	mixIn: 0.15,
	tracks: {
		pelvis: { translate: [k2(0, 0, 0, OUT), k2(0.55, 0, 0.14, 'outQuad'), k2(1.6, 0, 0.14)] },
		root: { rotate: [k(0, 0), k(0.65, 0, 'inQuad'), k(1.25, 82, 'outBack'), k(1.6, 80)], translate: [k2(0, 0, 0), k2(0.65, 0, 0, 'inQuad'), k2(1.25, 0.06, 0, OUT), k2(1.6, 0.06, 0)] },
		torso: { rotate: [k(0, 0, OUT), k(0.55, 30, 'outQuad'), k(0.8, 26, SINE), k(1.25, 10, OUT), k(1.6, 8)] },
		head: { rotate: [k(0, 0, OUT), k(0.6, 26, 'outQuad'), k(1.25, 10, OUT), k(1.6, 12)] },
		'arm.upper.front': { rotate: [k(0, 0, OUT), k(0.55, 12, SINE), k(1.25, -50, OUT), k(1.6, -45)] },
		'arm.upper.back': { rotate: [k(0, 0, OUT), k(0.55, 10, SINE), k(1.25, -40, OUT), k(1.6, -38)] },
		'leg.upper.front': { rotate: [k(0, 0, OUT), k(0.55, -45, 'outQuad'), k(1.25, -10, OUT), k(1.6, -8)] },
		'leg.lower.front': { rotate: [k(0, 0, OUT), k(0.55, 80, 'outQuad'), k(1.25, 15, OUT), k(1.6, 12)] },
		'leg.upper.back': { rotate: [k(0, 0, OUT), k(0.55, -30, 'outQuad'), k(1.25, -5, OUT), k(1.6, -5)] },
		'leg.lower.back': { rotate: [k(0, 0, OUT), k(0.55, 70, 'outQuad'), k(1.25, 10, OUT), k(1.6, 10)] },
	},
});

export const LIBRARY_CLIPS: ClipDocument[] = [
	MAGICAL_IDLE,
	HEAVY_IDLE,
	WALK,
	RUN,
	JUMP,
	DASH,
	TELEPORT,
	THRUST,
	SPEAR,
	DUAL,
	BOW,
	STAFF,
	UNARMED,
	FIREARM,
	THROW,
	CHANNEL,
	CHARGE,
	PROJECTILE,
	AREA,
	HEALING,
	SUMMON,
	BLOCK,
	DODGE,
	PARRY,
	COUNTER,
	GUARD,
	STAGGER,
	KNOCKBACK,
	KNOCKDOWN,
	DEFEAT,
];
