// End-to-end test of the Studio with real mouse and keyboard input (headless Chromium, PixiJS 7).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { serve } from './server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
await build({ entryPoints: [new URL('./studio-harness.ts', import.meta.url).pathname], bundle: true, format: 'iife', outfile: OUT + 'studio-harness.js', target: 'es2022', logLevel: 'error' });
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${url}/test/render/studio.html`);
await page.waitForFunction(() => window.harnessReady === true);
let failed = 0;
const check = (ok, label, detail = '') => {
	console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`);
	if (!ok) failed++;
};
const tick = (ms = 120) => page.waitForTimeout(ms);
/** Screen position of a bone's joint (or tip) in the current pose. */
const bonePoint = (id, tip = false) =>
	page.evaluate(
		([id, tip]) => {
			const s = window.studio;
			const sk = s.view.skeleton;
			const i = sk.index.get(id);
			const seg = sk.segment(i);
			const [x, y] = s.viewport.toScreen(tip ? seg.bx : seg.ax, tip ? seg.by : seg.ay);
			const r = s.viewport.app.view.getBoundingClientRect();
			return { x: r.left + x, y: r.top + y };
		},
		[id, tip],
	);
const boneFrame = (id) => page.evaluate((id) => window.studio.rig.bones.find((b) => b.id === id), id);

// 1. import
await page.click('.fusa-empty .fusa-btn.primary');
await page.waitForFunction(() => !!window.studio.rig);
await tick(300);
check(await page.evaluate(() => window.studio.rig.bones.length === 17 && window.studio.rig.parts.length === 16), 'importing a sprite places the humanoid skeleton');

// 2. select in the tree and drag a joint
await page.click('.fusa-node:has-text("Front forearm")');
check(await page.evaluate(() => window.studio.selected === 'arm_lower_front'), 'clicking the tree selects a bone');
const before = await boneFrame('arm_lower_front');
const p = await bonePoint('arm_lower_front');
await page.mouse.move(p.x, p.y);
await page.mouse.down();
await page.mouse.move(p.x + 12, p.y - 8, { steps: 6 });
await page.mouse.up();
await tick();
const after = await boneFrame('arm_lower_front');
check(Math.abs(after.rotation - before.rotation) > 1 || Math.abs(after.length - before.length) > 0.5, 'dragging a joint moves it (bone re-aims to keep its tip)', `rot ${before.rotation.toFixed(1)}→${after.rotation.toFixed(1)}, len ${before.length.toFixed(1)}→${after.length.toFixed(1)}`);

// 3. undo / redo with the keyboard (one undo step for the whole drag)
await page.focus('.fusa-studio');
await page.keyboard.press('Control+z');
await tick();
const undone = await boneFrame('arm_lower_front');
check(Math.abs(undone.rotation - before.rotation) < 1e-6 && Math.abs(undone.length - before.length) < 1e-6, 'Ctrl+Z undoes the whole drag');
await page.keyboard.press('Control+Shift+z');
await tick();
const redone = await boneFrame('arm_lower_front');
check(Math.abs(redone.rotation - after.rotation) < 1e-6, 'Ctrl+Shift+Z redoes it');

// 4. drag a tip: change length
const t0 = await boneFrame('weapon');
await page.click('.fusa-node:has-text("Weapon")');
const tip = await bonePoint('weapon', true);
await page.mouse.move(tip.x, tip.y);
await page.mouse.down();
await page.mouse.move(tip.x + 20, tip.y + 20, { steps: 5 });
await page.mouse.up();
await tick();
check(Math.abs((await boneFrame('weapon')).length - t0.length) > 1, 'dragging a tip changes length and direction');

// 5. rename inline
await page.dblclick('.fusa-node:has-text("Weapon")');
await page.keyboard.press('Control+a');
await page.keyboard.type('Blade');
await page.keyboard.press('Enter');
await tick();
check(await page.evaluate(() => window.studio.rig.bones.find((b) => b.id === 'weapon').name === 'Blade'), 'double-click renames a bone');

// 6. add a bone with the tool, then delete it
const n0 = await page.evaluate(() => window.studio.rig.bones.length);
await page.click('.fusa-viewbar button:has-text("Add bone")');
const head = await bonePoint('head', true);
await page.mouse.move(head.x, head.y + 4);
await page.mouse.down();
await page.mouse.move(head.x + 30, head.y - 10, { steps: 5 });
await page.mouse.up();
await tick();
const n1 = await page.evaluate(() => window.studio.rig.bones.length);
check(n1 === n0 + 1, 'the Add bone tool creates a bone by dragging');
await page.focus('.fusa-studio');
await page.keyboard.press('Delete');
await tick();
check((await page.evaluate(() => window.studio.rig.bones.length)) === n0, 'Delete removes the selected bone');

// 7. reparent from the inspector keeps the bone in place
await page.click('.fusa-node:has-text("Blade")');
const wBefore = await page.evaluate(() => { const sk = window.studio.view.skeleton; return sk.segment(sk.index.get('weapon')); });
await page.selectOption('.fusa-inspector .fusa-field:has-text("Parent") select', 'arm_lower_front');
await tick(250);
const wAfter = await page.evaluate(() => { const sk = window.studio.view.skeleton; return sk.segment(sk.index.get('weapon')); });
check((await boneFrame('weapon')).parent === 'arm_lower_front' && Math.abs(wAfter.ax - wBefore.ax) < 1e-3 && Math.abs(wAfter.by - wBefore.by) < 1e-3, 'changing the parent keeps the bone where it is');

// 8. paint pixels onto a bone, then undo
await page.keyboard.press('2');
await page.click('.fusa-node:has-text("Front upper arm")');
const count = () => page.evaluate(() => { const s = window.studio; const part = s.rig.parts.find((p) => p.bone === 'arm_upper_front'); return s.labels.filter((v) => v === part.label).length; });
const c0 = await count();
const torso = await bonePoint('torso');
await page.mouse.move(torso.x, torso.y - 20);
await page.mouse.down();
await page.mouse.move(torso.x + 15, torso.y - 30, { steps: 8 });
await page.mouse.up();
await tick();
const c1 = await count();
check(c1 > c0, 'brush paints pixels onto the selected bone', `${c0} → ${c1} pixels`);
await page.focus('.fusa-studio');
await page.keyboard.press('Control+z');
await tick();
check((await count()) === c0, 'undo reverts the paint stroke');

// 9. pose: drag a bone and the art moves
await page.keyboard.press('3');
await tick(200);
const pixels = () => page.evaluate(() => Array.from(window.studio.viewport.app.renderer.extract.pixels(window.studio.view.renderTexture)).reduce((h, v, i) => (h * 31 + v * (i % 7 + 1)) >>> 0, 7));
const restHash = await pixels();
const arm = await bonePoint('arm_upper_front', true);
const sh = await bonePoint('arm_upper_front');
await page.mouse.move(arm.x, arm.y);
await page.mouse.down();
await page.mouse.move(sh.x + (sh.y - arm.y), sh.y + (arm.x - sh.x), { steps: 8 });
await page.mouse.up();
await tick(200);
check((await pixels()) !== restHash, 'Pose mode: dragging a limb moves the art');
await page.click('.fusa-viewbar button:has-text("Reset pose")');
await tick(200);
check((await pixels()) === restHash, 'Reset pose returns to the exact rest image');

// 10. animate: pick the sword slash, events fire
await page.click('.fusa-card:has-text("Sword slash")');
await tick(1300);
const anim = await page.evaluate(() => ({ mode: window.studio.mode, playing: window.studio.playing, status: document.querySelector('.fusa-status').textContent }));
check(anim.mode === 'animate' && /release|contact|recover|end/.test(anim.status), 'clicking an animation plays it in Animate mode', anim.status.slice(-30));
await page.screenshot({ path: OUT + 'studio_e2e_animate.png' });

// 11. save, change, reopen
await page.focus('.fusa-studio');
await page.keyboard.press('Control+s');
await tick(200);
check((await page.evaluate(() => window.store.size)) === 1, 'Ctrl+S saves the rig');
await page.fill('.fusa-name', 'Renamed');
await page.press('.fusa-name', 'Enter');
await page.click('.fusa-head button[title="Open a saved rig"]');
await page.click('.fusa-rig-item');
await tick(400);
check((await page.evaluate(() => window.studio.rig.name)) === 'warrior', 'opening the saved rig restores it', await page.evaluate(() => window.studio.rig.name));

// 12. export and import a bundle
await page.click('.fusa-head button[title^="Export"]');
await tick(300);
const bundle = await page.evaluate(() => window.lastDownload);
check(!!bundle && JSON.parse(bundle.text).format === 'fusa-bundle' && JSON.parse(bundle.text).image.startsWith('data:image/png'), 'export writes one file with the rig and its image', bundle?.name);
await page.evaluate((t) => (window.nextFile = t), bundle.text);
await page.click('.fusa-head button[title^="Import"]');
await tick(500);
check((await page.evaluate(() => window.studio.rig.bones.find((b) => b.id === 'weapon')?.name)) === 'Blade', 'importing the bundle restores the rig');

// 13. Phase 3: a sprite on a white background, the automatic rig proposal, the Hidden tool
await page.evaluate(() => window.setNextImage('../sprites/swordsman_white.png'));
await page.click('.fusa-head button[title="New rig from a sprite"]');
await page.waitForFunction(() => window.studio.rig?.name === 'swordsman_white', null, { timeout: 10000 });
await tick(300);
check(await page.evaluate(() => window.studio.rig.image.src.startsWith('data:image/png') && window.log.some((l) => l.includes('Solid background') === false)), 'a solid white background is replaced by a transparent copy');
const banner = await page.evaluate(() => document.querySelector('.fusa-banner.show')?.textContent ?? '');
const facingShown = await page.evaluate(() => document.querySelector('.fusa-banner.show .fusa-faces button.active')?.textContent ?? '');
check(/Automatic rig/.test(banner) && /Left/.test(facingShown), 'the automatic rig is offered with what it found', `${banner.slice(0, 40)} · faces ${facingShown}`);
// the facing switch on the banner rebuilds the skeleton facing the other way
await page.evaluate(() => [...document.querySelectorAll('.fusa-banner.show .fusa-faces button')].find((b) => /Right/.test(b.textContent))?.click());
await tick(400);
check(await page.evaluate(() => window.studio.rig.facing === 'right' && document.querySelector('.fusa-banner.show .fusa-faces button.active')?.textContent.includes('Right')), 'one click on the banner flips the facing and rebuilds the skeleton');
await page.evaluate(() => [...document.querySelectorAll('.fusa-banner.show .fusa-faces button')].find((b) => /Left/.test(b.textContent))?.click());
await tick(400);
const weaponAuto = await page.evaluate(() => JSON.stringify(window.studio.rig.bones.find((b) => b.id === 'weapon')));
await page.click('.fusa-banner button:has-text("Use proportions instead")');
await tick(200);
check(/Rig from proportions/.test(await page.evaluate(() => document.querySelector('.fusa-banner.show')?.textContent ?? '')), '"Use proportions instead" swaps in the template rig');
await page.click('.fusa-banner button:has-text("Discard")');
await tick(200);
check((await page.evaluate(() => JSON.stringify(window.studio.rig.bones.find((b) => b.id === 'weapon')))) === weaponAuto && !(await page.$('.fusa-banner.show')), 'Discard goes back to the previous rig');
await page.click('.fusa-toolrow .tool-auto');
await tick(200);
await page.click('.fusa-banner button:has-text("Keep")');
check(!(await page.$('.fusa-banner.show')), 'Keep accepts a re-run auto-rig');
await page.focus('.fusa-studio');
await page.keyboard.press('2');
await page.click('.fusa-node:has-text("Torso")');
await page.click('.fusa-viewbar button:has-text("Hidden")');
const ta = await bonePoint('torso');
await page.mouse.move(ta.x, ta.y);
await page.mouse.down();
await page.mouse.move(ta.x + 40, ta.y + 10, { steps: 8 });
await page.mouse.up();
await tick(200);
check(await page.evaluate(() => typeof window.studio.rig.fillHints === 'string' && window.studio.rig.fillHints.length > 0), 'the Hidden tool records where a part extends under others');

// 14. teardown
await page.evaluate(() => window.studio.destroy());
check(errors.length === 0, 'no page errors', errors.join(' | '));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
