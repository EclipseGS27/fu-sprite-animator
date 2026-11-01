import { MODULE_ID, SOCKET, STUDIO_TITLE } from './constants';
import { createApi, onSocket } from './api';
import { StudioApp } from './studio-app';
import { registerTokenHooks, tokenAnimators } from './tokens';

/**
 * Fabula Ultima Sprite Animator — entry point (Foundry v13).
 * Everything here uses documented hooks and APIs; nothing replaces Foundry classes.
 */

Hooks.once('init', () => {
	const reg = (key: string, data: Record<string, unknown>) => game.settings.register(MODULE_ID, key, { config: true, ...data });
	game.settings.register(MODULE_ID, 'rigs', { scope: 'world', config: false, type: Object, default: {} });
	reg('animateTokens', {
		name: 'Animate tokens',
		hint: 'Tokens of actors with a sprite animation idle and act on the map. Turn off to see their still images (for you only).',
		scope: 'client',
		type: Boolean,
		default: true,
		onChange: () => tokenAnimators.reset(),
	});
	reg('maxAnimated', {
		name: 'Most animated tokens',
		hint: 'Above this many on one scene, extra tokens keep their still image (for you only). Lower it on slow computers.',
		scope: 'client',
		type: Number,
		range: { min: 1, max: 100, step: 1 },
		default: 40,
		onChange: () => tokenAnimators.reset(),
	});
	reg('textureMode', {
		name: 'Token texture',
		hint: 'Padded: weapons and limbs can swing past the edge of the sprite. Clipped: everything stays inside the sprite’s own rectangle. Use Clipped only if the self-test says so.',
		scope: 'world',
		type: String,
		choices: { padded: 'Padded (recommended)', clipped: 'Clipped' },
		default: 'padded',
		onChange: () => tokenAnimators.reset(),
	});
	game.settings.registerMenu(MODULE_ID, 'studio', {
		name: 'Sprite Animation Studio',
		label: 'Open the Studio',
		hint: 'Rig character sprites, preview animations and assign them to actors.',
		icon: 'fa-solid fa-person-running',
		type: StudioApp,
		restricted: true,
	});
	const api = createApi();
	const mod = game.modules.get(MODULE_ID);
	if (mod) mod.api = api;
	if (!('SpriteAnimator' in globalThis)) (globalThis as Record<string, unknown>).SpriteAnimator = api;
	registerTokenHooks();
});

Hooks.once('ready', () => {
	game.socket?.on(SOCKET, onSocket);
	Hooks.callAll(`${MODULE_ID}.ready`, game.modules.get(MODULE_ID)?.api);
});

/* Scene controls: a Studio button in the token tools (GM). v13 controls are records keyed by name. */
Hooks.on('getSceneControlButtons', (controls: Record<string, { tools?: Record<string, unknown> }> | unknown[]) => {
	if (!game.user?.isGM) return;
	const tool = { name: 'fusaStudio', title: STUDIO_TITLE, icon: 'fa-solid fa-person-running', button: true, order: 99, visible: true, onChange: () => void StudioApp.open() };
	if (Array.isArray(controls)) {
		const tokens = controls.find((c) => (c as { name?: string }).name === 'token') as { tools?: unknown[] } | undefined;
		tokens?.tools?.push({ ...tool, onClick: tool.onChange });
		return;
	}
	const tokens = controls.tokens ?? controls.token;
	if (tokens?.tools) tokens.tools.fusaStudio = tool;
});

/* "Sprite animation" in actor sheet headers and the Actors directory context menu. */
Hooks.on('getHeaderControlsDocumentSheetV2', (app: { document?: { documentName?: string; isOwner?: boolean }; options: { actions?: Record<string, unknown> } }, controls: { action: string }[]) => {
	const doc = app.document;
	if (doc?.documentName !== 'Actor' || !game.user?.isGM) return;
	app.options.actions ??= {};
	app.options.actions.fusaStudio ??= () => void StudioApp.open({ actor: doc as { id: string } });
	if (controls.some((c) => c.action === 'fusaStudio')) return;
	controls.push({ action: 'fusaStudio', icon: 'fa-solid fa-person-running', label: 'Sprite animation', ownership: 'OWNER' } as { action: string });
});

for (const hook of ['getActorContextOptions', 'getActorDirectoryEntryContext']) {
	Hooks.on(hook, (_app: unknown, options: { name: string }[]) => {
		if (!game.user?.isGM || options.some((o) => o.name === 'Sprite animation')) return;
		const actorOf = (li: { dataset?: { entryId?: string; documentId?: string } } | { dataset?: { entryId?: string } }[]) => {
			const el = Array.isArray(li) ? li[0] : li;
			return game.actors?.get(el?.dataset?.entryId ?? (el as { dataset?: { documentId?: string } })?.dataset?.documentId);
		};
		options.push({
			name: 'Sprite animation',
			icon: '<i class="fa-solid fa-person-running"></i>',
			condition: () => game.user.isGM,
			callback: (li: never) => {
				const actor = actorOf(li);
				if (actor) void StudioApp.open({ actor });
			},
		} as { name: string });
	});
}
