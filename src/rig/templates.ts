import type { BoneData, DeformMode, Facing, PartData, TemplateId } from '../core/types';
import type { Rect } from '../sprite/image';
import { applyFrames, frameFromPoints, type Frame } from './frames';

/**
 * Rig templates are data. Positions are fractions of the character's opaque bounds
 * (u: back → front for a right-facing character, v: top → bottom).
 */
export interface TemplateBone {
	id: string;
	name: string;
	role: string;
	parent: string | null;
	from: [number, number];
	to: [number, number];
	color: string;
	/** Present when the bone gets a part (pixels) of its own. */
	part?: { deform: DeformMode; softness?: number; stiffness?: number; fill?: boolean; reach?: number };
}

export interface RigTemplate {
	id: TemplateId;
	name: string;
	description: string;
	bones: TemplateBone[];
	/** Bone ids with parts, back to front. */
	drawOrder: string[];
}

const C = { body: '#f2c45a', head: '#ffd98a', armF: '#5aa9ff', armB: '#3f6fb5', legF: '#7ad08f', legB: '#4f9163', weapon: '#ff6b6b', root: '#9aa4b8' };

export const HUMANOID: RigTemplate = {
	id: 'humanoid',
	name: 'Humanoid',
	description: 'Two arms, two legs, a head and a held weapon. Side or three-quarter battle sprites.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'pelvis', name: 'Pelvis', role: 'pelvis', parent: 'root', from: [0.5, 0.66], to: [0.5, 0.59], color: C.body, part: { deform: 'mesh', softness: 0.03, reach: 0.03 } },
		{ id: 'torso', name: 'Torso', role: 'torso', parent: 'pelvis', from: [0.5, 0.59], to: [0.5, 0.36], color: C.body, part: { deform: 'mesh', softness: 0.04, reach: 0.05 } },
		{ id: 'head', name: 'Head', role: 'head', parent: 'torso', from: [0.5, 0.36], to: [0.5, 0.04], color: C.head, part: { deform: 'rigid', softness: 0, reach: 0.08 } },
		{ id: 'arm_upper_back', name: 'Back upper arm', role: 'arm.upper.back', parent: 'torso', from: [0.4, 0.39], to: [0.33, 0.5], color: C.armB, part: { deform: 'mesh', softness: 0.03 } },
		{ id: 'arm_lower_back', name: 'Back forearm', role: 'arm.lower.back', parent: 'arm_upper_back', from: [0.33, 0.5], to: [0.29, 0.58], color: C.armB, part: { deform: 'mesh', softness: 0.03 } },
		{ id: 'hand_back', name: 'Back hand', role: 'hand.back', parent: 'arm_lower_back', from: [0.29, 0.58], to: [0.27, 0.64], color: C.armB, part: { deform: 'rigid', reach: -0.005 } },
		{ id: 'leg_upper_back', name: 'Back thigh', role: 'leg.upper.back', parent: 'pelvis', from: [0.46, 0.66], to: [0.43, 0.8], color: C.legB, part: { deform: 'mesh', softness: 0.03, reach: 0.01 } },
		{ id: 'leg_lower_back', name: 'Back shin', role: 'leg.lower.back', parent: 'leg_upper_back', from: [0.43, 0.8], to: [0.43, 0.95], color: C.legB, part: { deform: 'mesh', softness: 0.03, reach: 0.01 } },
		{ id: 'foot_back', name: 'Back foot', role: 'foot.back', parent: 'leg_lower_back', from: [0.43, 0.95], to: [0.5, 0.99], color: C.legB, part: { deform: 'rigid' } },
		{ id: 'leg_upper_front', name: 'Front thigh', role: 'leg.upper.front', parent: 'pelvis', from: [0.55, 0.66], to: [0.58, 0.8], color: C.legF, part: { deform: 'mesh', softness: 0.03, reach: 0.01 } },
		{ id: 'leg_lower_front', name: 'Front shin', role: 'leg.lower.front', parent: 'leg_upper_front', from: [0.58, 0.8], to: [0.58, 0.95], color: C.legF, part: { deform: 'mesh', softness: 0.03, reach: 0.01 } },
		{ id: 'foot_front', name: 'Front foot', role: 'foot.front', parent: 'leg_lower_front', from: [0.58, 0.95], to: [0.66, 0.99], color: C.legF, part: { deform: 'rigid' } },
		{ id: 'arm_upper_front', name: 'Front upper arm', role: 'arm.upper.front', parent: 'torso', from: [0.6, 0.39], to: [0.68, 0.5], color: C.armF, part: { deform: 'mesh', softness: 0.03 } },
		{ id: 'arm_lower_front', name: 'Front forearm', role: 'arm.lower.front', parent: 'arm_upper_front', from: [0.68, 0.5], to: [0.76, 0.57], color: C.armF, part: { deform: 'mesh', softness: 0.03 } },
		{ id: 'hand_front', name: 'Front hand', role: 'hand.front', parent: 'arm_lower_front', from: [0.76, 0.57], to: [0.81, 0.62], color: C.armF, part: { deform: 'rigid', reach: -0.005 } },
		{ id: 'weapon', name: 'Weapon', role: 'weapon', parent: 'hand_front', from: [0.81, 0.62], to: [1.05, 0.3], color: C.weapon, part: { deform: 'rigid', fill: false, reach: -0.01 } },
	],
	drawOrder: [
		'arm_upper_back',
		'arm_lower_back',
		'hand_back',
		'leg_upper_back',
		'leg_lower_back',
		'foot_back',
		'leg_upper_front',
		'leg_lower_front',
		'foot_front',
		'pelvis',
		'torso',
		'head',
		'arm_upper_front',
		'arm_lower_front',
		'weapon',
		'hand_front',
	],
};

export const CUSTOM: RigTemplate = {
	id: 'custom',
	name: 'Custom',
	description: 'A root and one body bone. Build any creature by adding bones.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'body', name: 'Body', role: 'torso', parent: 'root', from: [0.5, 0.95], to: [0.5, 0.2], color: C.body, part: { deform: 'mesh', softness: 0.04 } },
	],
	drawOrder: ['body'],
};

export const TEMPLATES: Partial<Record<TemplateId, RigTemplate>> = { humanoid: HUMANOID, custom: CUSTOM };

/** Every role a template defines, for role pickers. */
export const KNOWN_ROLES = [...new Set([...HUMANOID.bones.map((b) => b.role), 'neck', 'hair', 'cape', 'tail', 'offhand', 'accessory'])];

/** Default part settings. */
export function defaultPart(id: string, name: string, bone: string, label: number, deform: DeformMode = 'mesh'): PartData {
	return { id, name, bone, label, deform, softness: deform === 'mesh' ? 0.03 : 0, stiffness: 0, cell: 0, fill: true };
}

/** Build a template's bones and parts with each bone placed at explicit points (sprite pixels). */
export function buildFromTemplate(t: RigTemplate, place: (tb: TemplateBone) => { from: [number, number]; to: [number, number] }): { bones: BoneData[]; parts: PartData[] } {
	const frames = new Map<string, Frame>();
	const bones: BoneData[] = t.bones.map((tb) => {
		const { from, to } = place(tb);
		frames.set(tb.id, frameFromPoints(from[0], from[1], to[0], to[1]));
		return { id: tb.id, name: tb.name, parent: tb.parent, role: tb.role, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, length: 0, color: tb.color };
	});
	applyFrames(bones, frames);
	const parts: PartData[] = t.drawOrder.map((boneId, i) => {
		const tb = t.bones.find((b) => b.id === boneId)!;
		const spec = tb.part!;
		const p = defaultPart(`part_${boneId}`, tb.name, boneId, i + 1, spec.deform);
		if (spec.softness !== undefined) p.softness = spec.softness;
		if (spec.stiffness !== undefined) p.stiffness = spec.stiffness;
		if (spec.fill !== undefined) p.fill = spec.fill;
		if (spec.reach !== undefined) p.reach = spec.reach;
		return p;
	});
	return { bones, parts };
}

/** Place a template over the character's bounds (proportions only). */
export function fitTemplate(t: RigTemplate, bounds: Rect, facing: Facing): { bones: BoneData[]; parts: PartData[] } {
	const map = ([u, v]: [number, number]): [number, number] => [bounds.x + (facing === 'left' ? 1 - u : u) * bounds.width, bounds.y + v * bounds.height];
	return buildFromTemplate(t, (tb) => ({ from: map(tb.from), to: map(tb.to) }));
}
