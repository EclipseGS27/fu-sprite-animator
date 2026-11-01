import type { ImageDataLike } from './image';

/**
 * Sprites saved on a solid background (white, magenta…) instead of transparency. We never
 * change the original file: the Studio offers to save a transparent copy, made by clearing
 * only the background colour that is connected to the image border.
 */

export interface Background {
	color: [number, number, number];
	/** Share of border pixels with that colour. */
	coverage: number;
}

/** The solid background colour, or null when the image already has transparency (or no clear background). */
export function detectBackground(img: ImageDataLike, tolerance = 24): Background | null {
	const { width: w, height: h, data } = img;
	const border: number[] = [];
	for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
	for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
	let transparent = 0;
	const counts = new Map<number, { n: number; rgb: [number, number, number] }>();
	for (const i of border) {
		if (data[i * 4 + 3]! < 250) {
			transparent++;
			continue;
		}
		const r = data[i * 4]!;
		const g = data[i * 4 + 1]!;
		const b = data[i * 4 + 2]!;
		const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
		const c = counts.get(key);
		if (c) c.n++;
		else counts.set(key, { n: 1, rgb: [r, g, b] });
	}
	if (transparent > border.length * 0.2) return null;
	let best: { n: number; rgb: [number, number, number] } | null = null;
	for (const c of counts.values()) if (!best || c.n > best.n) best = c;
	if (!best) return null;
	// count everything within tolerance of the dominant colour
	let near = 0;
	for (const i of border) {
		if (data[i * 4 + 3]! < 250) continue;
		if (Math.max(Math.abs(data[i * 4]! - best.rgb[0]), Math.abs(data[i * 4 + 1]! - best.rgb[1]), Math.abs(data[i * 4 + 2]! - best.rgb[2])) <= tolerance) near++;
	}
	const coverage = near / border.length;
	return coverage >= 0.8 ? { color: best.rgb, coverage } : null;
}

/**
 * A copy with the background made transparent: pixels close to the background colour that are
 * connected to the border (so a white shirt inside the outline stays). Soft edges keep their colour.
 */
export function removeBackground(img: ImageDataLike, bg: Background, tolerance = 24): { image: ImageDataLike; cleared: number } {
	const { width: w, height: h, data } = img;
	const out = new Uint8ClampedArray(data);
	const near = (i: number) => out[i * 4 + 3]! > 0 && Math.max(Math.abs(out[i * 4]! - bg.color[0]), Math.abs(out[i * 4 + 1]! - bg.color[1]), Math.abs(out[i * 4 + 2]! - bg.color[2])) <= tolerance;
	const seen = new Uint8Array(w * h);
	const stack: number[] = [];
	for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
	for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
	let cleared = 0;
	while (stack.length) {
		const i = stack.pop()!;
		if (seen[i]) continue;
		seen[i] = 1;
		if (!near(i)) continue;
		out[i * 4 + 3] = 0;
		cleared++;
		const x = i % w;
		const y = (i - x) / w;
		if (x > 0) stack.push(i - 1);
		if (x < w - 1) stack.push(i + 1);
		if (y > 0) stack.push(i - w);
		if (y < h - 1) stack.push(i + w);
	}
	return { image: { width: w, height: h, data: out }, cleared };
}
