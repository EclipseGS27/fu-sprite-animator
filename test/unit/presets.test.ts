import { describe, expect, it } from 'vitest';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton } from '../../src/core/skeleton';
import type { ClipDocument } from '../../src/core/types';
import { getClip, listClips, registerClip, unregisterClip } from '../../src/presets';
import { createRig } from '../../src/rig/document';
import { readPng, spritePath } from './png';

describe('preset library', () => {
	it('has the Phase 2 clips with phases and events', () => {
		for (const id of ['idle-breathing', 'combat-stance', 'sword-slash', 'heavy-slash', 'magic-cast', 'light-hit', 'heavy-hit']) {
			const c = getClip(id);
			expect(c, id).toBeDefined();
			if (!c!.loop) {
				expect(c!.events?.some((e) => e.name === 'end')).toBe(true);
				expect(c!.phases).toBeDefined();
			}
		}
	});
	it('every clip keeps its keys in time order and inside its duration', () => {
		for (const c of listClips()) {
			for (const track of Object.values(c.tracks)) {
				for (const keys of [track.rotate, track.translate, track.scale]) {
					if (!keys) continue;
					for (let i = 0; i < keys.length; i++) {
						expect(keys[i]!.t).toBeGreaterThanOrEqual(0);
						expect(keys[i]!.t).toBeLessThanOrEqual(c.duration + 1e-9);
						if (i) expect(keys[i]!.t).toBeGreaterThanOrEqual(keys[i - 1]!.t);
					}
				}
			}
		}
	});
	it('registering validates and can override a built-in', () => {
		expect(() => registerClip({ format: 'fusa-clip', version: 1, id: 'x', name: 'x', category: 'other', duration: 0, loop: false, tracks: {} } as ClipDocument)).toThrow();
		const custom: ClipDocument = { ...getClip('sword-slash')!, name: 'World slash' };
		registerClip(custom);
		expect(getClip('sword-slash')!.name).toBe('World slash');
		unregisterClip('sword-slash');
		expect(getClip('sword-slash')!.name).toBe('Sword slash');
	});
});

describe('clips on every test rig', () => {
	const cases = [
		['warrior', 'humanoid', 'right'],
		['warrior', 'humanoid', 'left'],
		['tiny', 'humanoid', 'right'],
		['wolf', 'custom', 'right'],
		['slime', 'custom', 'left'],
		['wolf', 'quadruped', 'right'],
		['dragon', 'winged', 'left'],
		['ghost', 'floating', 'right'],
		['slime', 'blob', 'right'],
		['wolf', 'serpentine', 'right'],
	] as const;
	it.each(cases)('%s (%s, facing %s) plays every clip with finite poses', (name, template, facing) => {
		const image = readPng(spritePath(name));
		const rig = createRig({ name, src: name, image, template, facing });
		const sk = new Skeleton(rig.bones);
		const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing });
		p.play(getClip('idle-breathing')!);
		for (const c of listClips()) {
			p.play(c, { variation: 1 });
			for (let t = 0; t < c.duration + 0.5; t += 1 / 30) {
				p.update(1 / 30);
				for (const m of sk.skin) for (const v of [m.a, m.b, m.c, m.d, m.tx, m.ty]) expect(Number.isFinite(v)).toBe(true);
			}
		}
	}, 30000);
	it('a left-facing rig mirrors the slash (the blade ends on the other side)', () => {
		const image = readPng(spritePath('warrior'));
		const tipAtImpact = (facing: 'left' | 'right') => {
			const rig = createRig({ name: 'w', src: 'w', image, template: 'humanoid', facing: 'right' });
			if (facing === 'left') rig.facing = 'left';
			const sk = new Skeleton(rig.bones);
			const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing });
			p.play(getClip('sword-slash')!, { mixIn: 0 });
			p.update(0.46);
			return sk.world[sk.roles.get('weapon')!]!.angle();
		};
		const r = tipAtImpact('right');
		const l = tipAtImpact('left');
		// pointing forward-down for a right-facing rig; mirrored (≈180° − angle) when facing left
		expect(Math.cos((r * Math.PI) / 180)).toBeGreaterThan(0.3);
		expect(Math.cos((l * Math.PI) / 180)).toBeLessThan(-0.3);
	});
});
