import type { BoneData, Facing, PartData, RenderSettings, RigDocument, TemplateId } from '../core/types';
import { bodyBounds, looksLikePixelArt, opaqueBounds, type ImageDataLike } from '../sprite/image';
import { autoAssign, type BoneSegment } from '../sprite/ownership';
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
	/** Assign pixels to bones right away (default true). */
	assign?: boolean;
}

/** A new rig: the template fitted to the character's bounds and pixels assigned to the nearest bone. */
export function createRig(o: CreateRigOptions): RigDocument {
	const full = { x: 0, y: 0, width: o.image.width, height: o.image.height };
	const bounds = opaqueBounds(o.image) ?? full;
	const body = bodyBounds(o.image) ?? full;
	const template = TEMPLATES[o.template ?? 'humanoid'] ?? TEMPLATES.humanoid!;
	const facing = o.facing ?? 'right';
	const { bones, parts } = fitTemplate(template, body, facing);
	const now = Date.now();
	const rig: RigDocument = {
		format: RIG_FORMAT,
		version: RIG_VERSION,
		id: newId('rig'),
		name: o.name,
		template: template.id,
		facing,
		image: { src: o.src, width: o.image.width, height: o.image.height },
		metrics: { bodyHeight: body.height, bounds },
		bones,
		parts,
		ownership: null,
		render: defaultRender(o.image),
		created: now,
		updated: now,
		revision: 1,
	};
	if (o.assign !== false) rig.ownership = encodeRle(assignPixels(rig, o.image));
	return rig;
}

/** The ownership map of a rig (all zeros when it has none yet). */
export function rigLabels(rig: RigDocument): Uint8Array {
	const n = rig.image.width * rig.image.height;
	return rig.ownership ? decodeRle(rig.ownership, n) : new Uint8Array(n);
}

/** Bone segments for automatic assignment: one per part, on its bone. */
export function segmentsFor(rig: RigDocument): BoneSegment[] {
	const frames = bonesToFrames(rig.bones);
	const H = rig.metrics.bodyHeight;
	const out: BoneSegment[] = [];
	for (const p of rig.parts) {
		const f = frames.get(p.bone);
		if (!f || p.hidden) continue;
		const [bx, by] = tipOf(f);
		out.push({ label: p.label, ax: f.x, ay: f.y, bx, by, bias: (p.reach ?? 0) * H });
	}
	return out;
}

/** Assign every visible pixel to the nearest part's bone. */
export function assignPixels(rig: RigDocument, image: ImageDataLike): Uint8Array {
	return autoAssign(image, segmentsFor(rig));
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
		template: (['humanoid', 'quadruped', 'winged', 'serpentine', 'custom'] as const).includes(o.template as TemplateId) ? (o.template as TemplateId) : 'custom',
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
		roleScale: o.roleScale && typeof o.roleScale === 'object' ? (o.roleScale as Record<string, number>) : undefined,
		created: num(o.created, Date.now()),
		updated: num(o.updated, Date.now()),
		revision: Math.max(1, Math.round(num(o.revision, 1))),
	};
	if (rig.ownership) rigLabels(rig); // throws if the map does not match the image
	return rig;
}

export function cloneRig(rig: RigDocument): RigDocument {
	return JSON.parse(JSON.stringify(rig)) as RigDocument;
}
