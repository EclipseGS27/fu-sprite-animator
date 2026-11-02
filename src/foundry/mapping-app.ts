import { DEFAULT_RULES, NONE, resolveClip, ruleLabel, type MappingTable } from '../mapping';
import { abilityKeyOf, describeItem } from '../mapping/projectfu';
import { getClip, listClips } from '../presets';
import { MappingView } from '../ui/mapping-view';
import { ITEM_FLAG, mappingTable, setMappingTable } from './combat';
import { MODULE_ID, type AnimationProfile } from './constants';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = any;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function confirmDialog(title: string, text: string): Promise<boolean> {
	return !!(await foundry.applications.api.DialogV2.confirm({ window: { title }, content: `<p>${esc(text)}</p>`, rejectClose: false }));
}

/** Readable name for a per-ability key: a world item with that id or name. */
function abilityLabel(key: string): string | null {
	const items = [...(game.items ?? [])];
	const hit = items.find((i: Doc) => abilityKeyOf(i) === key);
	if (hit) return `${hit.name} (${hit.type})`;
	const m = /^([a-zA-Z]+):(.+)$/.exec(key);
	return m ? `${m[2]} (${m[1]})` : null;
}

const { ApplicationV2 } = foundry.applications.api;

/** World editor for the ability → animation table. */
export class MappingApp extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: 'fusa-mapping',
		classes: ['fusa-app'],
		window: { title: 'Sprite animations for abilities', icon: 'fa-solid fa-person-running', resizable: true },
		position: { width: 620, height: 720 },
	};

	view: MappingView | null = null;

	static open(): MappingApp {
		const existing = foundry.applications.instances.get('fusa-mapping') as MappingApp | undefined;
		const app = existing ?? new MappingApp();
		void app.render({ force: true });
		return app;
	}

	async _renderHTML(): Promise<HTMLElement> {
		const div = document.createElement('div');
		div.style.cssText = 'position:absolute;inset:0;';
		return div;
	}

	_replaceHTML(result: HTMLElement, content: HTMLElement): void {
		if (this.view) return;
		content.style.position = 'relative';
		content.replaceChildren(result);
		this.view = new MappingView(result, {
			load: () => mappingTable(),
			save: (t) => setMappingTable(t),
			clips: () => listClips().filter((c) => !c.loop || c.category !== 'idle'),
			confirm: confirmDialog,
			abilityLabel,
		});
	}

	_onClose(options?: unknown): void {
		this.view = null;
		super._onClose?.(options);
	}
}

/** One actor's own choices (stored in its animation profile). Same editor, inheriting the world's. */
export class ActorMappingApp extends ApplicationV2 {
	static DEFAULT_OPTIONS = {
		classes: ['fusa-app'],
		window: { title: 'Sprite animation choices', icon: 'fa-solid fa-person-running', resizable: true },
		position: { width: 620, height: 720 },
	};

	view: MappingView | null = null;
	actor: Doc = null;

	constructor(options?: Record<string, unknown>) {
		super(options);
	}

	static open(actor: Doc): ActorMappingApp | null {
		const profile = actor?.getFlag?.(MODULE_ID, 'profile') as AnimationProfile | undefined;
		if (!profile?.rig) {
			ui.notifications.warn(`${actor?.name ?? 'This actor'} has no sprite rig yet: open the Studio and use “Use this rig for an actor” first.`);
			return null;
		}
		const id = `fusa-actor-mapping-${actor.id}`;
		const existing = foundry.applications.instances.get(id) as ActorMappingApp | undefined;
		const app = existing ?? new ActorMappingApp({ id, window: { title: `Sprite animation choices: ${actor.name}`, icon: 'fa-solid fa-person-running', resizable: true } });
		app.actor = actor;
		void app.render({ force: true });
		return app;
	}

	async _renderHTML(): Promise<HTMLElement> {
		const div = document.createElement('div');
		div.style.cssText = 'position:absolute;inset:0;';
		return div;
	}

	_replaceHTML(result: HTMLElement, content: HTMLElement): void {
		if (this.view) return;
		content.style.position = 'relative';
		content.replaceChildren(result);
		const actor = this.actor;
		const known = new Set(Object.keys(DEFAULT_RULES));
		const isRule = (k: string) => known.has(k.split('@')[0]!);
		this.view = new MappingView(result, {
			hint: `Choices for ${actor.name} only. “World” follows Settings → Sprite animations for abilities. A choice the rig cannot play falls back to the closest animation it can.`,
			load: (): MappingTable => {
				const map = (actor.getFlag(MODULE_ID, 'profile') as AnimationProfile | undefined)?.map ?? {};
				const t: MappingTable = { rules: {}, abilities: {} };
				for (const [k, v] of Object.entries(map)) t[isRule(k) ? 'rules' : 'abilities'][k] = v;
				return t;
			},
			save: async (t) => {
				const profile = actor.getFlag(MODULE_ID, 'profile') as AnimationProfile | undefined;
				if (!profile) return;
				const map = { ...t.rules, ...t.abilities };
				await actor.setFlag(MODULE_ID, 'profile', { ...profile, map });
			},
			inherited: (kind, key) => {
				const w = mappingTable();
				return { prefix: 'World', clip: kind === 'rules' ? (w.rules[key] ?? DEFAULT_RULES[key]) : w.abilities[key] };
			},
			clips: () => listClips().filter((c) => !c.loop || c.category !== 'idle'),
			confirm: confirmDialog,
			abilityLabel,
		});
	}

	_onClose(options?: unknown): void {
		this.view = null;
		super._onClose?.(options);
	}
}

/** Refresh an open editor after the setting changed (on any client). */
export function refreshMappingApp(): void {
	(foundry.applications.instances.get('fusa-mapping') as MappingApp | undefined)?.view?.refresh();
}

/** "Sprite animation" for one item: automatic, none, or a clip; for this item or the whole world. */
export async function itemDialog(item: Doc): Promise<void> {
	const info = describeItem(item, { actor: item.actor });
	const world = mappingTable();
	const key = abilityKeyOf(item);
	const auto = resolveClip(info, { world: { ...world, abilities: {} } });
	const autoName = auto.clip ? (getClip(auto.clip)?.name ?? auto.clip) : 'No animation';
	const own = item.getFlag(MODULE_ID, ITEM_FLAG) as string | undefined;
	const worldOwn = key ? world.abilities[key] : undefined;
	const current = own ?? worldOwn ?? '';
	const opts = [`<option value="">Automatic: ${esc(autoName)}${auto.key ? ` (${esc(ruleLabel(auto.key))})` : ''}</option>`, `<option value="${NONE}" ${current === NONE ? 'selected' : ''}>No animation</option>`];
	const groups = new Map<string, string[]>();
	for (const c of listClips()) {
		if (c.loop && c.category === 'idle') continue;
		const list = groups.get(c.category) ?? [];
		list.push(`<option value="${esc(c.id)}" ${current === c.id ? 'selected' : ''}>${esc(c.name)}</option>`);
		groups.set(c.category, list);
	}
	for (const [cat, list] of groups) opts.push(`<optgroup label="${esc(cat)}">${list.join('')}</optgroup>`);
	const content = `<div class="fusa-assign">
		<p>Which animation characters with a sprite rig play when <b>${esc(item.name)}</b> is used.</p>
		<div class="form-group"><label>Animation</label><select name="clip">${opts.join('')}</select></div>
		<div class="form-group"><label>Applies to</label><select name="scope">
			<option value="item" ${worldOwn && !own ? '' : 'selected'}>This item only</option>
			<option value="world" ${worldOwn && !own ? 'selected' : ''} ${key ? '' : 'disabled'}>Every “${esc(item.name)}” in the world</option>
		</select></div>
		<p class="hint">Automatic follows the world list (Settings → Sprite animations for abilities). A rig that cannot play the choice plays the closest animation it can.</p>
	</div>`;
	const result = await foundry.applications.api.DialogV2.prompt({
		window: { title: `Sprite animation: ${item.name}` },
		content,
		ok: { label: 'Save', callback: (_e: unknown, button: { form: HTMLFormElement }) => new FormData(button.form) },
		rejectClose: false,
	});
	if (!result) return;
	const form = result as FormData;
	const clip = String(form.get('clip') ?? '');
	const scope = String(form.get('scope') ?? 'item');
	if (scope === 'world' && key) {
		const t = mappingTable();
		if (clip) t.abilities[key] = clip;
		else delete t.abilities[key];
		await setMappingTable(t);
		if (own) await item.unsetFlag(MODULE_ID, ITEM_FLAG);
	} else if (clip) await item.setFlag(MODULE_ID, ITEM_FLAG, clip);
	else if (own) await item.unsetFlag(MODULE_ID, ITEM_FLAG);
	ui.notifications.info(`${item.name}: ${clip ? (clip === NONE ? 'no animation' : (getClip(clip)?.name ?? clip)) : 'automatic animation'}.`);
}

