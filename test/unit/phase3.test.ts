import { describe, expect, it } from 'vitest';
import { Skeleton } from '../../src/core/skeleton';
import { buildRig } from '../../src/rig/build';
import { createRig, lastReport, proposeRig, rigLabels } from '../../src/rig/document';
import { isUsable, validateRig } from '../../src/rig/validate';
import { diffAgainst, rasterize } from '../../src/render/cpu';
import { detectBackground, removeBackground } from '../../src/sprite/background';
import { computeFills } from '../../src/sprite/fill';
import { geodesicAssign } from '../../src/sprite/geodesic';
import { detectHumanoid, detectWeapon } from '../../src/sprite/landmarks';
import { alphaMask, distanceTransform, skeletonize } from '../../src/sprite/morph';
import { countUnassigned } from '../../src/sprite/ownership';
import { encodeRle } from '../../src/sprite/rle';
import { readPng, spritePath } from './png';

const transparent = (name: string) => {
	const img = readPng(spritePath(name));
	const bg = detectBackground(img);
	return bg ? removeBackground(img, bg).image : img;
};

describe('background removal', () => {
	it('finds a solid white background and clears only it', () => {
		const img = readPng(spritePath('swordsman_white'));
		const bg = detectBackground(img)!;
		expect(bg.color).toEqual([255, 255, 255]);
		const { image, cleared } = removeBackground(img, bg);
		expect(cleared).toBeGreaterThan(img.width * img.height * 0.5);
		let changedArt = 0;
		for (let i = 0; i < img.width * img.height; i++) {
			const white = img.data[i * 4] === 255 && img.data[i * 4 + 1] === 255 && img.data[i * 4 + 2] === 255;
			if (image.data[i * 4 + 3] === 0) continue;
			if (white) continue;
			if ([0, 1, 2, 3].some((c) => image.data[i * 4 + c] !== img.data[i * 4 + c])) changedArt++;
		}
		expect(changedArt).toBe(0);
	});
	it('leaves sprites that already have transparency alone', () => {
		for (const n of ['warrior', 'dragon', 'illustrated']) expect(detectBackground(readPng(spritePath(n)))).toBeNull();
	});
});

describe('skeleton and weapons', () => {
	it('skeletonize gives a thin, connected skeleton', () => {
		const img = readPng(spritePath('warrior'));
		const m = alphaMask(img);
		const sk = skeletonize(m, img.width, img.height);
		let n = 0;
		for (let i = 0; i < sk.length; i++) {
			if (!sk[i]) continue;
			n++;
			expect(m[i]).toBe(1);
		}
		expect(n).toBeGreaterThan(40);
		expect(n).toBeLessThan(m.reduce((a, b) => a + b, 0) / 3);
		const dt = distanceTransform(m, img.width, img.height);
		expect(Math.max(...dt)).toBeGreaterThan(3);
	});
	it.each([
		['warrior', 'right'],
		['knight', 'right'],
		['greatsword', 'right'],
		['tiny', 'right'],
		['swordsman_white', 'left'],
	] as const)('%s: weapon found, facing %s', (name, facing) => {
		const img = transparent(name);
		const m = alphaMask(img);
		expect(detectWeapon(m, img.width, img.height, img.height * 0.8)).not.toBeNull();
		const L = detectHumanoid(img, 'auto')!;
		expect(L.weapon).not.toBeNull();
		expect(L.facing).toBe(facing);
	});
	it('a golem’s legs are not taken for a weapon', () => {
		const L = detectHumanoid(transparent('golem'), 'auto')!;
		expect(L.weapon).toBeNull();
	});
	it('landmarks are anatomically ordered', () => {
		for (const n of ['warrior', 'mage', 'swordsman_white', 'mage_front', 'golem', 'illustrated']) {
			const L = detectHumanoid(transparent(n), 'auto')!;
			expect(L.top[1]).toBeLessThan(L.neck[1]);
			expect(L.neck[1]).toBeLessThan(L.pelvis[1]);
			expect(L.hipFront[1]).toBeLessThan(L.kneeFront[1]);
			expect(L.kneeFront[1]).toBeLessThan(L.ankleFront[1]);
			expect(L.shoulderFront[1]).toBeLessThan(L.pelvis[1]);
		}
	});
});

describe('assignment', () => {
	it('floating pieces are adopted by the nearest part: no visible pixel is lost', () => {
		for (const n of ['mage_front', 'ghost', 'dragon', 'swordsman_white']) {
			const img = transparent(n);
			const rig = createRig({ name: n, src: n, image: img, template: ['ghost', 'dragon'].includes(n) ? 'custom' : 'humanoid' });
			expect(countUnassigned(rigLabels(rig), img)).toBe(0);
			expect(isUsable(validateRig(rig, { image: img }))).toBe(true);
		}
	});
	it('geodesic regions do not jump across transparent gaps', () => {
		// two blocks separated by a gap; a bone in each; no pixel of one block goes to the other bone
		const w = 20;
		const h = 10;
		const data = new Uint8ClampedArray(w * h * 4);
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < 8 || x > 11) data.set([200, 50, 50, 255], (y * w + x) * 4);
		const labels = geodesicAssign({ width: w, height: h, data }, [
			{ label: 1, ax: 2, ay: 5, bx: 6, by: 5, bias: 0 },
			{ label: 2, ax: 13, ay: 5, bx: 18, by: 5, bias: 30 }, // a huge reach would win everywhere in Euclidean terms
		]);
		for (let y = 0; y < h; y++) for (let x = 0; x < 8; x++) expect(labels[y * w + x]).toBe(1);
	});
	it('the automatic report says what was found', () => {
		const img = transparent('swordsman_white');
		const rig = createRig({ name: 's', src: 's', image: img, template: 'humanoid' });
		const r = lastReport.get(rig)!;
		expect(r.method).toBe('landmarks');
		expect(r.confidence.weapon).toBeGreaterThan(0);
		expect(rig.facing).toBe('left');
		const p = proposeRig(img, 'humanoid', 'auto', false);
		expect(p.report.method).toBe('proportions');
	});
});

describe('hidden-region hints', () => {
	it('extend a part beyond its automatic fill, still only under opaque higher parts', () => {
		const img = transparent('warrior');
		const rig = createRig({ name: 'w', src: 'w', image: img, template: 'humanoid' });
		const labels = rigLabels(rig);
		const order = rig.parts.map((p) => p.label);
		const torso = rig.parts.find((p) => p.bone === 'torso')!.label;
		const plain = computeFills(img, labels, order, { radius: 3 }).get(torso)?.indices.length ?? 0;
		const hints = new Uint8Array(labels.length);
		const rank = new Map(order.map((l, i) => [l, i]));
		for (let i = 0; i < labels.length; i++) if (labels[i] && (rank.get(labels[i]!) ?? -1) > rank.get(torso)! && img.data[i * 4 + 3] === 255) hints[i] = torso;
		const hinted = computeFills(img, labels, order, { radius: 3, hints }).get(torso)!;
		expect(hinted.indices.length).toBeGreaterThan(plain);
		for (const i of hinted.indices) {
			expect(img.data[i * 4 + 3]).toBe(255);
			expect(rank.get(labels[i]!)!).toBeGreaterThan(rank.get(torso)!);
		}
		// and the rest pose is still identical
		rig.fillHints = encodeRle(hints);
		const build = buildRig(rig, img);
		expect(diffAgainst(img, rasterize(build, new Skeleton(rig.bones), { snap: true }), build.pad).different).toBe(0);
	});
});
