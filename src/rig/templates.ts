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

/*
 * Creature templates (Phase 6). Same role names wherever the body part is the same thing, so a
 * clip written for one template works on the others that have those roles: torso, neck, head,
 * tail and tail.tip are shared by quadrupeds, winged creatures and serpents; floating spirits
 * use the humanoid arm roles so spell clips work on them. Legs: leg.front|hind.near|far — "near"
 * is the side facing the viewer (drawn in front).
 */
const Q = { body: '#c9a36b', head: '#f2c45a', near: '#7ad08f', far: '#4f9163', tail: '#d98a5a', wing: '#9a8cf2', wingFar: '#6a5cb5' };

export const QUADRUPED: RigTemplate = {
	id: 'quadruped',
	name: 'Four-legged beast',
	description: 'Body, head on a neck, tail, four legs. Wolves, cats, horses, boars, side view.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'body', name: 'Body', role: 'torso', parent: 'root', from: [0.24, 0.5], to: [0.74, 0.46], color: Q.body, part: { deform: 'mesh', softness: 0.05, reach: 0.04 } },
		{ id: 'neck', name: 'Neck', role: 'neck', parent: 'body', from: [0.74, 0.46], to: [0.82, 0.3], color: Q.head },
		{ id: 'head', name: 'Head', role: 'head', parent: 'neck', from: [0.82, 0.3], to: [1, 0.24], color: Q.head, part: { deform: 'rigid', reach: 0.06 } },
		{ id: 'tail', name: 'Tail', role: 'tail', parent: 'body', from: [0.22, 0.44], to: [0.09, 0.3], color: Q.tail, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'tail_tip', name: 'Tail tip', role: 'tail.tip', parent: 'tail', from: [0.09, 0.3], to: [0, 0.16], color: Q.tail, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_hind_far', name: 'Far hind leg', role: 'leg.hind.far', parent: 'body', from: [0.3, 0.6], to: [0.3, 0.99], color: Q.far, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_front_far', name: 'Far foreleg', role: 'leg.front.far', parent: 'body', from: [0.7, 0.6], to: [0.7, 0.99], color: Q.far, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_hind_near', name: 'Near hind leg', role: 'leg.hind.near', parent: 'body', from: [0.24, 0.6], to: [0.24, 0.99], color: Q.near, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_front_near', name: 'Near foreleg', role: 'leg.front.near', parent: 'body', from: [0.64, 0.6], to: [0.64, 0.99], color: Q.near, part: { deform: 'mesh', softness: 0.04 } },
	],
	drawOrder: ['leg_hind_far', 'leg_front_far', 'tail', 'tail_tip', 'body', 'leg_hind_near', 'leg_front_near', 'head'],
};

export const WINGED: RigTemplate = {
	id: 'winged',
	name: 'Winged creature',
	description: 'A beast with wings: body, long neck, head, two wings, tail, four legs. Dragons, griffins, side view.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'body', name: 'Body', role: 'torso', parent: 'root', from: [0.3, 0.6], to: [0.7, 0.54], color: Q.body, part: { deform: 'mesh', softness: 0.05, reach: 0.04 } },
		{ id: 'neck', name: 'Neck', role: 'neck', parent: 'body', from: [0.7, 0.54], to: [0.8, 0.27], color: Q.head, part: { deform: 'mesh', softness: 0.05 } },
		{ id: 'head', name: 'Head', role: 'head', parent: 'neck', from: [0.8, 0.27], to: [1, 0.24], color: Q.head, part: { deform: 'rigid', reach: 0.04 } },
		{ id: 'wing_far', name: 'Far wing', role: 'wing.far', parent: 'body', from: [0.58, 0.46], to: [0.64, 0.04], color: Q.wingFar, part: { deform: 'mesh', softness: 0.06, fill: false } },
		{ id: 'wing_near', name: 'Near wing', role: 'wing.near', parent: 'body', from: [0.46, 0.46], to: [0.14, 0.12], color: Q.wing, part: { deform: 'mesh', softness: 0.06, fill: false } },
		{ id: 'tail', name: 'Tail', role: 'tail', parent: 'body', from: [0.28, 0.62], to: [0.06, 0.8], color: Q.tail, part: { deform: 'mesh', softness: 0.05 } },
		{ id: 'tail_tip', name: 'Tail tip', role: 'tail.tip', parent: 'tail', from: [0.06, 0.8], to: [0.2, 0.98], color: Q.tail, part: { deform: 'mesh', softness: 0.05 } },
		{ id: 'leg_hind_far', name: 'Far hind leg', role: 'leg.hind.far', parent: 'body', from: [0.38, 0.66], to: [0.38, 0.99], color: Q.far, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_front_far', name: 'Far foreleg', role: 'leg.front.far', parent: 'body', from: [0.72, 0.64], to: [0.72, 0.99], color: Q.far, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_hind_near', name: 'Near hind leg', role: 'leg.hind.near', parent: 'body', from: [0.33, 0.66], to: [0.33, 0.99], color: Q.near, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'leg_front_near', name: 'Near foreleg', role: 'leg.front.near', parent: 'body', from: [0.66, 0.64], to: [0.66, 0.99], color: Q.near, part: { deform: 'mesh', softness: 0.04 } },
	],
	drawOrder: ['wing_far', 'leg_hind_far', 'leg_front_far', 'tail', 'tail_tip', 'body', 'neck', 'head', 'leg_hind_near', 'leg_front_near', 'wing_near'],
};

export const SERPENTINE: RigTemplate = {
	id: 'serpentine',
	name: 'Serpent',
	description: 'A long body raised at the front: tail, body, neck, head. Snakes, eels, worms, nagas’ lower body.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'body', name: 'Body', role: 'torso', parent: 'root', from: [0.42, 0.86], to: [0.66, 0.72], color: Q.body, part: { deform: 'mesh', softness: 0.06 } },
		{ id: 'neck', name: 'Neck', role: 'neck', parent: 'body', from: [0.66, 0.72], to: [0.78, 0.3], color: Q.head, part: { deform: 'mesh', softness: 0.06 } },
		{ id: 'head', name: 'Head', role: 'head', parent: 'neck', from: [0.78, 0.3], to: [1, 0.22], color: Q.head, part: { deform: 'rigid', reach: 0.04 } },
		{ id: 'tail', name: 'Tail', role: 'tail', parent: 'body', from: [0.42, 0.86], to: [0.18, 0.9], color: Q.tail, part: { deform: 'mesh', softness: 0.06 } },
		{ id: 'tail_tip', name: 'Tail tip', role: 'tail.tip', parent: 'tail', from: [0.18, 0.9], to: [0, 0.8], color: Q.tail, part: { deform: 'mesh', softness: 0.06 } },
	],
	drawOrder: ['tail_tip', 'tail', 'body', 'neck', 'head'],
};

export const FLOATING: RigTemplate = {
	id: 'floating',
	name: 'Floating spirit',
	description: 'No legs: head, body, two arms and a trailing lower body. Ghosts, wraiths, elementals, front or side view.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'torso', name: 'Body', role: 'torso', parent: 'root', from: [0.5, 0.74], to: [0.5, 0.3], color: C.body, part: { deform: 'mesh', softness: 0.05, reach: 0.04 } },
		{ id: 'head', name: 'Head', role: 'head', parent: 'torso', from: [0.5, 0.3], to: [0.5, 0], color: C.head, part: { deform: 'rigid', reach: 0.06 } },
		{ id: 'arm_upper_back', name: 'Back arm', role: 'arm.upper.back', parent: 'torso', from: [0.34, 0.34], to: [0.2, 0.46], color: C.armB, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'arm_lower_back', name: 'Back forearm', role: 'arm.lower.back', parent: 'arm_upper_back', from: [0.2, 0.46], to: [0.04, 0.56], color: C.armB, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'arm_upper_front', name: 'Front arm', role: 'arm.upper.front', parent: 'torso', from: [0.66, 0.34], to: [0.8, 0.46], color: C.armF, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'arm_lower_front', name: 'Front forearm', role: 'arm.lower.front', parent: 'arm_upper_front', from: [0.8, 0.46], to: [0.96, 0.56], color: C.armF, part: { deform: 'mesh', softness: 0.04 } },
		{ id: 'tail', name: 'Trail', role: 'tail', parent: 'torso', from: [0.5, 0.74], to: [0.5, 0.88], color: Q.tail, part: { deform: 'mesh', softness: 0.06 } },
		{ id: 'tail_tip', name: 'Trail tip', role: 'tail.tip', parent: 'tail', from: [0.5, 0.88], to: [0.5, 1], color: Q.tail, part: { deform: 'mesh', softness: 0.06 } },
	],
	drawOrder: ['arm_upper_back', 'arm_lower_back', 'tail_tip', 'tail', 'torso', 'head', 'arm_upper_front', 'arm_lower_front'],
};

export const BLOB: RigTemplate = {
	id: 'blob',
	name: 'Blob',
	description: 'A soft body that squashes and stretches, with whatever sits on top (eye stalk, crown, flame). Slimes, puddings, flans.',
	bones: [
		{ id: 'root', name: 'Root', role: 'root', parent: null, from: [0.5, 1], to: [0.62, 1], color: C.root },
		{ id: 'body', name: 'Body', role: 'torso', parent: 'root', from: [0.5, 0.98], to: [0.5, 0.42], color: Q.body, part: { deform: 'mesh', softness: 0.2, reach: 0.06 } },
		{ id: 'crest', name: 'Top', role: 'crest', parent: 'body', from: [0.5, 0.42], to: [0.5, 0], color: Q.head, part: { deform: 'mesh', softness: 0.06 } },
	],
	drawOrder: ['body', 'crest'],
};

export const TEMPLATES: Partial<Record<TemplateId, RigTemplate>> = { humanoid: HUMANOID, quadruped: QUADRUPED, winged: WINGED, serpentine: SERPENTINE, floating: FLOATING, blob: BLOB, custom: CUSTOM };

/** Templates offered in the Studio, in menu order. */
export const TEMPLATE_LIST: RigTemplate[] = [HUMANOID, QUADRUPED, WINGED, SERPENTINE, FLOATING, BLOB, CUSTOM];

/** Every role a template defines, for role pickers. */
export const KNOWN_ROLES = [...new Set([...TEMPLATE_LIST.flatMap((t) => t.bones.map((b) => b.role)), 'hair', 'cape', 'offhand', 'accessory', 'jaw'])];

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
