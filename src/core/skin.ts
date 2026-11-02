import { Affine, smoothstep } from './math';
import type { Skeleton } from './skeleton';
import type { PartData } from './types';

/** Up to this many bones influence one vertex. */
export const MAX_INFLUENCES = 4;

export interface PartRect {
	/** Atlas position. */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Sprite position of the rect's top-left. */
	srcX: number;
	srcY: number;
}

/** A part ready to draw: vertices in the setup pose, UVs into the atlas, weights. */
export interface PartGeometry {
	part: PartData;
	boneIndex: number;
	/** Setup-pose vertex positions in sprite pixels (x, y pairs). */
	rest: Float32Array;
	/** Deformed positions written by deformPart (x, y pairs). */
	out: Float32Array;
	uvs: Float32Array;
	indices: Uint16Array;
	/** MAX_INFLUENCES bone indices per vertex (-1 = none). */
	bones: Int16Array;
	weights: Float32Array;
}

export interface BuildOptions {
	bodyHeight: number;
	atlasWidth: number;
	atlasHeight: number;
	/** Bones (by index) that have a part of their own. */
	bonesWithParts: Set<number>;
}

/** Automatic grid cell for mesh parts: about 1/12 of the body height, 2–32 px. */
export function autoCell(bodyHeight: number): number {
	return Math.max(2, Math.min(32, Math.round(bodyHeight / 12)));
}

/**
 * Bones a mesh part bends with: its own bone plus descendants that have no part of their own
 * (a single "whole arm" part spans the upper arm, forearm and hand bones).
 */
function spannedBones(sk: Skeleton, b: number, withParts: Set<number>): number[] {
	const out = [b];
	const stack = [...sk.children[b]!];
	while (stack.length) {
		const c = stack.pop()!;
		if (withParts.has(c)) continue;
		out.push(c);
		stack.push(...sk.children[c]!);
	}
	return out;
}

function segmentDistance(px: number, py: number, m: Affine, length: number): number {
	const ax = m.tx;
	const ay = m.ty;
	const [bx, by] = m.apply(length, 0);
	const dx = bx - ax;
	const dy = by - ay;
	const l2 = dx * dx + dy * dy;
	const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
	return Math.hypot(ax + dx * t - px, ay + dy * t - py);
}

/** Weights for one vertex of a mesh part, as (bone, weight) pairs summing to 1. */
function vertexWeights(sk: Skeleton, part: PartData, b: number, span: number[], vx: number, vy: number, bodyHeight: number): [number, number][] {
	let list: [number, number][];
	if (span.length === 1) list = [[b, 1]];
	else {
		// inverse distance to each spanned bone's segment, sharpened (nearest bone dominates)
		const raw = span.map((j) => [j, 1 / Math.pow(segmentDistance(vx, vy, sk.setupWorld[j]!, sk.bones[j]!.length) + 1, 4)] as [number, number]);
		const total = raw.reduce((s, [, w]) => s + w, 0);
		list = raw.map(([j, w]) => [j, w / total]);
	}
	// blend toward the parent near this part's root joint, so the joint bends instead of opening
	const p = sk.parent[b]!;
	const band = Math.max(1, part.softness * bodyHeight);
	if (p >= 0 && part.softness > 0) {
		const m = sk.setupWorld[b]!;
		const len = Math.hypot(m.a, m.b) || 1;
		const ux = m.a / len;
		const uy = m.b / len;
		const s = (vx - m.tx) * ux + (vy - m.ty) * uy;
		const r = Math.hypot(vx - m.tx, vy - m.ty);
		const axial = smoothstep(0.5 - s / (2 * band));
		const radial = 1 - smoothstep((r - band) / band);
		const wp = axial * radial;
		if (wp > 1e-4) {
			list = list.map(([j, w]) => [j, w * (1 - wp)]);
			list.push([p, wp]);
		}
	}
	list.sort((a, b2) => b2[1] - a[1]);
	list = list.slice(0, MAX_INFLUENCES).filter(([, w]) => w > 1e-4);
	const sum = list.reduce((s, [, w]) => s + w, 0) || 1;
	return list.map(([j, w]) => [j, w / sum]);
}

/**
 * Build a part's geometry over its atlas rect. Rigid parts are one quad; mesh parts a grid with
 * integer vertex positions (so the rest pose samples texels exactly) and empty cells removed.
 */
export function buildPartGeometry(part: PartData, rect: PartRect, coverage: Uint8Array, sk: Skeleton, opts: BuildOptions): PartGeometry {
	const b = sk.index.get(part.bone);
	if (b === undefined) throw new Error(`Part "${part.name}" follows a missing bone.`);
	const xs: number[] = [];
	const ys: number[] = [];
	if (part.deform === 'rigid') {
		xs.push(0, rect.w);
		ys.push(0, rect.h);
	} else {
		const cell = part.cell > 0 ? Math.round(part.cell) : autoCell(opts.bodyHeight);
		for (let x = 0; x < rect.w; x += cell) xs.push(x);
		xs.push(rect.w);
		for (let y = 0; y < rect.h; y += cell) ys.push(y);
		ys.push(rect.h);
	}
	// keep cells that contain at least one covered pixel
	const keep: [number, number][] = [];
	for (let cy = 0; cy < ys.length - 1; cy++) {
		for (let cx = 0; cx < xs.length - 1; cx++) {
			let any = false;
			for (let y = ys[cy]!; y < ys[cy + 1]! && !any; y++) {
				for (let x = xs[cx]!; x < xs[cx + 1]!; x++) {
					if (coverage[y * rect.w + x]) {
						any = true;
						break;
					}
				}
			}
			if (any) keep.push([cx, cy]);
		}
	}
	const vertexOf = new Map<number, number>();
	const pos: number[] = [];
	const indices: number[] = [];
	const vid = (gx: number, gy: number): number => {
		const key = gy * xs.length + gx;
		let v = vertexOf.get(key);
		if (v === undefined) {
			v = pos.length / 2;
			vertexOf.set(key, v);
			pos.push(xs[gx]!, ys[gy]!);
		}
		return v;
	};
	for (const [cx, cy] of keep) {
		const a = vid(cx, cy);
		const bb = vid(cx + 1, cy);
		const c = vid(cx + 1, cy + 1);
		const d = vid(cx, cy + 1);
		indices.push(a, bb, c, a, c, d);
	}
	const n = pos.length / 2;
	if (n > 65535) throw new Error(`Part "${part.name}" has too many vertices; use a larger grid cell.`);
	const rest = new Float32Array(n * 2);
	const uvs = new Float32Array(n * 2);
	const bones = new Int16Array(n * MAX_INFLUENCES).fill(-1);
	const weights = new Float32Array(n * MAX_INFLUENCES);
	const span = part.deform === 'mesh' ? spannedBones(sk, b, opts.bonesWithParts) : [b];
	for (let v = 0; v < n; v++) {
		const lx = pos[v * 2]!;
		const ly = pos[v * 2 + 1]!;
		const sx = rect.srcX + lx;
		const sy = rect.srcY + ly;
		rest[v * 2] = sx;
		rest[v * 2 + 1] = sy;
		uvs[v * 2] = (rect.x + lx) / opts.atlasWidth;
		uvs[v * 2 + 1] = (rect.y + ly) / opts.atlasHeight;
		const ws = part.deform === 'mesh' ? vertexWeights(sk, part, b, span, sx, sy, opts.bodyHeight) : [[b, 1] as [number, number]];
		ws.forEach(([j, w], k) => {
			bones[v * MAX_INFLUENCES + k] = j;
			weights[v * MAX_INFLUENCES + k] = w;
		});
	}
	return { part, boneIndex: b, rest, out: new Float32Array(n * 2), uvs, indices: Uint16Array.from(indices), bones, weights };
}

/**
 * Copy skin matrices, rounding the translation of pure translations to whole pixels: bobbing and
 * sliding parts then move a whole pixel at a time, like hand-made pixel art, with no shimmer.
 */
export function snapSkins(src: Affine[], out: Affine[]): Affine[] {
	for (let i = 0; i < src.length; i++) {
		const m = (out[i] ??= new Affine()).copyFrom(src[i]!);
		if (m.isTranslationOnly(1e-4)) {
			m.a = 1;
			m.b = 0;
			m.c = 0;
			m.d = 1;
			m.tx = Math.round(m.tx);
			m.ty = Math.round(m.ty);
		}
	}
	return out;
}

/**
 * Deform a part with linear blend skinning, then pull it toward rigid motion by its stiffness.
 * Writes geometry.out (+ offset, e.g. the render padding).
 */
export function deformPart(g: PartGeometry, skins: Affine[], offsetX = 0, offsetY = 0): void {
	const { rest, out, bones, weights } = g;
	const n = rest.length / 2;
	const own = skins[g.boneIndex]!;
	const k = g.part.deform === 'mesh' ? Math.max(0, Math.min(1, g.part.stiffness)) : 1;
	for (let v = 0; v < n; v++) {
		const x = rest[v * 2]!;
		const y = rest[v * 2 + 1]!;
		let ox = 0;
		let oy = 0;
		if (k < 1) {
			for (let i = 0; i < MAX_INFLUENCES; i++) {
				const j = bones[v * MAX_INFLUENCES + i]!;
				if (j < 0) break;
				const w = weights[v * MAX_INFLUENCES + i]!;
				const m = skins[j]!;
				ox += (m.a * x + m.c * y + m.tx) * w;
				oy += (m.b * x + m.d * y + m.ty) * w;
			}
		}
		if (k > 0) {
			const rx = own.a * x + own.c * y + own.tx;
			const ry = own.b * x + own.d * y + own.ty;
			ox = ox * (1 - k) + rx * k;
			oy = oy * (1 - k) + ry * k;
		}
		out[v * 2] = ox + offsetX;
		out[v * 2 + 1] = oy + offsetY;
	}
}

/**
 * Draw order of part geometries with layer overrides applied: each overridden bone's parts move
 * just behind (or just in front of) the target bone's parts. Overrides apply in base order, so a
 * whole arm chain moved behind the head keeps its own internal order.
 */
export function drawOrder(geoms: { boneIndex: number }[], overrides: Map<number, { behind?: number; front?: number }>): number[] {
	let order = geoms.map((_, i) => i);
	if (!overrides.size) return order;
	const firstOf = (bone: number) => geoms.findIndex((g) => g.boneIndex === bone);
	const moves = [...overrides.entries()].filter(([b]) => firstOf(b) >= 0).sort((a, b) => firstOf(a[0]) - firstOf(b[0]));
	for (const [bone, o] of moves) {
		const movers = order.filter((i) => geoms[i]!.boneIndex === bone);
		const rest = order.filter((i) => geoms[i]!.boneIndex !== bone);
		let at: number;
		if (o.behind !== undefined) at = rest.findIndex((i) => geoms[i]!.boneIndex === o.behind);
		else {
			const last = rest.map((i) => geoms[i]!.boneIndex).lastIndexOf(o.front!);
			at = last < 0 ? -1 : last + 1;
		}
		if (at < 0) continue;
		rest.splice(at, 0, ...movers);
		order = rest;
	}
	return order;
}
