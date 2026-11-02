import { CATEGORY_LABELS } from '../presets';
import type { ClipCategory } from '../core/types';
import { DEFAULT_RULES, NONE, RULE_GROUPS, parseTable, type MappingTable } from '../mapping';
import { clear, h } from './dom';

/**
 * The "Ability animations" editor: which clip plays for each kind of action, world-wide.
 * Plain DOM like the Studio. Every change is saved at once through the host.
 */
export interface MappingHost {
	load(): MappingTable;
	save(table: MappingTable): Promise<void>;
	clips(): { id: string; name: string; category: ClipCategory; requires?: string[] }[];
	confirm(title: string, text: string): Promise<boolean>;
	/** Optional readable names for per-ability keys (fuid → "Fireball"). */
	abilityLabel?(key: string): string | null;
	/** What applies when this level has no entry (default: the built-in table). */
	inherited?(kind: 'rules' | 'abilities', key: string): { prefix: string; clip: string | undefined };
	/** Text at the top. */
	hint?: string;
}

export class MappingView {
	readonly root: HTMLElement;
	private readonly host: MappingHost;
	private table: MappingTable;
	private filter = '';
	private saving: Promise<void> = Promise.resolve();

	constructor(root: HTMLElement, host: MappingHost) {
		this.root = root;
		this.host = host;
		this.table = parseTable(host.load());
		root.classList.add('fusa-studio', 'fusa-mapping');
		this.render();
	}

	/** Reload from the host (the setting changed elsewhere). */
	refresh(): void {
		this.table = parseTable(this.host.load());
		this.render();
	}

	private clipName(id: string): string {
		if (id === NONE) return 'No animation';
		return this.host.clips().find((c) => c.id === id)?.name ?? `${id} (missing)`;
	}

	private fallback(kind: 'rules' | 'abilities', key: string): { prefix: string; clip: string | undefined } {
		return this.host.inherited?.(kind, key) ?? { prefix: 'Built-in', clip: kind === 'rules' ? DEFAULT_RULES[key] : undefined };
	}

	private select(current: string | undefined, inherited: { prefix: string; clip: string | undefined }, onChange: (v: string) => void): HTMLSelectElement {
		const sel = h('select', { class: 'fusa-map-select', onchange: () => onChange(sel.value) });
		sel.append(h('option', { value: '' }, inherited.clip ? `${inherited.prefix}: ${this.clipName(inherited.clip)}` : 'Automatic'));
		sel.append(h('option', { value: NONE }, 'No animation'));
		const byCat = new Map<ClipCategory, { id: string; name: string }[]>();
		for (const c of this.host.clips()) {
			const list = byCat.get(c.category) ?? [];
			list.push(c);
			byCat.set(c.category, list);
		}
		for (const [cat, list] of byCat) {
			const g = h('optgroup', { label: CATEGORY_LABELS[cat] ?? cat });
			for (const c of list.sort((a, b) => a.name.localeCompare(b.name))) g.append(h('option', { value: c.id }, c.name));
			sel.append(g);
		}
		sel.value = current ?? '';
		if (current && sel.value !== current) {
			// a clip that no longer exists: keep showing it so nothing is silently lost
			sel.append(h('option', { value: current }, `${current} (missing)`));
			sel.value = current;
		}
		return sel;
	}

	private set(kind: 'rules' | 'abilities', key: string, clip: string): void {
		if (clip) this.table[kind][key] = clip;
		else delete this.table[kind][key];
		this.persist();
		this.render();
	}

	private persist(): void {
		const snapshot = parseTable(this.table);
		this.saving = this.saving.then(() => this.host.save(snapshot)).catch((e) => console.warn('fu-sprite-animator | could not save the mapping', e));
	}

	/** Resolves when every change so far is saved (tests). */
	flush(): Promise<void> {
		return this.saving;
	}

	render(): void {
		const root = this.root;
		clear(root);
		const changed = Object.keys(this.table.rules).length + Object.keys(this.table.abilities).length;
		const search = h('input', {
			type: 'search',
			class: 'fusa-map-search',
			placeholder: 'Filter…',
			value: this.filter,
			oninput: () => {
				this.filter = search.value;
				this.renderBody(body);
			},
		});
		const reset = h(
			'button',
			{
				class: 'fusa-btn subtle small',
				disabled: changed === 0,
				onclick: async () => {
					if (!(await this.host.confirm('Reset ability animations', 'Go back to the built-in choices for every action and remove the per-ability entries?'))) return;
					this.table = { rules: {}, abilities: {} };
					this.persist();
					this.render();
				},
			},
			'Reset all',
		);
		const body = h('div', { class: 'fusa-map-body' });
		root.append(
			h(
				'div',
				{ class: 'fusa-map-head' },
				h('p', { class: 'fusa-map-hint' }, this.host.hint ?? 'Which animation a character plays for each kind of action. Per character: the actor sheet’s header menu → Sprite animation choices. Per item: the item sheet’s header menu → Sprite animation. A character whose rig cannot play a choice (for example a wolf and a bow shot) plays the closest one it can.'),
				h('div', { class: 'fusa-map-tools' }, search, reset),
			),
			body,
		);
		this.renderBody(body);
	}

	private renderBody(body: HTMLElement): void {
		clear(body);
		const f = this.filter.trim().toLowerCase();
		const match = (...s: string[]) => !f || s.some((x) => x.toLowerCase().includes(f));
		for (const g of RULE_GROUPS) {
			const rows = g.keys.filter(([k, label]) => match(k, label, this.clipName(this.table.rules[k] ?? this.fallback('rules', k).clip ?? '')));
			if (!rows.length) continue;
			const sec = h('section', { class: 'fusa-map-group' }, h('h3', null, g.title));
			for (const [key, label] of rows) {
				const own = this.table.rules[key];
				sec.append(h('label', { class: `fusa-map-row${own ? ' changed' : ''}`, dataset: { key } }, h('span', null, label), this.select(own, this.fallback('rules', key), (v) => this.set('rules', key, v))));
			}
			body.append(sec);
		}
		// template-specific and other world rules not in the standard list
		const known = new Set(RULE_GROUPS.flatMap((g) => g.keys.map(([k]) => k)));
		const extra = Object.keys(this.table.rules).filter((k) => !known.has(k) && match(k));
		if (extra.length) {
			const sec = h('section', { class: 'fusa-map-group' }, h('h3', null, 'Other rules'));
			for (const key of extra.sort()) sec.append(this.entryRow('rules', key, key));
			body.append(sec);
		}
		const abilities = Object.keys(this.table.abilities).filter((k) => match(k, this.host.abilityLabel?.(k) ?? ''));
		const sec = h('section', { class: 'fusa-map-group' }, h('h3', null, 'Single abilities'));
		if (!abilities.length) sec.append(h('p', { class: 'fusa-map-hint' }, 'None yet. To give one ability its own animation in the whole world, open the item’s sheet → header menu → Sprite animation → “every character”.'));
		for (const key of abilities.sort()) sec.append(this.entryRow('abilities', key, this.host.abilityLabel?.(key) ?? key));
		body.append(sec);
	}

	private entryRow(kind: 'rules' | 'abilities', key: string, label: string): HTMLElement {
		return h(
			'div',
			{ class: 'fusa-map-row changed', dataset: { key } },
			h('span', { title: key }, label),
			this.select(this.table[kind][key], this.fallback(kind, key), (v) => this.set(kind, key, v)),
			h('button', { class: 'fusa-btn subtle small', title: 'Remove', onclick: () => this.set(kind, key, '') }, '✕'),
		);
	}
}
