// End-to-end test of the animation editor (Phase 4) with real mouse and keyboard input.
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
const tick = (ms = 150) => page.waitForTimeout(ms);
const bonePoint = (id, tip = false) =>
	page.evaluate(([id, tip]) => {
		const s = window.studio;
		const sk = s.view.skeleton;
		const seg = sk.segment(sk.index.get(id));
		const [x, y] = s.viewport.toScreen(tip ? seg.bx : seg.ax, tip ? seg.by : seg.ay);
		const r = s.viewport.app.view.getBoundingClientRect();
		return { x: r.left + x, y: r.top + y };
	}, [id, tip]);
const clip = () => page.evaluate(() => JSON.parse(JSON.stringify(window.studio['editClip']())));
const seekTo = async (t) => {
	const box = await page.locator('.fusa-timeline canvas').boundingBox();
	const dur = await page.evaluate(() => window.studio['timeline'].duration);
	await page.mouse.click(box.x + 66 + ((box.width - 66 - 12) * t) / dur, box.y + 8);
	await tick();
};

await page.click('.fusa-empty .fusa-btn.primary');
await page.waitForFunction(() => !!window.studio.rig);
await page.click('.fusa-banner button:has-text("Keep")').catch(() => {});
await page.click('.fusa-card[data-clip="sword-slash"]');
await tick(300);
await page.click('.fusa-transport button:has-text("Edit keys")');
await tick(300);
const c0 = await clip();
check(!!c0 && c0.id.startsWith('sword-slash-custom') && (await page.evaluate(() => window.clips.size)) === 1, 'editing a built-in animation edits a saved copy', c0?.id);
check(await page.evaluate(() => window.studio.editing && !window.studio.playing), 'edit mode pauses playback');

// pose a bone at 0.2 s: a key appears there
await page.click('.fusa-node:has-text("Front forearm")');
await seekTo(0.2);
const t0 = await page.evaluate(() => window.studio['actionTime']);
const p = await bonePoint('arm_lower_front', true);
const o = await bonePoint('arm_lower_front');
await page.mouse.move(p.x, p.y);
await page.mouse.down();
await page.mouse.move(o.x + (o.y - p.y), o.y - (o.x - p.x), { steps: 6 });
await page.mouse.up();
await tick(200);
let c = await clip();
const k = c.tracks['arm.lower.front'].rotate.find((x) => Math.abs(x.t - Math.round(t0 * 1000) / 1000) < 1e-3);
check(!!k, 'dragging a bone sets a turn key at the play head', `t=${t0.toFixed(3)} v=${k?.v}`);

// select the key on the timeline, change its easing, delete it, undo
const rowsBox = await page.locator('.fusa-timeline canvas').boundingBox();
const dur = await page.evaluate(() => window.studio['timeline'].duration);
await page.mouse.click(rowsBox.x + 66 + ((rowsBox.width - 78) * k.t) / dur, rowsBox.y + 18 + 12 + 4 + 7);
await tick(200);
check(await page.evaluate(() => window.studio['selectedKey']?.channel === 'rotate'), 'clicking a diamond on the timeline selects the key');
await page.selectOption('.fusa-inspector .fusa-field:has-text("Easing") select', 'outBack');
await tick(150);
c = await clip();
check(c.tracks['arm.lower.front'].rotate.some((x) => Math.abs(x.t - k.t) < 1e-3 && x.e === 'outBack'), 'the key’s easing can be changed');
const n1 = c.tracks['arm.lower.front'].rotate.length;
await page.focus('.fusa-studio');
await page.keyboard.press('Delete');
await tick(150);
check((await clip()).tracks['arm.lower.front'].rotate.length === n1 - 1, 'Delete removes the selected key');
await page.keyboard.press('Control+z');
await tick(150);
check((await clip()).tracks['arm.lower.front'].rotate.length === n1, 'Ctrl+Z brings the key back');

// IK: ctrl-drag the forearm tip keys both arm bones
await seekTo(0.6);
const t1 = await page.evaluate(() => Math.round(window.studio['actionTime'] * 1000) / 1000);
const tip = await bonePoint('arm_lower_front', true);
await page.keyboard.down('Control');
await page.mouse.move(tip.x, tip.y);
await page.mouse.down();
await page.mouse.move(tip.x + 25, tip.y - 25, { steps: 6 });
await page.mouse.up();
await page.keyboard.up('Control');
await tick(200);
c = await clip();
const at = (role) => (c.tracks[role]?.rotate ?? []).some((x) => Math.abs(x.t - t1) < 1e-3);
check(at('arm.upper.front') && at('arm.lower.front'), 'Ctrl-drag (IK) keys the upper arm and the forearm together');

// draw order, events, length
await page.selectOption('.fusa-inspector .fusa-field:has-text("Draw from here") select', 'behind:head');
await tick(150);
check(((await clip()).tracks['arm.lower.front'].layer ?? []).some((x) => x.behind === 'head'), 'a bone can be drawn behind another from the play head');
await page.fill('.fusa-inspector .fusa-row input[placeholder="contact"]', 'flash');
await page.click('.fusa-inspector button:has-text("Add at play head")');
await tick(150);
check((await clip()).events.some((e) => e.name === 'flash'), 'events can be added at the play head');
await page.fill('.fusa-inspector .fusa-field:has-text("Length") input', '1.2');
await page.press('.fusa-inspector .fusa-field:has-text("Length") input', 'Enter');
await tick(150);
check((await clip()).duration === 1.2, 'the animation length can be changed');
await page.waitForTimeout(1500);
check(await page.evaluate((id) => window.clips.get(id)?.duration === 1.2, (await clip()).id), 'edits are saved to the world (after a short pause)');

// ghosts
await page.click('.fusa-transport button:has-text("Ghosts")');
await tick(300);
check((await page.evaluate(() => window.studio.viewport['ghostSprites'].length)) === 2, 'Ghosts shows the frames before and after the play head');
await page.screenshot({ path: OUT + 'studio_editor.png' });

// library: duplicate, delete, export, import
await page.click('.fusa-transport button:has-text("Editing keys")');
await tick(200);
const before = await page.evaluate(() => window.studio.clipId);
await page.click('.fusa-lib-actions button[title^="Duplicate"]');
await tick(200);
const dup = await page.evaluate(() => window.studio.clipId);
check(dup !== before && dup.endsWith('-copy'), 'Duplicate makes a new animation', dup);
await page.click('.fusa-lib-actions button[title^="Delete"]');
await tick(200);
check(await page.evaluate((id) => !window.clips.has(id), dup), 'Delete removes your animation');
await page.click('.fusa-card[data-clip="heavy-slash"]');
await page.click('.fusa-lib-actions button[title^="Delete"]');
await tick(150);
check(await page.evaluate(() => window.log.at(-1).includes('cannot be deleted')), 'built-in animations cannot be deleted');
await page.click('.fusa-lib-actions button[title^="Export"]');
await tick(150);
const exported = await page.evaluate(() => window.lastDownload);
check(exported?.name === 'heavy-slash.fusa-clip.json', 'Export writes the animation as JSON');
await page.evaluate((t) => (window.nextFile = t), exported.text);
await page.click('.fusa-lib-actions button[title^="Import"]');
await tick(200);
const imported = await page.evaluate(() => window.studio.clipId);
check(imported !== 'heavy-slash' && imported.startsWith('heavy-slash') && (await page.evaluate((id) => window.clips.has(id), imported)), 'Import adds the file as a new animation (never silently replaces one)', imported);

check(errors.length === 0, 'no page errors', errors.join(' | '));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
