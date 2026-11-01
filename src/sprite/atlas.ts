import type { PartFill } from './fill';
import type { ImageDataLike } from './image';

/** Where a part's pixels sit in the atlas, and where they came from in the sprite. */
export interface AtlasRect {
	/** Position in the atlas. */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Top-left of the same rectangle in sprite pixels. */
	srcX: number;
	srcY: number;
}

export interface Atlas {
	width: number;
	height: number;
	data: Uint8ClampedArray;
	rects: Map<number, AtlasRect>;
	/** Per label: 1 where the part has a pixel (own or fill), in its rect, row-major. */
	coverage: Map<number, Uint8Array>;
}

const GUTTER = 2;

/**
 * Pack every part (its own pixels plus its hidden-region fill) into one RGBA image with
 * transparent gutters, so all parts of a rig share a single texture.
 */
export function buildAtlas(img: ImageDataLike, labels: Uint8Array, fills: Map<number, PartFill>, partLabels: number[], maxSize = 8192): Atlas {
	const { width: w, data } = img;
	const bounds = new Map<number, { x0: number; y0: number; x1: number; y1: number }>();
	const grow = (l: number, i: number) => {
		const x = i % w;
		const y = (i - x) / w;
		const b = bounds.get(l);
		if (!b) bounds.set(l, { x0: x, y0: y, x1: x, y1: y });
		else {
			if (x < b.x0) b.x0 = x;
			if (x > b.x1) b.x1 = x;
			if (y < b.y0) b.y0 = y;
			if (y > b.y1) b.y1 = y;
		}
	};
	const wanted = new Set(partLabels);
	for (let i = 0; i < labels.length; i++) if (labels[i] && wanted.has(labels[i]!)) grow(labels[i]!, i);
	for (const [l, f] of fills) if (wanted.has(l)) for (const i of f.indices) grow(l, i);

	const items = [...bounds.entries()].map(([label, b]) => ({ label, b, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }));
	items.sort((a, b) => b.h - a.h || b.w - a.w);
	const area = items.reduce((s, it) => s + (it.w + GUTTER) * (it.h + GUTTER), 0);
	const widest = items.reduce((m, it) => Math.max(m, it.w + GUTTER * 2), 0);
	const atlasW = Math.min(maxSize, Math.max(widest, Math.ceil(Math.sqrt(area) * 1.15) + GUTTER));
	// shelf packing
	const rects = new Map<number, AtlasRect>();
	let x = GUTTER;
	let y = GUTTER;
	let shelf = 0;
	for (const it of items) {
		if (x + it.w + GUTTER > atlasW) {
			x = GUTTER;
			y += shelf + GUTTER;
			shelf = 0;
		}
		rects.set(it.label, { x, y, w: it.w, h: it.h, srcX: it.b.x0, srcY: it.b.y0 });
		x += it.w + GUTTER;
		shelf = Math.max(shelf, it.h);
	}
	const atlasH = Math.max(1, y + shelf + GUTTER);
	if (atlasH > maxSize) throw new Error(`The parts do not fit in a ${maxSize}px texture. Use a smaller sprite.`);
	const out = new Uint8ClampedArray(atlasW * atlasH * 4);
	const coverage = new Map<number, Uint8Array>();
	for (const [l, r] of rects) coverage.set(l, new Uint8Array(r.w * r.h));
	const put = (l: number, i: number, rgba: ArrayLike<number>, o: number) => {
		const r = rects.get(l)!;
		const sx = i % w;
		const sy = (i - sx) / w;
		const lx = sx - r.srcX;
		const ly = sy - r.srcY;
		const d = ((r.y + ly) * atlasW + (r.x + lx)) * 4;
		out[d] = rgba[o]!;
		out[d + 1] = rgba[o + 1]!;
		out[d + 2] = rgba[o + 2]!;
		out[d + 3] = rgba[o + 3]!;
		coverage.get(l)![ly * r.w + lx] = 1;
	};
	for (let i = 0; i < labels.length; i++) {
		const l = labels[i]!;
		if (l && rects.has(l)) put(l, i, data, i * 4);
	}
	for (const [l, f] of fills) {
		if (!rects.has(l)) continue;
		for (let k = 0; k < f.indices.length; k++) put(l, f.indices[k]!, f.rgba, k * 4);
	}
	return { width: atlasW, height: atlasH, data: out, rects, coverage };
}
