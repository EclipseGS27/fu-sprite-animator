import type { ImageDataLike } from './image';

/**
 * Hidden-region fill. A flat sprite has no pixels behind an arm that covers the torso. For each
 * part we synthesise the covered area by copying the part's own nearest pixels into it
 * (breadth-first, 8-neighbour, so outlines and shading continue under the cover). Rules:
 *  - only under pixels owned by parts drawn ABOVE this part,
 *  - only under fully opaque pixels (so the rest pose is bit-identical to the original),
 *  - only inside the part's convex hull and within `radius` steps of it,
 *  - colours are copied, never mixed: the palette stays exact.
 */

export interface PartFill {
	/** Pixel indices (y·width + x) of the synthesised pixels. */
	indices: Int32Array;
	/** RGBA per index. */
	rgba: Uint8Array;
}

export interface FillOptions {
	/** Maximum reach in pixels. */
	radius: number;
	/** Labels that get a fill (default: all). */
	enabled?: Set<number>;
}

/** Convex hull (monotone chain) of points, counter-clockwise in y-up terms. */
export function convexHull(points: [number, number][]): [number, number][] {
	if (points.length < 3) return points.slice();
	const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const lower: [number, number][] = [];
	for (const p of pts) {
		while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
		lower.push(p);
	}
	const upper: [number, number][] = [];
	for (let i = pts.length - 1; i >= 0; i--) {
		const p = pts[i]!;
		while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
		upper.push(p);
	}
	upper.pop();
	lower.pop();
	return lower.concat(upper);
}

export function insideHull(hull: [number, number][], x: number, y: number): boolean {
	if (hull.length < 3) return false;
	for (let i = 0; i < hull.length; i++) {
		const a = hull[i]!;
		const b = hull[(i + 1) % hull.length]!;
		if ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) < -1e-9) return false;
	}
	return true;
}

/**
 * @param order labels from back to front (draw order)
 * @returns fill per label (labels with nothing to fill are absent)
 */
export function computeFills(img: ImageDataLike, labels: Uint8Array, order: number[], opts: FillOptions): Map<number, PartFill> {
	const { width: w, height: h, data } = img;
	const out = new Map<number, PartFill>();
	const rank = new Map<number, number>();
	order.forEach((l, i) => rank.set(l, i));
	// Pixel lists per label, and hull corner points (pixel corners, so the hull covers whole pixels).
	const pixels = new Map<number, number[]>();
	for (let i = 0; i < labels.length; i++) {
		const l = labels[i]!;
		if (!l) continue;
		let list = pixels.get(l);
		if (!list) pixels.set(l, (list = []));
		list.push(i);
	}
	const reach = Math.max(1, Math.round(opts.radius));
	const dist = new Int32Array(w * h);
	const src = new Int32Array(w * h);
	for (const label of order) {
		if (opts.enabled && !opts.enabled.has(label)) continue;
		const own = pixels.get(label);
		if (!own || !own.length) continue;
		const myRank = rank.get(label)!;
		// hull from the extreme pixel corners of each row (cheap and exact enough)
		const rows = new Map<number, [number, number]>();
		for (const i of own) {
			const x = i % w;
			const y = (i - x) / w;
			const r = rows.get(y);
			if (!r) rows.set(y, [x, x]);
			else {
				if (x < r[0]) r[0] = x;
				if (x > r[1]) r[1] = x;
			}
		}
		const corners: [number, number][] = [];
		for (const [y, [x0, x1]] of rows) corners.push([x0, y], [x1 + 1, y], [x0, y + 1], [x1 + 1, y + 1]);
		const hull = convexHull(corners);
		const eligible = (j: number): boolean => {
			const l = labels[j]!;
			if (!l || l === label) return false;
			const r = rank.get(l);
			if (r === undefined || r <= myRank) return false;
			if (data[j * 4 + 3] !== 255) return false;
			const x = j % w;
			return insideHull(hull, x + 0.5, (j - x) / w + 0.5);
		};
		dist.fill(-1);
		let queue: number[] = [];
		for (const i of own) {
			dist[i] = 0;
			src[i] = i;
			queue.push(i);
		}
		const filled: number[] = [];
		for (let step = 1; step <= reach && queue.length; step++) {
			const next: number[] = [];
			for (const i of queue) {
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
						if (dist[j] !== -1 || !eligible(j)) continue;
						dist[j] = step;
						src[j] = src[i]!;
						next.push(j);
						filled.push(j);
					}
				}
			}
			queue = next;
		}
		if (!filled.length) continue;
		filled.sort((a, b) => a - b);
		const indices = Int32Array.from(filled);
		const rgba = new Uint8Array(indices.length * 4);
		for (let k = 0; k < indices.length; k++) {
			const s = src[indices[k]!]! * 4;
			rgba[k * 4] = data[s]!;
			rgba[k * 4 + 1] = data[s + 1]!;
			rgba[k * 4 + 2] = data[s + 2]!;
			rgba[k * 4 + 3] = data[s + 3]!;
		}
		out.set(label, { indices, rgba });
	}
	return out;
}
