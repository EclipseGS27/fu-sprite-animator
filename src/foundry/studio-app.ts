import type { RigDocument } from '../core/types';
import { Studio, type StudioHost } from '../ui/studio';
import { MODULE_ID, STUDIO_TITLE, type AnimationProfile } from './constants';
import * as storage from './storage';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function confirmDialog(title: string, text: string): Promise<boolean> {
	return !!(await foundry.applications.api.DialogV2.confirm({ window: { title }, content: `<p>${esc(text)}</p>`, rejectClose: false }));
}

/** Link a rig to an actor (and optionally use the sprite as its token image). */
export async function assignRigToActor(rig: RigDocument, preselect?: string): Promise<void> {
	const actors = [...(game.actors ?? [])].filter((a: { isOwner?: boolean }) => a.isOwner).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
	if (!actors.length) return ui.notifications.warn('There are no actors to give this animation to.');
	const options = actors.map((a: { id: string; name: string }) => `<option value="${a.id}" ${a.id === preselect ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
	const content = `<div class="fusa-assign">
		<p>Tokens of this actor will show <b>${esc(rig.name)}</b> animated: idling on the map and playing attacks, spells and reactions.</p>
		<div class="form-group"><label>Actor</label><select name="actor">${options}</select></div>
		<div class="form-group"><label>Idle</label><select name="idle"><option value="idle-breathing">Breathing</option><option value="combat-stance">Combat stance</option><option value="">None (still until an action)</option></select></div>
		<div class="form-group"><label><input type="checkbox" name="token" checked> Use this sprite as the actor's token image</label></div>
		<p class="hint">The animation replaces the token image only while it plays; turning it off shows the token's own image again.</p>
	</div>`;
	const result = await foundry.applications.api.DialogV2.prompt({
		window: { title: 'Use this rig for an actor' },
		content,
		ok: { label: 'Assign', callback: (_e: unknown, button: { form: HTMLFormElement }) => new FormData(button.form) },
		rejectClose: false,
	});
	if (!result) return;
	const form = result as FormData;
	const actor = game.actors.get(String(form.get('actor')));
	if (!actor) return;
	const profile: AnimationProfile = { rig: rig.id, enabled: true, idle: String(form.get('idle') ?? 'idle-breathing') };
	await actor.setFlag(MODULE_ID, 'profile', profile);
	if (form.get('token')) {
		await actor.update({ 'prototypeToken.texture.src': rig.image.src });
		for (const t of actor.getActiveTokens?.(false, true) ?? []) if (t.texture?.src !== rig.image.src) await t.update({ 'texture.src': rig.image.src });
	}
	ui.notifications.info(`${actor.name} now uses "${rig.name}".`);
}

function makeHost(app: StudioApp): StudioHost {
	return {
		pickImage: () => storage.pickImage(),
		saveRig: (rig) => storage.saveRig(rig),
		listRigs: async () => storage.listRigs(),
		loadRig: (id) => storage.loadRig(id),
		deleteRig: (id) => storage.deleteRig(id),
		download: (name, text) => storage.download(name, text),
		pickTextFile: (accept) => storage.pickTextFile(accept),
		storeImage: (name, data) => storage.storeImage(name, data),
		notify: (m, t = 'info') => ui.notifications?.[t === 'warn' ? 'warn' : t === 'error' ? 'error' : 'info'](m),
		confirm: confirmDialog,
		assignToActor: (rig) => assignRigToActor(rig, app.actorId ?? undefined),
		listClips: async () => Object.values(storage.worldClips()),
		saveClip: (clip) => storage.saveClip(clip),
		deleteClip: (id) => storage.deleteClip(id),
	};
}

const { ApplicationV2 } = foundry.applications.api;

/** The Studio in a Foundry window. One at a time. */
export class StudioApp extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: 'fusa-studio',
		classes: ['fusa-app'],
		window: { title: STUDIO_TITLE, icon: 'fa-solid fa-person-running', resizable: true },
		position: { width: Math.min(1440, window.innerWidth - 80), height: Math.min(900, window.innerHeight - 60) },
	};

	studio: Studio | null = null;
	actorId: string | null = null;
	private pendingRig: string | null = null;

	/** Open (or focus) the Studio, optionally on a rig or for an actor. */
	static async open(o: { rigId?: string; actor?: { id: string; getFlag?: (s: string, k: string) => AnimationProfile | undefined } } = {}): Promise<StudioApp> {
		if (!game.user?.isGM && !storage.canSave()) ui.notifications.warn('Only the GM can save rigs; you can still try things out.');
		const existing = foundry.applications.instances.get('fusa-studio') as StudioApp | undefined;
		const app = existing ?? new StudioApp();
		app.actorId = o.actor?.id ?? app.actorId;
		app.pendingRig = o.rigId ?? o.actor?.getFlag?.(MODULE_ID, 'profile')?.rig ?? null;
		await app.render({ force: true });
		await app.loadPending();
		return app;
	}

	private async loadPending(): Promise<void> {
		const id = this.pendingRig;
		this.pendingRig = null;
		if (!id || !this.studio || this.studio.rig?.id === id) return;
		try {
			await this.studio.loadRigDocument(await storage.loadRig(id));
		} catch (e) {
			ui.notifications.error(`Could not open the rig: ${(e as Error).message}`);
		}
	}

	async _renderHTML(): Promise<HTMLElement> {
		const div = document.createElement('div');
		div.className = 'fusa-host';
		div.style.cssText = 'position:absolute;inset:0;';
		return div;
	}

	_replaceHTML(result: HTMLElement, content: HTMLElement): void {
		// mount once; later renders (window focus, resize) keep the live Studio
		if (this.studio) return;
		content.style.position = 'relative';
		content.replaceChildren(result);
		this.studio = new Studio(result, makeHost(this));
	}

	async close(options?: unknown): Promise<unknown> {
		if (this.studio?.hasUnsavedChanges && !(await confirmDialog('Close the Studio?', 'This rig has unsaved changes. Close anyway?'))) return this;
		return super.close(options);
	}

	_onClose(options?: unknown): void {
		this.studio?.destroy();
		this.studio = null;
		super._onClose?.(options);
	}
}
