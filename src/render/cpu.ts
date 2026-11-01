import type { Skeleton } from '../core/skeleton';
import { deformPart, snapSkins } from '../core/skin';
import type { Affine } from '../core/math';
import type { RigBuild } from '../rig/build';
import type { ImageDataLike } from '../sprite/image';

/**
 * Reference software renderer: draws a posed rig with nearest-neighbour sampling at pixel
 * centres, like the GPU path in pixel mode. Used by tests (fidelity checks without WebGL) and
 * for thumbnails. Straight (non-premultiplied) alpha, "over" compositing, parts in draw order.
 */
export function rasterize(build: RigBuild, skeleton: Skeleton, o: { snap?: boolean } = {}): ImageDataLike {
	const W = build.outWidth;
	const H = build.outHeight;
	const out = new Uint8ClampedArray(W * H * 4);
	const skins: Affine[] = o.snap ? snapSkins(skeleton.skin, []) : skeleton.skin;
	const tex = build.atlas;
	for (const g of build.geometries) {
		deformPart(g, skins, build.pad, build.pad);
		const v = g.out;
		const uv = g.uvs;
		const idx = g.indices;
		for (let t = 0; t < idx.length; t += 3) {
			let i0 = idx[t]!;
			let i1 = idx[t + 1]!;
			let i2 = idx[t + 2]!;
			let area = (v[i1 * 2]! - v[i0 * 2]!) * (v[i2 * 2 + 1]! - v[i0 * 2 + 1]!) - (v[i1 * 2 + 1]! - v[i0 * 2 + 1]!) * (v[i2 * 2]! - v[i0 * 2]!);
			if (Math.abs(area) < 1e-9) continue;
			if (area < 0) {
				[i1, i2] = [i2, i1];
				area = -area;
			}
			const x0 = v[i0 * 2]!;
			const y0 = v[i0 * 2 + 1]!;
			const x1 = v[i1 * 2]!;
			const y1 = v[i1 * 2 + 1]!;
			const x2 = v[i2 * 2]!;
			const y2 = v[i2 * 2 + 1]!;
			// Fill rule like a GPU's: a pixel centre exactly on an edge shared by two triangles is drawn once.
			const tl = (ax: number, ay: number, bx: number, by: number) => by - ay < 0 || (by - ay === 0 && bx - ax > 0);
			const tl12 = tl(x1, y1, x2, y2);
			const tl20 = tl(x2, y2, x0, y0);
			const tl01 = tl(x0, y0, x1, y1);
			const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
			const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
			const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
			const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
			for (let py = minY; py <= maxY; py++) {
				const cy = py + 0.5;
				for (let px = minX; px <= maxX; px++) {
					const cx = px + 0.5;
					const e12 = (x2 - x1) * (cy - y1) - (y2 - y1) * (cx - x1);
					const e20 = (x0 - x2) * (cy - y2) - (y0 - y2) * (cx - x2);
					const e01 = (x1 - x0) * (cy - y0) - (y1 - y0) * (cx - x0);
					if (e12 < 0 || e20 < 0 || e01 < 0) continue;
					if ((e12 === 0 && !tl12) || (e20 === 0 && !tl20) || (e01 === 0 && !tl01)) continue;
					const w0 = e12 / area;
					const w1 = e20 / area;
					const w2 = e01 / area;
					const u = w0 * uv[i0 * 2]! + w1 * uv[i1 * 2]! + w2 * uv[i2 * 2]!;
					const vv = w0 * uv[i0 * 2 + 1]! + w1 * uv[i1 * 2 + 1]! + w2 * uv[i2 * 2 + 1]!;
					const tx = Math.min(tex.width - 1, Math.max(0, Math.floor(u * tex.width)));
					const ty = Math.min(tex.height - 1, Math.max(0, Math.floor(vv * tex.height)));
					const s = (ty * tex.width + tx) * 4;
					const sa = tex.data[s + 3]! / 255;
					if (sa <= 0) continue;
					const d = (py * W + px) * 4;
					const da = out[d + 3]! / 255;
					const oa = sa + da * (1 - sa);
					for (let c = 0; c < 3; c++) out[d + c] = Math.round((tex.data[s + c]! * sa + out[d + c]! * da * (1 - sa)) / oa);
					out[d + 3] = Math.round(oa * 255);
				}
			}
		}
	}
	return { width: W, height: H, data: out };
}

/** Pixels that differ between an image and the same-size window of a padded render. */
export function diffAgainst(original: ImageDataLike, render: ImageDataLike, pad: number, tolerance = 0): { different: number; total: number } {
	let different = 0;
	for (let y = 0; y < original.height; y++) {
		for (let x = 0; x < original.width; x++) {
			const a = (y * original.width + x) * 4;
			const b = ((y + pad) * render.width + (x + pad)) * 4;
			const oa = original.data[a + 3]!;
			const ra = render.data[b + 3]!;
			if (oa === 0 && ra === 0) continue;
			if (Math.abs(oa - ra) > tolerance || (oa > 0 && [0, 1, 2].some((c) => Math.abs(original.data[a + c]! - render.data[b + c]!) > tolerance))) different++;
		}
	}
	return { different, total: original.width * original.height };
}
