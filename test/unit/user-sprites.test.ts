import { describe, expect, it } from 'vitest';
import { Skeleton } from '../../src/core/skeleton';
import type { TemplateId } from '../../src/core/types';
import { buildRig } from '../../src/rig/build';
import { createRig, rigLabels } from '../../src/rig/document';
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
