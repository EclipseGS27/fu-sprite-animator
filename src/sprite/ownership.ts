import { distanceToSegment } from '../core/math';
import type { ImageDataLike } from './image';

/**
 * The ownership map: one byte per sprite pixel naming the part that owns it (0 = nobody).
 * Parts are therefore exact, disjoint cuts of the original image.
 */

export interface BoneSegment {
	/** Part label the pixels go to. */
	label: number;
	ax: number;
	ay: number;
	bx: number;
	by: number;
	/** Pixels of reach added to this bone (wide body parts get a positive bias). */
	bias: number;
}

export interface AssignOptions {
	/** Pixels with lower alpha are left unassigned (default 1). */
	alphaMin?: number;
	/** Clean up stray islands smaller than this fraction of their part's main body (default 0.25). */
	islandRatio?: number;
}

/**
 * Give every visible pixel to the nearest bone segment (a Voronoi partition on segments), then
 * hand small disconnected islands to the neighbouring part that surrounds them.
 */
export function autoAssign(img: ImageDataLike, segments: BoneSegment[], opts: AssignOptions = {}): Uint8Array {
	const { width: w, height: h, data } = img;
	const alphaMin = opts.alphaMin ?? 1;
	const labels = new Uint8Array(w * h);
	if (!segments.length) return labels;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (data[i * 4 + 3]! < alphaMin) continue;
			let best = 0;
			let bestD = Infinity;
			for (const s of segments) {
				const d = distanceToSegment(x + 0.5, y + 0.5, s.ax, s.ay, s.bx, s.by) - s.bias;
				if (d < bestD) {
					bestD = d;
					best = s.label;
				}
			}
			labels[i] = best;
		}
	}
	cleanIslands(labels, w, h, opts.islandRatio ?? 0.25);
	return labels;
}

/** Connected components (4-neighbour) of one label value. */
function components(labels: Uint8Array, w: number, h: number, label: number, seen: Uint8Array): number[][] {
	const out: number[][] = [];
	const stack: number[] = [];
	for (let start = 0; start < labels.length; start++) {
		if (labels[start] !== label || seen[start]) continue;
		const comp: number[] = [];
		stack.push(start);
		seen[start] = 1;
		while (stack.length) {
			const i = stack.pop()!;
			comp.push(i);
			const x = i % w;
			const y = (i - x) / w;
			const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
			for (const j of nb) {
				if (j >= 0 && !seen[j] && labels[j] === label) {
					seen[j] = 1;
					stack.push(j);
				}
			}
		}
		out.push(comp);
	}
	return out;
}

/** Reassign small islands of each label to the label most common around them. */
export function cleanIslands(labels: Uint8Array, w: number, h: number, ratio: number): number {
	const present = new Set<number>();
	for (const v of labels) if (v) present.add(v);
	let moved = 0;
	for (const label of present) {
		const seen = new Uint8Array(labels.length);
		const comps = components(labels, w, h, label, seen);
		if (comps.length < 2) continue;
		comps.sort((a, b) => b.length - a.length);
		const main = comps[0]!.length;
		for (const comp of comps.slice(1)) {
			if (comp.length >= main * ratio) continue;
			const votes = new Map<number, number>();
			for (const i of comp) {
				const x = i % w;
				const y = (i - x) / w;
				for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
					if (j < 0) continue;
					const v = labels[j]!;
					if (v && v !== label) votes.set(v, (votes.get(v) ?? 0) + 1);
				}
			}
			let best = 0;
			let bestN = 0;
			for (const [v, n] of votes) {
				if (n > bestN) {
					best = v;
					bestN = n;
				}
			}
			if (!best) continue; // an isolated piece (e.g. a floating item): keep it
			for (const i of comp) labels[i] = best;
			moved += comp.length;
		}
	}
	return moved;
}

/** Brush: assign visible pixels within radius r of (cx, cy) to label. Returns pixels changed. */
export function paintCircle(labels: Uint8Array, img: ImageDataLike, cx: number, cy: number, r: number, label: number, alphaMin = 1): number {
	const { width: w, height: h, data } = img;
	let changed = 0;
	const x0 = Math.max(0, Math.floor(cx - r));
	const x1 = Math.min(w - 1, Math.ceil(cx + r));
	const y0 = Math.max(0, Math.floor(cy - r));
	const y1 = Math.min(h - 1, Math.ceil(cy + r));
	const r2 = r * r;
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			if (dx * dx + dy * dy > r2) continue;
			const i = y * w + x;
			if (data[i * 4 + 3]! < alphaMin || labels[i] === label) continue;
			labels[i] = label;
			changed++;
		}
	}
	return changed;
}

/** Bucket: relabel the connected region (same label, 4-neighbour) containing (x, y). */
export function floodAssign(labels: Uint8Array, w: number, h: number, x: number, y: number, label: number): number {
	if (x < 0 || y < 0 || x >= w || y >= h) return 0;
	const start = y * w + x;
	const from = labels[start]!;
	if (from === label || from === 0) return 0;
	const stack = [start];
	labels[start] = label;
	let n = 0;
	while (stack.length) {
		const i = stack.pop()!;
		n++;
		const px = i % w;
		const py = (i - px) / w;
		for (const j of [px > 0 ? i - 1 : -1, px < w - 1 ? i + 1 : -1, py > 0 ? i - w : -1, py < h - 1 ? i + w : -1]) {
			if (j >= 0 && labels[j] === from) {
				labels[j] = label;
				stack.push(j);
			}
		}
	}
	return n;
}

/** Number of visible pixels not owned by any part. */
export function countUnassigned(labels: Uint8Array, img: ImageDataLike, alphaMin = 1): number {
	let n = 0;
	for (let i = 0; i < labels.length; i++) if (!labels[i] && img.data[i * 4 + 3]! >= alphaMin) n++;
	return n;
}

/** Pixel count per label. */
export function labelCounts(labels: Uint8Array): Map<number, number> {
	const out = new Map<number, number>();
	for (const v of labels) if (v) out.set(v, (out.get(v) ?? 0) + 1);
	return out;
}
