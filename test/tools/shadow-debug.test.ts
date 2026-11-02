import { it } from 'vitest';
import { detectShadow } from '../../src/sprite/shadow';
import { SPRITES, readPng, spritePath } from '../unit/png';
// Dev tool: which sprites get a ground shadow and how big it is.
it('shadows', () => {
	const user = ['sword_blue_blade', 'summoner_staff', 'greatsword_red_coat', 'brawler_ball', 'mage_dress_moogle', 'thief_bracers', 'beast_spear', 'chronomancer', 'dragon_green', 'spectral_wolf', 'wraith'].map((n) => `user/${n}`);
	for (const n of [...SPRITES, ...user]) {
		const img = readPng(spritePath(n));
		const s = detectShadow(img);
		let k = 0;
		if (s) for (const v of s) k += v;
		console.log(`S ${n}: ${s ? `${k} px` : 'none'}`);
	}
});
