/** Minimal image shape: what ImageData has, so analysis runs in Node, the browser or a worker. */
export interface ImageDataLike {
	width: number;
	height: number;
	/** RGBA, row-major, not premultiplied. */
	data: Uint8ClampedArray | Uint8Array;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Bounds of pixels with alpha ≥ alphaMin; null for a fully transparent image. */
export function opaqueBounds(img: ImageDataLike, alphaMin = 1): Rect | null {
	const { width: w, height: h, data } = img;
	let x0 = w;
	let y0 = h;
	let x1 = -1;
	let y1 = -1;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (data[(y * w + x) * 4 + 3]! >= alphaMin) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
	}
	return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

export function countOpaque(img: ImageDataLike, alphaMin = 1): number {
	let n = 0;
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i]! >= alphaMin) n++;
	return n;
}

/**
 * Guess whether an image is pixel art: few distinct colours, hard alpha edges, and pixels that
 * repeat in runs. Used only to pick a default render mode; the GM can always change it.
 */
export function looksLikePixelArt(img: ImageDataLike): boolean {
	const { data } = img;
	const colours = new Set<number>();
	let opaque = 0;
	let partial = 0;
	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3]!;
		if (a === 0) continue;
		opaque++;
		if (a < 250) partial++;
		if (colours.size <= 512) colours.add((data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!);
	}
	if (!opaque) return false;
	return colours.size <= 256 && partial / opaque < 0.02 && Math.max(img.width, img.height) <= 512;
}

/** Copy of an image with transparent padding on every side. */
export function padImage(img: ImageDataLike, pad: number): ImageDataLike {
	const w = img.width + pad * 2;
	const h = img.height + pad * 2;
	const out = new Uint8ClampedArray(w * h * 4);
	for (let y = 0; y < img.height; y++) {
		out.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), ((y + pad) * w + pad) * 4);
	}
	return { width: w, height: h, data: out };
}

/**
 * Bounds of the character's body, ignoring thin protrusions such as a raised sword or a staff:
 * rows whose longest opaque run is under a quarter of the widest row do not count, and the
 * horizontal extent uses the 10th/90th percentiles of the remaining rows' run ends.
 * Falls back to the opaque bounds.
 */
export function bodyBounds(img: ImageDataLike, alphaMin = 1): Rect | null {
	const all = opaqueBounds(img, alphaMin);
	if (!all) return null;
	const { width: w, data } = img;
	const runs: { y: number; x0: number; x1: number }[] = [];
	let maxRun = 0;
	for (let y = all.y; y < all.y + all.height; y++) {
		let best: { x0: number; x1: number } | null = null;
		let start = -1;
		for (let x = all.x; x <= all.x + all.width; x++) {
			const on = x < all.x + all.width && data[(y * w + x) * 4 + 3]! >= alphaMin;
			if (on && start < 0) start = x;
			if (!on && start >= 0) {
				if (!best || x - 1 - start > best.x1 - best.x0) best = { x0: start, x1: x - 1 };
				start = -1;
			}
		}
		if (best) {
			runs.push({ y, ...best });
			maxRun = Math.max(maxRun, best.x1 - best.x0 + 1);
		}
	}
	const body = runs.filter((r) => r.x1 - r.x0 + 1 >= maxRun * 0.25);
	if (body.length < 3) return all;
	const pct = (vals: number[], p: number) => {
		const s = vals.slice().sort((a, b) => a - b);
		return s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))]!;
	};
	const x0 = pct(body.map((r) => r.x0), 0.1);
	const x1 = pct(body.map((r) => r.x1), 0.9);
	const top = body[0]!.y;
	const bottom = all.y + all.height - 1;
	return { x: x0, y: top, width: Math.max(1, x1 - x0 + 1), height: Math.max(1, bottom - top + 1) };
}
