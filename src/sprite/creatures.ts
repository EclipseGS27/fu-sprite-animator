import type { Facing } from '../core/types';
import type { ImageDataLike } from './image';
import { skeletonBranches, type Pt } from './landmarks';
import { alphaMask, components, distanceTransform, skeletonize } from './morph';

/**
 * Landmarks of a four-legged (optionally winged) creature seen from the side: where the legs
 * stand, the belly line, the body's thickness, the snout, the tail and wing tips. Found on the
 * silhouette only (no colours), like the humanoid landmarks. Null when no legs are found
 * (serpents, blobs, floating spirits): those use template proportions.
 */
export interface BeastLandmarks {
	facing: Facing;
	box: { x: number; y: number; width: number; height: number };
	/** Row where the legs leave the body. */
	belly: number;
	/** Body thickness above the belly line (px). */
	thickness: number;
	hip: Pt;
	shoulder: Pt;
	legs: { hindNear: Leg; hindFar: Leg; frontNear: Leg; frontFar: Leg };
	head: { base: Pt; tip: Pt };
	neckBase: Pt;
	tail: { base: Pt; mid: Pt; tip: Pt } | null;
	wings: { near: { base: Pt; tip: Pt }; far: { base: Pt; tip: Pt } } | null;
	confidence: Record<string, number>;
	notes: string[];
}

export interface Leg {
	top: Pt;
	foot: Pt;
	pixels: number;
}

interface Run {
	x0: number;
	x1: number;
}

function runsOf(mask: Uint8Array, w: number, y: number): Run[] {
	const out: Run[] = [];
	let s = -1;
	for (let x = 0; x <= w; x++) {
		const on = x < w && mask[y * w + x] === 1;
		if (on && s < 0) s = x;
		if (!on && s >= 0) {
			out.push({ x0: s, x1: x - 1 });
			s = -1;
		}
	}
	return out;
}

const mid = (r: Run) => (r.x0 + r.x1) / 2;
const width = (r: Run) => r.x1 - r.x0 + 1;

export function detectBeast(img: ImageDataLike, facingIn: Facing | 'auto' = 'auto', o: { wings?: boolean } = {}): BeastLandmarks | null {
	const { width: w, height: h } = img;
	// main body only: sparks and smoke do not count
	const mask = alphaMask(img, 128);
	{
		const comps = components(mask, w, h).sort((a, b) => b.length - a.length);
		const keep = new Uint8Array(mask.length);
		const main = comps[0]?.length ?? 0;
		for (const c of comps) if (c.length >= main * 0.15) for (const i of c) keep[i] = 1;
		mask.set(keep);
	}
	let top = h, bottom = -1, left = w, right = -1;
	for (let i = 0; i < mask.length; i++) {
		if (!mask[i]) continue;
		const x = i % w, y = (i - x) / w;
		if (y < top) top = y;
		if (y > bottom) bottom = y;
		if (x < left) left = x;
		if (x > right) right = x;
	}
	if (bottom < 0) return null;
	const H = bottom - top + 1;
	const W = right - left + 1;
	const notes: string[] = [];

	/* ---- belly: going up from the ground, the first row that is mostly one wide body ---- */
	let belly = -1;
	for (let y = bottom; y >= top; y--) {
		const widest = runsOf(mask, w, y).reduce((m, r) => Math.max(m, width(r)), 0);
		if (widest >= W * 0.5) {
			belly = y + 1;
			break;
		}
	}
	if (belly < 0 || bottom - belly < H * 0.1) return null;

	/* ---- legs: feet whose column stays solid all the way up to the belly ---- */
	const footRow = bottom - Math.max(1, Math.round(H * 0.03));
	const legs: Leg[] = [];
	for (const r of runsOf(mask, w, footRow)) {
		let pixels = 0;
		let solid = true;
		for (let y = footRow; y >= belly; y--) {
			let n = 0;
			for (let x = r.x0; x <= r.x1; x++) n += mask[y * w + x]!;
			if (n < width(r) * 0.6) {
				solid = false; // a tail or claw resting on the ground, not a leg
				break;
			}
			pixels += n;
		}
		if (solid && width(r) <= W * 0.3) legs.push({ top: [mid(r), belly], foot: [mid(r), bottom], pixels });
	}
	if (legs.length < 2) return null;

	/* ---- body: thickness above the belly between the outermost legs ---- */
	const xs = legs.map((l) => l.top[0]);
	const lo = Math.min(...xs);
	const hi = Math.max(...xs);
	const thick: number[] = [];
	for (let x = Math.round(lo); x <= Math.round(hi); x++) {
		let n = 0;
		for (let y = belly - 1; y >= top && mask[y * w + x]; y--) n++;
		if (n > 0) thick.push(n);
	}
	thick.sort((a, b) => a - b);
	const thickness = Math.max(2, thick.length ? thick[thick.length >> 1]! : H * 0.25);
	const cy = belly - thickness / 2;
	const backY = belly - thickness;

	/* ---- free ends of the silhouette's skeleton (feet excluded) ---- */
	const dist = distanceTransform(mask, w, h);
	const skel = skeletonize(mask, w, h);
	const P = (i: number): Pt => [i % w, Math.floor(i / w)];
	const near = (a: Pt, b: Pt, r: number) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= r;
	const free = skeletonBranches(skel, w, h)
		.map((b) => {
			// how thick the shape stays near its end: a head stays thick, wing and tail tips thin out
			const k = Math.max(2, Math.ceil(b.path.length * 0.4));
			const d = b.path.slice(0, k).map((i) => dist[i]!).sort((x, y) => x - y);
			return { end: P(b.path[0]!), half: P(b.path[Math.floor(b.path.length / 2)]!), length: b.length, girth: d[d.length >> 1]! };
		})
		.filter((e) => !legs.some((l) => near(e.end, l.foot, Math.max(4, thickness * 0.6))) && e.length >= Math.max(3, H * 0.05));

	/* ---- wings: the free ends highest above the back ---- */
	const used = new Set<(typeof free)[number]>();
	let wingEnds: (typeof free)[number][] = [];
	if (o.wings) {
		// the highest end, then the highest one well apart from it (one wing can have several points)
		const high = free.filter((e) => e.end[1] < backY - thickness * 0.3).sort((a, b) => a.end[1] - b.end[1]);
		if (high.length) {
			const first = high[0]!;
			const second = high.find((e) => Math.abs(e.end[0] - first.end[0]) >= W * 0.25);
			wingEnds = second ? [first, second] : [first];
		}
		// every point of the wings is wing, not head or tail
		for (const e of high) used.add(e);
	}

	/* ---- head: the thickest remaining end; it also says which way the creature faces ---- */
	const rest = free.filter((e) => !used.has(e));
	const headEnd = rest.slice().sort((a, b) => b.girth - a.girth)[0] ?? null;
	let facing: Facing = facingIn === 'auto' ? 'right' : facingIn;
	if (facingIn === 'auto' && headEnd) {
		facing = headEnd.end[0] >= (left + right) / 2 ? 'right' : 'left';
		notes.push(`Facing ${facing}: the head is the thickest end of the silhouette.`);
	}
	const s = facing === 'right' ? 1 : -1;
	const front = (x: number) => x * s; // larger = further forward

	/* ---- hind and front legs, near and far ---- */
	const centre = (left + right) / 2;
	legs.sort((a, b) => front(a.foot[0]) - front(b.foot[0]));
	let hind = legs.filter((l) => front(l.foot[0]) < front(centre));
	let fore = legs.filter((l) => front(l.foot[0]) >= front(centre));
	if (!hind.length || !fore.length) {
		hind = legs.slice(0, Math.ceil(legs.length / 2));
		fore = legs.slice(Math.ceil(legs.length / 2));
	}
	// the near leg is drawn whole, the far one partly hidden: more pixels = near
	const pair = (list: Leg[]) => {
		const sorted = list.slice().sort((a, b) => b.pixels - a.pixels);
		const n = sorted[0]!;
		const f = sorted[1] ?? { top: [n.top[0] + s, n.top[1]] as Pt, foot: [n.foot[0] + s, n.foot[1]] as Pt, pixels: 0 };
		return { near: n, far: f };
	};
	const hp = pair(hind);
	const fp = pair(fore);
	if (legs.length < 4) notes.push(`${legs.length} legs visible; the hidden ones share their place.`);
	const hipX = (hp.near.top[0] + hp.far.top[0]) / 2;
	const shX = (fp.near.top[0] + fp.far.top[0]) / 2;
	const hip: Pt = [hipX, cy];
	const shoulder: Pt = [shX, cy];

	/* ---- the snout: the front-most point above the belly ---- */
	let tip: Pt | null = null;
	for (let y = top; y < belly; y++) {
		for (let x = left; x <= right; x++) {
			if (!mask[y * w + x]) continue;
			if (!tip || front(x) > front(tip[0])) tip = [x, y];
		}
	}
	if (!tip) return null;
	const neckBase: Pt = [shX + s * thickness * 0.15, backY + thickness * 0.25];
	const reach = Math.hypot(tip[0] - neckBase[0], tip[1] - neckBase[1]) || 1;
	const headLen = Math.min(reach * 0.7, thickness * 1.25 + 2);
	const headBase: Pt = [tip[0] - ((tip[0] - neckBase[0]) / reach) * headLen, tip[1] - ((tip[1] - neckBase[1]) / reach) * headLen];

	/* ---- wings: near = further back (drawn over the body), far = further forward ---- */
	let wings: BeastLandmarks['wings'] = null;
	if (o.wings) {
		const lerpX = (t: number) => hipX + (shX - hipX) * t;
		if (wingEnds.length) {
			const [back, fwd] = wingEnds.slice().sort((a, b) => front(a.end[0]) - front(b.end[0]));
			wings = { near: { base: [lerpX(0.4), backY + 1], tip: back!.end }, far: { base: [lerpX(0.65), backY + 1], tip: fwd ? fwd.end : [back!.end[0] + s * W * 0.15, back!.end[1]] } };
			notes.push(`Wings found: ${fwd ? 'two tips' : 'one tip (the other wing is hidden)'}.`);
		} else notes.push('No wing tips found above the back; wings placed by proportion.');
	}

	/* ---- tail: the remaining end furthest back, behind the hips ---- */
	let tail: BeastLandmarks['tail'] = null;
	const behindHip = rest.filter((e) => e !== headEnd && front(e.end[0]) < front(hipX) - W * 0.04);
	// tails hang at or below the back; a raised tail is taken only when nothing hangs lower
	const low = behindHip.filter((e) => e.end[1] >= backY);
	// (with wings, anything above the back is wing)
	const tails = (low.length || o.wings ? low : behindHip).sort((a, b) => Math.hypot(b.end[0] - hipX, b.end[1] - cy) - Math.hypot(a.end[0] - hipX, a.end[1] - cy));
	if (tails.length) {
		const t = tails[0]!;
		tail = { base: [hipX - s * thickness * 0.3, cy - thickness * 0.15], mid: t.half, tip: t.end };
	} else notes.push('No tail found.');

	const conf = (v: number) => Math.max(0, Math.min(1, v));
	return {
		facing,
		box: { x: left, y: top, width: W, height: H },
		belly,
		thickness,
		hip,
		shoulder,
		legs: { hindNear: hp.near, hindFar: hp.far, frontNear: fp.near, frontFar: fp.far },
		head: { base: headBase, tip },
		neckBase,
		tail,
		wings,
		confidence: { legs: conf(legs.length / 4), head: headEnd ? 0.7 : 0.4, tail: tail ? 0.6 : 0, ...(o.wings ? { wings: wings ? 0.6 : 0 } : {}) },
		notes,
	};
}
