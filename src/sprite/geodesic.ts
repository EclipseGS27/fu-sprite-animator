import type { ImageDataLike } from './image';
import { cleanIslands, type BoneSegment } from './ownership';

/**
 * Edge-aware geodesic assignment. Every bone grows from its own segment through the sprite's
 * opaque pixels; stepping between two pixels costs more the more their colours differ, so regions
 * stop at outlines and colour edges (a sleeve's outline separates it from the torso) and never
 * cross transparent gaps (between the legs). Each pixel goes to the bone that reaches it first.
 */

export interface GeodesicOptions {
	alphaMin?: number;
	/** Extra cost of crossing a full colour difference (0 = plain geodesic distance). */
	edgeWeight?: number;
	/** Seed only the middle part of long bones so joint ends do not claim neighbours' pixels. */
	seedCore?: number;
	islandRatio?: number;
}

/** Binary min-heap of (cost, index) pairs. */
class Heap {
	private cost: Float64Array;
	private idx: Int32Array;
	size = 0;
	constructor(capacity: number) {
		this.cost = new Float64Array(capacity);
		this.idx = new Int32Array(capacity);
	}
	push(c: number, i: number): void {
		if (this.size === this.cost.length) {
			const nc = new Float64Array(this.cost.length * 2);
			nc.set(this.cost);
			const ni = new Int32Array(this.idx.length * 2);
			ni.set(this.idx);
			this.cost = nc;
			this.idx = ni;
		}
		let k = this.size++;
		while (k > 0) {
			const p = (k - 1) >> 1;
			if (this.cost[p]! <= c) break;
			this.cost[k] = this.cost[p]!;
			this.idx[k] = this.idx[p]!;
			k = p;
		}
		this.cost[k] = c;
		this.idx[k] = i;
	}
	/** Pop the smallest; returns the index and leaves its cost in `lastCost`. */
	lastCost = 0;
	pop(): number {
		const top = this.idx[0]!;
		this.lastCost = this.cost[0]!;
		const c = this.cost[--this.size]!;
		const i = this.idx[this.size]!;
		let k = 0;
		for (;;) {
			let m = 2 * k + 1;
			if (m >= this.size) break;
			if (m + 1 < this.size && this.cost[m + 1]! < this.cost[m]!) m++;
			if (this.cost[m]! >= c) break;
			this.cost[k] = this.cost[m]!;
			this.idx[k] = this.idx[m]!;
			k = m;
		}
		this.cost[k] = c;
		this.idx[k] = i;
		return top;
	}
}

export function geodesicAssign(img: ImageDataLike, segments: BoneSegment[], o: GeodesicOptions = {}): Uint8Array {
	const { width: w, height: h, data } = img;
	const n = w * h;
	const alphaMin = o.alphaMin ?? 1;
	const lambda = o.edgeWeight ?? 6;
	const core = o.seedCore ?? 0.7;
	const labels = new Uint8Array(n);
	if (!segments.length) return labels;
	const inMask = (i: number) => data[i * 4 + 3]! >= alphaMin;
	const dist = new Float64Array(n).fill(Infinity);
	const heap = new Heap(Math.max(64, n >> 2));
	for (const s of segments) {
		const len = Math.hypot(s.bx - s.ax, s.by - s.ay);
		const t0 = len > 4 ? (1 - core) / 2 : 0;
		const t1 = len > 4 ? 1 - t0 : 1;
		const steps = Math.max(1, Math.ceil(len * 2));
		let seeded = false;
		for (let k = 0; k <= steps; k++) {
			const t = t0 + ((t1 - t0) * k) / steps;
			const x = Math.floor(s.ax + (s.bx - s.ax) * t);
			const y = Math.floor(s.ay + (s.by - s.ay) * t);
			if (x < 0 || y < 0 || x >= w || y >= h) continue;
			const i = y * w + x;
			if (!inMask(i)) continue;
			const c = -s.bias;
			if (c < dist[i]!) {
				dist[i] = c;
				labels[i] = s.label;
				heap.push(c, i);
			}
			seeded = true;
		}
		if (!seeded) {
			// the bone lies outside the art: start from the nearest visible pixel
			let best = -1;
			let bestD = Infinity;
			const mx = (s.ax + s.bx) / 2;
			const my = (s.ay + s.by) / 2;
			for (let i = 0; i < n; i++) {
				if (!inMask(i)) continue;
				const d = (((i % w) + 0.5 - mx) ** 2) + ((Math.floor(i / w) + 0.5 - my) ** 2);
				if (d < bestD) {
					bestD = d;
					best = i;
				}
			}
			if (best >= 0 && Math.sqrt(bestD) - s.bias < dist[best]!) {
				dist[best] = Math.sqrt(bestD) - s.bias;
				labels[best] = s.label;
				heap.push(dist[best]!, best);
			}
		}
	}
	const diff = (a: number, b: number) => {
		const pa = a * 4;
		const pb = b * 4;
		return Math.max(Math.abs(data[pa]! - data[pb]!), Math.abs(data[pa + 1]! - data[pb + 1]!), Math.abs(data[pa + 2]! - data[pb + 2]!), Math.abs(data[pa + 3]! - data[pb + 3]!)) / 255;
	};
	while (heap.size) {
		const i = heap.pop();
		const c = heap.lastCost;
		if (c > dist[i]!) continue;
		const x = i % w;
		const y = (i - x) / w;
		for (let dy = -1; dy <= 1; dy++) {
			const ny = y + dy;
			if (ny < 0 || ny >= h) continue;
			for (let dx = -1; dx <= 1; dx++) {
				if (!dx && !dy) continue;
				const nx = x + dx;
				if (nx < 0 || nx >= w) continue;
				const j = ny * w + nx;
				if (!inMask(j)) continue;
				const step = (dx && dy ? Math.SQRT2 : 1) * (1 + lambda * diff(i, j));
				const nc = c + step;
				if (nc < dist[j]!) {
					dist[j] = nc;
					labels[j] = labels[i]!;
					heap.push(nc, j);
				}
			}
		}
	}
	cleanIslands(labels, w, h, o.islandRatio ?? 0.25);
	adoptStrays(labels, img, alphaMin);
	return labels;
}

/**
 * Pieces the bones cannot reach through the art (floating glyphs, sparks, smoke, a detached
 * scarf tip) go to the nearest part across the empty space, so no visible pixel is ever lost.
 */
export function adoptStrays(labels: Uint8Array, img: ImageDataLike, alphaMin = 1): number {
	const { width: w, height: h, data } = img;
	let strays = 0;
	for (let i = 0; i < labels.length; i++) if (!labels[i] && data[i * 4 + 3]! >= alphaMin) strays++;
	if (!strays) return 0;
	const from = new Uint8Array(labels.length);
	let queue: number[] = [];
	for (let i = 0; i < labels.length; i++) {
		if (labels[i]) {
			from[i] = labels[i]!;
			queue.push(i);
		}
	}
	if (!queue.length) return 0;
	while (queue.length) {
		const next: number[] = [];
		for (const i of queue) {
			const x = i % w;
			const y = (i - x) / w;
			for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
				if (j < 0 || from[j]) continue;
				from[j] = from[i]!;
				next.push(j);
			}
		}
		queue = next;
	}
	let adopted = 0;
	for (let i = 0; i < labels.length; i++) {
		if (!labels[i] && data[i * 4 + 3]! >= alphaMin && from[i]) {
			labels[i] = from[i]!;
			adopted++;
		}
	}
	return adopted;
}
