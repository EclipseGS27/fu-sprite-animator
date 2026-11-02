import { describe, expect, it } from 'vitest';
import { TimeWarp, evaluateClip, sampleKeys, STRIDE } from '../../src/core/clip';
import { EASINGS, bezier, easeFn } from '../../src/core/easing';
import { Affine, wrapDeg } from '../../src/core/math';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton, orderBones } from '../../src/core/skeleton';
import type { BoneData, ClipDocument } from '../../src/core/types';

const bone = (id: string, parent: string | null, x: number, y: number, rotation: number, length: number, role?: string): BoneData => ({ id, name: id, parent, role, x, y, rotation, scaleX: 1, scaleY: 1, length });

const clip = (tracks: ClipDocument['tracks'], extra: Partial<ClipDocument> = {}): ClipDocument => ({ format: 'fusa-clip', version: 1, id: 'c', name: 'c', category: 'other', duration: 1, loop: false, tracks, ...extra });

describe('math', () => {
	it('composes and inverts affine transforms', () => {
		const m = Affine.fromTRS(10, 5, 30, 2, 1.5);
		const n = Affine.fromTRS(-3, 7, -45, 1, 1);
		const mn = m.multiply(n);
		const [x, y] = mn.apply(4, -2);
		const [nx, ny] = n.apply(4, -2);
		const [ex, ey] = m.apply(nx, ny);
		expect(x).toBeCloseTo(ex, 9);
		expect(y).toBeCloseTo(ey, 9);
		const back = m.invert().apply(...m.apply(3, 9));
		expect(back[0]).toBeCloseTo(3, 9);
		expect(back[1]).toBeCloseTo(9, 9);
	});
	it('wraps angles into (-180, 180]', () => {
		expect(wrapDeg(190)).toBe(-170);
		expect(wrapDeg(-180)).toBe(180);
		expect(wrapDeg(540)).toBe(180);
		expect(wrapDeg(-350)).toBe(10);
	});
});

describe('easing', () => {
	it('every named curve starts at 0 and ends at 1', () => {
		for (const [name, f] of Object.entries(EASINGS)) {
			if (name !== 'step') expect(f(0)).toBeCloseTo(0, 6);
			expect(f(1)).toBeCloseTo(1, 6);
		}
	});
	it('cubic bezier matches its control polygon for linear and ease', () => {
		const lin = bezier(0, 0, 1, 1);
		for (const t of [0.1, 0.5, 0.9]) expect(lin(t)).toBeCloseTo(t, 4);
		const ease = easeFn([0.25, 0.1, 0.25, 1]);
		expect(ease(0.5)).toBeCloseTo(0.8024, 3); // CSS "ease" at 50%
	});
});

describe('skeleton', () => {
	it('orders bones parent-first and rejects cycles', () => {
		const ordered = orderBones([bone('c', 'b', 0, 0, 0, 1), bone('b', 'a', 0, 0, 0, 1), bone('a', null, 0, 0, 0, 1)]);
		expect(ordered.map((b) => b.id)).toEqual(['a', 'b', 'c']);
		expect(() => orderBones([bone('a', 'b', 0, 0, 0, 1), bone('b', 'a', 0, 0, 0, 1)])).toThrow(/cycle/);
		expect(() => orderBones([bone('a', 'zz', 0, 0, 0, 1)])).toThrow(/missing parent/);
	});
	it('computes world transforms and identity skins in the setup pose', () => {
		const sk = new Skeleton([bone('a', null, 10, 10, 90, 5), bone('b', 'a', 5, 0, 0, 5)]);
		const seg = sk.segment(1);
		expect(seg.ax).toBeCloseTo(10);
		expect(seg.ay).toBeCloseTo(15);
		expect(seg.by).toBeCloseTo(20);
		for (const m of sk.skin) expect(m.isTranslationOnly()).toBe(true);
		sk.local[0]!.rot = 0;
		sk.update();
		const [x, y] = sk.skin[1]!.apply(10, 20); // old tip of b
		expect(x).toBeCloseTo(20);
		expect(y).toBeCloseTo(10);
	});
	it('accumulates continuous setup angles', () => {
		const sk = new Skeleton([bone('a', null, 0, 0, 170, 5), bone('b', 'a', 5, 0, 30, 5)]);
		expect(sk.setupAngle[1]).toBeCloseTo(200);
	});
});

describe('clips', () => {
	it('samples keys with clamping and easing', () => {
		const keys = [
			{ t: 0, v: 0, e: 'linear' as const },
			{ t: 1, v: 10, e: 'inQuad' as const },
			{ t: 2, v: 20 },
		];
		expect(sampleKeys(keys, -1)).toBe(0);
		expect(sampleKeys(keys, 0.5)).toBeCloseTo(5);
		expect(sampleKeys(keys, 1.5)).toBeCloseTo(12.5);
		expect(sampleKeys(keys, 9)).toBe(20);
	});
	it('time warp stretches phases and stays monotonic', () => {
		const c = clip({}, { duration: 1, phases: { anticipation: [0, 0.4], action: [0.4, 0.5], recovery: [0.5, 1] } });
		const w = new TimeWarp(c, { anticipation: 2, action: 0.5 });
		expect(w.duration).toBeCloseTo(0.8 + 0.05 + 0.5);
		let prev = -1;
		for (let p = 0; p <= w.duration; p += 0.01) {
			const t = w.toClip(p);
			expect(t).toBeGreaterThanOrEqual(prev);
			prev = t;
			expect(w.toPlay(t)).toBeCloseTo(p, 6);
		}
		expect(w.toClip(0.8)).toBeCloseTo(0.4);
	});
	it('offset tracks add to the setup pose; mirroring negates rotation and x', () => {
		const sk = new Skeleton([bone('r', null, 0, 0, 0, 1, 'root'), bone('a', 'r', 0, 0, 90, 10, 'arm')]);
		const c = clip({ arm: { rotate: [{ t: 0, v: 30 }] }, root: { translate: [{ t: 0, x: 0.1, y: 0.2 }] } });
		const out = new Float64Array(sk.size * STRIDE);
		const mask = new Uint8Array(sk.size);
		const ang = new Float64Array(sk.size);
		evaluateClip(c, 0, { skeleton: sk, bodyHeight: 50, mirror: false, intensity: 1 }, out, mask, ang);
		expect(out[STRIDE]).toBeCloseTo(30);
		expect(out[1]).toBeCloseTo(5);
		expect(out[2]).toBeCloseTo(10);
		evaluateClip(c, 0, { skeleton: sk, bodyHeight: 50, mirror: true, intensity: 0.5 }, out, mask, ang);
		expect(out[STRIDE]).toBeCloseTo(-15);
		expect(out[1]).toBeCloseTo(-2.5);
		expect(out[2]).toBeCloseTo(5);
	});
	it('world tracks reach the target angle whatever the rest pose, and sweep continuously', () => {
		for (const rest of [90, 120, -60]) {
			const sk = new Skeleton([bone('t', null, 0, 0, -90, 10, 'torso'), bone('a', 't', 10, 0, rest + 90, 10, 'arm')]);
			const c = clip({ arm: { space: 'world', rotate: [{ t: 0, v: 225 }, { t: 1, v: 405 }] } });
			const out = new Float64Array(sk.size * STRIDE);
			const mask = new Uint8Array(sk.size);
			const ang = new Float64Array(sk.size);
			let prev: number | null = null;
			for (let t = 0; t <= 1.0001; t += 0.05) {
				evaluateClip(c, t, { skeleton: sk, bodyHeight: 50, mirror: false, intensity: 1 }, out, mask, ang);
				const world = ang[1]!;
				expect(wrapDeg(world - (225 + 180 * t))).toBeCloseTo(0, 6);
				if (prev !== null) expect(Math.abs(world - prev)).toBeLessThan(10); // no jumps
				prev = world;
			}
		}
	});
	it('rest keys start and end a world track exactly on the drawn pose, both facings', () => {
		for (const mirror of [false, true]) {
			for (const rest of [90, 170, -150, 300]) {
				const sk = new Skeleton([bone('t', null, 0, 0, -90, 10, 'torso'), bone('a', 't', 10, 0, rest + 90, 10, 'arm')]);
				const c = clip({ arm: { space: 'world', rotate: [{ t: 0, v: 0, rest: true }, { t: 0.5, v: -100 }, { t: 1, v: 0, rest: true }] } });
				const out = new Float64Array(sk.size * STRIDE);
				const mask = new Uint8Array(sk.size);
				const ang = new Float64Array(sk.size);
				const ctx = { skeleton: sk, bodyHeight: 50, mirror, intensity: 1 };
				evaluateClip(c, 0, ctx, out, mask, ang);
				expect(out[STRIDE]).toBeCloseTo(0, 6);
				evaluateClip(c, 1, ctx, out, mask, ang);
				expect(out[STRIDE]).toBeCloseTo(0, 6);
				evaluateClip(c, 0.5, ctx, out, mask, ang);
				expect(wrapDeg(ang[1]! - (mirror ? 280 : -100))).toBeCloseTo(0, 6);
			}
		}
	});
	it('world tracks mirror for left-facing rigs', () => {
		const sk = new Skeleton([bone('a', null, 0, 0, 90, 10, 'arm')]);
		const c = clip({ arm: { space: 'world', rotate: [{ t: 0, v: 0 }] } });
		const out = new Float64Array(STRIDE);
		const ang = new Float64Array(1);
		evaluateClip(c, 0, { skeleton: sk, bodyHeight: 50, mirror: true, intensity: 1 }, out, new Uint8Array(1), ang);
		expect(wrapDeg(ang[0]!)).toBeCloseTo(180);
	});
});

describe('player', () => {
	const sk = () => new Skeleton([bone('r', null, 0, 0, 0, 1, 'root'), bone('a', 'r', 0, 0, 0, 10, 'arm')]);
	const idle = clip({ arm: { rotate: [{ t: 0, v: 0 }, { t: 0.5, v: 10 }, { t: 1, v: 0 }] } }, { id: 'idle', loop: true });
	const hit = clip({ arm: { rotate: [{ t: 0, v: 90 }, { t: 1, v: 90 }] } }, { id: 'hit', duration: 0.5, events: [{ t: 0.25, name: 'contact' }] });

	it('fires events once, on time, and completes', () => {
		const p = new AnimationPlayer(sk(), { bodyHeight: 50, facing: 'right' });
		const fired: string[] = [];
		let done = 0;
		p.play(idle);
		p.play(hit, { mixIn: 0, onEvent: (n) => fired.push(n), onComplete: () => done++ });
		for (let i = 0; i < 6; i++) p.update(0.04);
		expect(fired).toEqual([]);
		p.update(0.04);
		expect(fired).toEqual(['contact']);
		for (let i = 0; i < 20; i++) p.update(0.04);
		expect(fired).toEqual(['contact']);
		expect(done).toBe(1);
	});
	it('layers an action over the base loop and fades back to it', () => {
		const s = sk();
		const p = new AnimationPlayer(s, { bodyHeight: 50, facing: 'right' });
		p.play(idle);
		p.update(0.25);
		expect(s.local[1]!.rot).toBeCloseTo(5);
		p.play(hit, { mixIn: 0, mixOut: 0.1 });
		p.update(0.01);
		expect(s.local[1]!.rot).toBeCloseTo(90);
		expect(p.busy).toBe(true);
		for (let i = 0; i < 40; i++) p.update(0.02);
		expect(p.busy).toBe(false);
		expect(Math.abs(s.local[1]!.rot)).toBeLessThan(11);
	});
	it('crossfades without a jump', () => {
		const s = sk();
		const p = new AnimationPlayer(s, { bodyHeight: 50, facing: 'right' });
		p.play(hit, { track: 1, mixIn: 0 });
		p.update(0.1);
		const before = s.local[1]!.rot;
		const other = clip({ arm: { rotate: [{ t: 0, v: -90 }] } }, { id: 'other' });
		p.play(other, { track: 1, mixIn: 0.2 });
		p.update(0.001);
		expect(Math.abs(s.local[1]!.rot - before)).toBeLessThan(2);
		p.update(0.3);
		expect(s.local[1]!.rot).toBeCloseTo(-90, 3);
	});
	it('fires loop events every cycle', () => {
		const p = new AnimationPlayer(sk(), { bodyHeight: 50, facing: 'right' });
		const fired: string[] = [];
		const loop = clip({ arm: { rotate: [{ t: 0, v: 0 }] } }, { loop: true, events: [{ t: 0.1, name: 'step' }] });
		p.play(loop, { onEvent: (n) => fired.push(n) });
		for (let i = 0; i < 30; i++) p.update(0.1);
		expect(fired.length).toBe(3);
	});
	it('the same seed gives the same variation; variation 0 is exact', () => {
		const a = sk();
		const b = sk();
		const pa = new AnimationPlayer(a, { bodyHeight: 50, facing: 'right' });
		const pb = new AnimationPlayer(b, { bodyHeight: 50, facing: 'right' });
		pa.play(hit, { track: 1, mixIn: 0, seed: 7, variation: 1 });
		pb.play(hit, { track: 1, mixIn: 0, seed: 7, variation: 1 });
		pa.update(0.1);
		pb.update(0.1);
		expect(a.local[1]!.rot).toBe(b.local[1]!.rot);
		expect(a.local[1]!.rot).not.toBeCloseTo(90, 3);
		pa.play(hit, { track: 1, mixIn: 0, variation: 0 });
		pa.update(0.1);
		expect(a.local[1]!.rot).toBeCloseTo(90, 6);
	});
});
