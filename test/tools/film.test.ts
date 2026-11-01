import { it } from 'vitest';
import { mkdirSync } from 'node:fs';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton } from '../../src/core/skeleton';
import { buildRig } from '../../src/rig/build';
import { createRig } from '../../src/rig/document';
import { rasterize } from '../../src/render/cpu';
import { getClip } from '../../src/presets';
import { encodeRle } from '../../src/sprite/rle';
import { groundTruthRoles } from '../unit/groundtruth';
import { readPng, spritePath, writePng } from '../unit/png';
const OUT = process.env.OUT ?? new URL('../render/out/', import.meta.url).pathname;
it('film', () => {
	mkdirSync(OUT, { recursive: true });
	const clipId = process.env.CLIP ?? 'sword-slash';
	const name = process.env.SPRITE ?? 'warrior';
	const image = readPng(spritePath(name));
	const rig = createRig({ name, src: name, image, template: 'humanoid' });
	if (process.env.GT) {
		const { roles } = groundTruthRoles(name);
		const lr = new Map(rig.parts.map((p) => [rig.bones.find((b) => b.id === p.bone)!.role!, p.label]));
		rig.ownership = encodeRle(Uint8Array.from(roles, (r) => lr.get(r) ?? 0));
	}
	const build = buildRig(rig, image);
	const sk = new Skeleton(rig.bones);
	const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
	p.play(getClip('idle-breathing')!);
	p.play(getClip(clipId)!, { mixIn: 0.08 });
	const frames = Number(process.env.N ?? 12);
	const dur = getClip(clipId)!.duration + 0.25;
	const W = build.outWidth, H = build.outHeight;
	const sheet = new Uint8ClampedArray(W * frames * H * 4);
	for (let f = 0; f < frames; f++) {
		p.update(f === 0 ? 0 : dur / frames);
		const img = rasterize(build, sk, { snap: true });
		for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
			const s = (y * W + x) * 4, d = (y * W * frames + f * W + x) * 4;
			const bg = (x === 0 || y === 0) ? [90, 90, 120, 255] : [36, 40, 56, 255];
			const a = img.data[s + 3]! / 255;
			for (let c = 0; c < 3; c++) sheet[d + c] = img.data[s + c]! * a + bg[c]! * (1 - a);
			sheet[d + 3] = 255;
		}
	}
	writePng(OUT + `film_${name}_${clipId}${process.env.GT ? '_gt' : ''}.png`, { width: W * frames, height: H, data: sheet }, Number(process.env.S ?? 2));
});
