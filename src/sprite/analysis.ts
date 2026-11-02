import type { ImageDataLike, Rect } from './image';

export type Point = [number, number];

/** A bounded working copy for detection only. Rendering always uses the original. */
export interface DetectionView {
	image: ImageDataLike;
	scale: number;
	origin: Point;
}

/** Ignore canvas padding and bound the cost of thinning large illustrations.
 * A transparent border lets skeletonization treat art at an image edge normally. */
export function detectionView(source: ImageDataLike, maxSide = 512): DetectionView {
	let x0 = source.width, y0 = source.height, x1 = -1, y1 = -1;
	for (let i = 0; i < source.width * source.height; i++) if (source.data[i * 4 + 3]) {
		const x = i % source.width, y = Math.floor(i / source.width);
		x0 = Math.min(x0, x); y0 = Math.min(y0, y);
		x1 = Math.max(x1, x); y1 = Math.max(y1, y);
	}
	if (x1 < 0) return { image: { width: 1, height: 1, data: new Uint8ClampedArray(4) }, scale: 1, origin: [0, 0] };
	const scale = Math.max(1, (x1 - x0 + 1) / maxSide, (y1 - y0 + 1) / maxSide);
	const width = Math.ceil((x1 - x0 + 1) / scale) + 2;
	const height = Math.ceil((y1 - y0 + 1) / scale) + 2;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
		const sx = Math.min(x1, Math.floor(x0 + (x - 0.5) * scale));
		const sy = Math.min(y1, Math.floor(y0 + (y - 0.5) * scale));
		let i = (sy * source.width + sx) * 4;
		if (scale > 1) {
			// Keep thin opaque features (a staff, antenna or tail) that a centre
			// sample could miss. Only the analysis copy is conservatively expanded.
			for (let yy = Math.floor(y0 + (y - 1) * scale); yy <= Math.min(y1, Math.ceil(y0 + y * scale) - 1); yy++) {
				for (let xx = Math.floor(x0 + (x - 1) * scale); xx <= Math.min(x1, Math.ceil(x0 + x * scale) - 1); xx++) {
					const candidate = (yy * source.width + xx) * 4;
					if (source.data[candidate + 3]! > source.data[i + 3]!) i = candidate;
				}
			}
		}
		data.set(source.data.subarray(i, i + 4), (y * width + x) * 4);
	}
	return { image: { width, height, data }, scale, origin: [x0 - scale, y0 - scale] };
}

/** Opaque art keeps the existing threshold; translucent creatures get a relative one. */
export function foregroundMask(image: ImageDataLike): Uint8Array {
	const hist = new Uint32Array(256);
	let visible = 0;
	for (let i = 3; i < image.data.length; i += 4) if (image.data[i]) { hist[image.data[i]!]!++; visible++; }
	let q = 1, accumulated = 0;
	for (; q < 255; q++) { accumulated += hist[q]!; if (accumulated >= visible * 0.9) break; }
	const threshold = Math.max(1, Math.min(128, Math.floor(q * 0.65)));
	const mask = new Uint8Array(image.width * image.height);
	for (let i = 0; i < mask.length; i++) mask[i] = image.data[i * 4 + 3]! >= threshold ? 1 : 0;
	return mask;
}

/** Landmark records contain point pairs and rectangles. No source pixels are rewritten. */
export function restoreLandmarks<T>(value: T, view: DetectionView): T {
	const walk = (v: unknown): unknown => {
		if (Array.isArray(v)) {
			if (v.length === 2 && v.every(x => typeof x === 'number')) return [view.origin[0] + v[0] * view.scale, view.origin[1] + v[1] * view.scale];
			return v.map(walk);
		}
		if (v && typeof v === 'object') {
			const r = v as Rect;
			if (['x', 'y', 'width', 'height'].every(k => typeof (v as Record<string, unknown>)[k] === 'number')) return {
				x: view.origin[0] + r.x * view.scale, y: view.origin[1] + r.y * view.scale,
				width: r.width * view.scale, height: r.height * view.scale,
			};
			return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
		}
		return v;
	};
	return walk(value) as T;
}
