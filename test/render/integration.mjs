// Exercise the built module against the Foundry mock: init/ready hooks, Studio window, saving a
// rig to world storage, assigning it to an actor, token texture swap, API play, socket, self-test.
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { serve } from './server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${url}/test/render/foundry-mock.html`);
await page.waitForFunction(() => window.mockReady === true, null, { timeout: 15000 });
let failed = 0;
const check = (ok, label, detail = '') => {
	console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`);
	if (!ok) failed++;
};

const r = await page.evaluate(async () => {
	const out = {};
	Hooks.callAll('init');
	Hooks.callAll('ready');
	const api = game.modules.get('fu-sprite-animator').api;
	out.api = !!api && typeof api.play === 'function' && window.SpriteAnimator === api;
	// scene controls (v13 record shape)
	const controls = { tokens: { tools: {} } };
	Hooks.callAll('getSceneControlButtons', controls);
	out.control = !!controls.tokens.tools.fusaStudio;
	// a token on the map
	const actor = mockMakeActor('a1', 'Warrior');
	const token = await mockMakeToken('t1', actor, '../sprites/warrior.png', 300, 250, 256);
	Hooks.callAll('canvasReady', canvas);
	out.sizeBefore = [token.mesh.width, token.mesh.height];
	// Studio: new rig from the sprite, save it
	const app = await api.openStudio();
	await app.studio.newFromImage('../sprites/warrior.png', 'Warrior');
	out.saved = await app.studio.save();
	const rigs = api.rigs();
	out.rigs = rigs.length;
	out.file = [...mockFiles.keys()][0];
	// assign to the actor (what the Assign dialog does)
	await api.setProfile(actor, { rig: rigs[0].id, enabled: true, idle: 'combat-stance' });
	await new Promise((r) => setTimeout(r, 600));
	out.animated = api.isAnimated(actor);
	out.swapped = token.mesh.texture !== token.texture;
	out.sizeAfter = [token.mesh.width, token.mesh.height];
	// play an attack (broadcast to other clients through the socket)
	out.played = await api.play(actor, 'sword-slash');
	out.socket = game.socket.emitted.length === 1 && game.socket.emitted[0][1].clip === 'sword-slash';
	const events = [];
	Hooks.on('fu-sprite-animator.event', (e) => events.push(e.event));
	await new Promise((r) => setTimeout(r, 1500));
	out.events = events;
	// a message from another client plays too
	game.socket.handler({ type: 'play', scene: 'scene-1', tokens: ['t1'], clip: 'light-hit', opts: {} });
	await new Promise((r) => setTimeout(r, 200));
	// the self-test (PIXI.Sprite stands in for PrimarySpriteMesh here)
	out.selftest = await api.selfTest();
	// turning the profile off gives the token its own image back
	await api.setProfile(actor, null);
	await new Promise((r) => setTimeout(r, 100));
	out.restored = token.mesh.texture === token.texture && !api.isAnimated(actor);
	await app.close();
	out.closed = !foundry.applications.instances.get('fusa-studio');
	out.log = mockLog;
	return out;
});
check(r.api, 'API on game.modules and globalThis.SpriteAnimator');
check(r.control, 'Studio button in the v13 token controls');
check(r.saved && r.rigs === 1, 'Studio saves a rig to world storage', r.file);
check(r.animated && r.swapped, 'assigned actor’s token is animated (mesh texture swapped)');
check(JSON.stringify(r.sizeBefore) === JSON.stringify(r.sizeAfter), 'token keeps its on-screen size', `${r.sizeBefore} → ${r.sizeAfter}`);
check(r.played === 1 && r.socket, 'api.play plays locally and broadcasts', `played on ${r.played}`);
check(['release', 'contact', 'end'].every((e) => r.events.includes(e)), 'clip events reach other modules via hooks', r.events.join(', '));
check(r.restored, 'removing the profile restores the token image');
check(r.closed, 'Studio window closes and cleans up');
for (const t of r.selftest) check(t.ok || t.name === 'Animated tokens on this scene', `self-test: ${t.name}`, t.detail);
await page.screenshot({ path: OUT + 'foundry_mock.png' });
check(errors.length === 0, 'no page errors', errors.join(' | '));
console.log('notifications:', r.log.join(' | '));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
