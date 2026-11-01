import { describe, expect, it } from 'vitest';
import { Skeleton } from '../../src/core/skeleton';
import { buildRig } from '../../src/rig/build';
import { cloneRig, createRig, parseRig, rigLabels } from '../../src/rig/document';
import { addBone, deleteBone, moveJoint, moveSubtree, moveTip, reparent } from '../../src/rig/edit';
import { applyFrames, bonesToFrames, tipOf } from '../../src/rig/frames';
import { History } from '../../src/rig/history';
import { isUsable, validateRig } from '../../src/rig/validate';
import { diffAgainst, rasterize } from '../../src/render/cpu';
import { computeFills, convexHull, insideHull } from '../../src/sprite/fill';
import { autoAssign, cleanIslands, countUnassigned, floodAssign, paintCircle } from '../../src/sprite/ownership';
import { decodeRle, encodeRle } from '../../src/sprite/rle';
import { SPRITES, readPng, spritePath } from './png';
import { assignmentAccuracy, groundTruthRoles } from './groundtruth';

const HUMANOIDS = new Set(['warrior', 'mage', 'greatsword', 'knight', 'tiny', 'illustrated']);
const rigFor = (name: string) => {
	const image = readPng(spritePath(name));
	const rig = createRig({ name, src: `${name}.png`, image, template: HUMANOIDS.has(name) ? 'humanoid' : 'custom' });
	return { image, rig };
};

describe('rle', () => {
	it('round-trips long and short runs', () => {
		const data = new Uint8Array(100000);
		for (let i = 0; i < data.length; i++) data[i] = i < 300 ? 0 : i % 977 < 400 ? 3 : (i >> 5) % 7;
		expect(decodeRle(encodeRle(data), data.length)).toEqual(data);
		expect(() => decodeRle(encodeRle(data), data.length + 1)).toThrow();
	});
});

describe('ownership', () => {
	it('assigns every visible pixel and nothing else', () => {
		for (const name of SPRITES) {
			const { image, rig } = rigFor(name);
			const labels = rigLabels(rig);
			expect(countUnassigned(labels, image)).toBe(0);
			for (let i = 0; i < labels.length; i++) if (image.data[i * 4 + 3] === 0) expect(labels[i]).toBe(0);
		}
	});
	it('cleans small islands into their surroundings', () => {
		const w = 10;
		const h = 10;
		const labels = new Uint8Array(w * h).fill(1);
		labels[55] = 2; // one stray pixel of 2 inside 1
		for (let i = 0; i < 20; i++) labels[i] = 2; // main body of 2
		expect(cleanIslands(labels, w, h, 0.25)).toBe(1);
		expect(labels[55]).toBe(1);
	});
	it('brush and bucket relabel only what they should', () => {
		const { image, rig } = rigFor('warrior');
		const labels = rigLabels(rig);
		const changed = paintCircle(labels, image, 32, 32, 3, 200);
		expect(changed).toBeGreaterThan(0);
		for (let i = 0; i < labels.length; i++) if (labels[i] === 200) expect(image.data[i * 4 + 3]).toBeGreaterThan(0);
		const i0 = labels.indexOf(200);
		const n = floodAssign(labels, image.width, image.height, i0 % image.width, Math.floor(i0 / image.width), 201);
		expect(n).toBe(changed);
	});
});

describe('hidden-region fill', () => {
	it('only fills under opaque pixels of parts drawn above, with colours from the part itself', () => {
		const { image, rig } = rigFor('warrior');
		const labels = rigLabels(rig);
		const order = rig.parts.map((p) => p.label);
		const fills = computeFills(image, labels, order, { radius: 10 });
		expect(fills.size).toBeGreaterThan(0);
		for (const [label, f] of fills) {
			const rank = order.indexOf(label);
			const palette = new Set<number>();
			for (let i = 0; i < labels.length; i++) if (labels[i] === label) palette.add((image.data[i * 4]! << 16) | (image.data[i * 4 + 1]! << 8) | image.data[i * 4 + 2]!);
			for (let k = 0; k < f.indices.length; k++) {
				const i = f.indices[k]!;
				expect(image.data[i * 4 + 3]).toBe(255);
				expect(order.indexOf(labels[i]!)).toBeGreaterThan(rank);
				expect(palette.has((f.rgba[k * 4]! << 16) | (f.rgba[k * 4 + 1]! << 8) | f.rgba[k * 4 + 2]!)).toBe(true);
			}
		}
	});
	it('fills the torso behind the front arm (ground-truth parts)', () => {
		const { image, rig } = rigFor('warrior');
		const { roles } = groundTruthRoles('warrior');
		const labelOfRole = new Map(rig.parts.map((p) => [rig.bones.find((b) => b.id === p.bone)!.role!, p.label]));
		const labels = Uint8Array.from(roles, (r) => labelOfRole.get(r) ?? 0);
		const torso = rig.parts.find((p) => p.bone === 'torso')!.label;
		const arm = rig.parts.find((p) => p.bone === 'arm_upper_front')!.label;
		const fills = computeFills(image, labels, rig.parts.map((p) => p.label), { radius: 10 });
		const under = [...(fills.get(torso)?.indices ?? [])].filter((i) => labels[i] === arm).length;
		expect(under).toBeGreaterThan(5);
	});
});

describe('pixel fidelity', () => {
	it.each([...SPRITES])('%s: the rest pose is bit-identical to the source', (name) => {
		const { image, rig } = rigFor(name);
		const build = buildRig(rig, image);
		const sk = new Skeleton(rig.bones);
		const out = rasterize(build, sk, { snap: true });
		expect(diffAgainst(image, out, build.pad).different).toBe(0);
	});
	it('posing moves pixels but never invents colours (pixel mode)', () => {
		const { image, rig } = rigFor('warrior');
		const build = buildRig(rig, image);
		const sk = new Skeleton(rig.bones);
		sk.local[sk.index.get('arm_upper_front')!]!.rot += 70;
		sk.local[sk.index.get('torso')!]!.rot += 8;
		sk.update();
		const out = rasterize(build, sk, { snap: true });
		const palette = new Set<number>();
		for (let i = 0; i < image.data.length; i += 4) if (image.data[i + 3]) palette.add((image.data[i]! << 16) | (image.data[i + 1]! << 8) | image.data[i + 2]!);
		for (let i = 0; i < out.data.length; i += 4) {
			if (!out.data[i + 3]) continue;
			expect(palette.has((out.data[i]! << 16) | (out.data[i + 1]! << 8) | out.data[i + 2]!)).toBe(true);
		}
	});
	it('moving the front arm away leaves no hole in the torso (ground-truth parts)', () => {
		const { image, rig } = rigFor('warrior');
		const { roles } = groundTruthRoles('warrior');
		const labelOfRole = new Map(rig.parts.map((p) => [rig.bones.find((b) => b.id === p.bone)!.role!, p.label]));
		const labels = Uint8Array.from(roles, (r) => labelOfRole.get(r) ?? 0);
		rig.ownership = encodeRle(labels);
		const build = buildRig(rig, image, labels);
		const sk = new Skeleton(rig.bones);
		sk.local[sk.index.get('arm_upper_front')!]!.rot -= 100; // swing the arm up and away from the body
		sk.update();
		const out = rasterize(build, sk, { snap: true });
		const w = image.width;
		// pixels of the front arm inside the torso's convex hull: the area the arm used to hide
		const torsoCorners: [number, number][] = [];
		roles.forEach((r, i) => {
			if (r === 'torso') torsoCorners.push([i % w, Math.floor(i / w)], [(i % w) + 1, Math.floor(i / w) + 1], [(i % w) + 1, Math.floor(i / w)], [i % w, Math.floor(i / w) + 1]);
		});
		const hull = convexHull(torsoCorners);
		let covered = 0;
		let holes = 0;
		roles.forEach((r, i) => {
			const x = i % w;
			const y = Math.floor(i / w);
			if (r !== 'arm.upper.front' || image.data[i * 4 + 3] !== 255 || !insideHull(hull, x + 0.5, y + 0.5)) return;
			covered++;
			if (out.data[((y + build.pad) * out.width + x + build.pad) * 4 + 3] === 0) holes++;
		});
		expect(covered).toBeGreaterThan(10);
		expect(holes).toBe(0);
	});
});

describe('frames and editing', () => {
	it('frames round-trip through local bone data', () => {
		const { rig } = rigFor('warrior');
		const before = bonesToFrames(rig.bones);
		const copy = cloneRig(rig);
		applyFrames(copy.bones, before);
		const after = bonesToFrames(copy.bones);
		for (const [id, f] of before) {
			expect(after.get(id)!.x).toBeCloseTo(f.x, 6);
			expect(after.get(id)!.y).toBeCloseTo(f.y, 6);
			expect(after.get(id)!.length).toBeCloseTo(f.length, 6);
		}
	});
	it('moving an elbow keeps the hand where it is and re-aims the upper arm', () => {
		const { rig } = rigFor('warrior');
		const f0 = bonesToFrames(rig.bones);
		const handTip = tipOf(f0.get('arm_lower_front')!);
		moveJoint(rig, 'arm_lower_front', f0.get('arm_lower_front')!.x + 3, f0.get('arm_lower_front')!.y - 2);
		const f1 = bonesToFrames(rig.bones);
		const tip = tipOf(f1.get('arm_lower_front')!);
		expect(tip[0]).toBeCloseTo(handTip[0], 6);
		expect(tip[1]).toBeCloseTo(handTip[1], 6);
		const upperTip = tipOf(f1.get('arm_upper_front')!);
		expect(upperTip[0]).toBeCloseTo(f1.get('arm_lower_front')!.x, 6);
		expect(f1.get('hand_front')!.x).toBeCloseTo(f0.get('hand_front')!.x, 6);
		expect(f1.get('torso')!.angle).toBeCloseTo(f0.get('torso')!.angle, 6);
	});
	it('moving a tip drags connected children by the joint only', () => {
		const { rig } = rigFor('warrior');
		const f0 = bonesToFrames(rig.bones);
		moveTip(rig, 'arm_upper_front', 40, 30);
		const f1 = bonesToFrames(rig.bones);
		expect(f1.get('arm_lower_front')!.x).toBeCloseTo(40, 6);
		const t0 = tipOf(f0.get('arm_lower_front')!);
		const t1 = tipOf(f1.get('arm_lower_front')!);
		expect(t1[0]).toBeCloseTo(t0[0], 6);
		moveSubtree(rig, 'arm_upper_front', 2, 0);
		expect(bonesToFrames(rig.bones).get('weapon')!.x).toBeCloseTo(f1.get('weapon')!.x + 2, 6);
	});
	it('adds, reparents and deletes bones without moving the others', () => {
		const { rig } = rigFor('warrior');
		const labels = rigLabels(rig);
		const b = addBone(rig, 'head', 30, 10, 30, 2, { name: 'Ponytail', role: 'hair' });
		expect(rig.parts.some((p) => p.bone === b.id)).toBe(true);
		expect(() => reparent(rig, 'torso', 'head')).toThrow();
		const f0 = bonesToFrames(rig.bones);
		reparent(rig, b.id, 'torso');
		expect(bonesToFrames(rig.bones).get(b.id)!.x).toBeCloseTo(f0.get(b.id)!.x, 6);
		const handLabel = rig.parts.find((p) => p.bone === 'hand_front')!.label;
		const lowerLabel = rig.parts.find((p) => p.bone === 'arm_lower_front')!.label;
		const handPixels = labels.filter((v) => v === handLabel).length;
		deleteBone(rig, 'hand_front', labels);
		expect(rig.bones.find((x) => x.id === 'weapon')!.parent).toBe('arm_lower_front');
		expect(bonesToFrames(rig.bones).get('weapon')!.x).toBeCloseTo(f0.get('weapon')!.x, 6);
		expect(labels.filter((v) => v === handLabel).length).toBe(0);
		expect(labels.filter((v) => v === lowerLabel).length).toBeGreaterThanOrEqual(handPixels);
	});
});

describe('documents', () => {
	it('parses what it saves and rejects broken files', () => {
		const { rig } = rigFor('knight');
		const again = parseRig(JSON.parse(JSON.stringify(rig)));
		expect(again).toEqual(JSON.parse(JSON.stringify(rig)));
		expect(() => parseRig({ format: 'nope' })).toThrow();
		expect(() => parseRig({ ...rig, ownership: encodeRle(new Uint8Array(5)) })).toThrow();
		expect(() => parseRig({ ...rig, bones: [] })).toThrow();
	});
	it('validation flags pixels that would disappear and broken parts', () => {
		const { image, rig } = rigFor('warrior');
		expect(isUsable(validateRig(rig, { image }))).toBe(true);
		const labels = rigLabels(rig);
		const broken = cloneRig(rig);
		broken.parts = broken.parts.filter((p) => p.bone !== 'torso');
		const issues = validateRig(broken, { image, labels });
		expect(issues.some((i) => i.code === 'pixels-lost' && i.level === 'error')).toBe(true);
		broken.parts.push({ ...broken.parts[0]!, id: 'x', bone: 'nope' });
		expect(validateRig(broken, { image }).some((i) => i.code === 'part-bone')).toBe(true);
	});
});

describe('history', () => {
	it('undoes and redoes, and a drag is one step', () => {
		const h = new History();
		h.reset('a');
		h.record('b');
		h.begin();
		h.record('c1');
		h.record('c2');
		h.end('c3');
		expect(h.undo()).toBe('b');
		expect(h.undo()).toBe('a');
		expect(h.undo()).toBeNull();
		expect(h.redo()).toBe('b');
		h.record('d');
		expect(h.redo()).toBeNull();
		expect(h.undo()).toBe('b');
	});
});

describe('auto assignment quality (baseline, Phase 2)', () => {
	// Template fitted to body bounds + nearest-bone assignment. Phase 3 should raise these.
	const floor: Record<string, number> = { warrior: 0.72, mage: 0.55, greatsword: 0.64, knight: 0.56, tiny: 0.63, illustrated: 0.7 };
	it.each(Object.keys(floor))('%s stays above its baseline accuracy', (name) => {
		const { image, rig } = rigFor(name);
		expect(assignmentAccuracy(name, rig, image)).toBeGreaterThan(floor[name]!);
	});
});

describe('auto assignment helpers', () => {
	it('autoAssign with no segments leaves everything unassigned', () => {
		const img = readPng(spritePath('slime'));
		expect(autoAssign(img, []).every((v) => v === 0)).toBe(true);
	});
});
