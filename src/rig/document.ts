import type { BoneData, Facing, PartData, RenderSettings, RigDocument, TemplateId } from '../core/types';
import { bodyBounds, looksLikePixelArt, opaqueBounds, type ImageDataLike } from '../sprite/image';
import { type BoneSegment } from '../sprite/ownership';
import { geodesicAssign } from '../sprite/geodesic';
import { mainBounds } from '../sprite/morph';
import { detectShadow } from '../sprite/shadow';
import { detectHumanoid, type HumanoidLandmarks } from '../sprite/landmarks';
import { beastFromLandmarks, humanoidFromLandmarks, shapeFromLandmarks } from './autorig';
import { detectBeast, type BeastLandmarks } from '../sprite/creatures';
import { detectShape, type ShapeLandmarks } from '../sprite/shapes';
import { decodeRle, encodeRle } from '../sprite/rle';
import { bonesToFrames, tipOf } from './frames';
import { TEMPLATES, fitTemplate } from './templates';

export const RIG_FORMAT = 'fusa-rig';
export const RIG_VERSION = 1;

let counter = 0;
/** Short unique id (Foundry's randomID when available). */
export function newId(prefix = ''): string {
	const f = (globalThis as { foundry?: { utils?: { randomID?: (n?: number) => string } } }).foundry?.utils?.randomID;
	if (f) return prefix + f(12);
	counter = (counter + 1) % 1e6;
	return prefix + Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

export function defaultRender(img: ImageDataLike | null): RenderSettings {
	const pixel = img ? looksLikePixelArt(img) : true;
	return { mode: pixel ? 'pixel' : 'smooth', padding: 0.35, snap: pixel, idleFps: pixel ? 12 : 0, resolution: 1 };
}

export interface CreateRigOptions {
	name: string;
	src: string;
	image: ImageDataLike;
	template?: TemplateId;
	facing?: Facing;
	/** Facing to assume when the art does not tell (no weapon): e.g. the GM's last choice. */
	facingFallback?: Facing;
	/** Assign pixels to bones right away (default true). */
	assign?: boolean;
	/** Which way the character looks; default: guessed from the weapon (else right). */
	/** Place bones on landmarks found in the silhouette (default true; humanoid only). */
	detect?: boolean;
}

/** What automatic rigging found, for the Studio to show. */
export interface RigReport {
	method: 'landmarks' | 'proportions';
	confidence: Record<string, number>;
	notes: string[];
}

export const lastReport = new WeakMap<RigDocument, RigReport>();

/** A new rig: the template fitted to the character's bounds and pixels assigned to the nearest bone. */
export function createRig(o: CreateRigOptions): RigDocument {
	const full = { x: 0, y: 0, width: o.image.width, height: o.image.height };
	const bounds = opaqueBounds(o.image) ?? full;
	const body = bodyBounds(o.image) ?? full;
	const template = TEMPLATES[o.template ?? 'humanoid'] ?? TEMPLATES.humanoid!;
	let facing: Facing = o.facing ?? o.facingFallback ?? 'right';
	let landmarks: HumanoidLandmarks | null = null;
	if (template.id === 'humanoid' && o.detect !== false) {
		landmarks = detectHumanoid(o.image, o.facing ?? 'auto', o.facingFallback);
		if (landmarks) facing = landmarks.facing;
	}
	// creatures: the whole animal (tail, wings, trailing body) minus floating effects
	const creature = template.id !== 'humanoid' && template.id !== 'custom';
	const fitBox = creature ? (mainBounds(o.image) ?? bounds) : body;
	let beast: BeastLandmarks | null = null;
	if ((template.id === 'quadruped' || template.id === 'winged') && o.detect !== false) {
		beast = detectBeast(o.image, o.facing ?? 'auto', { wings: template.id === 'winged', fallback: o.facingFallback });
		if (beast) facing = beast.facing;
	}
	let shape: ShapeLandmarks | null = null;
	if (o.detect !== false && ['floating', 'serpentine', 'blob', 'custom'].includes(template.id)) {
		shape = detectShape(o.image, template.id as 'floating' | 'serpentine' | 'blob' | 'custom', o.facing ?? 'auto', o.facingFallback);
		if (shape) facing = shape.facing;
	}
	const { bones, parts } = landmarks ? humanoidFromLandmarks(landmarks) : beast ? beastFromLandmarks(beast, template) : shape ? shapeFromLandmarks(shape, template) : fitTemplate(template, fitBox, facing);
	const now = Date.now();
	const rig: RigDocument = {
		format: RIG_FORMAT,
		version: RIG_VERSION,
		id: newId('rig'),
		name: o.name,
		template: template.id,
		facing,
		image: { src: o.src, width: o.image.width, height: o.image.height },
		metrics: { bodyHeight: fitBox.height, bounds },
		bones,
		parts,
		ownership: null,
		render: defaultRender(o.image),
		created: now,
		updated: now,
		revision: 1,
	};
	if (landmarks) rig.metrics.bodyHeight = landmarks.body.height;
	if (beast) rig.metrics.bodyHeight = beast.box.height;
	if (shape) rig.metrics.bodyHeight = shape.box.height;
	// a ground shadow gets its own part on the root, drawn first, so it stays on the floor
	if (detectShadow(o.image) && rig.bones.some((b) => b.id === 'root')) {
		const shadow = defaultPartFor('part_shadow', 'Shadow', 'root', nextLabel(rig.parts));
		rig.parts.unshift(shadow);
	}
	if (landmarks && !landmarks.weapon) {
		const weaponPart = rig.parts.find(p => rig.bones.find(b => b.id === p.bone)?.role === 'weapon');
		if (weaponPart) weaponPart.autoAssign = false;
	}
	if (o.assign !== false) {
		const labels = assignPixels(rig, o.image);
		rig.ownership = encodeRle(labels);
	}
	const found = landmarks ?? beast ?? shape;
	lastReport.set(rig, found ? { method: 'landmarks', confidence: found.confidence, notes: found.notes } : { method: 'proportions', confidence: {}, notes: [] });
	const report = lastReport.get(rig)!;
	report.confidence.body ??= report.method === 'landmarks' ? 0.55 : 0.2;
	if (landmarks && !landmarks.weapon) report.notes.push('No weapon detected; its optional bone is available for manual rigging.');
	// Confidence is geometric support, not a probability of anatomical correctness.
	// Do not advertise a high score for a group whose bones mostly miss the art.
	const frames = bonesToFrames(rig.bones);
	const support = new Map<string, number[]>();
	for (const bone of rig.bones) {
		const role = bone.role ?? '';
		const group = /^(arm|hand)/.test(role) ? 'arms' : /^(leg|foot)/.test(role) ? 'legs' : role.startsWith('wing') ? 'wings' : role.startsWith('tail') ? 'tail' : role === 'head' ? 'head' : role === 'weapon' ? 'weapon' : ['torso', 'pelvis', 'neck'].includes(role) ? 'body' : '';
		if (!group || report.confidence[group] === undefined || role === 'weapon' && landmarks && !landmarks.weapon) continue;
		const f = frames.get(bone.id)!, tip = tipOf(f);
		let visible = 0;
		for (let k = 1; k < 16; k++) {
			const x = Math.floor(f.x + (tip[0] - f.x) * k / 16), y = Math.floor(f.y + (tip[1] - f.y) * k / 16);
			if (x >= 0 && y >= 0 && x < o.image.width && y < o.image.height && o.image.data[(y * o.image.width + x) * 4 + 3]) visible++;
		}
		const values = support.get(group) ?? [];
		values.push(visible / 15); support.set(group, values);
	}
	const unsupported: string[] = [];
	for (const [group, values] of support) if (values.reduce((a, b) => a + b, 0) / values.length < 0.45) {
		report.confidence[group] = Math.min(report.confidence[group]!, 0.2);
		unsupported.push(group);
	}
	if (unsupported.length) report.notes.push(`Check ${unsupported.join(', ')}: limited silhouette support for the proposed bones.`);
	return rig;
}

/** The ownership map of a rig (all zeros when it has none yet). */
export function rigLabels(rig: RigDocument): Uint8Array {
	const n = rig.image.width * rig.image.height;
	return rig.ownership ? decodeRle(rig.ownership, n) : new Uint8Array(n);
}

/** The GM's hidden-region hints (null when none). */
export function rigHints(rig: RigDocument): Uint8Array | null {
	return rig.fillHints ? decodeRle(rig.fillHints, rig.image.width * rig.image.height) : null;
}

/**
 * Propose a fresh skeleton for an existing rig's image: detect landmarks (humanoid) or fit the
 * template, assign pixels. Returns the pieces to put into the rig and what was found.
 */
export function proposeRig(image: ImageDataLike, template: TemplateId, facing: Facing | 'auto', detect = true, facingFallback?: Facing): Pick<RigDocument, 'bones' | 'parts' | 'ownership' | 'metrics' | 'facing' | 'template'> & { report: RigReport } {
	const fresh = createRig({ name: 'proposal', src: '', image, template, facing: facing === 'auto' ? undefined : facing, detect, facingFallback });
	return { bones: fresh.bones, parts: fresh.parts, ownership: fresh.ownership, metrics: fresh.metrics, facing: fresh.facing, template: fresh.template, report: lastReport.get(fresh)! };
}

/** Bone segments for automatic assignment: one per part, on its bone. */
export function segmentsFor(rig: RigDocument): BoneSegment[] {
	const frames = bonesToFrames(rig.bones);
	const H = rig.metrics.bodyHeight;
	const out: BoneSegment[] = [];
	for (const p of rig.parts) {
		const f = frames.get(p.bone);
		if (!f || p.hidden || p.autoAssign === false) continue;
		const [bx, by] = tipOf(f);
		out.push({ label: p.label, ax: f.x, ay: f.y, bx, by, bias: (p.reach ?? 0) * H });
	}
	return out;
}

/**
 * Assign every visible pixel to a part: each bone grows from its own segment through the art,
 * stopping at outlines and colour edges (edge-aware geodesic distance).
 */
export function assignPixels(rig: RigDocument, image: ImageDataLike): Uint8Array {
	// a part on the root is the ground shadow: it gets exactly the shadow's pixels
	const root = rig.parts.find((p) => rig.bones.find((b) => b.id === p.bone)?.role === 'root');
	const labels = geodesicAssign(image, segmentsFor(rig).filter((s) => s.label !== root?.label), { edgeWeight: 8 });
	if (root) {
		const shadow = detectShadow(image);
		if (shadow) for (let i = 0; i < labels.length; i++) if (shadow[i]) labels[i] = root.label;
	}
	return labels;
}

function defaultPartFor(id: string, name: string, bone: string, label: number): PartData {
	return { id, name, bone, label, deform: 'rigid', softness: 0, stiffness: 0, cell: 0, fill: false };
}

/** Next free part label (1–254). */
export function nextLabel(parts: PartData[]): number {
	const used = new Set(parts.map((p) => p.label));
	for (let l = 1; l < 255; l++) if (!used.has(l)) return l;
	throw new Error('A rig can have at most 254 parts.');
}

/* ------------------------------------------------------------------ */
/*  Reading untrusted JSON                                             */
/* ------------------------------------------------------------------ */

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d: string): string => (typeof v === 'string' ? v : d);

/**
 * Turn parsed JSON into a rig document, filling defaults and rejecting what cannot be repaired.
 * Throws an Error with a readable message.
 */
export function parseRig(input: unknown): RigDocument {
	if (!input || typeof input !== 'object') throw new Error('Not a rig file.');
	const o = input as Record<string, unknown>;
	if (o.format !== RIG_FORMAT) throw new Error('Not a rig file (format is not "fusa-rig").');
	if (num(o.version, 0) > RIG_VERSION) throw new Error(`This rig was saved by a newer version (format ${o.version}).`);
	const image = (o.image ?? {}) as Record<string, unknown>;
	const width = Math.round(num(image.width, 0));
	const height = Math.round(num(image.height, 0));
	if (width <= 0 || height <= 0) throw new Error('The rig has no image size.');
	const bones: BoneData[] = (Array.isArray(o.bones) ? o.bones : []).map((b: Record<string, unknown>, i: number) => ({
		id: str(b.id, `bone${i}`),
		name: str(b.name, `Bone ${i + 1}`),
		parent: typeof b.parent === 'string' ? b.parent : null,
		role: typeof b.role === 'string' && b.role ? b.role : undefined,
		x: num(b.x, 0),
		y: num(b.y, 0),
		rotation: num(b.rotation, 0),
		scaleX: num(b.scaleX, 1),
		scaleY: num(b.scaleY, 1),
		length: Math.max(0, num(b.length, 0)),
		inheritRotation: b.inheritRotation === false ? false : undefined,
		color: typeof b.color === 'string' ? b.color : undefined,
	}));
	if (!bones.length) throw new Error('The rig has no bones.');
	const parts: PartData[] = (Array.isArray(o.parts) ? o.parts : []).map((p: Record<string, unknown>, i: number) => ({
		id: str(p.id, `part${i}`),
		name: str(p.name, `Part ${i + 1}`),
		bone: str(p.bone, ''),
		label: Math.round(num(p.label, i + 1)),
		deform: p.deform === 'rigid' ? 'rigid' : 'mesh',
		softness: Math.max(0, num(p.softness, 0.03)),
		stiffness: Math.min(1, Math.max(0, num(p.stiffness, 0))),
		cell: Math.max(0, Math.round(num(p.cell, 0))),
		fill: p.fill !== false,
		autoAssign: p.autoAssign === false ? false : undefined,
		reach: typeof p.reach === 'number' ? p.reach : undefined,
		hidden: p.hidden === true ? true : undefined,
	}));
	const render = (o.render ?? {}) as Record<string, unknown>;
	const metrics = (o.metrics ?? {}) as Record<string, unknown>;
	const b = (metrics.bounds ?? {}) as Record<string, unknown>;
	const rig: RigDocument = {
		format: RIG_FORMAT,
		version: RIG_VERSION,
		id: str(o.id, newId('rig')),
		name: str(o.name, 'Unnamed rig'),
		template: (['humanoid', 'quadruped', 'winged', 'serpentine', 'floating', 'blob', 'custom'] as const).includes(o.template as TemplateId) ? (o.template as TemplateId) : 'custom',
		facing: o.facing === 'left' ? 'left' : 'right',
		image: { src: str(image.src, ''), width, height },
		metrics: {
			bodyHeight: Math.max(1, num(metrics.bodyHeight, height)),
			bounds: { x: num(b.x, 0), y: num(b.y, 0), width: num(b.width, width), height: num(b.height, height) },
		},
		bones,
		parts,
		ownership: typeof o.ownership === 'string' ? o.ownership : null,
		render: {
			mode: render.mode === 'smooth' ? 'smooth' : 'pixel',
			padding: Math.min(2, Math.max(0, num(render.padding, 0.35))),
			snap: render.snap !== false,
			idleFps: Math.max(0, Math.min(60, num(render.idleFps, 12))),
			resolution: Math.min(4, Math.max(0.25, num(render.resolution, 1))),
		},
		created: num(o.created, Date.now()),
		updated: num(o.updated, Date.now()),
		revision: Math.max(1, Math.round(num(o.revision, 1))),
	};
	if (typeof o.fillHints === 'string') rig.fillHints = o.fillHints;
	if (o.roleScale && typeof o.roleScale === 'object') rig.roleScale = o.roleScale as Record<string, number>;
	if (rig.ownership) rigLabels(rig); // throws if the map does not match the image
	if (rig.fillHints) rigHints(rig);
	return rig;
}

export function cloneRig(rig: RigDocument): RigDocument {
	return JSON.parse(JSON.stringify(rig)) as RigDocument;
}
