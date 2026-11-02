import type { Facing } from '../core/types';
import type { ImageDataLike, Rect } from './image';
import { detectShadow } from './shadow';
import { alphaMask, components, distanceTransform, pca, skeletonize } from './morph';

export type Pt = [number, number];

/** Joint positions found in a side-view humanoid sprite, with how sure we are about each group. */
export interface HumanoidLandmarks {
	facing: Facing;
	body: Rect;
	top: Pt;
	neck: Pt;
	pelvis: Pt;
	ground: Pt;
	shoulderFront: Pt;
	shoulderBack: Pt;
	elbowFront: Pt;
	elbowBack: Pt;
	wristFront: Pt;
	wristBack: Pt;
	handFront: Pt;
	handBack: Pt;
	hipFront: Pt;
	hipBack: Pt;
	kneeFront: Pt;
	kneeBack: Pt;
	ankleFront: Pt;
	ankleBack: Pt;
	toeFront: Pt;
	toeBack: Pt;
	weapon: { hilt: Pt; tip: Pt } | null;
	confidence: { head: number; legs: number; arms: number; weapon: number };
	notes: string[];
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const median = (v: number[]) => {
	if (!v.length) return 0;
	const s = v.slice().sort((a, b) => a - b);
	return s[s.length >> 1]!;
};

interface Run {
	x0: number;
	x1: number;
}

function rowRuns(mask: Uint8Array, w: number, y: number, minLen = 1): Run[] {
	const out: Run[] = [];
	let s = -1;
	for (let x = 0; x <= w; x++) {
		const on = x < w && mask[y * w + x] === 1;
		if (on && s < 0) s = x;
		if (!on && s >= 0) {
			if (x - s >= minLen) out.push({ x0: s, x1: x - 1 });
			s = -1;
		}
	}
	return out;
}

/** Follow two foot silhouettes upward. Unlike a fixed torso column, this permits a
 * wide stance and bent shins. Stop where the runs merge; never split a robe in two. */
function traceLegs(mask: Uint8Array, w: number, top: number, bottom: number, cx: number): { left: Pt[]; right: Pt[] } | null {
	const H = bottom - top + 1;
	const minWidth = Math.max(1, Math.round(H * 0.025));
	const start = Math.round(bottom - H * 0.07);
	const runs = rowRuns(mask, w, start, minWidth)
		.filter(r => Math.abs((r.x0 + r.x1 + 1) / 2 - cx) < H * 0.5)
		.sort((a, b) => (b.x1 - b.x0) - (a.x1 - a.x0)).slice(0, 2)
		.sort((a, b) => a.x0 - b.x0);
	if (runs.length !== 2) return null;
	const centre = (r: Run) => (r.x0 + r.x1 + 1) / 2;
	const tracks: [Pt[], Pt[]] = [[[centre(runs[0]!), start + 0.5]], [[centre(runs[1]!), start + 0.5]]];
	for (let y = start - 1; y >= top + H * 0.4; y--) {
		const row = rowRuns(mask, w, y, minWidth);
		const chosen = tracks.map(t => {
			const x = t[t.length - 1]![0];
			return row.filter(r => x >= r.x0 - H * 0.035 && x <= r.x1 + H * 0.035)
				.sort((a, b) => Math.abs(centre(a) - x) - Math.abs(centre(b) - x))[0];
		});
		if (!chosen[0] || !chosen[1] || chosen[0] === chosen[1] || chosen[0].x0 >= chosen[1].x0) break;
		for (let k = 0; k < 2; k++) tracks[k]!.push([centre(chosen[k]!), y + 0.5]);
	}
	if (tracks[0].length < H * 0.12) return null;
	return { left: tracks[0].reverse(), right: tracks[1].reverse() };
}

interface Branch {
	/** Skeleton pixels from the free end inward. */
	path: number[];
	length: number;
	straightness: number;
}

/** Branches of a one-pixel skeleton: paths from each free end to the first junction. */
export function skeletonBranches(skel: Uint8Array, w: number, h: number): Branch[] {
	const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : skel[y * w + x]!);
	const ring = (i: number): number[] => {
		const x = i % w;
		const y = (i - x) / w;
		return [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
	};
	/** Crossing number: separate skeleton arms meeting here (1 = end, 2 = line, 3+ = junction). Staircase steps count as a line. */
	const crossings = (i: number) => {
		const r = ring(i);
		let a = 0;
		for (let k = 0; k < 8; k++) if (!r[k] && r[(k + 1) % 8]) a++;
		return a;
	};
	const nb = (i: number): number[] => {
		const x = i % w;
		const y = (i - x) / w;
		const out: number[] = [];
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (!dx && !dy) continue;
				if (at(x + dx, y + dy)) out.push((y + dy) * w + x + dx);
			}
		}
		return out;
	};
	const px = (i: number) => i % w;
	const py = (i: number) => Math.floor(i / w);
	const out: Branch[] = [];
	for (let i = 0; i < skel.length; i++) {
		if (!skel[i] || crossings(i) !== 1) continue;
		const path = [i];
		const seen = new Set([i]);
		let cur = i;
		for (;;) {
			const next = nb(cur).filter((j) => !seen.has(j));
			if (!next.length) break;
			// move on to the neighbour that makes the most progress away from where we came from
			const back = path[Math.max(0, path.length - 3)]!;
			next.sort((a, b) => Math.hypot(px(b) - px(back), py(b) - py(back)) - Math.hypot(px(a) - px(back), py(a) - py(back)));
			for (const j of next) seen.add(j); // staircase steps beside the path are part of it
			cur = next[0]!;
			path.push(cur);
			if (crossings(cur) >= 3) break; // a junction
		}
		const a = path[0]!;
		const b = path[path.length - 1]!;
		const chord = Math.hypot(px(a) - px(b), py(a) - py(b));
		let len = 0;
		for (let k = 1; k < path.length; k++) len += Math.hypot(px(path[k - 1]!) - px(path[k]!), py(path[k - 1]!) - py(path[k]!));
		out.push({ path, length: len, straightness: len > 0 ? chord / len : 0 });
	}
	return out;
}

/**
 * A spear or staff shaft that crosses in front of the body: its skeleton runs between junctions
 * (the head and the hand), so the branch search cannot see it. Here: the thin parts of the
 * silhouette (no wider than a shaft), grouped, and the longest group that lies on a straight line.
 */
function thinLine(mask: Uint8Array, w: number, h: number, dt: Float32Array, height: number, bottom: number, bodyCx: number, bodyCy: number, rgba: ArrayLike<number> | null, debug?: (msg: string) => void): { pixels: number[]; hilt: Pt; tip: Pt; length: number } | null {
	// a shaft pixel has transparency close by on both sides in some direction; the outline of a
	// big shape does not (inward the shape goes on). Shafts are narrower than limbs.
	const maxW = Math.max(3, Math.round(height * 0.036));
	const keep = new Uint8Array(mask.length);
	const dirs: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];
	for (let i = 0; i < mask.length; i++) {
		if (!mask[i] || dt[i]! > maxW) continue;
		const x = i % w;
		const y = (i - x) / w;
		for (const [dx, dy] of dirs) {
			let run = 1;
			for (let s2 = 1; s2 <= maxW && run <= maxW; s2++) {
				const xx = x + dx * s2;
				const yy = y + dy * s2;
				if (xx < 0 || yy < 0 || xx >= w || yy >= h || !mask[yy * w + xx]) break;
				run++;
			}
			for (let s2 = 1; s2 <= maxW && run <= maxW; s2++) {
				const xx = x - dx * s2;
				const yy = y - dy * s2;
				if (xx < 0 || yy < 0 || xx >= w || yy >= h || !mask[yy * w + xx]) break;
				run++;
			}
			if (run <= maxW) {
				keep[i] = 1;
				break;
			}
		}
	}
	let best: { pixels: number[]; hilt: Pt; tip: Pt; length: number } | null = null;
	for (const comp of components(keep, w, h)) {
		if (comp.length < height * 0.12) continue;
		const p = pca(comp, w);
		// pixels close to the main line, and how far along it they reach
		let lo = Infinity;
		let hi = -Infinity;
		let near = 0;
		for (const i of comp) {
			const x = (i % w) + 0.5 - p.cx;
			const y = Math.floor(i / w) + 0.5 - p.cy;
			const along = x * p.ux + y * p.uy;
			const across = Math.abs(-x * p.uy + y * p.ux);
			if (across <= 2) {
				near++;
				lo = Math.min(lo, along);
				hi = Math.max(hi, along);
			}
		}
		let len = hi - lo;
		let a: Pt = [p.cx + p.ux * lo, p.cy + p.uy * lo];
		let b: Pt = [p.cx + p.ux * hi, p.cy + p.uy * hi];
		const pixels = comp.slice();
		const at = () => `line (${a.map(Math.round)})–(${b.map(Math.round)}) len ${len.toFixed(0)}`;
		if (len < height * 0.15 || near < comp.length * 0.55) {
			if (len >= height * 0.15) debug?.(`${at()}: not straight enough (${Math.round((near / comp.length) * 100)} % on the line)`);
			continue;
		}
		// the visible piece of a shaft that crosses the body: follow its colour along the same line
		if (rgba) {
			const col = [0, 0, 0];
			let n = 0;
			for (const i of comp) {
				const x = (i % w) + 0.5 - p.cx;
				const y = Math.floor(i / w) + 0.5 - p.cy;
				if (Math.abs(-x * p.uy + y * p.ux) > 1) continue;
				for (let c = 0; c < 3; c++) col[c] += rgba[i * 4 + c]!;
				n++;
			}
			for (let c = 0; c < 3; c++) col[c] /= n || 1;
			const extend = (from: number, dir: 1 | -1): number => {
				let t = from;
				let gap = 0;
				for (let s2 = from + dir; Math.abs(s2 - from) < height * 1.5; s2 += dir) {
					let hit = false;
					for (let o = -1; o <= 1; o++) {
						const x = Math.floor(p.cx + p.ux * s2 - p.uy * o);
						const y = Math.floor(p.cy + p.uy * s2 + p.ux * o);
						if (x < 0 || y < 0 || x >= w || y >= h) continue;
						const j = y * w + x;
						if (!mask[j]) continue;
						const d = Math.abs(rgba[j * 4]! - col[0]!) + Math.abs(rgba[j * 4 + 1]! - col[1]!) + Math.abs(rgba[j * 4 + 2]! - col[2]!);
						if (d < 60) {
							hit = true;
							pixels.push(j);
						}
					}
					if (hit) {
						t = s2;
						gap = 0;
					} else if (++gap > 3) break;
				}
				return t;
			};
			const lo2 = extend(lo, -1);
			const hi2 = extend(hi, 1);
			if (hi2 - lo2 > len) {
				a = [p.cx + p.ux * lo2, p.cy + p.uy * lo2];
				b = [p.cx + p.ux * hi2, p.cy + p.uy * hi2];
				len = hi2 - lo2;
			}
		}
		if (len < height * 0.3) {
			debug?.(`${at()}: too short`);
			continue;
		}
		if (Math.max(a[1], b[1]) >= bottom - height * 0.04 && Math.min(a[1], b[1]) >= bottom - height * 0.2) {
			debug?.(`${at()}: lies along the floor`);
			continue;
		}
		// the tip is the end further from the body
		const da = Math.hypot(a[0] - bodyCx, a[1] - bodyCy);
		const db = Math.hypot(b[0] - bodyCx, b[1] - bodyCy);
		const [tip, hilt] = da >= db ? [a, b] : [b, a];
		// a weapon's tip is free; a braid or ribbon runs on into the head or body beyond it
		{
			const L = Math.hypot(tip[0] - hilt[0], tip[1] - hilt[1]) || 1;
			const ux = (tip[0] - hilt[0]) / L;
			const uy = (tip[1] - hilt[1]) / L;
			let solid = 0;
			for (let s2 = 3; s2 <= 8; s2++) {
				const x = Math.floor(tip[0] + ux * s2);
				const y = Math.floor(tip[1] + uy * s2);
				if (x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x]) solid++;
			}
			if (solid >= 4) {
				debug?.(`${at()}: its far end runs into the figure (hair or cloth)`);
				continue;
			}
		}
		debug?.(`${at()}: candidate (shaft)`);
		if (!best || len > best.length) best = { pixels: [...new Set(pixels)], tip, hilt, length: len };
	}
	return best;
}

/**
 * Remove the short spurs a jagged outline grows on a skeleton (real art is rarely smooth), so long
 * limbs and blades stay one branch instead of being chopped at every bump. Spurs shorter than
 * `minLen` are cut back to their junction, a few rounds over.
 */
export function pruneSkeleton(skel: Uint8Array, w: number, h: number, minLen: number, rounds = 3): Uint8Array {
	const out = skel.slice();
	for (let r = 0; r < rounds; r++) {
		let removed = 0;
		for (const b of skeletonBranches(out, w, h)) {
			if (b.length >= minLen) continue;
			// keep the junction pixel (the last one) so the main line stays connected
			for (const i of b.path.slice(0, -1)) out[i] = 0;
			removed++;
		}
		if (!removed) break;
	}
	return out;
}

/**
 * The long, straight part of the silhouette that ends in a free tip: a blade, staff or spear.
 * Found on the shape's skeleton (works for blades of any thickness), then the weapon's pixels
 * are the silhouette pixels around that branch that are no thicker than the branch itself.
 */
export function detectWeapon(mask: Uint8Array, w: number, h: number, height: number, debug?: (msg: string) => void, rgba?: ArrayLike<number>): { pixels: number[]; hilt: Pt; tip: Pt; length: number; broad?: boolean } | null {
	const skel = skeletonize(mask, w, h);
	const dt = distanceTransform(mask, w, h);
	let best: Branch | null = null;
	let bestScore = 0;
	let medianThick = 0;
	let coreThick = 0;
	{
		const all: number[] = [];
		for (let i = 0; i < skel.length; i++) if (skel[i]) all.push(dt[i]!);
		medianThick = median(all);
		all.sort((a, b) => a - b);
		coreThick = all[Math.floor(all.length * 0.9)] ?? medianThick;
	}
	let bottom = 0;
	let bodyCx = 0;
	let bodyCy = 0;
	let bodyN = 0;
	for (let i = 0; i < mask.length; i++) {
		if (!mask[i]) continue;
		const y = Math.floor(i / w);
		bottom = Math.max(bottom, y);
		// the thick core (beyond the median thickness) stands for the body's centre
		if (dt[i]! >= medianThick) {
			bodyCx += (i % w) + 0.5;
			bodyCy += y + 0.5;
			bodyN++;
		}
	}
	bodyCx /= bodyN || 1;
	bodyCy /= bodyN || 1;
	const px = (i: number) => (i % w) + 0.5;
	const py = (i: number) => Math.floor(i / w) + 0.5;
	/** How far path[a..k] strays from the line path[a]→path[k]. */
	let lenient = false;
	const straightFrom = (path: number[], a: number): number => {
		const p0 = path[a]!;
		// a wide blade's centre line wobbles with its jagged edges: allow a third of its half-width
		const wobble = lenient ? 0.35 * median(path.slice(a, a + 24).map((i) => dt[i]!)) : 0;
		let keep = a + 1;
		for (let k = a + 2; k < path.length; k++) {
			const pk = path[k]!;
			const L = Math.hypot(px(pk) - px(p0), py(pk) - py(p0)) || 1;
			const tol = Math.max(1.25, L * 0.04, wobble);
			let ok = true;
			for (let j = a + 1; j < k && ok; j++) {
				const q = path[j]!;
				const dev = Math.abs((px(pk) - px(p0)) * (py(p0) - py(q)) - (px(p0) - px(q)) * (py(pk) - py(p0))) / L;
				if (dev > tol) ok = false;
			}
			if (!ok) break;
			keep = k + 1;
		}
		return keep;
	};
	/**
	 * The longest straight stretch of a branch that starts near its free end: a blade or shaft. The
	 * end itself may be hooked, forked or ornamented (spearheads, staff heads), so the stretch may
	 * begin a little way in; the returned path still runs from the free end to the stretch's end.
	 */
	const straightPrefix = (b: Branch): Branch & { from: number } => {
		const reach = lenient ? Math.min(b.path.length - 1, Math.ceil(height * 0.22)) : 0;
		let bestA = 0;
		let bestK = 1;
		let bestLen = 0;
		for (let a = 0; a <= reach; a += a < 6 ? 1 : 2) {
			let k = straightFrom(b.path, a);
			// a weapon stays about as thick as it starts; where the line runs into a much thicker
			// shape it has reached the hand or the body, so it ends there
			const base = median(b.path.slice(a, Math.min(k, a + 12)).map((i) => dt[i]!));
			if (lenient) for (let j = a + 4; j < k; j++) if (dt[b.path[j]!]! > Math.max(2.5, base * 1.8)) {
				k = j;
				break;
			}
			const len = Math.hypot(px(b.path[k - 1]!) - px(b.path[a]!), py(b.path[k - 1]!) - py(b.path[a]!));
			if (len > bestLen) {
				bestLen = len;
				bestA = a;
				bestK = k;
			}
		}
		return { path: b.path.slice(0, bestK), length: bestLen, straightness: 1, from: bestA };
	};
	// pass 1: a clean straight line from the free end (crisp, generated or simple art);
	// pass 2 (only if nothing was found): jagged outlines, hooked or ornamented tips (real art)
	for (const pass of [false, true]) {
		lenient = pass;
		if (best) break;
		for (const whole of skeletonBranches(lenient ? pruneSkeleton(skel, w, h, Math.max(3, height * 0.05)) : skel, w, h)) {
			const b = straightPrefix(whole);
			const tip = b.path[0]!;
			const at = `(${tip % w},${Math.floor(tip / w)}) len ${b.length.toFixed(0)}/${whole.length.toFixed(0)}`;
			if (b.length < height * 0.3) {
				if (whole.length >= height * 0.2) debug?.(`${at}: straight part too short`);
				continue;
			}
			// legs end on the ground; a weapon's free end is not the lowest point of a vertical branch
			const tipY = Math.floor(tip / w);
			const baseY = Math.floor(b.path[b.path.length - 1]! / w);
			// lying along the floor (a tail, a cape's hem): not a weapon
			if (lenient && Math.min(tipY, baseY) >= bottom - height * 0.15) {
				debug?.(`${at}: lies along the floor`);
				continue;
			}
			if (tipY >= bottom - height * 0.04 && tipY > baseY) {
				debug?.(`${at}: ends on the ground`);
				continue;
			}
			// standing on the ground (solid pixels straight down to the floor): a leg, not a weapon
			{
				const tx0 = tip % w;
				let solid = 0;
				for (let y = tipY; y <= bottom; y++) if (mask[y * w + tx0]) solid++;
				if (tipY > baseY && solid >= (bottom - tipY + 1) * 0.8) {
					debug?.(`${at}: stands on the ground`);
					continue;
				}
			}
			const thick = median(b.path.map((i) => dt[i]!));
			if (lenient && thick > b.length * 0.22) continue;
			const tx = (tip % w) + 0.5;
			const far = Math.hypot(tx - bodyCx, tipY + 0.5 - bodyCy) >= height * 0.4;
			if (!far) {
				debug?.(`${at}: too close to the body`);
				continue; // a hand or a foot, not the end of a weapon
			}
			// thicker than a typical limb: a body part, unless it is long (a huge sword)
			if (thick > Math.max(1.6, medianThick * 1.15) && b.length < height * 0.35) {
				debug?.(`${at}: thick ${thick.toFixed(1)} vs median ${medianThick.toFixed(1)}`);
				continue;
			}
			// real art (second pass): a weapon is clearly thinner than the body's core
			if (lenient && thick > coreThick * 0.6 && !(b.length >= height * 0.5 && thick < b.length * 0.18)) {
				debug?.(`${at}: as thick as the body (${thick.toFixed(1)} vs core ${coreThick.toFixed(1)})`);
				continue;
			}
			// A long curved prefix is usually a fist, hair or cloth. Ornamented tips may
			// deviate a little, but must still lie close to the proposed weapon axis.
			if (b.from > 0) {
				const a = b.path[b.from]!;
				const z = b.path[b.path.length - 1]!;
				const L = Math.hypot(px(z) - px(a), py(z) - py(a)) || 1;
				const dev = Math.abs((px(z) - px(a)) * (py(a) - py(tip)) - (px(a) - px(tip)) * (py(z) - py(a))) / L;
				if (dev > Math.max(height * 0.025, thick * 1.2)) continue;
			}
			const score = b.length * b.straightness;
			debug?.(`${at}: candidate${lenient ? ' (second pass)' : ''}, score ${score.toFixed(0)}, thickness ${thick.toFixed(1)}, core ${coreThick.toFixed(1)}, from ${b.from}`);
			if (score > bestScore) {
				bestScore = score;
				best = b;
			}
		}
	}
	if (!best) {
		const line = thinLine(mask, w, h, dt, height, bottom, bodyCx, bodyCy, rgba ?? null, debug);
		if (line) return line;
	}
	if (!best) return null;
	// pixels of the weapon: within the branch's local thickness of its skeleton
	const thick = Math.max(1, median(best.path.map((i) => dt[i]!)));
	const pixels = new Set<number>();
	const r = Math.ceil(thick + 1);
	for (const i of best.path.slice(0, Math.max(2, best.path.length - Math.ceil(thick)))) {
		const x = i % w;
		const y = (i - x) / w;
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				const xx = x + dx;
				const yy = y + dy;
				if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
				const j = yy * w + xx;
				if (mask[j] && Math.hypot(dx, dy) <= thick + 0.75) pixels.add(j);
			}
		}
	}
	const tipI = best.path[0]!;
	const hiltI = best.path[best.path.length - 1]!;
	// Broad, tapered blades do not have a straight medial axis at their tips.
	// Fit the visible blade area and follow cross-sections back to the narrow grip.
	if (thick > height * 0.055 && best.length >= height * 0.5) {
		const axis = pca([...pixels], w);
		const towardBase = (px(hiltI) - axis.cx) * axis.ux + (py(hiltI) - axis.cy) * axis.uy >= 0 ? 1 : -1;
		const ux = axis.ux * towardBase, uy = axis.uy * towardBase;
		const sections: { point: Pt; pixels: number[]; width: number }[] = [];
		const window = Math.max(3, Math.round(height * 0.03));
		let reference = 0;
		let junction = false;
		for (let t = 0; t < height * 0.8; t++) {
			const x = axis.cx + ux * t, y = axis.cy + uy * t;
			const slice: number[] = [];
			for (const sign of [-1, 1]) for (let q = sign < 0 ? 1 : 0; q < height * 0.2; q++) {
				const xx = Math.floor(x - uy * q * sign), yy = Math.floor(y + ux * q * sign);
				if (xx < 0 || yy < 0 || xx >= w || yy >= h || !mask[yy * w + xx]) break;
				slice.push(yy * w + xx);
			}
			sections.push({ point: [x, y], pixels: slice, width: 0 });
			const section = sections[sections.length - 1]!;
			section.width = median(sections.slice(-window).map(s => s.pixels.length));
			if (t === window) reference = section.width;
			// Continue through holes/decorations in the blade. Look for a grip just
			// before the large widening into a hand/body, not the first local dip.
			if (t > height * 0.25 && (!slice.length || section.width > reference * 1.6)) {
				junction = true;
				break;
			}
		}
		if (junction && reference > 0) {
			const start = Math.max(window, sections.length - Math.round(height * 0.16));
			let gripIndex = start;
			for (let i = sections.length - 2; i >= start; i--) {
				if (sections[i]!.width < reference * 0.85) { gripIndex = i; break; }
			}
			const gripSection = sections[gripIndex]!;
			if (gripSection.pixels.length && gripSection.width < reference * 0.85 && gripIndex > height * 0.2) {
				// The rolling median lags the geometry by half its window.
				const grip = sections[Math.max(0, gripIndex - Math.floor(window / 2))]!.point;
				for (const section of sections.slice(0, gripIndex)) for (const i of section.pixels) pixels.add(i);
				debug?.(`Broad blade grip at ${grip.map(v => v.toFixed(1)).join(',')}`);
				return { pixels: [...pixels], tip: [px(tipI), py(tipI)], hilt: grip, broad: true, length: Math.hypot(px(tipI) - grip[0], py(tipI) - grip[1]) };
			}
		}
	}
	return { pixels: [...pixels], tip: [(tipI % w) + 0.5, Math.floor(tipI / w) + 0.5], hilt: [(hiltI % w) + 0.5, Math.floor(hiltI / w) + 0.5], length: best.length };
}

/**
 * Find the joints of a side-view humanoid from its silhouette. Returns null for an empty image.
 * Every guess falls back to typical JRPG proportions when the silhouette does not show it
 * clearly, and lowers that group's confidence.
 */
export function detectHumanoid(img: ImageDataLike, facingIn: Facing | 'auto' = 'auto', fallback: Facing = 'right'): HumanoidLandmarks | null {
	const { width: w, height: h } = img;
	// the main body only: floating effects (sparks, glyphs, smoke) do not shape the skeleton
	const full = alphaMask(img, 128);
	{
		const comps = components(full, w, h).sort((a, b) => b.length - a.length);
		const keep = new Uint8Array(full.length);
		const main = comps[0]?.length ?? 0;
		for (const c of comps) if (c.length >= main * 0.15) for (const i of c) keep[i] = 1;
		full.set(keep);
		// a ground shadow under the feet is not part of the body
		const shadow = detectShadow(img);
		if (shadow) {
			for (let i = 0; i < full.length; i++) if (shadow[i]) full[i] = 0;
			// Clearing the floor can detach antialiased shadow fringes. They must not
			// keep defining the feet or the character's width after the main pass.
			const pieces = components(full, w, h).sort((a, b) => b.length - a.length);
			const keep = new Uint8Array(full.length);
			for (const c of pieces) if (c.length >= (pieces[0]?.length ?? 0) * 0.15) for (const i of c) keep[i] = 1;
			full.set(keep);
		}
	}
	let anyPx = false;
	let fTop = h;
	let fBottom = -1;
	for (let i = 0; i < full.length; i++) {
		if (!full[i]) continue;
		anyPx = true;
		const y = Math.floor(i / w);
		fTop = Math.min(fTop, y);
		fBottom = Math.max(fBottom, y);
	}
	if (!anyPx) return null;
	const notes: string[] = [];
	const weaponFound = detectWeapon(full, w, h, fBottom - fTop + 1, undefined, img.data);
	let facing: Facing = facingIn === 'auto' ? fallback : facingIn;
	if (facingIn === 'auto' && weaponFound) {
		// the character faces the side its weapon is on (a vertical staff says nothing by its direction)
		let sum = 0;
		let n = 0;
		for (let i = 0; i < full.length; i++) {
			if (!full[i]) continue;
			sum += i % w;
			n++;
		}
		const centre = sum / (n || 1);
		const mid = (weaponFound.tip[0] + weaponFound.hilt[0]) / 2;
		const side = mid - centre;
		const dir = weaponFound.tip[0] - weaponFound.hilt[0];
		const lean = Math.abs(side) > (fBottom - fTop) * 0.05 ? side : dir;
		facing = lean >= 0 ? 'right' : 'left';
		notes.push(`Facing ${facing}: the weapon is on that side.`);
	} else if (facingIn === 'auto') notes.push(`Facing ${facing} is a guess (no weapon to tell by): flip it if the character looks the other way.`);
	const s = facing === 'right' ? 1 : -1;
	const mask = full.slice();
	if (weaponFound) for (const i of weaponFound.pixels) mask[i] = 0;

	// body bounds and centre line
	let top = h;
	let bottom = -1;
	let left = w;
	let right = -1;
	const xs: number[] = [];
	for (let i = 0; i < mask.length; i++) {
		if (!mask[i]) continue;
		const x = i % w;
		const y = (i - x) / w;
		top = Math.min(top, y);
		bottom = Math.max(bottom, y);
		left = Math.min(left, x);
		right = Math.max(right, x);
		xs.push(x);
	}
	const H = bottom - top + 1;
	const cx = median(xs) + 0.5;
	const mainRun = (y: number): Run | null => {
		const runs = rowRuns(mask, w, y);
		if (!runs.length) return null;
		let best = runs[0]!;
		let bestD = Infinity;
		for (const r of runs) {
			const d = cx >= r.x0 && cx <= r.x1 + 1 ? 0 : Math.min(Math.abs(cx - r.x0), Math.abs(cx - r.x1 - 1));
			if (d < bestD) {
				bestD = d;
				best = r;
			}
		}
		return best;
	};
	const widthAt = (y: number) => {
		const r = mainRun(y);
		return r ? r.x1 - r.x0 + 1 : 0;
	};
	const centreAt = (y: number) => {
		const r = mainRun(Math.round(y));
		return r ? (r.x0 + r.x1 + 1) / 2 : cx;
	};

	// head and neck: where the silhouette widens most into the shoulders (a narrow head on broad
	// shoulders), or the narrowest row under a wide (chibi) head, else typical proportions
	let neckY = Math.round(top + H * 0.33);
	let headConf = 0.2;
	{
		const y0 = Math.round(top + H * 0.12);
		const y1 = Math.round(top + H * 0.5);
		const widths: number[] = [];
		for (let y = top; y <= y1 + 3; y++) widths.push(widthAt(y));
		const W = (y: number) => widths[y - top] ?? 0;
		// the first local maximum from the top (a hat brim, hair or the widest part of the head)
		let peak = top;
		let run = 0;
		for (let y = top; y <= y1; y++) {
			const wy = W(y);
			if (wy > run) {
				run = wy;
				peak = y;
			} else if (wy < run - Math.max(2, run * 0.1)) break;
		}
		let minW = Infinity;
		let minY = neckY;
		for (let y = Math.max(peak + 1, y0); y <= y1; y++) {
			const wy = W(y);
			if (wy > 0 && wy < minW) {
				minW = wy;
				minY = y;
			}
		}
		// a narrow head on broad shoulders: the biggest widening, with a narrower block above it
		let jump = 0;
		let jumpY = -1;
		for (let y = y0; y <= y1; y++) {
			const wy = W(y);
			const below = Math.max(W(y + 2), W(y + 3));
			if (wy > 0 && below / wy > jump) {
				jump = below / wy;
				jumpY = y;
			}
		}
		const headW = W(peak);
		const dip = headW > 0 && minW < Infinity ? (headW - minW) / headW : 0;
		if (dip >= 0.08 && minY > peak) {
			neckY = minY;
			headConf = clamp01(dip * 3);
		} else if (jump >= 1.35 && jumpY > 0) {
			neckY = jumpY;
			headConf = clamp01((jump - 1) * 1.5);
		} else notes.push('No clear neck: head size guessed from proportions.');
	}
	const neck: Pt = [centreAt(neckY), neckY + 0.5];
	const topPt: Pt = [neck[0], top];

	// legs: the rows where the silhouette splits into two
	const minRun = Math.max(1, Math.round(H * 0.03));
	// legs sit under the torso: ignore runs far to the side (a hanging fist, a cape, a tail)
	let torsoHalf = 0;
	{
		const ws: number[] = [];
		for (let y = Math.round(neckY + H * 0.08); y <= Math.round(top + H * 0.6); y++) ws.push(widthAt(y) / 2);
		ws.sort((a, b) => a - b);
		torsoHalf = Math.max(2, ws[Math.floor(ws.length * 0.2)] ?? 2);
	}
	const underTorso = (r: Run) => Math.abs((r.x0 + r.x1 + 1) / 2 - cx) <= torsoHalf * 1.3;
	const legRuns = (y: number) => rowRuns(mask, w, y, minRun).filter(underTorso);
	let span: [number, number] | null = null;
	{
		let start = -1;
		let gap = 0;
		for (let y = Math.round(top + H * 0.5); y <= bottom; y++) {
			const n = legRuns(y).length;
			if (n >= 2) {
				if (start < 0) start = y;
				gap = 0;
				if (!span || y - start > span[1] - span[0]) span = [start, y];
			} else if (start >= 0 && ++gap > 1) {
				start = -1;
				gap = 0;
			}
		}
		if (span && span[1] - span[0] + 1 < H * 0.08) span = null;
	}
	const legRows = (y0: number, y1: number) => {
		const back: number[] = [];
		const front: number[] = [];
		for (let y = Math.round(y0); y <= Math.round(y1); y++) {
			const runs = legRuns(y).sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0)).slice(0, 2);
			if (runs.length < 2) continue;
			runs.sort((a, b) => (a.x0 - b.x0) * s);
			back.push((runs[0]!.x0 + runs[0]!.x1 + 1) / 2);
			front.push((runs[1]!.x0 + runs[1]!.x1 + 1) / 2);
		}
		return { back: median(back), front: median(front), n: back.length };
	};
	let hipY: number;
	let hipF: Pt;
	let hipB: Pt;
	let kneeF: Pt;
	let kneeB: Pt;
	let ankleF: Pt;
	let ankleB: Pt;
	let legConf: number;
	const ankleY = bottom - H * 0.06;
	if (span) {
		const [c0, c1] = span;
		const len = c1 - c0;
		const hi = legRows(c0, c0 + len * 0.25);
		const mid = legRows(c0 + len * 0.35, c0 + len * 0.65);
		const lo = legRows(c0 + len * 0.75, c1);
		hipY = c0 - H * 0.03;
		const kneeY = (c0 + ankleY) / 2;
		hipF = [hi.front, hipY];
		hipB = [hi.back, hipY];
		kneeF = [mid.n ? mid.front : hi.front, kneeY];
		kneeB = [mid.n ? mid.back : hi.back, kneeY];
		ankleF = [lo.n ? lo.front : kneeF[0], ankleY];
		ankleB = [lo.n ? lo.back : kneeB[0], ankleY];
		legConf = clamp01(len / (H * 0.25));
	} else {
		notes.push('Legs not separated (robe or long coat): legs placed from proportions.');
		const bw = right - left + 1;
		hipY = top + H * 0.62;
		hipF = [cx + s * bw * 0.08, hipY];
		hipB = [cx - s * bw * 0.06, hipY];
		kneeF = [hipF[0] + s * bw * 0.04, (hipY + ankleY) / 2];
		kneeB = [hipB[0] - s * bw * 0.04, (hipY + ankleY) / 2];
		ankleF = [kneeF[0], ankleY];
		ankleB = [kneeB[0], ankleY];
		legConf = 0.2;
	}
	const tracked = traceLegs(mask, w, top, bottom, cx);
	if (tracked) {
		const backTrack = s > 0 ? tracked.left : tracked.right;
		const frontTrack = s > 0 ? tracked.right : tracked.left;
		const at = (track: Pt[], t: number): Pt => track[Math.round((track.length - 1) * t)]!;
		const first = frontTrack[0]!;
		// A split much lower than the pelvis is just the feet beneath a dress.
		if (first[1] >= top + H * 0.5 && first[1] < top + H * 0.8) {
			hipY = first[1] - H * 0.025;
			hipF = [first[0], hipY];
			hipB = [backTrack[0]![0], hipY];
			kneeF = at(frontTrack, 0.48);
			kneeB = at(backTrack, 0.48);
			ankleF = at(frontTrack, 1);
			ankleB = at(backTrack, 1);
			legConf = clamp01(frontTrack.length / (H * 0.3));
			const fallbackNote = notes.indexOf('Legs not separated (robe or long coat): legs placed from proportions.');
			if (fallbackNote >= 0) notes.splice(fallbackNote, 1);
		}
	}

	// toes: the furthest pixel forward in the bottom rows, near each ankle
	const toe = (ankle: Pt): Pt => {
		let best: Pt = [ankle[0] + s * H * 0.06, bottom];
		let bestX = -Infinity;
		for (let y = Math.round(bottom - H * 0.06); y <= bottom; y++) {
			for (const r of rowRuns(mask, w, y)) {
				const c = (r.x0 + r.x1 + 1) / 2;
				if (Math.abs(c - ankle[0]) > H * 0.12) continue;
				const ex = s > 0 ? r.x1 + 1 : r.x0;
				if (ex * s > bestX) {
					bestX = ex * s;
					best = [ex - s * 0.5, y + 0.5];
				}
			}
		}
		return best;
	};
	const toeF = toe(ankleF);
	const toeB = toe(ankleB);
	const pelvis: Pt = [(hipF[0] + hipB[0]) / 2, hipY - H * 0.02];

	// arms: the furthest protrusions on each side between the shoulders and the hips
	const bandTop = Math.round(neckY + H * 0.06);
	const bandBottom = Math.round(hipY + H * 0.12);
	const halfWidths: number[] = [];
	for (let y = bandTop; y <= bandBottom; y++) halfWidths.push(widthAt(y) / 2);
	const wc = Math.max(1, median(halfWidths));
	let back: Pt | null = null;
	let front: Pt | null = null;
	for (let y = bandTop; y <= bandBottom; y++) {
		for (const r of rowRuns(mask, w, y)) {
			for (const ex of [r.x0 + 0.5, r.x1 + 0.5]) {
				if (!back || ex * s < back[0] * s) back = [ex, y + 0.5];
				if (!front || ex * s > front[0] * s) front = [ex, y + 0.5];
			}
		}
	}
	const midC = centreAt((bandTop + bandBottom) / 2);
	const protrudeB = back ? Math.abs(back[0] - midC) - wc : 0;
	const protrudeF = front ? Math.abs(front[0] - midC) - wc : 0;
	let armConf = clamp01(Math.min(protrudeB, protrudeF) / (H * 0.06));
	const shoulderY = neckY + H * 0.09;
	const sC = centreAt(shoulderY);
	const shoulderF: Pt = [sC + s * wc * 0.55, shoulderY];
	const shoulderB: Pt = [sC - s * wc * 0.55, shoulderY];
	let handF: Pt = front ?? [shoulderF[0] + s * wc, shoulderY + H * 0.2];
	let handB: Pt = back ?? [shoulderB[0] - s * wc, shoulderY + H * 0.2];
	if (weaponFound) {
		handF = weaponFound.hilt;
		armConf = Math.max(armConf, 0.5);
	}
	// an arm along the body, or a "hand" that is really a cape, scarf or hair: the hand hangs near the hip
	const plausible = (hand: Pt, shoulder: Pt) => {
		const d = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]);
		return d <= H * 0.48 && hand[1] >= shoulder[1] - H * 0.04;
	};
	if (protrudeB < 1 || !plausible(handB, shoulderB)) {
		armConf = Math.min(armConf, 0.25);
		if (protrudeB >= 1) notes.push('Back hand unclear: placed from proportions.');
		handB = [shoulderB[0] - s * wc * 0.4, hipY];
	}
	if (!weaponFound && (protrudeF < 1 || !plausible(handF, shoulderF))) {
		armConf = Math.min(armConf, 0.25);
		if (protrudeF >= 1) notes.push('Front hand unclear: placed from proportions.');
		handF = [shoulderF[0] + s * wc * 0.4, hipY];
	}
	if (weaponFound?.broad && weaponFound.length > H * 0.6 && handF[1] >= pelvis[1] - H * 0.12 &&
		Math.abs(handF[0] - pelvis[0]) < H * 0.28 && Math.hypot(handF[0] - shoulderB[0], handF[1] - shoulderB[1]) < H * 0.45) {
		// A low grip close to the body can be shared (battle-ready greatswords).
		// This is a proposal, not evidence of a visible second hand.
		handB = [handF[0] - s * H * 0.04, handF[1]];
		armConf = Math.min(armConf, 0.45);
		notes.push('Possible two-handed grip: check both hands before animating.');
	}
	const handLen = H * 0.07;
	const wrist = (shoulder: Pt, hand: Pt): Pt => {
		const d = Math.hypot(hand[0] - shoulder[0], hand[1] - shoulder[1]) || 1;
		return lerp(hand, shoulder, Math.min(0.4, handLen / d));
	};
	const wristF = wrist(shoulderF, handF);
	const wristB = wrist(shoulderB, handB);
	const elbow = (shoulder: Pt, wr: Pt): Pt => {
		const m = lerp(shoulder, wr, 0.5);
		return [m[0], m[1] + H * 0.015];
	};
	return {
		facing,
		body: { x: left, y: top, width: right - left + 1, height: H },
		top: topPt,
		neck,
		pelvis,
		ground: [pelvis[0], bottom + 1],
		shoulderFront: shoulderF,
		shoulderBack: shoulderB,
		elbowFront: elbow(shoulderF, wristF),
		elbowBack: elbow(shoulderB, wristB),
		wristFront: wristF,
		wristBack: wristB,
		handFront: handF,
		handBack: handB,
		hipFront: hipF,
		hipBack: hipB,
		kneeFront: kneeF,
		kneeBack: kneeB,
		ankleFront: ankleF,
		ankleBack: ankleB,
		toeFront: toeF,
		toeBack: toeB,
		weapon: weaponFound ? { hilt: weaponFound.hilt, tip: weaponFound.tip } : null,
		confidence: { head: headConf, legs: legConf, arms: armConf, weapon: weaponFound ? 0.8 : 0 },
		notes,
	};
}
