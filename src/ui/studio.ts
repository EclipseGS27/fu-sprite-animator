import { TimeWarp } from '../core/clip';
import { wrapDeg } from '../core/math';
import type { BoneData, ClipCategory, ClipDocument, Ease, PartData, PhaseTiming, RigDocument, TemplateId } from '../core/types';
import { CATEGORY_LABELS, defaultActionFor, defaultIdleFor, getClip, isBuiltIn, listClips, registerClip, unregisterClip } from '../presets';
import { CHANNELS, addEvent, cloneClip, keyFromPose, moveKey as moveClipKey, removeEvent, removeKey, setDuration, setKeyEase, setLayerKey, setRotateKey, setVectorKey, uniqueClipId, type Channel } from '../presets/edit';
import { EASE_NAMES } from '../core/easing';
import { solveTwoBone } from '../core/ik';
import { buildRig } from '../rig/build';
import { assignPixels, cloneRig, createRig, lastReport, parseRig, proposeRig, rigHints, rigLabels, type RigReport } from '../rig/document';
import { addBone, childrenOf, deleteBone, descendants, ensurePart, moveJoint, movePart, moveSubtree, moveTip, removePart, reparent, updateBone, updatePart } from '../rig/edit';
import { bonesToFrames, tipOf } from '../rig/frames';
import { History } from '../rig/history';
import { KNOWN_ROLES, TEMPLATES, TEMPLATE_LIST } from '../rig/templates';
import { isUsable, validateRig, type RigIssue } from '../rig/validate';
import { RigAsset, RigView, loadImageData } from '../render/pixi';
import { floodAssign, paintCircle } from '../sprite/ownership';
import { encodeRle } from '../sprite/rle';
import { detectBackground, removeBackground } from '../sprite/background';
import { clear, h, ibtn, icon, slider } from './dom';
import { Timeline } from './timeline';
import { Viewport, type BoneGizmo, type Handle } from './viewport';

export type Mode = 'rig' | 'paint' | 'pose' | 'animate';

export interface RigSummary {
	id: string;
	name: string;
	image: string;
	updated: number;
}

/** What the Studio needs from its surroundings (Foundry, or a plain page in tests). */
export interface StudioHost {
	/** Let the user choose an image; resolves to a URL the browser can load, or null. */
	pickImage(): Promise<string | null>;
	saveRig(rig: RigDocument): Promise<void>;
	listRigs(): Promise<RigSummary[]>;
	loadRig(id: string): Promise<RigDocument>;
	deleteRig?(id: string): Promise<void>;
	/** Save a bundle file for the user. */
	download(filename: string, text: string): void;
	/** Let the user choose a file; resolves to its text, or null. */
	pickTextFile(accept: string): Promise<string | null>;
	/** Store an embedded image (data URL) from an imported bundle; resolves to its URL. */
	storeImage(name: string, dataUrl: string): Promise<string>;
	notify(message: string, type?: 'info' | 'warn' | 'error'): void;
	confirm(title: string, text: string): Promise<boolean>;
	/** Optional: link a rig to an actor (Foundry). */
	assignToActor?(rig: RigDocument): Promise<void>;
	/** Optional: the world's own clips (edited or imported animations). */
	listClips?(): Promise<ClipDocument[]>;
	saveClip?(clip: ClipDocument): Promise<void>;
	deleteClip?(id: string): Promise<void>;
}

const CHANNEL_LABEL: Record<Channel, string> = { rotate: 'Turn', translate: 'Move', scale: 'Scale', layer: 'Layer' };

interface Bundle {
	format: 'fusa-bundle';
	version: 1;
	rig: RigDocument;
	image: string;
}

const MODES: { id: Mode; label: string; hint: string }[] = [
	{ id: 'rig', label: 'Rig', hint: 'Drag a joint to move it, a bone tip to aim and lengthen it. Shift-drag moves a bone with its children. "Add bone": drag from the joint to the tip.' },
	{ id: 'paint', label: 'Paint', hint: 'Paint pixels onto the selected bone. Right-click paints them back to its parent. Bucket: fill a whole connected region.' },
	{ id: 'pose', label: 'Pose', hint: 'Drag any bone to rotate it and see the art move. Shift-drag the root to move the whole body. Nothing here is saved.' },
	{ id: 'animate', label: 'Animate', hint: 'Pick an animation below. Space plays and pauses. Adjust speed, intensity and phase timing.' },
];

/** Loops that play underneath actions (idles, walking, running). */
const isBaseLoop = (c: ClipDocument): boolean => c.loop && (c.category === 'idle' || c.category === 'movement');

/**
 * FABULA ULTIMA — SPRITE ANIMATION STUDIO.
 * Framework-free DOM + a PixiJS viewport. Foundry mounts it in an ApplicationV2 window; the
 * render harness mounts it in a plain page.
 */
export class Studio {
	readonly root: HTMLDivElement;
	private readonly host: StudioHost;
	private viewport!: Viewport;
	private timeline!: Timeline;
	private readonly history = new History();

	rig: RigDocument | null = null;
	private image: ImageData | null = null;
	private labels: Uint8Array | null = null;
	private asset: RigAsset | null = null;
	view: RigView | null = null;
	private needsBuild = false;
	private issues: RigIssue[] = [];
	private savedSnapshot = '';

	mode: Mode = 'rig';
	tool: 'select' | 'add' | 'brush' | 'bucket' | 'hidden' = 'select';
	private hints: Uint8Array | null = null;
	/** An automatic rig waiting for the GM's verdict. */
	private proposal: { report: RigReport; previous: string | null } | null = null;
	private elBanner!: HTMLElement;
	selected: string | null = null;
	private hover: Handle | null = null;
	private drag: { kind: string; id: string; lastX: number; lastY: number; startAngle?: number; startRot?: number; startX?: number; startY?: number } | null = null;
	private addPreview: { ax: number; ay: number; bx: number; by: number } | null = null;
	private brushSize = 2;
	private cursor: { x: number; y: number } | null = null;
	private showBones = true;
	private showRegions = true;
	/** Pose mode: per bone index, rotation offset (deg) and translation (px). */
	private pose = new Map<number, { rot: number; x: number; y: number }>();
	private poseDirty = true;

	clipId = 'sword-slash';
	baseId = 'idle-breathing';
	playing = false;
	loop = false;
	speed = 1;
	intensity = 1;
	timing: Required<PhaseTiming> = { anticipation: 1, action: 1, recovery: 1 };
	variation = 0;
	private seed = 1;
	private warp: TimeWarp | null = null;
	private actionTime = 0;
	private destroyed = false;
	private lastEvent = '';
	/** Animate mode: editing the keys of the current clip. */
	editing = false;
	private selectedKey: { role: string; channel: Channel; index: number } | null = null;
	private readonly clipHistory = new History();
	private clipSaveTimer = 0;
	/** Onion skin: faint frames just before and after the play head. */
	onion = false;
	private ghosts: RigView[] = [];

	// DOM parts
	private elHeader!: HTMLElement;
	private elTree!: HTMLElement;
	private elInspector!: HTMLElement;
	private elIssues!: HTMLElement;
	private elLibrary!: HTMLElement;
	private elTransport!: HTMLElement;
	private elStatus!: HTMLElement;
	private elToolbar!: HTMLElement;
	private elEmpty!: HTMLElement;
	private elName!: HTMLInputElement;

	constructor(parent: HTMLElement, host: StudioHost) {
		this.host = host;
		this.root = h('div', { class: 'fusa-studio', tabindex: '0', dataset: { mode: this.mode } });
		parent.append(this.root);
		this.layout();
		this.root.addEventListener('keydown', this.onKey);
		this.renderAll();
		void this.loadWorldClips();
	}

	private async loadWorldClips(): Promise<void> {
		try {
			for (const c of (await this.host.listClips?.()) ?? []) {
				try {
					registerClip(c);
				} catch (e) {
					console.warn('fu-sprite-animator | a saved clip could not be loaded', c?.id, e);
				}
			}
			if (!this.destroyed) this.renderLibrary();
		} catch (e) {
			console.warn('fu-sprite-animator | could not list world clips', e);
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Layout                                                             */
	/* ------------------------------------------------------------------ */

	private layout(): void {
		this.elName = h('input', { class: 'fusa-name', type: 'text', placeholder: 'Untitled rig', spellcheck: false });
		this.elName.addEventListener('change', () => {
			if (!this.rig) return;
			this.rig.name = this.elName.value.trim() || this.rig.name;
			this.commit();
		});
		this.elHeader = h('header', { class: 'fusa-head' });
		const left = h('aside', { class: 'fusa-left' });
		const right = h('aside', { class: 'fusa-right' });
		const center = h('section', { class: 'fusa-center' });
		const bottom = h('section', { class: 'fusa-bottom' });
		this.elTree = h('div', { class: 'fusa-tree', role: 'tree' });
		left.append(h('div', { class: 'fusa-panel-title' }, 'Skeleton'), this.toolRow(), this.elTree);
		this.elInspector = h('div', { class: 'fusa-inspector' });
		this.elIssues = h('div', { class: 'fusa-issues' });
		right.append(h('div', { class: 'fusa-panel-title' }, 'Inspector'), this.elInspector, h('div', { class: 'fusa-panel-title' }, 'Rig check'), this.elIssues);
		this.elToolbar = h('div', { class: 'fusa-viewbar' });
		this.elStatus = h('div', { class: 'fusa-status' });
		this.elEmpty = h(
			'div',
			{ class: 'fusa-empty' },
			h('div', { class: 'fusa-empty-card' }, icon('image'), h('b', null, 'Import a character sprite'), h('p', null, 'PNG or WebP with a transparent background. Pixel art and illustrations both work. The file is used exactly as it is: nothing is resized, recoloured or repainted.'), h('button', { type: 'button', class: 'fusa-btn primary', onclick: () => this.importImage() }, icon('image'), 'Choose sprite'), h('button', { type: 'button', class: 'fusa-btn', onclick: () => this.openDialog() }, icon('open'), 'Open a saved rig')),
		);
		this.elBanner = h('div', { class: 'fusa-banner' });
		center.append(this.elToolbar, this.elEmpty, this.elBanner, this.elStatus);
		this.viewport = new Viewport(center, {
			down: (x, y, e) => this.onDown(x, y, e),
			move: (x, y, e) => this.onMove(x, y, e),
			up: (x, y, e) => this.onUp(x, y, e),
			hover: (x, y, e) => this.onHover(x, y, e),
			frame: (dt) => this.frame(dt),
		});
		center.insertBefore(this.viewport.el, this.elStatus);
		this.elLibrary = h('div', { class: 'fusa-library' });
		this.elTransport = h('div', { class: 'fusa-transport' });
		this.timeline = new Timeline({ seek: (t) => this.seek(t), selectKey: (r, i) => this.selectKeyAt(r, i), moveKey: (r, i, t, done) => this.moveKeyAt(r, i, t, done) });
		const libActions = h(
			'div',
			{ class: 'fusa-lib-actions' },
			ibtn('add', 'Duplicate the selected animation (to edit your own version)', () => void this.duplicateClip()),
			ibtn('trash', 'Delete the selected animation (your own animations only)', () => void this.deleteClip()),
			ibtn('import', 'Import an animation (.json)', () => void this.importClip()),
			ibtn('export', 'Export the selected animation (.json)', () => this.exportClip()),
		);
		bottom.append(h('div', { class: 'fusa-bottom-left' }, h('div', { class: 'fusa-panel-title fusa-lib-head' }, h('span', null, 'Animation library'), libActions), this.elLibrary), h('div', { class: 'fusa-bottom-right' }, this.elTransport, this.timeline.el));
		this.root.append(this.elHeader, left, center, right, bottom);
	}

	private toolRow(): HTMLElement {
		return h(
			'div',
			{ class: 'fusa-toolrow' },
			ibtn('add', 'Add a bone (drag in the view from joint to tip)', () => this.setTool(this.tool === 'add' ? 'select' : 'add'), { class: 'tool-add' }),
			ibtn('trash', 'Delete the selected bone (Del)', () => this.deleteSelected()),
			ibtn('bone', 'Auto-rig: find the joints in the sprite again (you can keep or discard the result)', () => void this.autoRig(), { class: 'tool-auto' }),
			ibtn('wand', 'Assign every pixel to its nearest bone (replaces painted regions)', () => this.reassign()),
			h(
				'select',
				{ class: 'fusa-template', title: 'Start over from a template', onchange: (e: Event) => this.resetTemplate((e.target as HTMLSelectElement).value as TemplateId) },
				h('option', { value: '' }, 'Template…'),
				...TEMPLATE_LIST.map((t) => h('option', { value: t.id, title: t.description }, t.id === 'custom' ? 'Custom (one bone)' : t.name)),
			),
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Rendering the panels                                               */
	/* ------------------------------------------------------------------ */

	private renderAll(): void {
		this.root.dataset.mode = this.mode;
		this.root.classList.toggle('has-rig', !!this.rig);
		this.root.classList.toggle('editing', this.editing && this.mode === 'animate');
		this.renderHeader();
		this.renderTree();
		this.renderInspector();
		this.renderIssues();
		this.renderLibrary();
		this.renderTransport();
		this.renderToolbar();
		this.renderStatus();
		this.renderBanner();
	}

	private renderBanner(): void {
		const e = this.elBanner;
		clear(e);
		const p = this.proposal;
		e.classList.toggle('show', !!p && !!this.rig);
		if (!p || !this.rig) return;
		const dots = (v: number) => '●'.repeat(Math.max(1, Math.round(v * 3))) + '○'.repeat(3 - Math.max(1, Math.round(v * 3)));
		const groups = Object.entries(p.report.confidence).map(([k, v]) => h('span', { class: 'conf', title: `${Math.round(v * 100)}%` }, `${k} ${v > 0 ? dots(v) : '—'}`));
		const kind = h(
			'select',
			{ class: 'fusa-kind', title: 'What kind of character is it? Changing it builds a fresh skeleton for that body plan.', onchange: () => void this.resetTemplate(kind.value as TemplateId, false) },
			...TEMPLATE_LIST.map((t) => h('option', { value: t.id, title: t.description }, t.name)),
		);
		kind.value = this.rig.template;
		e.append(
			h('div', { class: 'fusa-banner-text' }, h('b', null, p.report.method === 'landmarks' ? 'Automatic rig' : 'Rig from proportions'), h('label', { class: 'fusa-kind-label' }, 'What is it? ', kind), h('span', null, `Faces ${this.rig.facing}.`), ...groups, ...p.report.notes.map((n) => h('small', null, n))),
			h(
				'div',
				{ class: 'fusa-banner-actions' },
				h('button', { type: 'button', class: 'fusa-btn primary small', onclick: () => ((this.proposal = null), this.renderBanner()) }, 'Keep'),
				p.report.method === 'landmarks' ? h('button', { type: 'button', class: 'fusa-btn small', onclick: () => void this.autoRig(false) }, 'Use proportions instead') : null,
				p.previous ? h('button', { type: 'button', class: 'fusa-btn subtle small', onclick: () => this.discardProposal() }, 'Discard') : null,
			),
		);
	}

	/** Find the joints again (or fit by proportions) and offer the result. */
	async autoRig(detect = true): Promise<void> {
		if (!this.rig || !this.image) return;
		const previous = this.proposal?.previous ?? this.snapshot();
		const p = proposeRig(this.image, this.rig.template, 'auto', detect);
		Object.assign(this.rig, { bones: p.bones, parts: p.parts, ownership: p.ownership, metrics: p.metrics, facing: p.facing });
		this.labels = rigLabels(this.rig);
		this.selected = null;
		this.proposal = { report: p.report, previous };
		this.commit();
	}

	private discardProposal(): void {
		const prev = this.proposal?.previous ?? null;
		this.proposal = null;
		if (prev) {
			this.restore(prev);
			this.history.record(prev);
		}
		this.renderBanner();
	}

	private renderHeader(): void {
		const e = this.elHeader;
		clear(e);
		this.elName.value = this.rig?.name ?? '';
		this.elName.disabled = !this.rig;
		const dirty = !!this.rig && this.snapshot() !== this.savedSnapshot;
		e.append(
			h('div', { class: 'fusa-brand' }, h('small', null, 'Fabula Ultima'), h('b', null, 'Sprite Animation Studio')),
			h('div', { class: 'fusa-file' }, this.elName, dirty ? h('span', { class: 'fusa-dirty', title: 'Unsaved changes' }, '●') : null),
			h(
				'div',
				{ class: 'fusa-actions' },
				ibtn('image', 'New rig from a sprite', () => this.importImage()),
				ibtn('open', 'Open a saved rig', () => this.openDialog()),
				ibtn('save', 'Save (Ctrl+S)', () => this.save(), { disabled: !this.rig }),
				h('span', { class: 'sep' }),
				ibtn('import', 'Import a rig file (.json)', () => this.importBundle()),
				ibtn('export', 'Export this rig with its image (.json)', () => this.exportBundle(), { disabled: !this.rig }),
				this.host.assignToActor ? ibtn('user', 'Use this rig for an actor', () => this.assign(), { disabled: !this.rig }) : null,
				h('span', { class: 'sep' }),
				ibtn('undo', 'Undo (Ctrl+Z)', () => this.undo(), { disabled: !this.history.canUndo }),
				ibtn('redo', 'Redo (Ctrl+Shift+Z)', () => this.redo(), { disabled: !this.history.canRedo }),
			),
			h(
				'nav',
				{ class: 'fusa-modes', role: 'tablist' },
				...MODES.map((m, i) => h('button', { type: 'button', role: 'tab', class: m.id === this.mode ? 'active' : '', 'aria-selected': String(m.id === this.mode), title: `${m.label} (${i + 1})`, disabled: !this.rig, onclick: () => this.setMode(m.id) }, h('span', { class: 'num' }, String(i + 1)), m.label)),
			),
		);
	}

	private boneOf(id: string | null): BoneData | undefined {
		return id ? this.rig?.bones.find((b) => b.id === id) : undefined;
	}

	private partOf(boneId: string | null): PartData | undefined {
		return boneId ? this.rig?.parts.find((p) => p.bone === boneId) : undefined;
	}

	private renderTree(): void {
		const e = this.elTree;
		clear(e);
		if (!this.rig) return;
		const counts = new Map<number, number>();
		if (this.labels) for (const v of this.labels) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
		const row = (b: BoneData, depth: number) => {
			const part = this.partOf(b.id);
			const n = part ? (counts.get(part.label) ?? 0) : 0;
			const el = h(
				'div',
				{ class: `fusa-node ${b.id === this.selected ? 'selected' : ''}`, role: 'treeitem', style: `--depth:${depth}`, title: b.role ? `Role: ${b.role}` : 'No role', dataset: { id: b.id }, onclick: () => this.select(b.id), ondblclick: () => this.renameInline(b) },
				h('span', { class: 'swatch', style: `background:${b.color ?? '#c9a7ff'}` }),
				h('span', { class: 'label' }, b.name),
				part ? h('span', { class: 'px', title: `${n} pixels, ${part.deform}` }, n ? String(n) : '—') : h('span', { class: 'px none', title: 'No pixels of its own' }, '·'),
			);
			e.append(el);
			for (const c of childrenOf(this.rig!, b.id)) row(c, depth + 1);
		};
		for (const r of childrenOf(this.rig, null)) row(r, 0);
	}

	private renameInline(b: BoneData): void {
		const el = [...this.elTree.querySelectorAll<HTMLElement>('.fusa-node')].find((n) => n.dataset.id === b.id);
		const label = el?.querySelector('.label');
		if (!label) return;
		const input = h('input', { class: 'fusa-rename', value: b.name });
		label.replaceWith(input);
		input.focus();
		input.select();
		let finished = false;
		const done = (ok: boolean) => {
			if (finished) return;
			finished = true;
			if (ok && input.value.trim() && input.value.trim() !== b.name) {
				updateBone(this.rig!, b.id, { name: input.value });
				const part = this.partOf(b.id);
				if (part) part.name = b.name;
				this.commit();
			} else this.renderTree();
		};
		input.addEventListener('keydown', (ev) => {
			ev.stopPropagation();
			if (ev.key === 'Enter') done(true);
			if (ev.key === 'Escape') done(false);
		});
		input.addEventListener('blur', () => done(true));
	}

	private field(label: string, control: HTMLElement, hint?: string): HTMLElement {
		return h('label', { class: 'fusa-field', title: hint ?? '' }, h('span', null, label), control);
	}

	private renderInspector(): void {
		const e = this.elInspector;
		clear(e);
		const rig = this.rig;
		if (!rig) {
			e.append(h('p', { class: 'fusa-muted' }, 'No rig yet.'));
			return;
		}
		if (this.mode === 'animate' && this.editing) return this.renderClipInspector(e, rig);
		const b = this.boneOf(this.selected);
		if (!b) {
			this.renderRigSettings(e, rig);
			return;
		}
		const name = h('input', { type: 'text', value: b.name });
		name.addEventListener('change', () => {
			updateBone(rig, b.id, { name: name.value });
			this.commit();
		});
		const roles = h('select', null, h('option', { value: '' }, '— none —'), ...[...new Set([...KNOWN_ROLES, ...(b.role ? [b.role] : [])])].map((r) => h('option', { value: r, selected: r === b.role }, r)));
		roles.addEventListener('change', () => {
			updateBone(rig, b.id, { role: roles.value });
			this.commit();
		});
		const below = descendants(rig, b.id);
		const parent = h('select', null, h('option', { value: '' }, '— root —'), ...rig.bones.filter((x) => x.id !== b.id && !below.has(x.id)).map((x) => h('option', { value: x.id, selected: x.id === b.parent }, x.name)));
		parent.addEventListener('change', () => {
			try {
				reparent(rig, b.id, parent.value || null);
				this.commit();
			} catch (err) {
				this.host.notify((err as Error).message, 'warn');
				this.renderInspector();
			}
		});
		const colour = h('input', { type: 'color', value: b.color ?? '#c9a7ff' });
		colour.addEventListener('change', () => {
			updateBone(rig, b.id, { color: colour.value });
			this.commit();
		});
		const f = bonesToFrames(rig.bones).get(b.id)!;
		e.append(
			h('div', { class: 'fusa-insp-title' }, h('span', { class: 'swatch', style: `background:${b.color}` }), 'Bone'),
			this.field('Name', name),
			this.field('Role', roles, 'What this bone is. Animations move bones by role, so any rig with the role plays them.'),
			this.field('Parent', parent),
			this.field('Colour', colour),
			h('div', { class: 'fusa-readout' }, `Joint ${f.x.toFixed(1)}, ${f.y.toFixed(1)} · angle ${wrapDeg(f.angle).toFixed(0)}° · length ${f.length.toFixed(1)}px`),
		);
		const part = this.partOf(b.id);
		e.append(h('div', { class: 'fusa-insp-title' }, 'Art'));
		if (!part) {
			e.append(h('p', { class: 'fusa-muted' }, 'This bone moves no pixels of its own.'), h('button', { type: 'button', class: 'fusa-btn', onclick: () => (ensurePart(rig, b.id), this.commit(), this.setMode('paint')) }, icon('brush'), 'Give it pixels'));
			return;
		}
		const deform = h('div', { class: 'fusa-seg' }, ...(['rigid', 'mesh'] as const).map((d) => h('button', { type: 'button', class: part.deform === d ? 'active' : '', title: d === 'rigid' ? 'Moves as one piece: crisp, best for heads, hands and weapons.' : 'Bends at its joints: smooth elbows, knees and waists.', onclick: () => (updatePart(rig, part.id, { deform: d }), this.commit()) }, d === 'rigid' ? 'Rigid' : 'Bend')));
		e.append(this.field('Deformation', deform));
		if (part.deform === 'mesh') {
			e.append(
				slider('Joint softness', part.softness, 0, 0.12, 0.005, (v) => updatePart(rig, part.id, { softness: v }), (v) => `${Math.round(v * 100)}%`),
				slider('Stiffness', part.stiffness, 0, 1, 0.05, (v) => updatePart(rig, part.id, { stiffness: v }), (v) => `${Math.round(v * 100)}%`),
			);
			e.querySelectorAll<HTMLInputElement>('.fusa-slider input').forEach((i) => i.addEventListener('change', () => this.commit()));
		}
		const fill = h('input', { type: 'checkbox', checked: part.fill });
		fill.addEventListener('change', () => (updatePart(rig, part.id, { fill: fill.checked }), this.commit()));
		e.append(
			h('label', { class: 'fusa-check', title: 'When parts in front of this one move away, show copies of this part’s own nearest pixels instead of a hole. The visible art is never changed.' }, fill, 'Fill what is hidden behind other parts'),
			this.field(
				'Draw order',
				h(
					'div',
					{ class: 'fusa-seg' },
					h('button', { type: 'button', title: 'To the back', onclick: () => (movePart(rig, part.id, 'back'), this.commit()) }, '⇤'),
					h('button', { type: 'button', title: 'One step back', onclick: () => (movePart(rig, part.id, -1), this.commit()) }, icon('down')),
					h('button', { type: 'button', title: 'One step forward', onclick: () => (movePart(rig, part.id, 1), this.commit()) }, icon('up')),
					h('button', { type: 'button', title: 'To the front', onclick: () => (movePart(rig, part.id, 'front'), this.commit()) }, '⇥'),
				),
			),
			h('div', { class: 'fusa-readout' }, `Layer ${rig.parts.indexOf(part) + 1} of ${rig.parts.length}`),
			h('button', { type: 'button', class: 'fusa-btn subtle', onclick: () => (removePart(rig, part.id, this.labels, this.partOf(b.parent)?.label ?? 0), this.commit()) }, 'Give its pixels to the parent'),
		);
	}

	private renderRigSettings(e: HTMLElement, rig: RigDocument): void {
		const r = rig.render;
		const mode = h('div', { class: 'fusa-seg' }, ...(['pixel', 'smooth'] as const).map((m) => h('button', { type: 'button', class: r.mode === m ? 'active' : '', title: m === 'pixel' ? 'Nearest-neighbour: every original pixel stays a crisp square of its own colour.' : 'Smooth sampling for painted, high-resolution sprites.', onclick: () => ((r.mode = m), (r.snap = m === 'pixel'), this.commit()) }, m === 'pixel' ? 'Pixel art' : 'Illustration')));
		const facing = h('div', { class: 'fusa-seg' }, ...(['left', 'right'] as const).map((f) => h('button', { type: 'button', class: rig.facing === f ? 'active' : '', onclick: () => ((rig.facing = f), this.commit()) }, f === 'left' ? '← Left' : 'Right →')));
		e.append(
			h('div', { class: 'fusa-insp-title' }, 'Rig'),
			h('p', { class: 'fusa-muted' }, `${rig.image.width}×${rig.image.height}px sprite, body ${rig.metrics.bodyHeight}px tall, ${rig.bones.length} bones, ${rig.parts.length} parts. Select a bone to edit it.`),
			this.field('Rendering', mode),
			this.field('Character faces', facing, 'Animations are written for a right-facing character and mirrored for left-facing ones.'),
			slider('Room around the sprite', r.padding, 0, 1, 0.05, (v) => (r.padding = v), (v) => `${Math.round(v * 100)}%`),
			slider('Idle frame rate', r.idleFps, 0, 30, 1, (v) => (r.idleFps = v), (v) => (v ? `${v} fps` : 'every frame')),
		);
		e.querySelectorAll<HTMLInputElement>('.fusa-slider input').forEach((i) => i.addEventListener('change', () => this.commit()));
	}

	private renderIssues(): void {
		const e = this.elIssues;
		clear(e);
		if (!this.rig) return;
		if (!this.issues.length) {
			e.append(h('div', { class: 'fusa-issue ok' }, '✓ Ready to animate'));
			return;
		}
		for (const i of this.issues) e.append(h('div', { class: `fusa-issue ${i.level}`, onclick: () => i.partId && this.select(this.rig!.parts.find((p) => p.id === i.partId)?.bone ?? null) }, i.level === 'info' ? 'ℹ ' : icon('warn'), i.message));
	}

	private renderLibrary(): void {
		const e = this.elLibrary;
		clear(e);
		const groups = new Map<string, ClipDocument[]>();
		// clips this rig can play first; the others stay listed, dimmed
		const rank = (c: ClipDocument) => (!this.rig ? 0 : !this.canPlay(c) ? 2 : (c.templates?.includes(this.rig.template) ?? true) ? 0 : 1);
		const all = listClips().sort((a, b) => rank(a) - rank(b));
		for (const c of all) groups.set(c.category, [...(groups.get(c.category) ?? []), c]);
		for (const [cat, clips] of groups) {
			e.append(
				h(
					'div',
					{ class: 'fusa-group' },
					h('div', { class: 'fusa-cat' }, CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat),
					h(
						'div',
						{ class: 'fusa-cards' },
					...clips.map((c) => {
						const isBase = isBaseLoop(c);
						const active = isBase ? this.baseId === c.id : this.clipId === c.id;
						const fits = !this.rig || this.canPlay(c);
						const tip = fits ? (c.description ?? c.name) : `${c.description ?? c.name}\nThis rig lacks: ${(c.requires ?? []).filter((r) => !this.rig!.bones.some((b) => b.role === r)).join(', ')}`;
						return h('button', { type: 'button', class: `fusa-card ${active ? 'active' : ''} ${isBase ? 'base' : ''} ${fits ? '' : 'unfit'}`, title: tip, disabled: !this.rig, dataset: { clip: c.id }, onclick: () => this.chooseClip(c) }, h('b', null, c.name), h('small', null, isBase ? 'Idle loop' : `${c.duration.toFixed(2)}s${isBuiltIn(c.id) ? '' : ' · yours'}`));
						}),
					),
				),
			);
		}
	}

	private renderTransport(): void {
		const e = this.elTransport;
		clear(e);
		const disabled = !this.rig;
		e.append(
			ibtn(this.playing ? 'pause' : 'play', this.playing ? 'Pause (Space)' : 'Play (Space)', () => this.togglePlay(), { class: 'big', disabled }),
			ibtn('stop', 'Back to the start', () => this.restart(), { disabled }),
			ibtn('loop', 'Loop the animation', () => ((this.loop = !this.loop), this.renderTransport()), { class: this.loop ? 'on' : '', disabled }),
			h('div', { class: 'fusa-clipname' }, h('small', null, this.editing ? 'Editing (alone, at its own timing)' : `Over ${getClip(this.baseId)?.name ?? 'nothing'}`), h('b', null, getClip(this.clipId)?.name ?? '')),
			slider('Speed', this.speed, 0.25, 2, 0.05, (v) => (this.speed = v), (v) => `${v.toFixed(2)}×`),
			slider('Intensity', this.intensity, 0, 1.5, 0.05, (v) => ((this.intensity = v), this.replayIfPaused()), (v) => `${Math.round(v * 100)}%`),
			slider('Wind-up', this.timing.anticipation, 0.5, 2, 0.05, (v) => ((this.timing.anticipation = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			slider('Strike', this.timing.action, 0.5, 2, 0.05, (v) => ((this.timing.action = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			slider('Recovery', this.timing.recovery, 0.5, 2, 0.05, (v) => ((this.timing.recovery = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			h('label', { class: 'fusa-check', title: 'Each play varies a little (amplitude and speed), so repeated attacks do not look identical.' }, h('input', { type: 'checkbox', checked: this.variation > 0, onchange: (ev: Event) => ((this.variation = (ev.target as HTMLInputElement).checked ? 1 : 0), this.restart()) }), 'Vary'),
			ibtn('dice', 'Another variation', () => ((this.seed++, this.variation ||= 1), this.restart()), { disabled }),
			h('span', { class: 'grow' }),
			h('button', { type: 'button', class: `fusa-btn small ${this.onion ? 'on' : ''}`, title: 'Show faint frames just before and after the play head', disabled, onclick: () => this.setOnion(!this.onion) }, icon('eye'), 'Ghosts'),
			h('button', { type: 'button', class: `fusa-btn small ${this.editing ? 'primary' : ''}`, title: 'Edit the keys of this animation: pose bones at the play head (Ctrl-drag: IK), drag keys on the timeline', disabled, onclick: () => this.setEditing(!this.editing) }, icon('brush'), this.editing ? 'Editing keys' : 'Edit keys'),
		);
	}

	private renderToolbar(): void {
		const e = this.elToolbar;
		clear(e);
		if (!this.rig) return;
		const toggles = h(
			'div',
			{ class: 'fusa-seg small' },
			h('button', { type: 'button', class: this.showBones ? 'active' : '', title: 'Show bones', onclick: () => ((this.showBones = !this.showBones), this.renderToolbar()) }, icon('bone'), 'Bones'),
			h('button', { type: 'button', class: this.showRegions ? 'active' : '', title: 'Show which pixels belong to which bone', onclick: () => ((this.showRegions = !this.showRegions), this.refreshRegions(), this.renderToolbar()) }, icon('brush'), 'Regions'),
		);
		const tools: HTMLElement[] = [];
		if (this.mode === 'rig') tools.push(h('div', { class: 'fusa-seg small' }, h('button', { type: 'button', class: this.tool !== 'add' ? 'active' : '', onclick: () => this.setTool('select') }, 'Move'), h('button', { type: 'button', class: this.tool === 'add' ? 'active' : '', onclick: () => this.setTool('add') }, icon('add'), 'Add bone')));
		if (this.mode === 'paint') {
			tools.push(
				h(
					'div',
					{ class: 'fusa-seg small' },
					h('button', { type: 'button', class: this.tool === 'brush' ? 'active' : '', onclick: () => this.setTool('brush') }, icon('brush'), 'Brush'),
					h('button', { type: 'button', class: this.tool === 'bucket' ? 'active' : '', onclick: () => this.setTool('bucket') }, icon('bucket'), 'Bucket'),
					h('button', { type: 'button', class: this.tool === 'hidden' ? 'active' : '', title: 'Extend the selected part under the parts in front of it (what shows when they move away). Cyan: the automatic fill; gold: your additions. Right-click removes.', onclick: () => this.setTool('hidden') }, icon('eye'), 'Hidden'),
				),
				slider('Size', this.brushSize, 0.5, 12, 0.5, (v) => (this.brushSize = v), (v) => `${v}px`),
			);
		}
		if (this.mode === 'pose') tools.push(h('button', { type: 'button', class: 'fusa-btn small', onclick: () => ((this.pose.clear(), (this.poseDirty = true))) }, icon('reset'), 'Reset pose'));
		e.append(...tools, h('span', { class: 'grow' }), toggles, ibtn('fit', 'Fit to view (F)', () => this.viewport.fit()));
	}

	private renderStatus(): void {
		const e = this.elStatus;
		clear(e);
		if (!this.rig) return;
		const m = MODES.find((x) => x.id === this.mode)!;
		const z = this.viewport.zoom;
		const hint = this.tool === 'add' && this.mode === 'rig' ? 'Drag from where the new bone starts to where it ends. It joins the selected bone.' : this.mode === 'animate' && this.editing ? 'Drag a bone to key its turn, Shift-drag to key its position, Ctrl-drag a hand or foot for IK. K: key turn, ←/→: step, Del: delete key, Ctrl+Z: undo.' : m.hint;
		const parts: (HTMLElement | null)[] = [h('span', { class: 'hint' }, hint), h('span', { class: 'grow' }), this.cursor ? h('span', null, `${Math.floor(this.cursor.x)}, ${Math.floor(this.cursor.y)}`) : null, h('span', null, `${Math.round(z * 100)}%`), this.lastEvent && this.mode === 'animate' ? h('span', { class: 'event' }, this.lastEvent) : null];
		for (const p of parts) if (p) e.append(p);
	}

	/* ------------------------------------------------------------------ */
	/*  Document lifecycle                                                 */
	/* ------------------------------------------------------------------ */

	private snapshot(): string {
		return this.rig ? JSON.stringify(this.rig) : '';
	}

	/** Load an image URL and start a new rig on it. */
	async newFromImage(src: string, name?: string): Promise<void> {
		let { data } = await loadImageData(src);
		if (data.width * data.height > 4096 * 4096) throw new Error('This image is too large (over 4096×4096).');
		const base = name ?? decodeURIComponent(src.split('/').pop() ?? 'Sprite').replace(/\.[a-z0-9]+(\?.*)?$/i, '');
		const bg = detectBackground(data);
		if (bg) {
			const [r, g, b] = bg.color;
			const ok = await this.host.confirm('Solid background', `This sprite has a solid background (rgb ${r}, ${g}, ${b}) instead of transparency, so it would show as a box on the map. Save a transparent copy and use that? Your original file is not changed.`);
			if (ok) {
				const { image } = removeBackground(data, bg);
				const canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
				src = await this.host.storeImage(`${base.replace(/[^a-z0-9_-]+/gi, '_')}-transparent.png`, canvas.toDataURL('image/png'));
				data = (await loadImageData(src)).data;
			}
		}
		const rig = createRig({ name: base, src, image: data, template: 'humanoid' });
		this.setRig(rig, data, false);
	}

	/** Show a rig (and its image). */
	setRig(rig: RigDocument, image: ImageData, saved: boolean): void {
		this.rig = rig;
		this.image = image;
		this.labels = rigLabels(rig);
		this.hints = rigHints(rig);
		this.selected = null;
		this.pose.clear();
		const report = lastReport.get(rig);
		this.proposal = report && !saved ? { report, previous: null } : null;
		this.fitBaseLoop();
		this.history.reset(this.snapshot());
		this.savedSnapshot = saved ? this.snapshot() : '';
		this.rebuild();
		this.viewport.fit();
		this.validate();
		this.renderAll();
		this.restart();
	}

	async loadRigDocument(rig: RigDocument): Promise<void> {
		const { data } = await loadImageData(rig.image.src);
		if (data.width !== rig.image.width || data.height !== rig.image.height) throw new Error(`The image is now ${data.width}×${data.height}, but the rig was made for ${rig.image.width}×${rig.image.height}.`);
		this.setRig(rig, data, true);
	}

	/** Record the current rig as an undo step and refresh everything. */
	commit(): void {
		if (!this.rig || !this.labels) return;
		this.rig.ownership = encodeRle(this.labels);
		this.rig.fillHints = this.hints && this.hints.some((v) => v) ? encodeRle(this.hints) : null;
		this.rig.updated = Date.now();
		this.history.record(this.snapshot());
		this.needsBuild = true;
		this.validate();
		this.renderAll();
		this.refreshRegions();
	}

	private restore(snap: string | null): void {
		if (!snap || !this.image) return;
		this.rig = JSON.parse(snap) as RigDocument;
		this.labels = rigLabels(this.rig);
		this.hints = rigHints(this.rig);
		if (this.selected && !this.boneOf(this.selected)) this.selected = null;
		this.needsBuild = true;
		this.validate();
		this.renderAll();
		this.refreshRegions();
	}

	undo(): void {
		this.restore(this.history.undo());
	}

	redo(): void {
		this.restore(this.history.redo());
	}

	private validate(): void {
		if (!this.rig) return;
		this.issues = validateRig(this.rig, { image: this.image ?? undefined, labels: this.labels ?? undefined, clips: listClips().filter((c) => c.templates?.includes(this.rig!.template)) });
	}

	/** Rebuild meshes and textures from the rig (after edits that change geometry). */
	private rebuild(): void {
		this.needsBuild = false;
		if (!this.rig || !this.image || !this.labels) return;
		const old = this.view;
		try {
			const build = buildRig(this.rig, this.image, this.labels);
			this.asset = new RigAsset(build);
			this.view = new RigView(this.asset);
		} catch (e) {
			this.host.notify(`Could not build the rig: ${(e as Error).message}`, 'error');
			return;
		}
		old?.destroy();
		this.viewport.setView(this.view, this.rig.render.mode === 'pixel');
		this.refreshRegions();
		this.poseDirty = true;
		if (this.mode === 'animate') this.startClips(this.actionTime);
	}

	private refreshRegions(): void {
		if (!this.rig) return;
		if (this.mode === 'paint' && this.tool === 'hidden') {
			// the selected part (its colour), its automatic fill (cyan) and the GM's additions (gold)
			const part = this.partOf(this.selected);
			const W = this.rig.image.width;
			const H = this.rig.image.height;
			const show = new Uint8Array(W * H);
			if (part && this.labels) {
				for (let i = 0; i < show.length; i++) if (this.labels[i] === part.label) show[i] = 1;
				for (const i of this.view?.build.fills.get(part.label)?.indices ?? []) show[i] = 2;
				if (this.hints) for (let i = 0; i < show.length; i++) if (this.hints[i] === part.label) show[i] = 3;
			}
			const own = this.boneOf(this.selected)?.color ?? '#c9a7ff';
			this.viewport.setRegions(show, W, H, (l) => (l === 1 ? own : l === 2 ? '#5ee6ff' : '#f2c45a'), true);
			this.viewport.setRegionAlpha(0.6);
			return;
		}
		const colour = new Map(this.rig.parts.map((p) => [p.label, this.boneOf(p.bone)?.color ?? '#c9a7ff']));
		const show = this.showRegions && (this.mode === 'rig' || this.mode === 'paint');
		this.viewport.setRegions(this.labels, this.rig.image.width, this.rig.image.height, (l) => colour.get(l) ?? '#ff00ff', show);
		this.viewport.setRegionAlpha(this.mode === 'paint' ? 0.55 : 0.3);
	}

	/* ------------------------------------------------------------------ */
	/*  Modes, tools, selection                                            */
	/* ------------------------------------------------------------------ */

	setMode(mode: Mode): void {
		if (!this.rig) return;
		if (mode !== 'animate' && this.editing) this.editing = false;
		if (mode !== 'animate' && this.onion) this.setOnion(false);
		this.mode = mode;
		this.tool = mode === 'paint' ? 'brush' : 'select';
		this.playing = mode === 'animate';
		if (mode === 'animate') this.startClips(0);
		this.poseDirty = true;
		this.renderAll();
		this.refreshRegions();
		this.root.focus({ preventScroll: true });
	}

	private setTool(tool: Studio['tool']): void {
		this.tool = tool;
		this.renderToolbar();
		this.renderStatus();
		this.refreshRegions();
	}

	select(id: string | null): void {
		if (id === this.selected) return;
		this.selected = id;
		for (const n of this.elTree.querySelectorAll<HTMLElement>('.fusa-node')) n.classList.toggle('selected', n.dataset.id === id);
		this.renderInspector();
	}

	private deleteSelected(): void {
		if (!this.rig || !this.selected) return;
		if (this.rig.bones.length <= 1) return this.host.notify('A rig needs at least one bone.', 'warn');
		deleteBone(this.rig, this.selected, this.labels);
		this.selected = null;
		this.commit();
	}

	private async reassign(): Promise<void> {
		if (!this.rig || !this.image) return;
		if (!(await this.host.confirm('Assign pixels', 'Give every pixel to its nearest bone again? Regions you painted by hand will be replaced. You can undo this.'))) return;
		this.labels = assignPixels(this.rig, this.image);
		this.commit();
	}

	/** Start over from another template (from the tool row, or "What is it?" on the proposal banner). */
	async resetTemplate(t: TemplateId | '', ask = true): Promise<void> {
		(this.elTree.parentElement?.querySelector('.fusa-template') as HTMLSelectElement | null)?.blur();
		if (!t || !this.rig || !this.image) return this.renderAll();
		const name = TEMPLATES[t]?.name ?? t;
		if (ask && !(await this.host.confirm('Start over', `Replace the skeleton with the ${name} template and reassign every pixel? You can undo this.`))) return this.renderAll();
		const previous = this.proposal?.previous ?? this.snapshot();
		// a creature's facing is found again from its own shape
		const fresh = createRig({ name: this.rig.name, src: this.rig.image.src, image: this.image, template: t, facing: t === 'humanoid' || t === 'custom' ? this.rig.facing : undefined });
		Object.assign(this.rig, { template: fresh.template, bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics, facing: fresh.facing });
		this.labels = rigLabels(this.rig);
		this.selected = null;
		const report = lastReport.get(fresh);
		this.proposal = report ? { report, previous } : null;
		this.fitBaseLoop();
		this.commit();
	}

	/** The rig has every role the clip needs. */
	private canPlay(c: ClipDocument): boolean {
		if (!this.rig) return false;
		const roles = new Set(this.rig.bones.map((b) => b.role).filter(Boolean));
		return (c.requires ?? []).every((r) => roles.has(r));
	}

	/** Keep the preview's idle and action suited to this rig (a wolf breathes and bites like a beast). */
	private fitBaseLoop(): void {
		if (!this.rig) return;
		const tpl = this.rig.template;
		const suits = (c: ClipDocument | undefined) => !!c && this.canPlay(c) && (c.templates?.includes(tpl) ?? true);
		if (!suits(getClip(this.baseId))) this.baseId = defaultIdleFor(tpl);
		if (!suits(getClip(this.clipId)) && getClip(defaultActionFor(tpl))) this.clipId = defaultActionFor(tpl);
	}

	/* ------------------------------------------------------------------ */
	/*  Pointer input                                                      */
	/* ------------------------------------------------------------------ */

	private gizmos(): BoneGizmo[] {
		if (!this.rig) return [];
		const posed = (this.mode === 'pose' || this.mode === 'animate') && this.view;
		const out: BoneGizmo[] = [];
		if (posed) {
			const sk = this.view!.skeleton;
			sk.bones.forEach((b, i) => {
				const s = sk.segment(i);
				out.push({ id: b.id, ax: s.ax, ay: s.ay, bx: s.bx, by: s.by, color: b.color ?? '#c9a7ff', selected: b.id === this.selected, hover: this.hover?.id === b.id });
			});
			return out;
		}
		const frames = bonesToFrames(this.rig.bones);
		for (const b of this.rig.bones) {
			const f = frames.get(b.id)!;
			const [bx, by] = tipOf(f);
			let link: [number, number] | null = null;
			if (b.parent) {
				const [px, py] = tipOf(frames.get(b.parent)!);
				if (Math.hypot(px - f.x, py - f.y) > 0.75) link = [px, py];
			}
			out.push({ id: b.id, ax: f.x, ay: f.y, bx, by, color: b.color ?? '#c9a7ff', selected: b.id === this.selected, hover: this.hover?.id === b.id, link });
		}
		if (this.addPreview) out.push({ id: '__new', ...this.addPreview, color: '#ffffff', selected: true, hover: false });
		return out;
	}

	private snap(v: number): number {
		return this.rig?.render.mode === 'pixel' ? Math.round(v * 2) / 2 : Math.round(v * 10) / 10;
	}

	private onDown(x: number, y: number, e: PointerEvent): void {
		if (!this.rig) return;
		this.root.focus({ preventScroll: true });
		const right = e.button === 2;
		if (this.mode === 'rig') {
			if (this.tool === 'add') {
				this.addPreview = { ax: this.snap(x), ay: this.snap(y), bx: this.snap(x), by: this.snap(y) };
				return;
			}
			const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
			if (!hit) return this.select(null);
			if (hit.id !== this.selected) this.select(hit.id);
			this.history.begin();
			const kind = hit.kind === 'origin' && e.shiftKey ? 'body' : hit.kind;
			this.drag = { kind, id: hit.id, lastX: x, lastY: y };
			return;
		}
		if (this.mode === 'paint' && this.tool === 'hidden') {
			const part = this.partOf(this.selected);
			if (!part) return this.host.notify('Select the bone whose part should extend under its neighbours.', 'info');
			this.hints ??= new Uint8Array(this.rig.image.width * this.rig.image.height);
			this.drag = { kind: 'hint', id: String(right ? -part.label : part.label), lastX: x, lastY: y };
			this.hintAt(x, y, right ? -part.label : part.label);
			return;
		}
		if (this.mode === 'paint') {
			const target = this.paintLabel(right);
			if (target === null) return;
			if (this.tool === 'bucket') {
				const n = floodAssign(this.labels!, this.rig.image.width, this.rig.image.height, Math.floor(x), Math.floor(y), target);
				if (n) this.commit();
				return;
			}
			this.drag = { kind: 'paint', id: String(target), lastX: x, lastY: y };
			this.paintAt(x, y, target);
			return;
		}
		if (this.mode === 'animate' && this.editing && this.view) {
			const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
			if (!hit) return;
			this.select(hit.id);
			const b = this.boneOf(hit.id);
			if (!b?.role) return this.host.notify('This bone has no role; set one in Rig mode to animate it.', 'info');
			const sk = this.view.skeleton;
			const i = sk.index.get(hit.id)!;
			const w = sk.world[i]!;
			const kind = e.ctrlKey || e.metaKey ? 'key-ik' : e.shiftKey ? 'key-move' : 'key-rotate';
			this.drag = { kind, id: hit.id, lastX: x, lastY: y, startAngle: Math.atan2(y - w.ty, x - w.tx), startRot: sk.local[i]!.rot, startX: sk.local[i]!.x - x, startY: sk.local[i]!.y - y };
			return;
		}
		if (this.mode === 'pose' && this.view) {
			const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
			if (!hit) return this.select(null);
			this.select(hit.id);
			const sk = this.view.skeleton;
			const i = sk.index.get(hit.id)!;
			const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
			const w = sk.world[i]!;
			if (e.shiftKey && sk.parent[i] === -1) this.drag = { kind: 'translate', id: hit.id, lastX: x, lastY: y, startX: p.x - x, startY: p.y - y };
			else this.drag = { kind: 'rotate', id: hit.id, lastX: x, lastY: y, startAngle: Math.atan2(y - w.ty, x - w.tx), startRot: p.rot };
		}
	}

	private onMove(x: number, y: number, _e: PointerEvent): void {
		const e = _e;
		this.cursor = { x, y };
		if (!this.rig) return;
		if (this.addPreview) {
			this.addPreview.bx = this.snap(x);
			this.addPreview.by = this.snap(y);
			return;
		}
		const d = this.drag;
		if (!d) return this.onHover(x, y, e);
		if (this.mode === 'rig') {
			if (d.kind === 'origin') moveJoint(this.rig, d.id, this.snap(x), this.snap(y));
			else if (d.kind === 'tip') moveTip(this.rig, d.id, this.snap(x), this.snap(y));
			else moveSubtree(this.rig, d.id, x - d.lastX, y - d.lastY);
			d.lastX = x;
			d.lastY = y;
			this.renderInspector();
			return;
		}
		if (this.mode === 'paint' && d.kind === 'hint') {
			const steps = Math.max(1, Math.ceil(Math.hypot(x - d.lastX, y - d.lastY) / Math.max(0.5, this.brushSize / 2)));
			for (let k = 1; k <= steps; k++) this.hintAt(d.lastX + ((x - d.lastX) * k) / steps, d.lastY + ((y - d.lastY) * k) / steps, Number(d.id));
			d.lastX = x;
			d.lastY = y;
			return;
		}
		if (this.mode === 'paint' && d.kind === 'paint') {
			// paint along the stroke so fast moves leave no gaps
			const steps = Math.max(1, Math.ceil(Math.hypot(x - d.lastX, y - d.lastY) / Math.max(0.5, this.brushSize / 2)));
			for (let s = 1; s <= steps; s++) this.paintAt(d.lastX + ((x - d.lastX) * s) / steps, d.lastY + ((y - d.lastY) * s) / steps, Number(d.id));
			d.lastX = x;
			d.lastY = y;
			return;
		}
		if (this.mode === 'animate' && this.editing && this.view && d.kind.startsWith('key-')) {
			const c = this.editClip();
			const rig = this.rig;
			const sk = this.view.skeleton;
			const i = sk.index.get(d.id)!;
			const keyRole = (bi: number, channel: 'rotate' | 'translate') => {
				const role = sk.bones[bi]!.role;
				if (!c || !role) return;
				const k = keyFromPose(c, role, sk, this.actionTime, rig.facing, rig.metrics.bodyHeight);
				if (!k) return;
				if (channel === 'rotate') setRotateKey(c, role, this.actionTime, k.rotate);
				else setVectorKey(c, role, 'translate', this.actionTime, k.translate[0], k.translate[1]);
			};
			if (d.kind === 'key-rotate') {
				const w = sk.world[i]!;
				const a = Math.atan2(y - w.ty, x - w.tx);
				const flip = Math.sign(w.a * w.d - w.b * w.c) || 1;
				sk.local[i]!.rot = d.startRot! + wrapDeg(((a - d.startAngle!) * 180) / Math.PI) * flip;
				d.startRot = sk.local[i]!.rot;
				d.startAngle = a;
				sk.update();
				keyRole(i, 'rotate');
			} else if (d.kind === 'key-move') {
				sk.local[i]!.x = d.startX! + x;
				sk.local[i]!.y = d.startY! + y;
				sk.update();
				keyRole(i, 'translate');
			} else if (solveTwoBone(sk, i, x, y)) {
				keyRole(sk.parent[i]!, 'rotate');
				keyRole(i, 'rotate');
			}
			this.startClips(this.actionTime);
			return;
		}
		if (this.mode === 'pose' && this.view) {
			const sk = this.view.skeleton;
			const i = sk.index.get(d.id)!;
			const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
			if (d.kind === 'rotate' && (_e.ctrlKey || _e.metaKey) && sk.parent[i]! >= 0) {
				// IK: bend the parent and this bone so its tip follows the pointer
				if (solveTwoBone(sk, i, x, y)) {
					for (const bi of [sk.parent[i]!, i]) {
						const q = this.pose.get(bi) ?? { rot: 0, x: 0, y: 0 };
						q.rot = sk.local[bi]!.rot - sk.setup[bi]!.rot;
						this.pose.set(bi, q);
					}
					this.poseDirty = true;
				}
				return;
			}
			if (d.kind === 'rotate') {
				const w = sk.world[i]!;
				const a = Math.atan2(y - w.ty, x - w.tx);
				let delta = ((a - d.startAngle!) * 180) / Math.PI;
				delta = wrapDeg(delta);
				const flip = Math.sign(w.a * w.d - w.b * w.c) || 1;
				p.rot = d.startRot! + delta * flip;
				d.startAngle = a;
				d.startRot = p.rot;
			} else {
				p.x = this.snap(d.startX! + x);
				p.y = this.snap(d.startY! + y);
			}
			this.pose.set(i, p);
			this.poseDirty = true;
		}
	}

	private onUp(x: number, y: number, _e: PointerEvent): void {
		if (!this.rig) return;
		if (this.addPreview) {
			const a = this.addPreview;
			this.addPreview = null;
			if (Math.hypot(a.bx - a.ax, a.by - a.ay) < 1) return this.host.notify('Drag to give the new bone a length.', 'info');
			const parent = this.selected ?? this.rig.bones.find((b) => b.role === 'root')?.id ?? null;
			const b = addBone(this.rig, parent, a.ax, a.ay, a.bx, a.by, { name: `Bone ${this.rig.bones.length + 1}` });
			this.selected = b.id;
			this.tool = 'select';
			this.commit();
			return;
		}
		const d = this.drag;
		this.drag = null;
		if (!d) return;
		if (d.kind.startsWith('key-')) {
			this.clipChanged();
			return;
		}
		if (this.mode === 'rig') {
			this.history.end(this.snapshot());
			this.needsBuild = true;
			this.validate();
			this.renderAll();
		}
		if (this.mode === 'paint') this.commit();
		void x;
		void y;
	}

	private onHover(x: number, y: number, _e: PointerEvent): void {
		this.cursor = { x, y };
		if (!this.rig) return;
		if (this.mode === 'rig' || this.mode === 'pose') {
			const hit = this.viewport.pick(this.gizmos(), x, y, this.selected);
			if (hit?.id !== this.hover?.id || hit?.kind !== this.hover?.kind) this.hover = hit;
			this.viewport.el.style.cursor = hit ? (hit.kind === 'body' ? 'move' : 'crosshair') : this.tool === 'add' ? 'copy' : 'default';
		} else this.viewport.el.style.cursor = this.mode === 'paint' ? 'none' : 'default';
		this.renderStatusSoon();
	}

	private statusTimer = 0;
	private renderStatusSoon(): void {
		if (this.statusTimer) return;
		this.statusTimer = window.setTimeout(() => {
			this.statusTimer = 0;
			if (!this.destroyed) this.renderStatus();
		}, 80);
	}

	/** The label painted by the brush: the selected bone's part (created if needed), or its parent's on right-click. */
	private paintLabel(toParent: boolean): number | null {
		if (!this.rig) return null;
		const b = this.boneOf(this.selected);
		if (!b) {
			this.host.notify('Select the bone whose pixels you want to paint.', 'info');
			return null;
		}
		if (toParent) {
			for (let a = b.parent; a; a = this.boneOf(a)?.parent ?? null) {
				const p = this.partOf(a);
				if (p) return p.label;
			}
			return 0;
		}
		const part = this.partOf(b.id) ?? ensurePart(this.rig, b.id);
		return part.label;
	}

	/** Mark (label > 0) or unmark (label < 0) hidden-region hints under the brush. */
	private hintAt(x: number, y: number, label: number): void {
		if (!this.hints || !this.image || !this.rig) return;
		const W = this.rig.image.width;
		const r = this.brushSize;
		let changed = false;
		for (let py = Math.max(0, Math.floor(y - r)); py <= Math.min(this.rig.image.height - 1, Math.ceil(y + r)); py++) {
			for (let px = Math.max(0, Math.floor(x - r)); px <= Math.min(W - 1, Math.ceil(x + r)); px++) {
				if ((px + 0.5 - x) ** 2 + (py + 0.5 - y) ** 2 > r * r) continue;
				const i = py * W + px;
				if (this.image.data[i * 4 + 3] !== 255) continue;
				const v = label > 0 ? label : this.hints[i] === -label ? 0 : this.hints[i]!;
				if (this.hints[i] !== v) {
					this.hints[i] = v;
					changed = true;
				}
			}
		}
		if (changed) this.refreshRegions();
	}

	private paintAt(x: number, y: number, label: number): void {
		if (!this.labels || !this.image) return;
		if (paintCircle(this.labels, this.image, x, y, this.brushSize, label)) this.refreshRegions();
	}

	/* ------------------------------------------------------------------ */
	/*  Playback                                                           */
	/* ------------------------------------------------------------------ */

	private chooseClip(c: ClipDocument): void {
		if (isBaseLoop(c)) this.baseId = c.id;
		else this.clipId = c.id;
		if (this.mode !== 'animate') this.setMode('animate');
		else {
			this.playing = true;
			this.startClips(0);
			this.renderAll();
		}
	}

	private startClips(at: number): void {
		const v = this.view;
		if (!v) return;
		v.player.clear();
		v.skeleton.resetPose();
		const base = getClip(this.baseId);
		const clip = getClip(this.clipId);
		const plain = this.editing; // keys are edited on the clip alone, at its own timing
		if (base && !plain) v.player.play(base, { track: 0, mixIn: 0 });
		if (clip) {
			v.player.play(clip, {
				track: 1,
				mixIn: plain ? 0 : clip.loop ? 0.2 : 0.08,
				speed: plain ? 1 : this.speed,
				intensity: plain ? 1 : this.intensity,
				timing: plain ? undefined : this.timing,
				variation: plain ? 0 : this.variation,
				seed: this.seed,
				loop: clip.loop,
				onEvent: (name) => {
					this.lastEvent = `● ${name}`;
					this.renderStatusSoon();
				},
			});
			this.warp = new TimeWarp(clip, plain ? {} : this.timing);
		}
		this.actionTime = 0;
		if (at > 0) this.seek(at);
		v.player.update(0);
		v.dirty = true;
	}

	private seek(t: number): void {
		const v = this.view;
		if (!v) return;
		this.actionTime = t;
		v.player.seek(1, t);
		v.player.update(0);
		v.dirty = true;
		this.timeline.set(getClip(this.clipId) ?? null, this.warp, t, this.keyRows().rows);
		if (this.editing) this.renderInspectorSoon();
	}

	private inspTimer = 0;
	private renderInspectorSoon(): void {
		if (this.inspTimer) return;
		this.inspTimer = window.setTimeout(() => {
			this.inspTimer = 0;
			if (!this.destroyed) this.renderInspector();
		}, 120);
	}

	togglePlay(): void {
		if (!this.rig) return;
		if (this.mode !== 'animate') return this.setMode('animate');
		this.playing = !this.playing;
		if (this.playing && !this.view?.player.trackInfo(1)) this.startClips(0);
		this.renderTransport();
	}

	private restart(): void {
		if (this.mode !== 'animate') return;
		this.playing = true;
		this.startClips(0);
		this.renderTransport();
	}

	private retime(): void {
		const clip = getClip(this.clipId);
		if (clip) this.warp = new TimeWarp(clip, this.timing);
		this.restart();
	}

	private replayIfPaused(): void {
		if (!this.playing) this.startClips(this.actionTime);
	}

	/* ------------------------------------------------------------------ */
	/*  Editing clips                                                      */
	/* ------------------------------------------------------------------ */

	private editClip(): ClipDocument | null {
		const c = getClip(this.clipId);
		return c && !isBuiltIn(c.id) ? c : null;
	}

	setEditing(on: boolean): void {
		if (!this.rig) return;
		if (on) {
			let c = getClip(this.clipId);
			if (!c) return;
			if (isBuiltIn(c.id)) {
				// built-in animations stay as they are: edit a copy
				const copy = cloneClip(c, uniqueClipId(`${c.id}-custom`, (id) => !!getClip(id)), `${c.name} (custom)`);
				registerClip(copy);
				this.clipId = copy.id;
				this.persistClip(copy, true);
				this.host.notify(`Editing your own copy: "${copy.name}".`);
				c = copy;
			}
			this.clipHistory.reset(JSON.stringify(c));
			if (this.mode !== 'animate') this.mode = 'animate';
		}
		this.editing = on;
		this.selectedKey = null;
		this.playing = !on;
		this.startClips(on ? this.actionTime : 0);
		this.renderAll();
	}

	private persistClip(clip: ClipDocument, now = false): void {
		clearTimeout(this.clipSaveTimer);
		const save = () => void this.host.saveClip?.(JSON.parse(JSON.stringify(clip))).catch((err) => this.host.notify(`Could not save the animation: ${(err as Error).message}`, 'error'));
		if (now) save();
		else this.clipSaveTimer = window.setTimeout(save, 1200);
	}

	/** After any change to the clip being edited: record undo, save, re-pose. */
	private clipChanged(record = true): void {
		const c = this.editClip();
		if (!c) return;
		if (record) this.clipHistory.record(JSON.stringify(c));
		this.persistClip(c);
		this.startClips(this.actionTime);
		this.renderInspector();
		this.renderLibrary();
	}

	private restoreClip(snap: string | null): void {
		if (!snap) return;
		const c = JSON.parse(snap) as ClipDocument;
		registerClip(c);
		this.clipId = c.id;
		this.persistClip(c);
		this.selectedKey = null;
		this.startClips(this.actionTime);
		this.renderAll();
	}

	private keyRows(): { role: string | null; rows: { label: string; keys: number[]; selected?: number; colour?: string }[] } {
		const c = getClip(this.clipId);
		const role = this.boneOf(this.selected)?.role ?? null;
		if (!this.editing || !c || !role) return { role, rows: [] };
		const tr = c.tracks[role];
		const colours: Record<Channel, string> = { rotate: '#5aa9ff', translate: '#7ad08f', scale: '#c9a7ff', layer: '#f2c45a' };
		return {
			role,
			rows: CHANNELS.map((ch) => ({
				label: CHANNEL_LABEL[ch],
				keys: ((tr?.[ch] as { t: number }[] | undefined) ?? []).map((k) => k.t),
				selected: this.selectedKey && this.selectedKey.role === role && this.selectedKey.channel === ch ? this.selectedKey.index : undefined,
				colour: colours[ch],
			})),
		};
	}

	private selectKeyAt(row: number, index: number): void {
		const { role } = this.keyRows();
		const c = getClip(this.clipId);
		if (!role || !c) return;
		const ch = CHANNELS[row]!;
		const key = (c.tracks[role]?.[ch] as { t: number }[] | undefined)?.[index];
		if (!key) return;
		this.selectedKey = { role, channel: ch, index };
		this.seek(key.t);
		this.renderInspector();
	}

	private moveKeyAt(row: number, index: number, t: number, done: boolean): void {
		const c = this.editClip();
		const { role } = this.keyRows();
		if (!c || !role) return;
		const ch = CHANNELS[row]!;
		const ni = moveClipKey(c, role, ch, this.selectedKey?.index ?? index, t);
		this.selectedKey = { role, channel: ch, index: ni };
		this.actionTime = Math.max(0, Math.min(c.duration, t));
		if (done) this.clipChanged();
		else this.startClips(this.actionTime);
	}

	/** Key the selected bone's current value at the play head. */
	private keyCurrent(channel: 'rotate' | 'translate'): void {
		const c = this.editClip();
		const b = this.boneOf(this.selected);
		if (!c || !b?.role || !this.view || !this.rig) return;
		const k = keyFromPose(c, b.role, this.view.skeleton, this.actionTime, this.rig.facing, this.rig.metrics.bodyHeight);
		if (!k) return;
		if (channel === 'rotate') setRotateKey(c, b.role, this.actionTime, k.rotate);
		else setVectorKey(c, b.role, 'translate', this.actionTime, k.translate[0], k.translate[1]);
		this.clipChanged();
	}

	private deleteSelectedKey(): void {
		const c = this.editClip();
		const k = this.selectedKey;
		if (!c || !k) return;
		removeKey(c, k.role, k.channel, k.index);
		this.selectedKey = null;
		this.clipChanged();
	}

	private renderClipInspector(e: HTMLElement, rig: RigDocument): void {
		const c = this.editClip();
		if (!c) {
			e.append(h('p', { class: 'fusa-muted' }, 'Pick an animation to edit.'));
			return;
		}
		const name = h('input', { type: 'text', value: c.name });
		name.addEventListener('change', () => ((c.name = name.value.trim() || c.name), this.clipChanged()));
		const cats = h('select', null, ...(Object.keys(CATEGORY_LABELS) as ClipCategory[]).map((k) => h('option', { value: k, selected: k === c.category }, CATEGORY_LABELS[k])));
		cats.addEventListener('change', () => ((c.category = cats.value as ClipCategory), this.clipChanged()));
		const dur = h('input', { type: 'number', min: '0.05', max: '10', step: '0.05', value: String(c.duration) });
		dur.addEventListener('change', () => (setDuration(c, Number(dur.value) || c.duration), this.clipChanged()));
		const loop = h('input', { type: 'checkbox', checked: c.loop });
		loop.addEventListener('change', () => ((c.loop = loop.checked), this.clipChanged()));
		e.append(h('div', { class: 'fusa-insp-title' }, 'Animation'), this.field('Name', name), this.field('Category', cats), this.field('Length (s)', dur), h('label', { class: 'fusa-check' }, loop, 'Loops'));

		// the selected bone
		const b = this.boneOf(this.selected);
		e.append(h('div', { class: 'fusa-insp-title' }, 'Bone at ', h('b', null, `${this.actionTime.toFixed(2)}s`)));
		if (!b) e.append(h('p', { class: 'fusa-muted' }, 'Select a bone (list or view). Drag it in the view to set a key; Ctrl-drag a hand or foot to bend the limb (IK). K keys it, Shift+K keys its position.'));
		else if (!b.role) e.append(h('p', { class: 'fusa-muted' }, `${b.name} has no role; animations move bones by role. Set one in Rig mode.`));
		else {
			const role = b.role;
			const tr = c.tracks[role];
			const space = h('div', { class: 'fusa-seg' }, ...(['offset', 'world'] as const).map((sp) => h('button', { type: 'button', class: (tr?.space ?? 'offset') === sp ? 'active' : '', disabled: !!tr?.rotate?.length, title: sp === 'offset' ? 'Turn relative to the rig’s own pose' : 'Point at an on-screen direction, whatever the rig’s pose (strikes). Only before the first turn key.', onclick: () => ((c.tracks[role] ??= {}).space = sp, this.clipChanged()) }, sp === 'offset' ? 'Relative' : 'Screen angle')));
			const roles = [...new Set(rig.bones.map((x) => x.role).filter((r): r is string => !!r && r !== role))];
			const curLayer = [...(tr?.layer ?? [])].filter((k) => k.t <= this.actionTime + 1e-6).pop();
			const layer = h('select', null, h('option', { value: '' }, 'normal order'), ...roles.map((r) => h('option', { value: `behind:${r}`, selected: curLayer?.behind === r }, `behind ${r}`)), ...roles.map((r) => h('option', { value: `front:${r}`, selected: curLayer?.front === r }, `in front of ${r}`)));
			layer.addEventListener('change', () => {
				const [kind, target] = layer.value.split(':');
				setLayerKey(c, role, this.actionTime, kind === 'behind' ? target : undefined, kind === 'front' ? target : undefined);
				this.clipChanged();
			});
			e.append(
				h('div', { class: 'fusa-readout' }, `${b.name} · ${role}`),
				this.field('Turn keys', space),
				h('div', { class: 'fusa-row' }, h('button', { type: 'button', class: 'fusa-btn small', onclick: () => this.keyCurrent('rotate') }, '◆ Key turn'), h('button', { type: 'button', class: 'fusa-btn small', onclick: () => this.keyCurrent('translate') }, '◆ Key position')),
				this.field('Draw from here', layer),
			);
		}

		// the selected key
		const sk = this.selectedKey;
		const key = sk ? (c.tracks[sk.role]?.[sk.channel] as { t: number; e?: Ease }[] | undefined)?.[sk.index] : undefined;
		if (sk && key) {
			const t = h('input', { type: 'number', min: '0', max: String(c.duration), step: '0.01', value: String(key.t) });
			t.addEventListener('change', () => {
				const ni = moveClipKey(c, sk.role, sk.channel, sk.index, Number(t.value));
				this.selectedKey = { ...sk, index: ni };
				this.actionTime = Math.min(c.duration, Number(t.value));
				this.clipChanged();
			});
			const ease = h('select', null, ...EASE_NAMES.map((n) => h('option', { value: n, selected: (typeof key.e === 'string' ? key.e : key.e ? '' : 'linear') === n }, n)), Array.isArray(key.e) ? h('option', { value: '', selected: true }, `curve ${key.e.join(', ')}`) : null);
			ease.addEventListener('change', () => (ease.value && setKeyEase(c, sk.role, sk.channel, sk.index, ease.value as Ease), this.clipChanged()));
			const value = 'v' in key ? `${(key as { v: number }).v.toFixed(1)}°` : 'x' in key ? `${(key as { x: number }).x.toFixed(3)}, ${(key as unknown as { y: number }).y.toFixed(3)}` : 'behind' in key || 'front' in key ? JSON.stringify(key) : 'normal order';
			e.append(h('div', { class: 'fusa-insp-title' }, `Key · ${CHANNEL_LABEL[sk.channel]} · ${sk.role}`), this.field('Time (s)', t), h('div', { class: 'fusa-readout' }, `Value ${value}`));
			if (sk.channel !== 'layer') e.append(this.field('Easing to next', ease));
			e.append(h('button', { type: 'button', class: 'fusa-btn subtle small', onclick: () => this.deleteSelectedKey() }, icon('trash'), 'Delete key (Del)'));
		}

		// events
		const evName = h('input', { type: 'text', placeholder: 'contact', value: '' });
		e.append(
			h('div', { class: 'fusa-insp-title' }, 'Events'),
			...(c.events ?? []).map((ev, i) => h('div', { class: 'fusa-event-row' }, h('span', null, `${ev.t.toFixed(2)}s`), h('b', null, ev.name), ibtn('trash', 'Remove', () => (removeEvent(c, i), this.clipChanged())))),
			h('div', { class: 'fusa-row' }, evName, h('button', { type: 'button', class: 'fusa-btn small', onclick: () => (addEvent(c, this.actionTime, evName.value || 'contact'), this.clipChanged()) }, 'Add at play head')),
		);

		// phases
		const ph = (c.phases ??= {});
		const num = (v: number | undefined, set: (n: number) => void) => {
			const i = h('input', { type: 'number', min: '0', max: String(c.duration), step: '0.01', value: v === undefined ? '' : String(v) });
			i.addEventListener('change', () => (set(Math.max(0, Math.min(c.duration, Number(i.value) || 0))), this.clipChanged()));
			return i;
		};
		const pair = (key: 'anticipation' | 'action' | 'recovery') => h('div', { class: 'fusa-row' }, num(ph[key]?.[0], (n) => (ph[key] = [n, ph[key]?.[1] ?? n])), num(ph[key]?.[1], (n) => (ph[key] = [ph[key]?.[0] ?? 0, n])));
		e.append(h('div', { class: 'fusa-insp-title' }, 'Phases (s)'), this.field('Wind-up', pair('anticipation')), this.field('Strike', pair('action')), this.field('Impact', num(ph.impact, (n) => (ph.impact = n))), this.field('Recovery', pair('recovery')));
	}

	private async duplicateClip(): Promise<void> {
		const c = getClip(this.clipId);
		if (!c) return;
		const copy = cloneClip(c, uniqueClipId(`${c.id}-copy`, (id) => !!getClip(id)), `${c.name} (copy)`);
		registerClip(copy);
		this.clipId = copy.id;
		this.persistClip(copy, true);
		this.startClips(0);
		this.renderAll();
	}

	private async deleteClip(): Promise<void> {
		const c = getClip(this.clipId);
		if (!c) return;
		if (isBuiltIn(c.id)) return this.host.notify('Built-in animations cannot be deleted. Duplicate one to make your own.', 'info');
		if (!(await this.host.confirm('Delete animation', `Delete "${c.name}" from this world?`))) return;
		unregisterClip(c.id);
		await this.host.deleteClip?.(c.id);
		if (!getClip(this.clipId)) this.clipId = 'sword-slash';
		this.editing = false;
		this.startClips(0);
		this.renderAll();
	}

	private exportClip(): void {
		const c = getClip(this.clipId);
		if (c) this.host.download(`${c.id}.fusa-clip.json`, JSON.stringify(c, null, 1));
	}

	private async importClip(): Promise<void> {
		const text = await this.host.pickTextFile('.json,application/json');
		if (!text) return;
		try {
			const c = JSON.parse(text) as ClipDocument;
			if (getClip(c.id)) {
				// never replace an existing animation silently
				c.id = uniqueClipId(c.id, (id) => !!getClip(id));
				c.name = `${c.name} (imported)`;
			}
			registerClip(c);
			this.persistClip(c, true);
			this.clipId = isBaseLoop(c) ? this.clipId : c.id;
			this.startClips(0);
			this.renderAll();
			this.host.notify(`Imported the animation "${c.name}".`);
		} catch (e) {
			this.host.notify(`Could not import: ${(e as Error).message}`, 'error');
		}
	}

	private setOnion(on: boolean): void {
		this.onion = on;
		if (!on) {
			for (const g of this.ghosts) g.destroy();
			this.ghosts = [];
			this.viewport.setGhosts([]);
		}
		this.renderTransport();
	}

	private renderGhosts(): void {
		const v = this.view;
		if (!v || !this.asset) return;
		if (this.ghosts.length !== 2 || this.ghosts[0]!.asset !== this.asset) {
			for (const g of this.ghosts) g.destroy();
			this.ghosts = [new RigView(this.asset), new RigView(this.asset)];
		}
		const clip = getClip(this.clipId);
		const base = getClip(this.baseId);
		const offsets = [-0.1, 0.1];
		this.ghosts.forEach((g, i) => {
			g.player.clear();
			g.skeleton.resetPose();
			if (base && !this.editing) g.player.play(base, { track: 0, mixIn: 0 });
			if (clip) g.player.play(clip, { track: 1, mixIn: 0, intensity: this.editing ? 1 : this.intensity, timing: this.editing ? undefined : this.timing, variation: 0 });
			g.player.seek(1, Math.max(0, this.actionTime + offsets[i]!));
			g.player.update(0);
			g.render(this.viewport.app.renderer);
		});
		this.viewport.setGhosts(this.ghosts.map((g, i) => ({ view: g, tint: i ? 0xff8a8a : 0x8ac4ff, alpha: 0.35 })));
	}

	/* ------------------------------------------------------------------ */
	/*  Frame loop                                                         */
	/* ------------------------------------------------------------------ */

	private frame(dt: number): void {
		if (this.destroyed || !this.rig) return;
		if (this.needsBuild && !this.drag) this.rebuild();
		const v = this.view;
		if (!v) return;
		if (this.mode === 'animate') {
			if (this.playing && !this.editing) {
				v.update(dt * this.speed);
				const info = v.player.trackInfo(1);
				if (info) this.actionTime = info.time;
				else if (this.loop) this.startClips(0);
				else {
					// the action ended and faded back to the idle loop
					this.actionTime = this.timeline.duration;
				}
			}
			this.timeline.set(getClip(this.clipId) ?? null, this.warp, this.actionTime, this.keyRows().rows);
			if (this.onion) this.renderGhosts();
		} else if (this.mode === 'pose') {
			if (this.poseDirty) {
				v.player.clear();
				const sk = v.skeleton;
				sk.resetPose();
				for (const [i, p] of this.pose) {
					sk.local[i]!.rot += p.rot;
					sk.local[i]!.x += p.x;
					sk.local[i]!.y += p.y;
				}
				sk.update();
				v.dirty = true;
				this.poseDirty = false;
			}
		} else if (this.poseDirty) {
			v.player.clear();
			v.skeleton.resetPose();
			v.skeleton.update();
			v.dirty = true;
			this.poseDirty = false;
		}
		if (v.dirty) v.render(this.viewport.app.renderer);
		const brush = this.mode === 'paint' && this.cursor && (this.tool === 'brush' || this.tool === 'hidden') ? { x: this.cursor.x, y: this.cursor.y, r: this.brushSize } : null;
		this.viewport.drawBones(this.gizmos(), this.showBones || this.mode === 'rig' || this.mode === 'pose', brush);
	}

	/* ------------------------------------------------------------------ */
	/*  Files                                                              */
	/* ------------------------------------------------------------------ */

	async importImage(): Promise<void> {
		if (this.rig && this.snapshot() !== this.savedSnapshot && !(await this.host.confirm('Unsaved changes', 'Start a new rig? Unsaved changes to this one will be lost.'))) return;
		const src = await this.host.pickImage();
		if (!src) return;
		try {
			await this.newFromImage(src);
		} catch (e) {
			this.host.notify((e as Error).message, 'error');
		}
	}

	async save(): Promise<boolean> {
		if (!this.rig) return false;
		if (!isUsable(this.issues) && !(await this.host.confirm('Save with problems?', 'The rig check found problems that would make the character look wrong on tokens. Save anyway?'))) return false;
		this.rig.ownership = encodeRle(this.labels!);
		this.rig.revision++;
		this.rig.updated = Date.now();
		try {
			await this.host.saveRig(cloneRig(this.rig));
			this.savedSnapshot = this.snapshot();
			this.history.record(this.savedSnapshot);
			this.host.notify(`Saved "${this.rig.name}".`);
			this.renderHeader();
			return true;
		} catch (e) {
			this.host.notify(`Could not save: ${(e as Error).message}`, 'error');
			return false;
		}
	}

	private async openDialog(): Promise<void> {
		let rigs: RigSummary[] = [];
		try {
			rigs = await this.host.listRigs();
		} catch (e) {
			return this.host.notify((e as Error).message, 'error');
		}
		const close = () => overlay.remove();
		const overlay = h(
			'div',
			{ class: 'fusa-overlay', onclick: (e: Event) => e.target === overlay && close() },
			h(
				'div',
				{ class: 'fusa-dialog' },
				h('div', { class: 'fusa-panel-title' }, 'Saved rigs'),
				rigs.length
					? h(
							'div',
							{ class: 'fusa-rig-list' },
							...rigs
								.sort((a, b) => b.updated - a.updated)
								.map((r) =>
									h(
										'button',
										{
											type: 'button',
											class: 'fusa-rig-item',
											onclick: async () => {
												close();
												if (this.hasUnsavedChanges && !(await this.host.confirm('Unsaved changes', `Open "${r.name}"? Unsaved changes to this rig will be lost.`))) return;
												try {
													await this.loadRigDocument(await this.host.loadRig(r.id));
												} catch (e) {
													this.host.notify(`Could not open "${r.name}": ${(e as Error).message}`, 'error');
												}
											},
										},
										h('img', { src: r.image, alt: '' }),
										h('b', null, r.name),
										h('small', null, new Date(r.updated).toLocaleString()),
									),
								),
						)
					: h('p', { class: 'fusa-muted' }, 'No saved rigs yet.'),
				h('div', { class: 'fusa-dialog-actions' }, h('button', { type: 'button', class: 'fusa-btn', onclick: close }, 'Close')),
			),
		);
		this.root.append(overlay);
	}

	private async exportBundle(): Promise<void> {
		if (!this.rig) return;
		const res = await fetch(this.rig.image.src);
		const blob = await res.blob();
		const image = await new Promise<string>((resolve, reject) => {
			const r = new FileReader();
			r.onload = () => resolve(String(r.result));
			r.onerror = () => reject(r.error);
			r.readAsDataURL(blob);
		});
		this.rig.ownership = encodeRle(this.labels!);
		const bundle: Bundle = { format: 'fusa-bundle', version: 1, rig: cloneRig(this.rig), image };
		this.host.download(`${this.rig.name.replace(/[^a-z0-9-_]+/gi, '_') || 'rig'}.fusa.json`, JSON.stringify(bundle));
	}

	private async importBundle(): Promise<void> {
		const text = await this.host.pickTextFile('.json,application/json');
		if (!text) return;
		try {
			const data = JSON.parse(text) as Partial<Bundle> & { format?: string };
			const rig = parseRig(data.format === 'fusa-bundle' ? data.rig : data);
			if (data.format === 'fusa-bundle' && typeof data.image === 'string' && data.image.startsWith('data:image/')) {
				const ext = data.image.slice(11, data.image.indexOf(';')) || 'png';
				rig.image.src = await this.host.storeImage(`${rig.name.replace(/[^a-z0-9-_]+/gi, '_')}.${ext === 'webp' ? 'webp' : 'png'}`, data.image);
			}
			await this.loadRigDocument(rig);
			this.savedSnapshot = '';
			this.renderHeader();
			this.host.notify(`Imported "${rig.name}". Save it to keep it in this world.`);
		} catch (e) {
			this.host.notify(`Could not import: ${(e as Error).message}`, 'error');
		}
	}

	private async assign(): Promise<void> {
		if (!this.rig || !this.host.assignToActor) return;
		if (this.snapshot() !== this.savedSnapshot && !(await this.save())) return;
		await this.host.assignToActor(this.rig);
	}

	/* ------------------------------------------------------------------ */
	/*  Keyboard                                                           */
	/* ------------------------------------------------------------------ */

	private onKey = (e: KeyboardEvent) => {
		const t = e.target as HTMLElement;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
		const mod = e.ctrlKey || e.metaKey;
		let handled = true;
		if (this.editing && this.mode === 'animate' && mod && e.key.toLowerCase() === 'z') this.restoreClip(e.shiftKey ? this.clipHistory.redo() : this.clipHistory.undo());
		else if (this.editing && this.mode === 'animate' && mod && e.key.toLowerCase() === 'y') this.restoreClip(this.clipHistory.redo());
		else if (this.editing && this.mode === 'animate' && (e.key === 'Delete' || e.key === 'Backspace')) this.deleteSelectedKey();
		else if (this.editing && this.mode === 'animate' && (e.key === 'k' || e.key === 'K')) this.keyCurrent(e.shiftKey ? 'translate' : 'rotate');
		else if (this.mode === 'animate' && !this.playing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) this.seek(Math.max(0, Math.min(this.timeline.duration, this.actionTime + (e.key === 'ArrowLeft' ? -1 : 1) / 30)));
		else if (mod && e.key.toLowerCase() === 'z') e.shiftKey ? this.redo() : this.undo();
		else if (mod && e.key.toLowerCase() === 'y') this.redo();
		else if (mod && e.key.toLowerCase() === 's') void this.save();
		else if (e.key === 'Delete' || e.key === 'Backspace') this.mode === 'rig' ? this.deleteSelected() : (handled = false);
		else if (e.key === ' ') this.togglePlay();
		else if (e.key === 'f' || e.key === 'F') this.viewport.fit();
		else if (['1', '2', '3', '4'].includes(e.key) && !mod) this.setMode(MODES[Number(e.key) - 1]!.id);
		else if (e.key === '[') this.brushSize = Math.max(0.5, this.brushSize - 0.5);
		else if (e.key === ']') this.brushSize = Math.min(12, this.brushSize + 0.5);
		else if (e.key === 'Escape') (this.tool = 'select'), (this.addPreview = null), this.renderToolbar();
		else handled = false;
		if (handled) {
			// keep Foundry's own shortcuts (delete token, undo on canvas…) out of the Studio
			e.preventDefault();
			e.stopPropagation();
		}
	};

	get hasUnsavedChanges(): boolean {
		return !!this.rig && this.snapshot() !== this.savedSnapshot;
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		clearTimeout(this.statusTimer);
		clearTimeout(this.clipSaveTimer);
		clearTimeout(this.inspTimer);
		for (const g of this.ghosts) g.destroy();
		this.ghosts = [];
		this.view?.destroy();
		this.view = null;
		this.timeline.destroy();
		this.viewport.destroy();
		this.root.remove();
	}
}
