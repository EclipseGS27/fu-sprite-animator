import { DEG, wrapDeg } from '../core/math';
import { orderBones } from '../core/skeleton';
import type { BoneData } from '../core/types';

/**
 * Setup-pose bones in world terms: where each bone starts, where it points and how long it is.
 * The rig editor works in frames (what the GM sees) and converts back to parent-local data.
 * Setup scale is always 1 in the editor; scale is for animation only.
 */
export interface Frame {
	x: number;
	y: number;
	/** World angle in degrees (+ = clockwise on screen). */
	angle: number;
	length: number;
}

export function tipOf(f: Frame): [number, number] {
	return [f.x + Math.cos(f.angle * DEG) * f.length, f.y + Math.sin(f.angle * DEG) * f.length];
}

export function frameFromPoints(ax: number, ay: number, bx: number, by: number): Frame {
	return { x: ax, y: ay, angle: Math.atan2(by - ay, bx - ax) / DEG, length: Math.hypot(bx - ax, by - ay) };
}

/** World frames of every bone in the setup pose, by id. */
export function bonesToFrames(bones: BoneData[]): Map<string, Frame> {
	const frames = new Map<string, Frame>();
	for (const b of orderBones(bones)) {
		const p = b.parent ? frames.get(b.parent) : undefined;
		if (!p) {
			frames.set(b.id, { x: b.x, y: b.y, angle: b.rotation, length: b.length });
			continue;
		}
		const r = p.angle * DEG;
		const inherits = b.inheritRotation !== false;
		frames.set(b.id, {
			x: p.x + Math.cos(r) * b.x - Math.sin(r) * b.y,
			y: p.y + Math.sin(r) * b.x + Math.cos(r) * b.y,
			angle: inherits ? p.angle + b.rotation : b.rotation,
			length: b.length,
		});
	}
	return frames;
}

/** Write world frames back into the bones' local setup data (in place). */
export function applyFrames(bones: BoneData[], frames: Map<string, Frame>): void {
	for (const b of bones) {
		const f = frames.get(b.id);
		if (!f) continue;
		const p = b.parent ? frames.get(b.parent) : undefined;
		b.scaleX = 1;
		b.scaleY = 1;
		b.length = Math.max(0, f.length);
		if (!p) {
			b.x = f.x;
			b.y = f.y;
			b.rotation = wrapDeg(f.angle);
			continue;
		}
		const r = -p.angle * DEG;
		const dx = f.x - p.x;
		const dy = f.y - p.y;
		b.x = Math.cos(r) * dx - Math.sin(r) * dy;
		b.y = Math.sin(r) * dx + Math.cos(r) * dy;
		b.rotation = b.inheritRotation === false ? wrapDeg(f.angle) : wrapDeg(f.angle - p.angle);
	}
}

/** True when a bone starts where its parent ends (a chained joint). */
export function isConnected(frames: Map<string, Frame>, bone: BoneData, eps = 0.75): boolean {
	if (!bone.parent) return false;
	const p = frames.get(bone.parent);
	const f = frames.get(bone.id);
	if (!p || !f) return false;
	const [tx, ty] = tipOf(p);
	return Math.hypot(tx - f.x, ty - f.y) <= eps;
}
