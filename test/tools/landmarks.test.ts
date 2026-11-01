import { it } from 'vitest';
import { mkdirSync } from 'node:fs';
import { createRig } from '../../src/rig/document';
import { bonesToFrames, tipOf } from '../../src/rig/frames';
import { readPng, spritePath, writePng } from '../unit/png';
import { detectBackground, removeBackground } from '../../src/sprite/background';
import { groundTruthRoles } from '../unit/groundtruth';
const OUT = process.env.OUT ?? new URL('../render/out/', import.meta.url).pathname;
// Dev tool: draws the automatically placed skeleton over each sprite (and the ownership map) for review.
it('landmarks sheet', () => {
	mkdirSync(OUT, { recursive: true });
	const names = (process.env.SPRITES ?? 'warrior,mage,greatsword,knight,tiny,illustrated').split(',');
	const S = 5;
	const tiles: { w: number; h: number; data: Uint8ClampedArray }[] = [];
	for (const n of names) {
		let image = readPng(spritePath(n));
		const bg = detectBackground(image);
		if (bg) image = removeBackground(image, bg).image;
		const rig = createRig({ name: n, src: n, image, template: 'humanoid', detect: process.env.DETECT !== '0' });
		const scale = Math.max(1, Math.round((S * 64) / Math.max(image.width, image.height)));
		const W = image.width * scale, H = image.height * scale;
		const px = new Uint8ClampedArray(W * H * 4);
		const labels = (globalThis as any).__labels ?? null;
		void labels;
		for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
			const s = (Math.floor(y / scale) * image.width + Math.floor(x / scale)) * 4, d = (y * W + x) * 4;
			const a = image.data[s + 3]! / 255;
			for (let c = 0; c < 3; c++) px[d + c] = image.data[s + c]! * a * 0.6 + 30 * (1 - a * 0.6);
			px[d + 3] = 255;
		}
		const dot = (x: number, y: number, col: number[], r = 2) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = Math.round(x * scale) + dx, Y = Math.round(y * scale) + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) px.set([...col, 255], (Y * W + X) * 4); } };
		const frames = bonesToFrames(rig.bones);
		for (const b of rig.bones) {
			const f = frames.get(b.id)!; const [tx, ty] = tipOf(f);
			const col = b.color ? [parseInt(b.color.slice(1, 3), 16), parseInt(b.color.slice(3, 5), 16), parseInt(b.color.slice(5, 7), 16)] : [255, 255, 255];
			const steps = Math.max(2, Math.ceil(f.length * scale));
			for (let k = 0; k <= steps; k++) dot(f.x + (tx - f.x) * k / steps, f.y + (ty - f.y) * k / steps, col, 1);
			dot(f.x, f.y, [255, 255, 255], 2);
		}
		tiles.push({ w: W, h: H, data: px });
		void groundTruthRoles;
	}
	const TW = tiles.reduce((s, t) => s + t.w + 8, 0), TH = Math.max(...tiles.map((t) => t.h));
	const sheet = new Uint8ClampedArray(TW * TH * 4);
	let ox = 0;
	for (const t of tiles) { for (let y = 0; y < t.h; y++) sheet.set(t.data.subarray(y * t.w * 4, (y + 1) * t.w * 4), (y * TW + ox) * 4); ox += t.w + 8; }
	writePng(OUT + `landmarks${process.env.DETECT === '0' ? '_template' : ''}.png`, { width: TW, height: TH, data: sheet });
});
