import { describe, expect, it } from 'vitest';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton } from '../../src/core/skeleton';
import type { TemplateId } from '../../src/core/types';
import { describeItem } from '../../src/mapping/projectfu';
import { pickPlayable, resolveClip, resolveReaction } from '../../src/mapping';
import { defaultIdleFor, getClip, listClips } from '../../src/presets';
import { CREATURE_CLIPS } from '../../src/presets/creatures';
import { createRig, lastReport } from '../../src/rig/document';
import { TEMPLATES, TEMPLATE_LIST } from '../../src/rig/templates';
import { detectBeast } from '../../src/sprite/creatures';
import type { ImageDataLike } from '../../src/sprite/image';
import { mainBounds } from '../../src/sprite/morph';
import { assignmentAccuracy } from './groundtruth';
import { readPng, spritePath } from './png';

const flip = (img: ImageDataLike): ImageDataLike => {
	const out = new Uint8ClampedArray(img.data.length);
	for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) out.set(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4), (y * img.width + img.width - 1 - x) * 4);
	return { width: img.width, height: img.height, data: out };
};

describe('creature templates', () => {
	it('every template has unique bone ids, valid parents and a part per draw-order entry', () => {
		for (const t of TEMPLATE_LIST) {
			const ids = new Set(t.bones.map((b) => b.id));
			expect(ids.size, t.id).toBe(t.bones.length);
			for (const b of t.bones) if (b.parent) expect(ids.has(b.parent), `${t.id}: ${b.id}`).toBe(true);
			for (const id of t.drawOrder) expect(t.bones.find((b) => b.id === id)?.part, `${t.id}: ${id}`).toBeDefined();
			expect(t.bones.filter((b) => b.part).length, t.id).toBe(t.drawOrder.length);
		}
	});

	it('each template’s own idle plays on it, and so does at least one clip of every family it needs', () => {
		for (const t of TEMPLATE_LIST) {
			const roles = new Set(t.bones.map((b) => b.role));
			const fits = (id: string) => (getClip(id)?.requires ?? []).every((r) => roles.has(r));
			const idle = defaultIdleFor(t.id);
			expect(getClip(idle), `${t.id} idle`).toBeDefined();
			expect(fits(idle), `${t.id} idle ${idle}`).toBe(true);
			for (const family of ['attack', 'magic', 'react:hit', 'react:defeat']) {
				const r = family.startsWith('react') ? resolveReaction({ result: 'hit', defeated: family === 'react:defeat' }, { template: t.id }) : resolveClip({ kind: family === 'attack' ? 'basic' : 'spell', name: 'x', key: null, offensive: true }, { template: t.id });
				expect(pickPlayable(r.candidates, fits), `${t.id} ${family}`).toBeTruthy();
			}
		}
	});

	it('every creature clip can play on at least one template', () => {
		for (const c of CREATURE_CLIPS) {
			const ok = TEMPLATE_LIST.some((t) => (c.requires ?? []).every((r) => t.bones.some((b) => b.role === r)));
			expect(ok, c.id).toBe(true);
		}
	});

	it('floating effects do not stretch a creature template', () => {
		const img = readPng(spritePath('ghost'));
		const b = mainBounds(img)!;
		// the ghost's sparks sit well outside its body; its body box is narrower than the sparks' spread
		let minX = img.width;
		let maxX = 0;
		for (let i = 0; i < img.width * img.height; i++) if (img.data[i * 4 + 3]) ((minX = Math.min(minX, i % img.width)), (maxX = Math.max(maxX, i % img.width)));
		expect(b.width).toBeLessThan(maxX - minX + 1);
	});
});

describe('beast landmarks', () => {
	it('wolf: legs, belly, head in front, tail behind', () => {
		const L = detectBeast(readPng(spritePath('wolf')), 'auto')!;
		expect(L).not.toBeNull();
		expect(L.facing).toBe('right');
		expect(L.head.tip[0]).toBeGreaterThan(L.shoulder[0]);
		expect(L.tail).not.toBeNull();
		expect(L.tail!.tip[0]).toBeLessThan(L.hip[0]);
		expect(L.legs.hindNear.foot[0]).toBeLessThan(L.legs.frontNear.foot[0]);
		expect(L.belly).toBeGreaterThan(L.box.y + L.box.height * 0.5);
	});

	it('dragon: wings are the high tips, not the head; facing is not fooled by the big wing', () => {
		const L = detectBeast(readPng(spritePath('dragon')), 'auto', { wings: true })!;
		expect(L.facing).toBe('right');
		expect(L.wings).not.toBeNull();
		for (const wtip of [L.wings!.near.tip, L.wings!.far.tip]) expect(wtip[1]).toBeLessThan(L.head.tip[1]);
		expect(L.head.tip[0]).toBeGreaterThan(L.shoulder[0]);
	});

	it('mirrored sprites face left', () => {
		for (const [name, wings] of [['wolf', false], ['dragon', true]] as const) {
			const L = detectBeast(flip(readPng(spritePath(name))), 'auto', { wings })!;
			expect(L.facing, name).toBe('left');
		}
	});

	it('sprites without legs give no beast landmarks (they use proportions)', () => {
		expect(detectBeast(readPng(spritePath('slime')))).toBeNull();
		expect(detectBeast(readPng(spritePath('ghost')))).toBeNull();
	});
});

describe('creature rigs', () => {
	// measured: wolf 69.7, dragon 75.6, ghost 83.4, slime 97.2 (% of pixels on the right part)
	const cases: [string, TemplateId, number][] = [
		['wolf', 'quadruped', 0.66],
		['dragon', 'winged', 0.72],
		['ghost', 'floating', 0.8],
		['slime', 'blob', 0.94],
	];
	it.each(cases)('%s (%s) is rigged above its accuracy floor', (name, template, floor) => {
		const image = readPng(spritePath(name));
		const rig = createRig({ name, src: name, image, template });
		expect(assignmentAccuracy(name, rig, image)).toBeGreaterThan(floor);
	});

	it('landmarks beat proportions for the beasts', () => {
		for (const [name, template] of [['wolf', 'quadruped'], ['dragon', 'winged']] as const) {
			const image = readPng(spritePath(name));
			const found = createRig({ name, src: name, image, template });
			const plain = createRig({ name, src: name, image, template, detect: false });
			expect(lastReport.get(found)!.method, name).toBe('landmarks');
			expect(assignmentAccuracy(name, found, image), name).toBeGreaterThan(assignmentAccuracy(name, plain, image) + 0.03);
		}
	});

	it('a left-facing beast gets a left-facing rig whose clips mirror', () => {
		const image = flip(readPng(spritePath('wolf')));
		const rig = createRig({ name: 'w', src: 'w', image, template: 'quadruped' });
		expect(rig.facing).toBe('left');
		const sk = new Skeleton(rig.bones);
		const head = sk.roles.get('head')!;
		const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
		const x0 = sk.world[head]!.tx;
		p.play(getClip('bite')!, { mixIn: 0, variation: 0 });
		p.update(0.4); // contact: lunged forward = to the left
		expect(sk.world[head]!.tx).toBeLessThan(x0 - 2);
	});
});

describe('creature mapping', () => {
	const claws = describeItem({ type: 'basic', name: 'Claws', system: { type: { value: 'melee' } } });
	const fire = describeItem({ type: 'spell', name: 'Flare', system: { isOffensive: { value: true } } });
	it('each template gets its own animations by default', () => {
		expect(resolveClip(claws, { template: 'quadruped' }).clip).toBe('bite');
		expect(resolveClip(fire, { template: 'quadruped' }).clip).toBe('roar');
		expect(resolveClip(fire, { template: 'winged' }).clip).toBe('breath');
		expect(resolveClip(claws, { template: 'blob' }).clip).toBe('blob-attack');
		expect(resolveClip(claws, { template: 'humanoid' }).clip).toBe('sword-slash');
		expect(resolveReaction({ result: 'hit' }, { template: 'quadruped' }).clip).toBe('beast-hit');
		expect(resolveReaction({ result: 'hit', defeated: true }, { template: 'blob' }).clip).toBe('blob-defeat');
		expect(resolveReaction({ result: 'hit', defeated: true }, { template: 'floating' }).clip).toBe('float-defeat');
	});
	it('a world choice still wins over a template default', () => {
		expect(resolveClip(claws, { template: 'quadruped', world: { rules: { 'basic:melee': 'claw' }, abilities: {} } }).clip).toBe('claw');
	});
	it('a custom rig with only a root still plays something', () => {
		const rootOnly = (id: string) => (getClip(id)?.requires ?? []).every((r) => r === 'root');
		expect(pickPlayable(resolveClip(claws, { template: 'custom' }).candidates, rootOnly)).toBe('generic-attack');
		expect(pickPlayable(resolveClip(fire, { template: 'custom' }).candidates, rootOnly)).toBe('generic-cast');
		expect(pickPlayable(resolveReaction({ result: 'miss' }, { template: 'custom' }).candidates, rootOnly)).toBe('generic-dodge');
		expect(pickPlayable(resolveReaction({ result: 'hit', defeated: true }, { template: 'custom' }).candidates, rootOnly)).toBe('generic-defeat');
	});
	it('all clips are listed once', () => {
		const ids = listClips().map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(Object.keys(TEMPLATES).length).toBe(7);
	});
});
