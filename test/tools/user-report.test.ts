import { it } from 'vitest';
import { createRig, lastReport } from '../../src/rig/document';
import type { TemplateId } from '../../src/core/types';
import { readPng, spritePath } from '../unit/png';
// Dev tool: what the automatic rig says about each of the owner's sprites.
it('user sprites report', () => {
	const list: [string, TemplateId][] = [['sword_blue_blade', 'humanoid'], ['summoner_staff', 'humanoid'], ['greatsword_red_coat', 'humanoid'], ['brawler_ball', 'humanoid'], ['mage_dress_moogle', 'humanoid'], ['thief_bracers', 'humanoid'], ['beast_spear', 'humanoid'], ['chronomancer', 'humanoid'], ['dragon_green', 'winged'], ['spectral_wolf', 'quadruped'], ['wraith', 'floating']];
	for (const [n, t] of list) {
		const image = readPng(spritePath(`user/${n}`));
		const t0 = performance.now();
		const rig = createRig({ name: n, src: n, image, template: t });
		const ms = performance.now() - t0;
		const r = lastReport.get(rig)!;
		console.log(`U ${n} | ${image.width}x${image.height} | ${rig.render.mode} | faces ${rig.facing} | ${r.method} | ${Math.round(ms)} ms | ${r.notes.join(' / ')}`);
	}
});
