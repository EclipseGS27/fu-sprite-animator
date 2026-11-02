import { describe, expect, it } from 'vitest';
import { solveTwoBone } from '../../src/core/ik';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton } from '../../src/core/skeleton';
import { drawOrder } from '../../src/core/skin';
import type { BoneData, ClipDocument } from '../../src/core/types';
import { getClip } from '../../src/presets';
import { createRig } from '../../src/rig/document';
import { readPng, spritePath } from './png';

const bone = (id: string, parent: string | null, x: number, y: number, rotation: number, length: number, role?: string): BoneData => ({ id, name: id, parent, role, x, y, rotation, scaleX: 1, scaleY: 1, length });

describe('draw-order (layer) keys', () => {
	it('drawOrder moves a chain behind a target, keeping its own order', () => {
		const g = [0, 1, 2, 3, 4, 5].map((b) => ({ boneIndex: b })); // torso 0, head 1, arm 2, forearm 3, weapon 4, hand 5
		const order = drawOrder(g, new Map([[2, { behind: 1 }], [3, { behind: 1 }], [4, { behind: 1 }], [5, { behind: 1 }]]));
		expect(order).toEqual([0, 2, 3, 4, 5, 1]);
		expect(drawOrder(g, new Map([[0, { front: 5 }]]))).toEqual([1, 2, 3, 4, 5, 0]);
		expect(drawOrder(g, new Map())).toEqual([0, 1, 2, 3, 4, 5]);
	});
	it('the player switches layers at key times (sword arm behind the head during the wind-up)', () => {
		const rig = createRig({ name: 'w', src: 'w', image: readPng(spritePath('warrior')), template: 'humanoid' });
		const sk = new Skeleton(rig.bones);
		const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
		p.play(getClip('sword-slash')!, { mixIn: 0, variation: 0 });
		p.update(0.01);
		expect(p.layerOverrides.size).toBe(0);
		p.update(0.15);
		const head = sk.roles.get('head')!;
		expect(p.layerOverrides.get(sk.roles.get('weapon')!)).toEqual({ behind: head });
		expect(p.layerOverrides.get(sk.roles.get('arm.upper.front')!)).toEqual({ behind: head });
		const key = p.layerKey;
		p.update(0.3);
		expect(p.layerOverrides.size).toBe(0);
		expect(p.layerKey).not.toBe(key);
	});
	it('a layer key naming a role the rig lacks is ignored', () => {
		const sk = new Skeleton([bone('r', null, 0, 0, 0, 1, 'root'), bone('a', 'r', 0, 0, 0, 10, 'arm')]);
		const clip: ClipDocument = { format: 'fusa-clip', version: 1, id: 'x', name: 'x', category: 'other', duration: 1, loop: false, tracks: { arm: { layer: [{ t: 0, behind: 'head' }] } } };
		const p = new AnimationPlayer(sk, { bodyHeight: 10, facing: 'right' });
		p.play(clip, { mixIn: 0 });
		p.update(0.1);
		expect(p.layerOverrides.size).toBe(0);
	});
});

describe('two-bone IK', () => {
	const arm = () => new Skeleton([bone('s', null, 0, 0, 60, 10, 'upper'), bone('f', 's', 10, 0, 40, 10, 'lower')]);
	it('reaches a reachable target and keeps the bend side', () => {
		const sk = arm();
		const before = sk.segment(1);
		const bendBefore = Math.sign((before.ax - 0) * (before.by - before.ay) - (before.ay - 0) * (before.bx - before.ax));
		for (const [tx, ty] of [[12, 6], [5, 15], [-8, 10], [15, -3]] as [number, number][]) {
			expect(solveTwoBone(sk, 1, tx, ty)).toBe(true);
			const s = sk.segment(1);
			expect(s.bx).toBeCloseTo(tx, 4);
			expect(s.by).toBeCloseTo(ty, 4);
			const bend = Math.sign((s.ax - 0) * (s.by - s.ay) - (s.ay - 0) * (s.bx - s.ax));
			expect(bend).toBe(bendBefore);
		}
	});
	it('stretches toward an unreachable target without breaking', () => {
		const sk = arm();
		solveTwoBone(sk, 1, 100, 0);
		const s = sk.segment(1);
		expect(Math.hypot(s.bx, s.by)).toBeCloseTo(20, 2);
		expect(s.by).toBeCloseTo(0, 1);
		expect(solveTwoBone(sk, 0, 1, 1)).toBe(false); // no parent
	});
});

import { evaluateClip, STRIDE } from '../../src/core/clip';
import { addEvent, cloneClip, keyFromPose, moveKey, removeKey, setDuration, setKeyEase, setLayerKey, setRotateKey, setVectorKey, uniqueClipId } from '../../src/presets/edit';

describe('clip editing', () => {
	const base = (): ClipDocument => cloneClip(getClip('sword-slash')!, 'test', 'Test');
	it('adds, replaces, moves, eases and removes keys', () => {
		const c = base();
		const n = c.tracks.torso!.rotate!.length;
		setRotateKey(c, 'torso', 0.2, 5);
		expect(c.tracks.torso!.rotate!.length).toBe(n + 1);
		setRotateKey(c, 'torso', 0.2, 7);
		expect(c.tracks.torso!.rotate!.length).toBe(n + 1);
		const i = c.tracks.torso!.rotate!.findIndex((k) => k.t === 0.2);
		expect(c.tracks.torso!.rotate![i]!.v).toBe(7);
		setKeyEase(c, 'torso', 'rotate', i, 'outBack');
		expect(c.tracks.torso!.rotate![i]!.e).toBe('outBack');
		const j = moveKey(c, 'torso', 'rotate', i, 0.05);
		expect(c.tracks.torso!.rotate![j]!.t).toBe(0.05);
		expect(c.tracks.torso!.rotate!.map((k) => k.t)).toEqual([...c.tracks.torso!.rotate!.map((k) => k.t)].sort((a, b) => a - b));
		removeKey(c, 'torso', 'rotate', j);
		expect(c.tracks.torso!.rotate!.length).toBe(n);
		setVectorKey(c, 'root', 'translate', 0.5, 0.1, 0);
		setLayerKey(c, 'head', 0.1, 'torso');
		expect(c.tracks.head!.layer![0]).toEqual({ t: 0.1, behind: 'torso' });
		addEvent(c, 0.3, 'flash');
		expect(c.events!.some((e) => e.name === 'flash' && e.t === 0.3)).toBe(true);
		setDuration(c, 0.5);
		for (const tr of Object.values(c.tracks)) for (const k of tr.rotate ?? []) expect(k.t).toBeLessThanOrEqual(0.5);
		removeKey(c, 'head', 'layer', 0);
		expect(c.tracks.head?.layer).toBeUndefined();
	});
	it('keyFromPose is the inverse of evaluation (offset and world tracks, both facings)', () => {
		for (const facing of ['right', 'left'] as const) {
			const rig = createRig({ name: 'w', src: 'w', image: readPng(spritePath('warrior')), template: 'humanoid', facing });
			const sk = new Skeleton(rig.bones);
			const c = base();
			const t = 0.2;
			// pose the bones as the clip says at t, then read keys back
			const out = new Float64Array(sk.size * STRIDE);
			evaluateClip(c, t, { skeleton: sk, bodyHeight: rig.metrics.bodyHeight, mirror: facing === 'left', intensity: 1 }, out, new Uint8Array(sk.size), new Float64Array(sk.size));
			for (let b = 0; b < sk.size; b++) {
				sk.local[b]!.rot = sk.setup[b]!.rot + out[b * STRIDE]!;
				sk.local[b]!.x = sk.setup[b]!.x + out[b * STRIDE + 1]!;
				sk.local[b]!.y = sk.setup[b]!.y + out[b * STRIDE + 2]!;
			}
			sk.update();
			for (const role of ['torso', 'arm.upper.front', 'weapon', 'root']) {
				const k = keyFromPose(c, role, sk, t, facing, rig.metrics.bodyHeight)!;
				const tr = c.tracks[role]!;
				// round-trip: setting the read value as a key must not change the evaluated pose
				if (tr.rotate) setRotateKey(c, role, t, k.rotate);
				if (tr.translate) setVectorKey(c, role, 'translate', t, k.translate[0], k.translate[1]);
			}
			const out2 = new Float64Array(sk.size * STRIDE);
			evaluateClip(c, t, { skeleton: sk, bodyHeight: rig.metrics.bodyHeight, mirror: facing === 'left', intensity: 1 }, out2, new Uint8Array(sk.size), new Float64Array(sk.size));
			for (let j = 0; j < out.length; j++) expect(out2[j]).toBeCloseTo(out[j]!, 1);
		}
	});
	it('unique ids', () => {
		const taken = new Set(['sword-slash', 'sword-slash-2']);
		expect(uniqueClipId('Sword slash', (id) => taken.has(id))).toBe('sword-slash-3');
		expect(uniqueClipId('My clip!', () => false)).toBe('my-clip');
	});
});
