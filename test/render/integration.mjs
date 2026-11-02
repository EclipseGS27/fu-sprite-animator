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

// ---- Phase 5: chat cards → attacker clip, target reactions, defeat, mapping ----
const c = await page.evaluate(async () => {
	const out = {};
	const api = game.modules.get('fu-sprite-animator').api;
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	const rig = api.rigs()[0].id;
	const hero = mockMakeActor('hero', 'Hero');
	const foe = mockMakeActor('foe', 'Foe', 30);
	await mockMakeToken('t2', hero, '../sprites/warrior.png', 700, 250, 200);
	await mockMakeToken('t3', foe, '../sprites/warrior.png', 1000, 250, 200);
	await api.setProfile(hero, { rig, enabled: true, idle: 'combat-stance' });
	await api.setProfile(foe, { rig, enabled: true, idle: 'idle-breathing' });
	await wait(500);
	const sword = mockMakeItem('sword', hero, { type: 'weapon', name: 'Bronze Sword', system: { category: { value: 'sword' }, type: { value: 'melee' } } });
	const spellItem = mockMakeItem('flare', hero, { type: 'spell', name: 'Flare', system: { isOffensive: { value: true }, targeting: { rule: 'single' } } });
	const card = (item, result, extra = {}) => mockChatCard('t2', { itemUuid: item.uuid, type: 'accuracy', critical: false, additionalData: { targets: [{ uuid: 'Scene.scene-1.Token.t3', result }] }, ...extra });
	const seen = [];
	Hooks.on('fu-sprite-animator.event', (e) => seen.push(`${e.token.id}:${e.clip}:${e.event}`));
	const emitted = () => game.socket.emitted.filter((e) => e[1]?.type === 'action').length;

	// 1. a sword attack that hits
	let before = emitted();
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(120);
	out.attack = api.current(hero)?.action;
	out.broadcast = emitted() === before + 1;
	await wait(700);
	out.hitReaction = seen.find((s) => s.startsWith('t3:'))?.split(':')[1] ?? api.current(foe)?.action;
	out.contactFirst = seen.indexOf('t2:sword-slash:contact') >= 0;
	await wait(1200);
	// 2. a miss: the target dodges
	seen.length = 0;
	Hooks.callAll('createChatMessage', card(sword, 'miss'));
	await wait(700);
	out.missReaction = api.current(foe)?.action;
	await wait(1200);
	// 3. a critical hit
	Hooks.callAll('createChatMessage', card(sword, 'hit', { critical: true }));
	await wait(700);
	out.critReaction = api.current(foe)?.action;
	await wait(1500);
	// 4. an offensive spell
	Hooks.callAll('createChatMessage', card(spellItem, 'hit', { type: 'magic' }));
	await wait(120);
	out.spell = api.current(hero)?.action;
	await wait(2000);
	// 5. the foe guards (a card with no item), then is hit while guarding
	Hooks.callAll('createChatMessage', { author: { id: 'user-1' }, speaker: { token: 't3', scene: 'scene-1' }, getFlag: (s, k) => (s === 'projectfu' && k === 'Check' ? { additionalData: { ruleDefinedAction: 'guard' } } : undefined) });
	await wait(120);
	out.guard = api.current(foe)?.action;
	await wait(1500);
	foe.statuses.add('guard');
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(700);
	out.guardedReaction = api.current(foe)?.action;
	foe.statuses.delete('guard');
	await wait(1500);
	// 6. the item's own choice, then the world table
	await sword.setFlag('fu-sprite-animator', 'clip', 'thrust');
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(120);
	out.itemOverride = api.current(hero)?.action;
	out.resolved = api.resolveClip(sword).source;
	await wait(1500);
	await sword.unsetFlag('fu-sprite-animator', 'clip');
	await api.mapping.set({ rules: { 'weapon:sword': 'heavy-slash' }, abilities: {} });
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(120);
	out.worldRule = api.current(hero)?.action;
	await wait(2200);
	await api.mapping.set({ rules: {}, abilities: {} });
	// 7. another client's card arrives through the socket
	const plan = game.socket.emitted.filter((e) => e[1]?.type === 'action').at(-1)[1].plan;
	game.socket.handler({ type: 'action', plan: { ...plan, info: { ...plan.info, weaponCategory: 'spear', key: null } } });
	await wait(120);
	out.remote = api.current(hero)?.action;
	await wait(1800);
	// 8. 0 HP: the foe falls and stays down; reactions do not play on it; back up with HP
	await foe.update({ 'system.resources.hp.value': 0 });
	await wait(1600);
	out.defeated = api.current(foe);
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(800);
	out.downReaction = api.current(foe)?.action;
	await wait(1500);
	await foe.update({ 'system.resources.hp.value': 12 });
	await wait(200);
	out.revived = api.current(foe)?.base;
	// 9. api.react and api.playAction
	out.react = await api.react(foe, 'hit', { critical: true });
	out.reactClip = api.current(foe)?.action;
	await wait(1500);
	await api.playAction(spellItem, { targets: [{ target: foe, result: 'miss' }] });
	await wait(120);
	out.playAction = api.current(hero)?.action;
	await wait(2000);
	// 10. with fu-animations active: its classification is used and our strike waits for its dash
	game.modules.set('fu-animations', { id: 'fu-animations', active: true, api: { resolve: () => ({ spec: { style: 'melee' }, source: 'default' }) } });
	game.settings.register('fu-animations', 'enabled', { default: true });
	game.settings.register('fu-animations', 'moveMelee', { default: true });
	const t0 = performance.now();
	const times = {};
	const id = Hooks.on('fu-sprite-animator.event', (e) => {
		const k = `${e.token.id}:${e.event}`;
		if (!(k in times)) times[k] = (performance.now() - t0) / 1000;
	});
	Hooks.callAll('createChatMessage', card(sword, 'hit'));
	await wait(2000);
	Hooks.off('fu-sprite-animator.event', id);
	out.fuaContact = times['t2:contact'];
	out.fuaReaction = Math.min(...Object.entries(times).filter(([k]) => k.startsWith('t3:')).map(([, v]) => v));
	game.modules.delete('fu-animations');
	// 12b. a creature: a wolf rigged as a four-legged beast idles, bites and flinches like one
	const studio = await api.openStudio();
	await studio.studio.newFromImage('../sprites/wolf.png', 'Wolf');
	await studio.studio.resetTemplate('quadruped', false);
	out.wolfTemplate = studio.studio.rig.template;
	out.wolfBase = studio.studio.baseId;
	await studio.studio.save();
	const wolfRig = api.rigs().find((r) => r.name === 'Wolf').id;
	await studio.close();
	const wolf = mockMakeActor('wolf', 'Wolf');
	await mockMakeToken('t5', wolf, '../sprites/wolf.png', 400, 420, 160);
	await api.setProfile(wolf, { rig: wolfRig, enabled: true });
	await wait(400);
	out.wolfIdle = api.current(wolf)?.base;
	const fangs = mockMakeItem('fangs', wolf, { type: 'basic', name: 'Fangs', system: { type: { value: 'melee' } } });
	Hooks.callAll('createChatMessage', mockChatCard('t5', { itemUuid: fangs.uuid, type: 'accuracy', additionalData: { targets: [{ uuid: 'Scene.scene-1.Token.t2', result: 'hit' }] } }));
	await wait(150);
	out.wolfAttack = api.current(wolf)?.action;
	await wait(1200);
	Hooks.callAll('createChatMessage', card(sword, 'hit', { additionalData: { targets: [{ uuid: 'Scene.scene-1.Token.t5', result: 'hit' }] } }));
	await wait(700);
	out.wolfReaction = api.current(wolf)?.action;
	await wait(1200);
	// 12c. coexistence: what fu-animations and condition modules do to token.mesh stays as they set it
	const heroToken = canvas.tokens.get('t2');
	const m = heroToken.mesh;
	m.x += 37;
	m.scale.set(m.scale.x * 1.3, m.scale.y * 0.8);
	m.angle = 12;
	m.alpha = 0.6;
	m.tint = 0xff8888;
	const filter = new PIXI.ColorMatrixFilter();
	m.filters = [filter];
	const set = { x: m.x, y: m.y, sx: m.scale.x, sy: m.scale.y, angle: m.angle, alpha: m.alpha, tint: m.tint, visible: m.visible, anchor: [m.anchor.x, m.anchor.y] };
	await api.play(hero, 'heavy-slash');
	await wait(900);
	out.coexist = { x: m.x === set.x && m.y === set.y, scale: m.scale.x === set.sx && m.scale.y === set.sy, angle: m.angle === set.angle, alpha: m.alpha === set.alpha, tint: m.tint === set.tint, filters: m.filters?.[0] === filter, visible: m.visible === set.visible, anchor: m.anchor.x === set.anchor[0] && m.anchor.y === set.anchor[1], ours: m.texture !== heroToken.texture };
	// Foundry redraws the token with its own texture: the animation takes it back on the next refresh
	m.texture = heroToken.texture;
	Hooks.callAll('refreshToken', heroToken);
	out.retaken = m.texture !== heroToken.texture;
	m.x -= 37;
	m.scale.set(set.sx / 1.3, set.sy / 0.8);
	m.angle = 0;
	m.alpha = 1;
	m.tint = 0xffffff;
	m.filters = null;
	// 11. mapping editor window and the item header control
	const app = api.mapping.open();
	await wait(100);
	const sel = app.element.querySelector('[data-key="weapon:bow"] select');
	out.editorRows = app.element.querySelectorAll('.fusa-map-row').length;
	sel.value = 'throw';
	sel.dispatchEvent(new Event('change'));
	await app.view.flush();
	out.editorSaved = api.mapping.get().rules['weapon:bow'];
	await app.close();
	const controls = [];
	Hooks.callAll('getHeaderControlsDocumentSheetV2', { document: sword, options: {} }, controls);
	out.itemControl = controls.some((x) => x.action === 'fusaItem');
	// 12. one actor's own choices: the hero thrusts with swords, the foe still slashes
	const actorControls = [];
	const sheet = { document: hero, options: {} };
	Hooks.callAll('getHeaderControlsDocumentSheetV2', sheet, actorControls);
	out.actorControl = actorControls.some((x) => x.action === 'fusaActorMap');
	sheet.options.actions.fusaActorMap();
	await wait(150);
	const actorApp = foundry.applications.instances.get('fusa-actor-mapping-hero');
	const swordSel = actorApp.element.querySelector('[data-key="weapon:sword"] select');
	out.actorInherits = swordSel.options[0].textContent;
	swordSel.value = 'thrust';
	swordSel.dispatchEvent(new Event('change'));
	await actorApp.view.flush();
	await actorApp.close();
	out.actorMap = hero.getFlag('fu-sprite-animator', 'profile')?.map?.['weapon:sword'];
	const foeSword = mockMakeItem('foesword', foe, { type: 'weapon', name: 'Rusty Sword', system: { category: { value: 'sword' }, type: { value: 'melee' } } });
	Hooks.callAll('createChatMessage', card(sword, 'none'));
	await wait(120);
	out.actorChoice = api.current(hero)?.action;
	await wait(1500);
	Hooks.callAll('createChatMessage', mockChatCard('t3', { itemUuid: foeSword.uuid, type: 'accuracy', additionalData: { targets: [] } }));
	await wait(120);
	out.otherActor = api.current(foe)?.action;
	// 13. a token drawn while its actor is at 0 HP starts in the held defeat pose
	const fallen = mockMakeActor('fallen', 'Fallen', 20);
	fallen.system.resources.hp.value = 0;
	await mockMakeToken('t4', fallen, '../sprites/warrior.png', 400, 600, 160);
	await api.setProfile(fallen, { rig, enabled: true, idle: 'idle-breathing' });
	await wait(400);
	out.drawnDown = api.current(fallen);
	return out;
});
check(c.attack === 'sword-slash' && c.broadcast, 'a sword card: the attacker plays Sword slash, broadcast to other clients', c.attack);
check(c.hitReaction === 'light-hit', 'the hit target flinches (Light hit)', c.hitReaction);
check(c.missReaction === 'dodge', 'a miss: the target dodges', c.missReaction);
check(c.critReaction === 'heavy-hit', 'a critical hit: Heavy hit', c.critReaction);
check(c.spell === 'magic-cast', 'an offensive spell: Magic cast', c.spell);
check(c.guard === 'guard', 'the Guard action plays Guard', c.guard);
check(c.guardedReaction === 'block', 'hit while guarding: Block', c.guardedReaction);
check(c.itemOverride === 'thrust' && c.resolved === 'item', 'the item’s own choice wins', `${c.itemOverride} (${c.resolved})`);
check(c.worldRule === 'heavy-slash', 'the world table changes every sword', c.worldRule);
check(c.remote === 'spear-attack', 'a card from another client plays here', c.remote);
check(c.defeated?.base === 'defeat' && !c.defeated?.action, 'at 0 HP the character falls and stays down', JSON.stringify(c.defeated));
check(!c.downReaction, 'no hit reactions while down', c.downReaction);
check(c.revived === 'idle-breathing', 'back above 0 HP: back to its idle', c.revived);
check(c.react === 1 && c.reactClip === 'heavy-hit', 'api.react', c.reactClip);
check(c.playAction === 'magic-cast', 'api.playAction', c.playAction);
check(Math.abs(c.fuaContact - 0.45) < 0.12, 'with fu-animations: the strike lands when its dash arrives (≈0.45 s)', `${c.fuaContact?.toFixed(2)} s`);
check(c.fuaReaction >= 0.4 && c.fuaReaction < 0.7, 'with fu-animations: the target reacts at its hit, not before', `${c.fuaReaction?.toFixed(2)} s`);
check(c.wolfTemplate === 'quadruped' && c.wolfBase === 'beast-idle', 'Studio: a wolf rigged as a four-legged beast previews over its beast idle', `${c.wolfTemplate}, ${c.wolfBase}`);
check(c.wolfIdle === 'beast-idle', 'a beast token idles like a beast', c.wolfIdle);
check(c.wolfAttack === 'bite' && c.wolfReaction === 'beast-hit', 'a beast bites and flinches like a beast', `${c.wolfAttack} / ${c.wolfReaction}`);
check(Object.values(c.coexist).every(Boolean), 'other modules’ changes to token.mesh (position, squash, rotation, alpha, tint, filters, anchor) survive an animation', JSON.stringify(c.coexist));
check(c.retaken, 'when Foundry puts the token’s own texture back, the animation takes it again on refresh');
check(c.editorRows > 30 && c.editorSaved === 'throw', 'mapping editor lists the rules and saves a change', `${c.editorRows} rows`);
check(c.itemControl, '"Sprite animation" in item sheet headers');
check(c.drawnDown?.base === 'defeat' && !c.drawnDown?.action, 'a token drawn at 0 HP starts down', JSON.stringify(c.drawnDown));
check(c.actorControl && c.actorInherits === 'World: Sword slash', 'per-actor choices window, inheriting the world’s', c.actorInherits);
check(c.actorMap === 'thrust' && c.actorChoice === 'thrust' && c.otherActor === 'sword-slash', 'an actor’s own choice applies to it only', `${c.actorChoice} / ${c.otherActor}`);
await page.screenshot({ path: OUT + 'foundry_mock.png' });
check(errors.length === 0, 'no page errors', errors.join(' | '));
console.log('notifications:', r.log.join(' | '));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
