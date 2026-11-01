import type { BoneData, DeformMode, PartData, RigDocument } from '../core/types';
import { nextLabel } from './document';
import { applyFrames, bonesToFrames, frameFromPoints, isConnected, tipOf, type Frame } from './frames';
import { defaultPart } from './templates';

/**
 * Rig editing operations. They change the rig in place; the Studio snapshots the rig for undo.
 * Every operation keeps the world position of bones it does not mean to move.
 */

const bone = (rig: RigDocument, id: string): BoneData => {
	const b = rig.bones.find((x) => x.id === id);
	if (!b) throw new Error(`No bone ${id}`);
	return b;
};

export function childrenOf(rig: RigDocument, id: string | null): BoneData[] {
	return rig.bones.filter((b) => b.parent === id);
}

export function descendants(rig: RigDocument, id: string): Set<string> {
	const out = new Set<string>();
	const stack = [id];
	while (stack.length) {
		const cur = stack.pop()!;
		for (const c of childrenOf(rig, cur)) {
			if (!out.has(c.id)) {
				out.add(c.id);
				stack.push(c.id);
			}
		}
	}
	return out;
}

function reaim(f: Frame, tx: number, ty: number, ox = f.x, oy = f.y): Frame {
	if (Math.hypot(tx - ox, ty - oy) < 1e-6) return { x: ox, y: oy, angle: f.angle, length: 0 };
	return frameFromPoints(ox, oy, tx, ty);
}

/**
 * Move where a bone starts. Its tip stays put; a parent that ends at this joint follows (and so do
 * siblings starting at the same joint). Everything else keeps its place.
 */
export function moveJoint(rig: RigDocument, id: string, x: number, y: number): void {
	const frames = bonesToFrames(rig.bones);
	const b = bone(rig, id);
	const f = frames.get(id)!;
	if (isConnected(frames, b) && b.parent) {
		const pf = frames.get(b.parent)!;
		for (const s of childrenOf(rig, b.parent)) {
			if (s.id === id || !isConnected(frames, s)) continue;
			const sf = frames.get(s.id)!;
			const [stx, sty] = tipOf(sf);
			frames.set(s.id, reaim(sf, stx, sty, x, y));
		}
		frames.set(b.parent, reaim(pf, x, y));
	}
	const [tx, ty] = tipOf(f);
	frames.set(id, f.length > 0 ? reaim(f, tx, ty, x, y) : { ...f, x, y });
	applyFrames(rig.bones, frames);
}

/** Move a bone's tip (direction and length). Children starting at the tip follow the joint. */
export function moveTip(rig: RigDocument, id: string, x: number, y: number): void {
	const frames = bonesToFrames(rig.bones);
	const f = frames.get(id)!;
	for (const c of childrenOf(rig, id)) {
		if (!isConnected(frames, c)) continue;
		const cf = frames.get(c.id)!;
		const [ctx, cty] = tipOf(cf);
		frames.set(c.id, cf.length > 0 ? reaim(cf, ctx, cty, x, y) : { ...cf, x, y });
	}
	frames.set(id, reaim(f, x, y));
	applyFrames(rig.bones, frames);
}

/** Shift a bone and everything under it. */
export function moveSubtree(rig: RigDocument, id: string, dx: number, dy: number): void {
	const frames = bonesToFrames(rig.bones);
	for (const bid of [id, ...descendants(rig, id)]) {
		const f = frames.get(bid)!;
		frames.set(bid, { ...f, x: f.x + dx, y: f.y + dy });
	}
	applyFrames(rig.bones, frames);
}

export interface AddBoneOptions {
	name?: string;
	role?: string;
	color?: string;
	/** Create a part for the new bone (default true). */
	part?: boolean;
	deform?: DeformMode;
}

/** Add a bone from (ax, ay) to (bx, by) in sprite pixels, under parent (or as a root). */
export function addBone(rig: RigDocument, parent: string | null, ax: number, ay: number, bx: number, by: number, o: AddBoneOptions = {}): BoneData {
	const frames = bonesToFrames(rig.bones);
	const id = `bone_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
	const b: BoneData = { id, name: o.name ?? `Bone ${rig.bones.length + 1}`, parent, role: o.role, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, length: 0, color: o.color ?? '#c9a7ff' };
	rig.bones.push(b);
	frames.set(id, frameFromPoints(ax, ay, bx, by));
	applyFrames(rig.bones, frames);
	if (o.part !== false) ensurePart(rig, id, o.deform ?? 'mesh');
	return b;
}

/**
 * Delete a bone. Its children move to its parent (keeping their place); its pixels go to the
 * nearest ancestor that has a part (or become unassigned).
 */
export function deleteBone(rig: RigDocument, id: string, labels: Uint8Array | null): void {
	const b = bone(rig, id);
	const frames = bonesToFrames(rig.bones);
	for (const c of childrenOf(rig, id)) c.parent = b.parent;
	rig.bones = rig.bones.filter((x) => x.id !== id);
	frames.delete(id);
	applyFrames(rig.bones, frames);
	const part = rig.parts.find((p) => p.bone === id);
	if (part) {
		let heir: PartData | undefined;
		for (let a = b.parent; a && !heir; a = rig.bones.find((x) => x.id === a)?.parent ?? null) heir = rig.parts.find((p) => p.bone === a);
		removePart(rig, part.id, labels, heir?.label ?? 0);
	}
}

/** Give a bone a new parent (or none), keeping it where it is. Refuses cycles. */
export function reparent(rig: RigDocument, id: string, parent: string | null): void {
	if (parent === id || (parent && descendants(rig, id).has(parent))) throw new Error('A bone cannot be placed under itself or its own children.');
	const frames = bonesToFrames(rig.bones);
	bone(rig, id).parent = parent;
	// keep parent-first order
	const moved = rig.bones.filter((b) => b.id === id || descendants(rig, id).has(b.id));
	const rest = rig.bones.filter((b) => !moved.includes(b));
	rig.bones = [...rest, ...moved];
	applyFrames(rig.bones, frames);
}

export function updateBone(rig: RigDocument, id: string, patch: Partial<Pick<BoneData, 'name' | 'role' | 'color' | 'inheritRotation'>>): void {
	const b = bone(rig, id);
	if (patch.inheritRotation !== undefined && patch.inheritRotation !== (b.inheritRotation !== false)) {
		const frames = bonesToFrames(rig.bones);
		b.inheritRotation = patch.inheritRotation ? undefined : false;
		applyFrames(rig.bones, frames);
	}
	if (patch.name !== undefined) b.name = patch.name.trim() || b.name;
	if (patch.role !== undefined) b.role = patch.role || undefined;
	if (patch.color !== undefined) b.color = patch.color;
}

/** The part of a bone, created (in front of its parent's part) if it has none. */
export function ensurePart(rig: RigDocument, boneId: string, deform: DeformMode = 'mesh'): PartData {
	const existing = rig.parts.find((p) => p.bone === boneId);
	if (existing) return existing;
	const b = bone(rig, boneId);
	const p = defaultPart(`part_${boneId}`, b.name, boneId, nextLabel(rig.parts), deform);
	const parentIndex = rig.parts.findIndex((x) => x.bone === b.parent);
	if (parentIndex >= 0) rig.parts.splice(parentIndex + 1, 0, p);
	else rig.parts.push(p);
	return p;
}

/** Remove a part; its pixels get `heir` (0 = unassigned). */
export function removePart(rig: RigDocument, partId: string, labels: Uint8Array | null, heir = 0): void {
	const p = rig.parts.find((x) => x.id === partId);
	if (!p) return;
	rig.parts = rig.parts.filter((x) => x.id !== partId);
	if (labels) for (let i = 0; i < labels.length; i++) if (labels[i] === p.label) labels[i] = heir;
}

export function updatePart(rig: RigDocument, partId: string, patch: Partial<Omit<PartData, 'id' | 'label' | 'bone'>>): void {
	const p = rig.parts.find((x) => x.id === partId);
	if (p) Object.assign(p, patch);
}

/** Move a part in the draw order: -1 back, +1 forward, or to the very back/front. */
export function movePart(rig: RigDocument, partId: string, to: -1 | 1 | 'back' | 'front'): void {
	const i = rig.parts.findIndex((x) => x.id === partId);
	if (i < 0) return;
	const [p] = rig.parts.splice(i, 1);
	let j = to === 'back' ? 0 : to === 'front' ? rig.parts.length : i + to;
	j = Math.max(0, Math.min(rig.parts.length, j));
	rig.parts.splice(j, 0, p!);
}
