import type { ImageDataLike } from './image';

/** Binary-mask helpers for silhouette analysis. Masks are Uint8Array (1 = inside), row-major. */

export function alphaMask(img: ImageDataLike, alphaMin = 128): Uint8Array {
	const m = new Uint8Array(img.width * img.height);
	for (let i = 0; i < m.length; i++) m[i] = img.data[i * 4 + 3]! >= alphaMin ? 1 : 0;
	return m;
}

/** Chamfer (3-4) distance to the nearest outside pixel, in pixels (approximately Euclidean). */
export function distanceTransform(mask: Uint8Array, w: number, h: number): Float32Array {
	const INF = 1e9;
	const d = new Float32Array(w * h);
	for (let i = 0; i < d.length; i++) d[i] = mask[i] ? INF : 0;
	const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]!);
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (!d[i]) continue;
			d[i] = Math.min(d[i]!, at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
		}
	}
	for (let y = h - 1; y >= 0; y--) {
		for (let x = w - 1; x >= 0; x--) {
			const i = y * w + x;
			if (!d[i]) continue;
			d[i] = Math.min(d[i]!, at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
		}
	}
	for (let i = 0; i < d.length; i++) d[i] = d[i]! / 3;
	return d;
}

/** Morphological opening with a (2r+1)² square: removes structures thinner than 2r+1. */
export function open(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
	const pass = (src: Uint8Array, erode: boolean) => {
		const out = new Uint8Array(src.length);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				let v = erode ? 1 : 0;
				for (let dy = -r; dy <= r && (erode ? v : !v); dy++) {
					for (let dx = -r; dx <= r; dx++) {
						const xx = x + dx;
						const yy = y + dy;
						const s = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : src[yy * w + xx]!;
						if (erode && !s) {
							v = 0;
							break;
						}
						if (!erode && s) {
							v = 1;
							break;
						}
					}
				}
				out[y * w + x] = v;
			}
		}
		return out;
	};
	return pass(pass(mask, true), false);
}

/** Connected components (8-neighbour) of a mask: list of pixel index arrays. */
export function components(mask: Uint8Array, w: number, h: number): number[][] {
	const seen = new Uint8Array(mask.length);
	const out: number[][] = [];
	for (let s = 0; s < mask.length; s++) {
		if (!mask[s] || seen[s]) continue;
		const comp: number[] = [];
		const stack = [s];
		seen[s] = 1;
		while (stack.length) {
			const i = stack.pop()!;
			comp.push(i);
			const x = i % w;
			const y = (i - x) / w;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const xx = x + dx;
					const yy = y + dy;
					if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
					const j = yy * w + xx;
					if (mask[j] && !seen[j]) {
						seen[j] = 1;
						stack.push(j);
					}
				}
			}
		}
		out.push(comp);
	}
	return out;
}

/** Principal axis of a set of pixels: centroid, unit direction, extent along it and across. */
export function pca(pixels: number[], w: number): { cx: number; cy: number; ux: number; uy: number; lo: number; hi: number; thick: number; elong: number } {
	let cx = 0;
	let cy = 0;
	for (const i of pixels) {
		cx += (i % w) + 0.5;
		cy += Math.floor(i / w) + 0.5;
	}
	cx /= pixels.length || 1;
	cy /= pixels.length || 1;
	let xx = 0;
	let yy = 0;
	let xy = 0;
	for (const i of pixels) {
		const dx = (i % w) + 0.5 - cx;
		const dy = Math.floor(i / w) + 0.5 - cy;
		xx += dx * dx;
		yy += dy * dy;
		xy += dx * dy;
	}
	const th = 0.5 * Math.atan2(2 * xy, xx - yy);
	const ux = Math.cos(th);
	const uy = Math.sin(th);
	let lo = Infinity;
	let hi = -Infinity;
	let plo = Infinity;
	let phi = -Infinity;
	for (const i of pixels) {
		const dx = (i % w) + 0.5 - cx;
		const dy = Math.floor(i / w) + 0.5 - cy;
		const a = dx * ux + dy * uy;
		const b = -dx * uy + dy * ux;
		lo = Math.min(lo, a);
		hi = Math.max(hi, a);
		plo = Math.min(plo, b);
		phi = Math.max(phi, b);
	}
	const thick = Math.max(1, phi - plo + 1);
	return { cx, cy, ux, uy, lo, hi, thick, elong: (hi - lo + 1) / thick };
}

/** Zhang–Suen thinning: a one-pixel-wide skeleton of the mask. */
export function skeletonize(mask: Uint8Array, w: number, h: number): Uint8Array {
	const m = mask.slice();
	const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : m[y * w + x]!);
	let changed = true;
	const del: number[] = [];
	while (changed) {
		changed = false;
		for (const step of [0, 1]) {
			del.length = 0;
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					if (!m[y * w + x]) continue;
					const p2 = get(x, y - 1);
					const p3 = get(x + 1, y - 1);
					const p4 = get(x + 1, y);
					const p5 = get(x + 1, y + 1);
					const p6 = get(x, y + 1);
					const p7 = get(x - 1, y + 1);
					const p8 = get(x - 1, y);
					const p9 = get(x - 1, y - 1);
					const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
					if (b < 2 || b > 6) continue;
					const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
					let a = 0;
					for (let k = 0; k < 8; k++) if (!seq[k] && seq[k + 1]) a++;
					if (a !== 1) continue;
					if (step === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
					del.push(y * w + x);
				}
			}
			for (const i of del) m[i] = 0;
			if (del.length) changed = true;
		}
	}
	return m;
}
