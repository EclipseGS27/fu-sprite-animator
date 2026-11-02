import type { ImageDataLike } from './image';
import { components } from './morph';

/**
 * The ground shadow many battle sprites carry under their feet: a wide, flat, near-black (or
 * dark, translucent) patch that makes up most of the figure's lowest rows. Returned as a pixel
 * mask (1 = shadow), or null when the sprite has none. Outlines and dark boots do not count: they
 * are small, coloured, or not the bulk of the bottom rows.
 */
export function detectShadow(img: ImageDataLike): Uint8Array | null {
	const { width: w, height: h, data } = img;
	let top = h;
	let bottom = -1;
	let opaque = 0;
	for (let i = 0; i < w * h; i++) {
		if (!data[i * 4 + 3]) continue;
		opaque++;
		const y = Math.floor(i / w);
		if (y < top) top = y;
		if (y > bottom) bottom = y;
	}
	if (bottom < 0) return null;
	const H = bottom - top + 1;
	const band = Math.max(3, Math.round(H * 0.15));
	const dark = new Uint8Array(w * h);
	const slate = new Uint8Array(w * h);
	for (let y = bottom - band + 1; y <= bottom; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			const a = data[i * 4 + 3]!;
			if (!a) continue;
			const r = data[i * 4]!;
			const g = data[i * 4 + 1]!;
			const b = data[i * 4 + 2]!;
			const max = Math.max(r, g, b);
			const min = Math.min(r, g, b);
			// near black and grey, or a dark translucent wash
			if ((max <= 40 && max - min <= 20) || (a < 200 && max <= 90 && max - min <= 30)) dark[i] = 1;
			else if (y >= bottom - Math.max(2, Math.round(H * 0.045)) && max <= 160 && b >= r && max - min <= 65) {
				dark[i] = 1;
				slate[i] = 1;
			}
		}
	}
	// the bottom rows must be mostly shadow
	const rows = Math.max(2, Math.round(H * 0.03));
	let bottomPx = 0;
	let bottomDark = 0;
	for (let y = bottom - rows + 1; y <= bottom; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x;
			if (!data[i * 4 + 3]) continue;
			bottomPx++;
			if (dark[i]) bottomDark++;
		}
	}
	if (!bottomPx || bottomDark < bottomPx * 0.4) return null;
	const out = new Uint8Array(w * h);
	let found = 0;
	for (const comp of components(dark, w, h)) {
		let x0 = w;
		let x1 = -1;
		let y0 = h;
		let y1 = -1;
		for (const i of comp) {
			const x = i % w;
			const y = (i - x) / w;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
		const width = x1 - x0 + 1, height = y1 - y0 + 1;
		const wide = width >= 3 * height;
		// The more permissive colour test needs much stronger floor geometry:
		// blue feet or a dragon's underside are not a ground shadow.
		const slatePixels = comp.reduce((sum, i) => sum + slate[i]!, 0);
		if (slatePixels > 0 && (width < H * 0.6 || width < height * 6)) continue;
		if (!wide || y1 < bottom - rows || comp.length < opaque * 0.015) continue;
		// a solid patch, not an outline: most of it has shadow or nothing on every side
		const inComp = new Set(comp);
		let solid = 0;
		for (const i of comp) {
			const x = i % w;
			const ok = [i - w, i + w, x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1].every((j) => j < 0 || j >= w * h || inComp.has(j) || !data[j * 4 + 3]);
			if (ok) solid++;
		}
		if (solid < comp.length * 0.3) continue;
		for (const i of comp) out[i] = 1;
		found += comp.length;
	}
	return found ? out : null;
}
