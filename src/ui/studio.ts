import { TimeWarp } from '../core/clip';
import { wrapDeg } from '../core/math';
import type { BoneData, ClipDocument, PartData, PhaseTiming, RigDocument, TemplateId } from '../core/types';
import { CATEGORY_LABELS, getClip, listClips } from '../presets';
import { buildRig } from '../rig/build';
import { assignPixels, cloneRig, createRig, parseRig, rigLabels } from '../rig/document';
import { addBone, childrenOf, deleteBone, descendants, ensurePart, moveJoint, movePart, moveSubtree, moveTip, removePart, reparent, updateBone, updatePart } from '../rig/edit';
import { bonesToFrames, tipOf } from '../rig/frames';
import { History } from '../rig/history';
import { KNOWN_ROLES } from '../rig/templates';
import { isUsable, validateRig, type RigIssue } from '../rig/validate';
import { RigAsset, RigView, loadImageData } from '../render/pixi';
import { floodAssign, paintCircle } from '../sprite/ownership';
import { encodeRle } from '../sprite/rle';
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
}

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

const IDLE_IDS = ['idle-breathing', 'combat-stance'];

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
	tool: 'select' | 'add' | 'brush' | 'bucket' = 'select';
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
		center.append(this.elToolbar, this.elEmpty, this.elStatus);
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
		this.timeline = new Timeline((t) => this.seek(t));
		bottom.append(h('div', { class: 'fusa-bottom-left' }, h('div', { class: 'fusa-panel-title' }, 'Animation library'), this.elLibrary), h('div', { class: 'fusa-bottom-right' }, this.elTransport, this.timeline.el));
		this.root.append(this.elHeader, left, center, right, bottom);
	}

	private toolRow(): HTMLElement {
		return h(
			'div',
			{ class: 'fusa-toolrow' },
			ibtn('add', 'Add a bone (drag in the view from joint to tip)', () => this.setTool(this.tool === 'add' ? 'select' : 'add'), { class: 'tool-add' }),
			ibtn('trash', 'Delete the selected bone (Del)', () => this.deleteSelected()),
			ibtn('wand', 'Assign every pixel to its nearest bone (replaces painted regions)', () => this.reassign()),
			h(
				'select',
				{ class: 'fusa-template', title: 'Start over from a template', onchange: (e: Event) => this.resetTemplate((e.target as HTMLSelectElement).value as TemplateId) },
				h('option', { value: '' }, 'Template…'),
				h('option', { value: 'humanoid' }, 'Humanoid'),
				h('option', { value: 'custom' }, 'Custom (one bone)'),
			),
		);
	}

	/* ------------------------------------------------------------------ */
	/*  Rendering the panels                                               */
	/* ------------------------------------------------------------------ */

	private renderAll(): void {
		this.root.dataset.mode = this.mode;
		this.root.classList.toggle('has-rig', !!this.rig);
		this.renderHeader();
		this.renderTree();
		this.renderInspector();
		this.renderIssues();
		this.renderLibrary();
		this.renderTransport();
		this.renderToolbar();
		this.renderStatus();
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
				{ class: `fusa-node ${b.id === this.selected ? 'selected' : ''}`, role: 'treeitem', style: `--depth:${depth}`, title: b.role ? `Role: ${b.role}` : 'No role', onclick: () => this.select(b.id), ondblclick: () => this.renameInline(el, b) },
				h('span', { class: 'swatch', style: `background:${b.color ?? '#c9a7ff'}` }),
				h('span', { class: 'label' }, b.name),
				part ? h('span', { class: 'px', title: `${n} pixels, ${part.deform}` }, n ? String(n) : '—') : h('span', { class: 'px none', title: 'No pixels of its own' }, '·'),
			);
			e.append(el);
			for (const c of childrenOf(this.rig!, b.id)) row(c, depth + 1);
		};
		for (const r of childrenOf(this.rig, null)) row(r, 0);
	}

	private renameInline(el: HTMLElement, b: BoneData): void {
		const input = h('input', { class: 'fusa-rename', value: b.name });
		const label = el.querySelector('.label')!;
		label.replaceWith(input);
		input.focus();
		input.select();
		const done = (ok: boolean) => {
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
		for (const c of listClips()) groups.set(c.category, [...(groups.get(c.category) ?? []), c]);
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
						const isBase = IDLE_IDS.includes(c.id) && c.loop;
						const active = isBase ? this.baseId === c.id : this.clipId === c.id;
						return h('button', { type: 'button', class: `fusa-card ${active ? 'active' : ''} ${isBase ? 'base' : ''}`, title: c.description ?? c.name, disabled: !this.rig, onclick: () => this.chooseClip(c) }, h('b', null, c.name), h('small', null, isBase ? 'Idle loop' : `${c.duration.toFixed(2)}s`));
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
			h('div', { class: 'fusa-clipname' }, h('small', null, `Over ${getClip(this.baseId)?.name ?? 'nothing'}`), h('b', null, getClip(this.clipId)?.name ?? '')),
			slider('Speed', this.speed, 0.25, 2, 0.05, (v) => (this.speed = v), (v) => `${v.toFixed(2)}×`),
			slider('Intensity', this.intensity, 0, 1.5, 0.05, (v) => ((this.intensity = v), this.replayIfPaused()), (v) => `${Math.round(v * 100)}%`),
			slider('Wind-up', this.timing.anticipation, 0.5, 2, 0.05, (v) => ((this.timing.anticipation = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			slider('Strike', this.timing.action, 0.5, 2, 0.05, (v) => ((this.timing.action = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			slider('Recovery', this.timing.recovery, 0.5, 2, 0.05, (v) => ((this.timing.recovery = v), this.retime()), (v) => `${v.toFixed(2)}×`),
			h('label', { class: 'fusa-check', title: 'Each play varies a little (amplitude and speed), so repeated attacks do not look identical.' }, h('input', { type: 'checkbox', checked: this.variation > 0, onchange: (ev: Event) => ((this.variation = (ev.target as HTMLInputElement).checked ? 1 : 0), this.restart()) }), 'Vary'),
			ibtn('dice', 'Another variation', () => ((this.seed++, this.variation ||= 1), this.restart()), { disabled }),
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
				h('div', { class: 'fusa-seg small' }, h('button', { type: 'button', class: this.tool !== 'bucket' ? 'active' : '', onclick: () => this.setTool('brush') }, icon('brush'), 'Brush'), h('button', { type: 'button', class: this.tool === 'bucket' ? 'active' : '', onclick: () => this.setTool('bucket') }, icon('bucket'), 'Bucket')),
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
		const parts: (HTMLElement | null)[] = [h('span', { class: 'hint' }, this.tool === 'add' && this.mode === 'rig' ? 'Drag from where the new bone starts to where it ends. It joins the selected bone.' : m.hint), h('span', { class: 'grow' }), this.cursor ? h('span', null, `${Math.floor(this.cursor.x)}, ${Math.floor(this.cursor.y)}`) : null, h('span', null, `${Math.round(z * 100)}%`), this.lastEvent && this.mode === 'animate' ? h('span', { class: 'event' }, this.lastEvent) : null];
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
		const { data } = await loadImageData(src);
		if (data.width * data.height > 4096 * 4096) throw new Error('This image is too large (over 4096×4096).');
		const base = name ?? decodeURIComponent(src.split('/').pop() ?? 'Sprite').replace(/\.[a-z0-9]+(\?.*)?$/i, '');
		const rig = createRig({ name: base, src, image: data, template: 'humanoid' });
		this.setRig(rig, data, false);
		this.host.notify('Skeleton placed from the humanoid template. Drag joints onto the art, then press the wand to reassign pixels.');
	}

	/** Show a rig (and its image). */
	setRig(rig: RigDocument, image: ImageData, saved: boolean): void {
		this.rig = rig;
		this.image = image;
		this.labels = rigLabels(rig);
		this.selected = null;
		this.pose.clear();
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
	}

	select(id: string | null): void {
		this.selected = id;
		this.renderTree();
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

	private async resetTemplate(t: TemplateId | ''): Promise<void> {
		(this.elTree.parentElement?.querySelector('.fusa-template') as HTMLSelectElement | null)?.blur();
		if (!t || !this.rig || !this.image) return this.renderAll();
		if (!(await this.host.confirm('Start over', `Replace the skeleton with the ${t} template and reassign every pixel? You can undo this.`))) return this.renderAll();
		const fresh = createRig({ name: this.rig.name, src: this.rig.image.src, image: this.image, template: t, facing: this.rig.facing });
		Object.assign(this.rig, { template: fresh.template, bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics });
		this.labels = rigLabels(this.rig);
		this.selected = null;
		this.commit();
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

	private onMove(x: number, y: number, e: PointerEvent): void {
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
		if (this.mode === 'paint' && d.kind === 'paint') {
			// paint along the stroke so fast moves leave no gaps
			const steps = Math.max(1, Math.ceil(Math.hypot(x - d.lastX, y - d.lastY) / Math.max(0.5, this.brushSize / 2)));
			for (let s = 1; s <= steps; s++) this.paintAt(d.lastX + ((x - d.lastX) * s) / steps, d.lastY + ((y - d.lastY) * s) / steps, Number(d.id));
			d.lastX = x;
			d.lastY = y;
			return;
		}
		if (this.mode === 'pose' && this.view) {
			const sk = this.view.skeleton;
			const i = sk.index.get(d.id)!;
			const p = this.pose.get(i) ?? { rot: 0, x: 0, y: 0 };
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

	private paintAt(x: number, y: number, label: number): void {
		if (!this.labels || !this.image) return;
		if (paintCircle(this.labels, this.image, x, y, this.brushSize, label)) this.refreshRegions();
	}

	/* ------------------------------------------------------------------ */
	/*  Playback                                                           */
	/* ------------------------------------------------------------------ */

	private chooseClip(c: ClipDocument): void {
		if (IDLE_IDS.includes(c.id) && c.loop) this.baseId = c.id;
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
		if (base) v.player.play(base, { track: 0, mixIn: 0 });
		if (clip) {
			v.player.play(clip, {
				track: 1,
				mixIn: clip.loop ? 0.2 : 0.08,
				speed: this.speed,
				intensity: this.intensity,
				timing: this.timing,
				variation: this.variation,
				seed: this.seed,
				loop: clip.loop,
				onEvent: (name) => {
					this.lastEvent = `● ${name}`;
					this.renderStatusSoon();
				},
			});
			this.warp = new TimeWarp(clip, this.timing);
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
		this.timeline.set(getClip(this.clipId) ?? null, this.warp, t);
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
	/*  Frame loop                                                         */
	/* ------------------------------------------------------------------ */

	private frame(dt: number): void {
		if (this.destroyed || !this.rig) return;
		if (this.needsBuild && !this.drag) this.rebuild();
		const v = this.view;
		if (!v) return;
		if (this.mode === 'animate') {
			if (this.playing) {
				v.update(dt * this.speed);
				const info = v.player.trackInfo(1);
				if (info) this.actionTime = info.time;
				else if (this.loop) this.startClips(0);
				else {
					// the action ended and faded back to the idle loop
					this.actionTime = this.timeline.duration;
				}
			}
			this.timeline.set(getClip(this.clipId) ?? null, this.warp, this.actionTime);
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
		const brush = this.mode === 'paint' && this.cursor && this.tool === 'brush' ? { x: this.cursor.x, y: this.cursor.y, r: this.brushSize } : null;
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
		if (mod && e.key.toLowerCase() === 'z') e.shiftKey ? this.redo() : this.undo();
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
		this.view?.destroy();
		this.view = null;
		this.timeline.destroy();
		this.viewport.destroy();
		this.root.remove();
	}
}
