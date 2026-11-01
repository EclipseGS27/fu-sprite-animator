import type { Ease, EaseName } from './types';

type EaseFn = (t: number) => number;

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export const EASINGS: Record<EaseName, EaseFn> = {
	linear: (t) => t,
	step: (t) => (t >= 1 ? 1 : 0),
	inQuad: (t) => t * t,
	outQuad: (t) => 1 - (1 - t) * (1 - t),
	inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
	inCubic: (t) => t * t * t,
	outCubic: (t) => 1 - Math.pow(1 - t, 3),
	inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
	inQuart: (t) => t * t * t * t,
	outQuart: (t) => 1 - Math.pow(1 - t, 4),
	inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
	outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
	inBack: (t) => c3 * t * t * t - c1 * t * t,
	outBack: (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
	inOutBack: (t) => (t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2),
	outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
	inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export const EASE_NAMES = Object.keys(EASINGS) as EaseName[];

/** Cubic Bézier easing like CSS cubic-bezier(x1, y1, x2, y2), solved with Newton steps and bisection. */
export function bezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sy = (t: number) => ((ay * t + by) * t + cy) * t;
	const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	return (x: number) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		let t = x;
		for (let i = 0; i < 6; i++) {
			const err = sx(t) - x;
			if (Math.abs(err) < 1e-6) return sy(t);
			const d = dx(t);
			if (Math.abs(d) < 1e-6) break;
			t -= err / d;
		}
		let lo = 0;
		let hi = 1;
		t = x;
		for (let i = 0; i < 30; i++) {
			const v = sx(t);
			if (Math.abs(v - x) < 1e-6) break;
			if (v < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return sy(t);
	};
}

const bezierCache = new Map<string, EaseFn>();

export function easeFn(e: Ease | undefined): EaseFn {
	if (!e) return EASINGS.linear;
	if (typeof e === 'string') return EASINGS[e] ?? EASINGS.linear;
	const key = e.join(',');
	let fn = bezierCache.get(key);
	if (!fn) {
		fn = bezier(e[0], e[1], e[2], e[3]);
		bezierCache.set(key, fn);
	}
	return fn;
}
