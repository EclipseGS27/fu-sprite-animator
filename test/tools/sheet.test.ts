import { it } from 'vitest';
import { mkdirSync } from 'node:fs';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton, } from '../../src/core/skeleton';
import { drawOrder } from '../../src/core/skin';
import { buildRig } from '../../src/rig/build';
import { createRig } from '../../src/rig/document';
import { rasterize } from '../../src/render/cpu';
import { getClip, listClips } from '../../src/presets';
import { encodeRle } from '../../src/sprite/rle';
import { groundTruthRoles } from '../unit/groundtruth';
import { readPng, spritePath, writePng } from '../unit/png';
const OUT = process.env.OUT ?? new URL('../render/out/', import.meta.url).pathname;
// Dev tool: a contact sheet of every clip (one row per clip, N frames) on one sprite with ground-truth parts.
it('contact sheet', () => {
	mkdirSync(OUT, { recursive: true });
	const name = process.env.SPRITE ?? 'warrior';
	const N = Number(process.env.N ?? 8);
	const ids = process.env.CLIPS ? process.env.CLIPS.split(',') : listClips().map((c) => c.id);
	const image = readPng(spritePath(name));
	const rig = createRig({ name, src: name, image, template: 'humanoid' });
	const { roles } = groundTruthRoles(name);
	const lr = new Map(rig.parts.map((p) => [rig.bones.find((b) => b.id === p.bone)!.role!, p.label]));
	rig.ownership = encodeRle(Uint8Array.from(roles, (r) => lr.get(r) ?? 0));
	const build = buildRig(rig, image);
	const W = build.outWidth, H = build.outHeight;
	const sheet = new Uint8ClampedArray(W * N * H * ids.length * 4);
	ids.forEach((id, row) => {
		const clip = getClip(id)!;
		const sk = new Skeleton(rig.bones);
		const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
		p.play(clip, { track: clip.loop ? 0 : 1, mixIn: 0, variation: 0 });
		for (let f = 0; f < N; f++) {
			p.update(f === 0 ? 0 : clip.duration / (N - 1) - 1e-4);
			const img = rasterize(build, sk, { snap: true, order: drawOrder(build.geometries, p.layerOverrides) });
			for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
				const s = (y * W + x) * 4, d = ((row * H + y) * W * N + f * W + x) * 4;
				const bg = (x === 0 || y === 0) ? [90, 90, 120] : row % 2 ? [36, 40, 56] : [44, 48, 66];
				const a = img.data[s + 3]! / 255;
				for (let c = 0; c < 3; c++) sheet[d + c] = img.data[s + c]! * a + bg[c]! * (1 - a);
				sheet[d + 3] = 255;
			}
		}
	});
	writePng(OUT + `sheet_${name}.png`, { width: W * N, height: H * ids.length, data: sheet }, Number(process.env.S ?? 1));
	console.log('ROWS', ids.join(','));
});
