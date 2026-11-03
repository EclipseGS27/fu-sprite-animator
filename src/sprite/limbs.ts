import { distanceToSegment } from '../core/math';
import type { Point } from './analysis';

/** A distinct upper thickness peak joined to the torso through a narrower neck.
 * Hats, armour and hair can erase this evidence; in that case leave the fallback alone. */
export function headNeck(mask: Uint8Array, radius: Float32Array, w: number, h: number, top: number, height: number, cx: number): { neck: Point; headX: number; confidence: number } | null {
	const rowRadius: number[] = [], rowX: number[] = [];
	const half = height * 0.2;
	for (let y = top; y < Math.min(h, top + height * 0.72); y++) {
		let best = 0, xBest = cx;
		for (let x = Math.max(0, Math.floor(cx - half)); x <= Math.min(w - 1, cx + half); x++) {
			const r = radius[y * w + x]!;
			if (r > best) { best = r; xBest = x + 0.5; }
		}
		rowRadius[y - top] = best; rowX[y - top] = xBest;
	}
	const smooth = (y: number) => {
		const k = Math.max(1, Math.round(height * 0.015));
		let sum = 0, n = 0;
		for (let dy = -k; dy <= k; dy++) if (rowRadius[y + dy - top] !== undefined) { sum += rowRadius[y + dy - top]!; n++; }
		return sum / (n || 1);
	};
	const reach = Math.max(2, Math.round(height * 0.06));
	let headY = -1;
	for (let y = Math.round(top + height * 0.08); y < top + height * 0.4; y++) {
		const r = smooth(y);
		if (r >= height * 0.035 && r >= smooth(y - 1) && r >= smooth(y + 1) && r > smooth(y - reach) * 1.12 && r > smooth(y + reach) * 1.12) { headY = y; break; }
	}
	if (headY < 0) return null;
	let torsoY = -1, torsoRadius = 0;
	for (let y = Math.round(headY + height * 0.13); y < top + height * 0.68; y++) {
		if (smooth(y) > torsoRadius) { torsoRadius = smooth(y); torsoY = y; }
	}
	if (torsoY < 0) return null;
	const head: Point = [rowX[headY - top]!, headY + 0.5];
	const torso: Point = [rowX[torsoY - top]!, torsoY + 0.5];
	const path = interiorPath(mask, radius, w, h, head, torso);
	if (!path) return null;
	let neck: Point | null = null, narrowest = Infinity;
	for (const p of path) {
		if (p[1] < headY + smooth(headY) * 0.5 || p[1] > torsoY - height * 0.06) continue;
		const r = radius[Math.floor(p[1]) * w + Math.floor(p[0])]!;
		if (r < narrowest) { narrowest = r; neck = p; }
	}
	const reference = Math.min(smooth(headY), torsoRadius);
	if (!neck || narrowest > reference * 0.82) return null;
	return { neck, headX: head[0], confidence: Math.min(0.85, 1 - narrowest / reference + 0.35) };
}

/** Centre-favouring A* through the silhouette. Transparent gaps are never bridged. */
export function interiorPath(mask: Uint8Array, radius: Float32Array, w: number, h: number, from: Point, to: Point): Point[] | null {
	const span = Math.hypot(to[0] - from[0], to[1] - from[1]);
	if (span < 2) return null;
	const margin = Math.max(4, span * 0.85);
	const x0 = Math.max(0, Math.floor(Math.min(from[0], to[0]) - margin));
	const y0 = Math.max(0, Math.floor(Math.min(from[1], to[1]) - margin));
	const x1 = Math.min(w - 1, Math.ceil(Math.max(from[0], to[0]) + margin));
	const y1 = Math.min(h - 1, Math.ceil(Math.max(from[1], to[1]) + margin));
	const snap = (point: Point): number => {
		let best = -1, cost = Infinity;
		const reach = Math.max(2, span * 0.12);
		for (let y = Math.max(y0, Math.floor(point[1] - reach)); y <= Math.min(y1, point[1] + reach); y++) {
			for (let x = Math.max(x0, Math.floor(point[0] - reach)); x <= Math.min(x1, point[0] + reach); x++) {
				const i = y * w + x;
				if (!mask[i]) continue;
				const d = Math.hypot(x + 0.5 - point[0], y + 0.5 - point[1]);
				if (d < cost) { cost = d; best = i; }
			}
		}
		return best;
	};
	const start = snap(from), goal = snap(to);
	if (start < 0 || goal < 0 || start === goal) return null;
	const dist = new Float64Array(mask.length).fill(Infinity);
	const prev = new Int32Array(mask.length).fill(-1);
	const heap: { i: number; score: number; cost: number }[] = [];
	const push = (entry: typeof heap[number]) => {
		let k = heap.length; heap.push(entry);
		while (k > 0) { const p = (k - 1) >> 1; if (heap[p]!.score <= entry.score) break; heap[k] = heap[p]!; k = p; }
		heap[k] = entry;
	};
	const pop = () => {
		const first = heap[0]!, last = heap.pop()!;
		if (heap.length) {
			let k = 0;
			while (k * 2 + 1 < heap.length) {
				let m = k * 2 + 1;
				if (m + 1 < heap.length && heap[m + 1]!.score < heap[m]!.score) m++;
				if (heap[m]!.score >= last.score) break;
				heap[k] = heap[m]!; k = m;
			}
			heap[k] = last;
		}
		return first;
	};
	const gx = goal % w, gy = Math.floor(goal / w);
	dist[start] = 0; push({ i: start, score: 0, cost: 0 });
	while (heap.length) {
		const current = pop();
		if (current.cost !== dist[current.i]) continue;
		if (current.i === goal) {
			const points: Point[] = [];
			for (let i = goal; i >= 0; i = prev[i]!) { points.push([i % w + 0.5, Math.floor(i / w) + 0.5]); if (i === start) break; }
			return points.reverse();
		}
		const x = current.i % w, y = Math.floor(current.i / w);
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			if (!dx && !dy) continue;
			const xx = x + dx, yy = y + dy;
			if (xx < x0 || xx > x1 || yy < y0 || yy > y1) continue;
			const j = yy * w + xx;
			if (!mask[j]) continue;
			// Prevent a diagonal shortcut through the corner between disconnected shapes.
			if (dx && dy && !mask[y * w + xx] && !mask[yy * w + x]) continue;
			const cost = current.cost + (dx && dy ? Math.SQRT2 : 1) * (1 + 2 / (radius[j]! + 0.5));
			if (cost >= dist[j]!) continue;
			dist[j] = cost; prev[j] = current.i;
			push({ i: j, cost, score: cost + Math.hypot(xx - gx, yy - gy) });
		}
	}
	return null;
}

/** Fit two segments to a curved path. A straight/ambiguous path has no observed joint. */
export function jointOnPath(path: Point[], from: Point, to: Point, bodyHeight: number): { point: Point; confidence: number } | null {
	if (path.length < 5) return null;
	const deviation = Math.max(...path.map(p => distanceToSegment(p[0], p[1], from[0], from[1], to[0], to[1])));
	if (deviation < Math.max(1.5, bodyHeight * 0.018)) return null;
	let best = -1, bestError = Infinity;
	const samples = path.filter((_, i) => i % Math.max(1, Math.floor(path.length / 48)) === 0);
	for (let k = Math.ceil(path.length * 0.22); k < path.length * 0.78; k++) {
		const p = path[k]!;
		let error = 0;
		for (const q of samples) error += Math.min(distanceToSegment(q[0], q[1], from[0], from[1], p[0], p[1]), distanceToSegment(q[0], q[1], p[0], p[1], to[0], to[1])) ** 2;
		if (error < bestError) { bestError = error; best = k; }
	}
	if (best < 0) return null;
	let point = path[best]!;
	// Rounded joints make a shortest path shave the inside corner. Intersect the
	// fitted axes of the two straight sections to recover the actual hinge.
	const axis = (points: Point[]) => {
		const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
		const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
		let xx = 0, yy = 0, xy = 0;
		for (const p of points) { xx += (p[0] - cx) ** 2; yy += (p[1] - cy) ** 2; xy += (p[0] - cx) * (p[1] - cy); }
		const angle = Math.atan2(2 * xy, xx - yy) / 2;
		return { cx, cy, ux: Math.cos(angle), uy: Math.sin(angle) };
	};
	const n = Math.max(3, Math.floor(path.length * 0.3));
	const a = axis(path.slice(0, n)), b = axis(path.slice(-n));
	const cross = a.ux * b.uy - a.uy * b.ux;
	if (Math.abs(cross) > 0.25) {
		const t = ((b.cx - a.cx) * b.uy - (b.cy - a.cy) * b.ux) / cross;
		const intersection: Point = [a.cx + a.ux * t, a.cy + a.uy * t];
		if (Math.hypot(intersection[0] - point[0], intersection[1] - point[1]) < bodyHeight * 0.09) point = intersection;
	}
	const residual = Math.sqrt(bestError / samples.length);
	if (residual > bodyHeight * 0.035) return null;
	return { point, confidence: Math.max(0.2, Math.min(0.85, 1 - residual / (bodyHeight * 0.04))) };
}
