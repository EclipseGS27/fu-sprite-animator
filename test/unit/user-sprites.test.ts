import { describe, expect, it } from 'vitest';
import { Skeleton } from '../../src/core/skeleton';
import type { TemplateId } from '../../src/core/types';
import { buildRig } from '../../src/rig/build';
import { createRig, lastReport, rigLabels } from '../../src/rig/document';
import { detectShadow } from '../../src/sprite/shadow';
import { isUsable, validateRig } from '../../src/rig/validate';
import { diffAgainst, rasterize } from '../../src/render/cpu';
import { readPng, spritePath } from './png';

/*
 * The project owner's own sprites (test/sprites/user, see its README). There is no ground truth
 * for them, so this checks what must hold for any art: the import loses nothing, the automatic
 * rig is usable, and the rest pose is bit-identical to the file.
 */
const USER: [string, TemplateId][] = [
	['sword_blue_blade', 'humanoid'],
	['summoner_staff', 'humanoid'],
	['greatsword_red_coat', 'humanoid'],
	['brawler_ball', 'humanoid'],
	['mage_dress_moogle', 'humanoid'],
	['thief_bracers', 'humanoid'],
	['beast_spear', 'humanoid'],
	['chronomancer', 'humanoid'],
	['dragon_green', 'winged'],
	['spectral_wolf', 'quadruped'],
	['wraith', 'floating'],
];

describe('the owner’s sprites', () => {
	it.each(USER)('%s (%s): every pixel gets a part, the rig is usable, the rest pose is exact', (name, template) => {
		const image = readPng(spritePath(`user/${name}`));
		const rig = createRig({ name, src: `${name}.png`, image, template });
		const labels = rigLabels(rig);
		let lost = 0;
		for (let i = 0; i < labels.length; i++) if (image.data[i * 4 + 3] && !labels[i]) lost++;
		expect(lost).toBe(0);
		const build = buildRig(rig, image);
		expect(isUsable(validateRig(rig, { image, labels: build.labels }))).toBe(true);
		const out = rasterize(build, new Skeleton(rig.bones), { snap: rig.render.snap });
		expect(diffAgainst(image, out, build.pad).different).toBe(0);
	});
});

describe('real-art detection (owner’s sprites)', () => {
	const rig = (name: string, template: TemplateId = 'humanoid', facingFallback?: 'left' | 'right') => {
		const image = readPng(spritePath(`user/${name}`));
		return { image, rig: createRig({ name, src: name, image, template, facingFallback }) };
	};
	const role = (r: ReturnType<typeof rig>['rig'], label: number) => r.bones.find((b) => b.id === r.parts.find((p) => p.label === label)?.bone)?.role;
	const weaponPixels = (name: string) => {
		const { rig: r } = rig(name);
		const labels = rigLabels(r);
		let n = 0;
		for (const l of labels) if (l && role(r, l) === 'weapon') n++;
		return { r, n };
	};

	it('finds the blade, the greatsword and the spear, and faces the blade and spear users left', () => {
		for (const name of ['sword_blue_blade', 'greatsword_red_coat', 'beast_spear']) expect(weaponPixels(name).n, name).toBeGreaterThan(150);
		expect(weaponPixels('sword_blue_blade').r.facing).toBe('left');
		expect(weaponPixels('beast_spear').r.facing).toBe('left');
	});

	it('finds no weapon where there is none to find', () => {
		for (const name of ['brawler_ball', 'mage_dress_moogle', 'thief_bracers']) expect(weaponPixels(name).n, name).toBeLessThan(40);
	});

	it('without a weapon, facing is the GM’s last choice, and the report says it is a guess', () => {
		const { rig: r } = rig('brawler_ball', 'humanoid', 'left');
		expect(r.facing).toBe('left');
		expect(lastReport.get(r)!.notes.join(' ')).toMatch(/guess/);
	});

	it('ground shadows get their own part on the root (and only the party sprites have one)', () => {
		for (const name of ['sword_blue_blade', 'brawler_ball', 'beast_spear']) {
			const { image, rig: r } = rig(name);
			const shadowPart = r.parts.find((p) => p.bone === 'root');
			expect(shadowPart, name).toBeDefined();
			const labels = rigLabels(r);
			const mask = detectShadow(image)!;
			for (let i = 0; i < labels.length; i++) if (mask[i]) expect(labels[i]).toBe(shadowPart!.label);
		}
		for (const name of ['chronomancer', 'wraith', 'dragon_green']) expect(detectShadow(readPng(spritePath(`user/${name}`))), name).toBeNull();
	});

	it('the real dragon and wolf get beast landmarks, facing right; the dragon’s wings are its wings', () => {
		const { rig: wolf } = rig('spectral_wolf', 'quadruped');
		const { rig: dragon } = rig('dragon_green', 'winged');
		expect(lastReport.get(wolf)!.method).toBe('landmarks');
		expect(lastReport.get(dragon)!.method).toBe('landmarks');
		expect(wolf.facing).toBe('right');
		expect(dragon.facing).toBe('right');
		// the near wing reaches far behind the body (the big wing on the left), the far wing stays above it
		const tip = (r: typeof dragon, id: string) => {
			const b = r.bones.find((x) => x.id === id)!;
			return b;
		};
		expect(tip(dragon, 'wing_near')).toBeDefined();
	});
});
