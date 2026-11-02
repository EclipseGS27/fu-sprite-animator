import { it } from 'vitest';
import { writePng } from '../unit/png';
import { detectWeapon } from '../../src/sprite/landmarks';
import { alphaMask, components } from '../../src/sprite/morph';
import { readPng, spritePath } from '../unit/png';
import { detectBackground, removeBackground } from '../../src/sprite/background';
// Dev tool: why the weapon detector picks (or rejects) each skeleton branch.
it('weapon debug', () => {
	const names = (process.env.SPRITES ?? 'user/sword_blue_blade,user/summoner_staff,user/greatsword_red_coat,user/beast_spear,user/chronomancer,warrior,mage,greatsword').split(',');
	for (const n of names) {
		let img = readPng(spritePath(n));
		const bg = detectBackground(img);
		if (bg) img = removeBackground(img, bg).image;
		const { width: w, height: h } = img;
		const mask = alphaMask(img, 128);
		const comps = components(mask, w, h).sort((a, b) => b.length - a.length);
		const keep = new Uint8Array(mask.length);
		for (const c of comps) if (c.length >= comps[0]!.length * 0.15) for (const i of c) keep[i] = 1;
		let top = h, bottom = 0;
		for (let i = 0; i < keep.length; i++) if (keep[i]) ((top = Math.min(top, Math.floor(i / w))), (bottom = Math.max(bottom, Math.floor(i / w))));
		const lines: string[] = [];
		const r = detectWeapon(keep, w, h, bottom - top + 1, (m) => lines.push(m), img.data);
		if (process.env.OUT && r) {
			const px = new Uint8ClampedArray(img.data);
			for (let i = 0; i < w * h; i++) if (px[i * 4 + 3]) for (let c = 0; c < 3; c++) px[i * 4 + c] = px[i * 4 + c]! * 0.35 + 20;
			for (const i of r.pixels) px.set([255, 60, 60, 255], i * 4);
			const dot = (p: number[], col: number[]) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = Math.round(p[0]!) + dx, y = Math.round(p[1]!) + dy; if (x >= 0 && y >= 0 && x < w && y < h) px.set([...col, 255], (y * w + x) * 4); } };
			dot(r.tip, [255, 255, 0]);
			dot(r.hilt, [0, 255, 255]);
			writePng(process.env.OUT + n.replace('/', '_') + '_weapon.png', { width: w, height: h, data: px }, 2);
		}
		console.log(`W ${n} H=${bottom - top + 1} → ${r ? `tip ${r.tip.map(Math.round)} hilt ${r.hilt.map(Math.round)} len ${r.length.toFixed(0)}` : 'none'}\n   ${lines.join('\n   ')}`);
	}
});
