import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { Skeleton } from '../../src/core/skeleton';
import type { TemplateId } from '../../src/core/types';
import { buildRig } from '../../src/rig/build';
import { createRig, rigLabels } from '../../src/rig/document';
import { diffAgainst, rasterize } from '../../src/render/cpu';
import { detectHumanoid } from '../../src/sprite/landmarks';
import { detectShadow } from '../../src/sprite/shadow';
import { isUsable, validateRig } from '../../src/rig/validate';
import { readPng, spritePath } from './png';

const image = (name: string) => readPng(spritePath(`review/${name}`));
const cases: [string, TemplateId][] = [
	['cloud', 'humanoid'], ['barret', 'humanoid'], ['tifa', 'humanoid'],
	['aerith', 'humanoid'], ['hero_sword', 'humanoid'], ['hero_mage', 'humanoid'],
	['hero_ranger', 'humanoid'], ['golem', 'humanoid'], ['wolf', 'quadruped'],
	['dragon', 'winged'], ['wraith', 'floating'],
];

// Private opt-in corpus: no uploaded artwork is distributed in the repository.
const available = cases.every(([name]) => existsSync(spritePath(`review/${name}`)));
describe.skipIf(!available)('uploaded sprite regression set (local opt-in)', () => {
	it.each(cases)('%s: preserves every visible pixel and the rest pose', (name, template) => {
		const img = image(name);
		const source = img.data.slice();
		const rig = createRig({ name, src: name, image: img, template });
		const labels = rigLabels(rig);
		let missing = 0;
		for (let i = 0; i < labels.length; i++) if (img.data[i * 4 + 3] && !labels[i]) missing++;
		expect(missing).toBe(0);
		expect(isUsable(validateRig(rig, { image: img }))).toBe(true);
		const built = buildRig(rig, img);
		expect(diffAgainst(img, rasterize(built, new Skeleton(rig.bones), { snap: rig.render.snap }), built.pad).different).toBe(0);
		expect(Buffer.compare(Buffer.from(img.data), Buffer.from(source))).toBe(0);
	});

	it('Cloud: blade endpoints and shared grip follow the artwork', () => {
		const L = detectHumanoid(image('cloud'))!;
		expect(L.facing).toBe('right');
		// Broad, visually annotated regions, not snapshots of detector output.
		expect(L.weapon).not.toBeNull();
		expect(L.weapon!.tip[0]).toBeGreaterThan(440);
		expect(L.weapon!.tip[1]).toBeLessThan(180);
		expect(L.weapon!.hilt[0]).toBeGreaterThan(205);
		expect(L.weapon!.hilt[0]).toBeLessThan(260);
		expect(L.weapon!.hilt[1]).toBeGreaterThan(255);
		expect(L.weapon!.hilt[1]).toBeLessThan(305);
		expect(Math.hypot(L.handBack[0] - L.handFront[0], L.handBack[1] - L.handFront[1])).toBeLessThan(30);
		expect(L.confidence.arms).toBeLessThan(0.6);
		expect(L.notes.join(' ')).toMatch(/two-handed/);
	});

	it('Cloud: spread legs reach both boots instead of the empty space between them', () => {
		const L = detectHumanoid(image('cloud'))!;
		expect(L.kneeBack[0]).toBeLessThan(145);
		expect(L.kneeFront[0]).toBeGreaterThan(185);
		expect(L.ankleBack[0]).toBeLessThan(110);
		expect(L.ankleFront[0]).toBeGreaterThan(195);
		expect(L.ankleFront[1]).toBeGreaterThan(375);
	});

	it('Cloud: blue floor shadow stays on the root, not a moving foot', () => {
		const img = image('cloud');
		const shadow = detectShadow(img)!;
		expect(shadow).not.toBeNull();
		const rig = createRig({ name: 'cloud', src: '', image: img });
		const root = rig.parts.find(p => p.bone === 'root')!;
		const labels = rigLabels(rig);
		expect(root).toBeDefined();
		for (let i = 0; i < shadow.length; i++) if (shadow[i]) expect(labels[i]).toBe(root.label);
		// Brown boots are artwork, not part of the blue shadow.
		expect(shadow[390 * img.width + 75]).toBe(0);
	});

	it('Barret: the thick arm is not a sword', () => {
		expect(detectHumanoid(image('barret'))!.weapon).toBeNull();
	});

	it('mirroring Cloud mirrors the detected blade, stance and facing', () => {
		const img = image('cloud');
		const data = new Uint8ClampedArray(img.data.length);
		for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
			const i = (y * img.width + x) * 4;
			data.set(img.data.subarray(i, i + 4), (y * img.width + img.width - 1 - x) * 4);
		}
		const L = detectHumanoid({ ...img, data })!;
		expect(L.facing).toBe('left');
		expect(L.weapon).not.toBeNull();
		expect(L.weapon!.tip[0]).toBeLessThan(80);
		expect(L.weapon!.hilt[0]).toBeGreaterThan(250);
		expect(L.ankleBack[0]).toBeGreaterThan(img.width - 110);
		expect(L.ankleFront[0]).toBeLessThan(img.width - 195);
	});
});
