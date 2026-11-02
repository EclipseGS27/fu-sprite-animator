import { describe, expect, it } from 'vitest';
import { detectHumanoid } from '../../src/sprite/landmarks';
import { detectBeast } from '../../src/sprite/creatures';
import { detectionView, foregroundMask } from '../../src/sprite/analysis';
import { detectShape } from '../../src/sprite/shapes';
import { posedFigure, serpentFigure, transformImage } from './procedural-sprites';
import { assignPixels, createRig, parseRig, rigLabels } from '../../src/rig/document';
import { paintCircle } from '../../src/sprite/ownership';
import { readPng, spritePath } from './png';

describe('detector generalization', () => {
	it.each([0, 100])('finds elbows on independently generated bent-arm poses, seed batch %s', batch => {
		let error = 0;
		for (let seed = batch; seed < batch + 16; seed++) {
			const { image, elbows } = posedFigure(seed);
			const L = detectHumanoid(image, 'right')!;
			error += Math.hypot(L.elbowBack[0] - elbows[0][0], L.elbowBack[1] - elbows[0][1]);
			error += Math.hypot(L.elbowFront[0] - elbows[1][0], L.elbowFront[1] - elbows[1][1]);
		}
		expect(error / 32).toBeLessThan(20);
	});

	it.each(['warrior', 'mage', 'greatsword', 'golem', 'illustrated'])('%s: canvas padding does not move detected joints relative to the art', name => {
		const image = readPng(spritePath(name));
		const a = detectHumanoid(image, 'right')!;
		const b = detectHumanoid(transformImage(image, 1, 37, 19), 'right')!;
		for (const key of ['neck', 'pelvis', 'handFront', 'handBack', 'kneeFront', 'kneeBack'] as const) {
			expect(Math.abs(a[key][0] - (b[key][0] - 37)), key).toBeLessThan(0.001);
			expect(Math.abs(a[key][1] - (b[key][1] - 19)), key).toBeLessThan(0.001);
		}
	});

	it.each(['warrior', 'mage', 'golem'])('%s: a translucent copy keeps the same anatomy', name => {
		const image = readPng(spritePath(name));
		const a = detectHumanoid(image, 'right')!;
		const b = detectHumanoid(transformImage(image, 1, 0, 0, false, 0.25), 'right')!;
		expect(b).not.toBeNull();
		expect(Math.hypot(a.neck[0] - b.neck[0], a.neck[1] - b.neck[1])).toBeLessThan(2);
		expect(Math.hypot(a.pelvis[0] - b.pelvis[0], a.pelvis[1] - b.pelvis[1])).toBeLessThan(2);
	});

	it.each([['wolf', false], ['dragon', true]] as const)('%s: the beast detector also handles translucent art and arbitrary margins', (name, wings) => {
		const image = readPng(spritePath(name));
		const a = detectBeast(image, 'right', { wings })!;
		const b = detectBeast(transformImage(image, 1, 23, 41, false, 0.3), 'right', { wings })!;
		expect(b).not.toBeNull();
		expect(Math.hypot(a.shoulder[0] - (b.shoulder[0] - 23), a.shoulder[1] - (b.shoulder[1] - 41))).toBeLessThan(2);
	});

	it.each([['ghost', 'floating'], ['slime', 'blob'], ['wolf', 'custom']] as const)('%s: non-humanoid body plans receive observed centreline anchors', (name, kind) => {
		const L = detectShape(readPng(spritePath(name)), kind)!;
		expect(L).not.toBeNull();
		expect(Object.keys(L.placements).length).toBeGreaterThan(1);
		for (const [from, to] of Object.values(L.placements)) expect([...from, ...to].every(Number.isFinite)).toBe(true);
	});

	it.each(Array.from({ length: 8 }, (_, i) => i))('curved serpent %s: anchors follow its body and reflect with it', seed => {
		const image = serpentFigure(seed);
		const a = detectShape(image, 'serpentine')!;
		const b = detectShape(transformImage(image, 1, 17, 29, true, 0.4), 'serpentine')!;
		expect(a).not.toBeNull(); expect(b).not.toBeNull();
		expect(a.facing).toBe('right'); expect(b.facing).toBe('left');
		for (const key of ['body', 'neck', 'head', 'tail', 'tail_tip']) {
			for (const point of a.placements[key]!) {
				expect(image.data[(Math.floor(point[1]) * image.width + Math.floor(point[0])) * 4 + 3], key).toBeGreaterThan(0);
			}
		}
		expect(Math.abs(image.width - a.placements.head![1][0] - (b.placements.head![1][0] - 17))).toBeLessThan(3);
	});

	it('an undetected weapon stays excluded on reassign/save/load while manual painting still works', () => {
		const image = readPng(spritePath('golem'));
		const rig = createRig({ name: 'unarmed', src: '', image });
		const weapon = rig.parts.find(p => p.bone === 'weapon')!;
		expect(weapon.autoAssign).toBe(false);
		const restored = parseRig(JSON.parse(JSON.stringify(rig)));
		const assigned = assignPixels(restored, image);
		expect(assigned.some(l => l === weapon.label)).toBe(false);
		const labels = rigLabels(restored);
		let first = -1;
		for (let i = 0; i < labels.length; i++) if (image.data[i * 4 + 3]) { first = i; break; }
		expect(paintCircle(labels, image, first % image.width + 0.5, Math.floor(first / image.width) + 0.5, 2, weapon.label)).toBeGreaterThan(0);
		expect(labels[first]).toBe(weapon.label);
	});

	it.each([1, 2, 4])('procedural pose at %s× resolution preserves the body geometry', scale => {
		const original = posedFigure(2).image;
		const a = detectHumanoid(original, 'right')!;
		const b = detectHumanoid(transformImage(original, scale, 13, 27), 'right')!;
		expect(b.weapon).toBeNull();
		for (const key of ['neck', 'pelvis', 'ankleFront', 'ankleBack'] as const) {
			expect(Math.hypot(a[key][0] - (b[key][0] - 13) / scale, a[key][1] - (b[key][1] - 27) / scale), key).toBeLessThan(9);
		}
	});

	it('bounds the analysis working view without mutating the source', () => {
		const image = transformImage(posedFigure(4).image, 5, 400, 200);
		const source = image.data.slice();
		const view = detectionView(image);
		expect(Math.max(view.image.width, view.image.height)).toBeLessThanOrEqual(514);
		expect(view.scale).toBeGreaterThan(1);
		expect(foregroundMask(view.image).some(Boolean)).toBe(true);
		expect(Buffer.compare(Buffer.from(source), Buffer.from(image.data))).toBe(0);
	});
});
