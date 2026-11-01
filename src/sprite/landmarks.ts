import type { Facing } from '../core/types';
import type { ImageDataLike, Rect } from './image';
import { alphaMask, components, distanceTransform, skeletonize } from './morph';

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
 * The long, straight part of the silhouette that ends in a free tip: a blade, staff or spear.
 * Found on the shape's skeleton (works for blades of any thickness), then the weapon's pixels
 * are the silhouette pixels around that branch that are no thicker than the branch itself.
 */
export function detectWeapon(mask: Uint8Array, w: number, h: number, height: number): { pixels: number[]; hilt: Pt; tip: Pt; length: number } | null {
	const skel = skeletonize(mask, w, h);
	const dt = distanceTransform(mask, w, h);
	let best: Branch | null = null;
	let bestScore = 0;
	let medianThick = 0;
	{
		const all: number[] = [];
		for (let i = 0; i < skel.length; i++) if (skel[i]) all.push(dt[i]!);
		medianThick = median(all);
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
	const straightPrefix = (b: Branch): Branch => {
		// the longest stretch from the free end that stays on a straight line (a blade ends where the hand begins)
		const px = (i: number) => (i % w) + 0.5;
		const py = (i: number) => Math.floor(i / w) + 0.5;
		const p0 = b.path[0]!;
		let keep = 1;
		for (let k = 2; k < b.path.length; k++) {
			const pk = b.path[k]!;
			const L = Math.hypot(px(pk) - px(p0), py(pk) - py(p0)) || 1;
			const tol = Math.max(1.25, L * 0.04);
			let ok = true;
			for (let j = 1; j < k && ok; j++) {
				const q = b.path[j]!;
				const dev = Math.abs((px(pk) - px(p0)) * (py(p0) - py(q)) - (px(p0) - px(q)) * (py(pk) - py(p0))) / L;
				if (dev > tol) ok = false;
			}
			if (!ok) break;
			keep = k + 1;
		}
		const path = b.path.slice(0, keep);
		const last = path[path.length - 1]!;
		const len = Math.hypot(px(last) - px(p0), py(last) - py(p0));
		return { path, length: len, straightness: 1 };
	};
	for (const whole of skeletonBranches(skel, w, h)) {
		const b = straightPrefix(whole);
		if (b.length < height * 0.3) continue;
		const tip = b.path[0]!;
		// legs end on the ground; a weapon's free end is not the lowest point of a vertical branch
		const tipY = Math.floor(tip / w);
		const baseY = Math.floor(b.path[b.path.length - 1]! / w);
		if (tipY >= bottom - height * 0.04 && tipY > baseY) continue;
		// standing on the ground (solid pixels straight down to the floor): a leg, not a weapon
		{
			const tx0 = tip % w;
			let solid = 0;
			for (let y = tipY; y <= bottom; y++) if (mask[y * w + tx0]) solid++;
			if (tipY > baseY && solid >= (bottom - tipY + 1) * 0.8) continue;
		}
		const thick = median(b.path.map((i) => dt[i]!));
		const tx = (tip % w) + 0.5;
		const far = Math.hypot(tx - bodyCx, tipY + 0.5 - bodyCy) >= height * 0.4;
		if (!far) continue; // a hand or a foot, not the end of a weapon
		// thicker than a typical limb: a body part, unless it is long (a huge sword)
		if (thick > Math.max(1.6, medianThick * 1.15) && b.length < height * 0.35) continue;
		const score = b.length * b.straightness;
		if (score > bestScore) {
			bestScore = score;
			best = b;
		}
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
	return { pixels: [...pixels], tip: [(tipI % w) + 0.5, Math.floor(tipI / w) + 0.5], hilt: [(hiltI % w) + 0.5, Math.floor(hiltI / w) + 0.5], length: best.length };
}

/**
 * Find the joints of a side-view humanoid from its silhouette. Returns null for an empty image.
 * Every guess falls back to typical JRPG proportions when the silhouette does not show it
 * clearly, and lowers that group's confidence.
 */
export function detectHumanoid(img: ImageDataLike, facingIn: Facing | 'auto' = 'auto'): HumanoidLandmarks | null {
	const { width: w, height: h } = img;
	// the main body only: floating effects (sparks, glyphs, smoke) do not shape the skeleton
	const full = alphaMask(img, 128);
	{
		const comps = components(full, w, h).sort((a, b) => b.length - a.length);
		const keep = new Uint8Array(full.length);
		const main = comps[0]?.length ?? 0;
		for (const c of comps) if (c.length >= main * 0.15) for (const i of c) keep[i] = 1;
		full.set(keep);
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
	const weaponFound = detectWeapon(full, w, h, fBottom - fTop + 1);
	let facing: Facing = facingIn === 'auto' ? 'right' : facingIn;
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
	}
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
		if (protrudeB >= 1) notes.push('Back hand unclear: placed from proportions.');
		handB = [shoulderB[0] - s * wc * 0.4, hipY];
	}
	if (!weaponFound && (protrudeF < 1 || !plausible(handF, shoulderF))) {
		if (protrudeF >= 1) notes.push('Front hand unclear: placed from proportions.');
		handF = [shoulderF[0] + s * wc * 0.4, hipY];
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
