import { Affine } from './math';
import type { BoneData } from './types';

/** A bone's local transform: rotation in degrees, translation in pixels, scale multipliers. */
export interface LocalPose {
	rot: number;
	x: number;
	y: number;
	sx: number;
	sy: number;
}

/**
 * Sort bones parent-first. Throws on unknown parents or cycles: a broken hierarchy must never
 * reach the renderer silently.
 */
export function orderBones(bones: BoneData[]): BoneData[] {
	const byId = new Map(bones.map((b) => [b.id, b]));
	if (byId.size !== bones.length) throw new Error('Two bones share an id.');
	const out: BoneData[] = [];
	const state = new Map<string, 1 | 2>();
	const visit = (b: BoneData, path: string[]) => {
		const s = state.get(b.id);
		if (s === 2) return;
		if (s === 1) throw new Error(`Bone hierarchy has a cycle: ${[...path, b.name].join(' → ')}`);
		state.set(b.id, 1);
		if (b.parent !== null) {
			const p = byId.get(b.parent);
			if (!p) throw new Error(`Bone "${b.name}" has a missing parent.`);
			visit(p, [...path, b.name]);
		}
		state.set(b.id, 2);
		out.push(b);
	};
	for (const b of bones) visit(b, []);
	return out;
}

/**
 * Runtime skeleton: setup pose, current local pose, world and skin matrices.
 * skin[i] = world[i] · setupWorld[i]⁻¹ maps a setup-pose point to where it is now.
 */
export class Skeleton {
	readonly bones: BoneData[];
	readonly index = new Map<string, number>();
	readonly parent: Int32Array;
	readonly children: number[][];
	readonly setup: LocalPose[];
	readonly local: LocalPose[];
	readonly world: Affine[];
	readonly setupWorld: Affine[];
	readonly setupWorldInv: Affine[];
	readonly skin: Affine[];
	/** Continuous setup world angle per bone: the sum of local rotations down the chain (degrees). */
	readonly setupAngle: Float64Array;
	/** role → bone index (first bone with that role). */
	readonly roles = new Map<string, number>();
	private readonly scratch = new Affine();

	constructor(bones: BoneData[]) {
		this.bones = orderBones(bones);
		const n = this.bones.length;
		this.parent = new Int32Array(n);
		this.children = Array.from({ length: n }, () => []);
		this.bones.forEach((b, i) => this.index.set(b.id, i));
		this.bones.forEach((b, i) => {
			const p = b.parent === null ? -1 : (this.index.get(b.parent) ?? -1);
			this.parent[i] = p;
			if (p >= 0) this.children[p]!.push(i);
			if (b.role && !this.roles.has(b.role)) this.roles.set(b.role, i);
		});
		this.setup = this.bones.map((b) => ({ rot: b.rotation, x: b.x, y: b.y, sx: b.scaleX, sy: b.scaleY }));
		this.local = this.setup.map((p) => ({ ...p }));
		this.world = this.bones.map(() => new Affine());
		this.skin = this.bones.map(() => new Affine());
		this.updateWorld(this.setup, this.world);
		this.setupWorld = this.world.map((m) => m.clone());
		this.setupWorldInv = this.setupWorld.map((m) => m.invert());
		this.setupAngle = new Float64Array(n);
		for (let i = 0; i < n; i++) {
			const p = this.parent[i]!;
			const inherits = p >= 0 && this.bones[i]!.inheritRotation !== false;
			this.setupAngle[i] = (inherits ? this.setupAngle[p]! : 0) + this.setup[i]!.rot;
		}
		this.updateSkin();
	}

	get size(): number {
		return this.bones.length;
	}

	resetPose(): void {
		for (let i = 0; i < this.setup.length; i++) Object.assign(this.local[i]!, this.setup[i]);
	}

	/** Compute world matrices from a local pose (defaults to the current pose). */
	updateWorld(local: LocalPose[] = this.local, out: Affine[] = this.world): void {
		for (let i = 0; i < this.bones.length; i++) {
			const l = local[i]!;
			const p = this.parent[i]!;
			const m = out[i]!;
			if (p < 0) {
				m.setTRS(l.x, l.y, l.rot, l.sx, l.sy);
				continue;
			}
			const pw = out[p]!;
			if (this.bones[i]!.inheritRotation === false) {
				const [wx, wy] = pw.apply(l.x, l.y);
				m.setTRS(wx, wy, l.rot, l.sx, l.sy);
			} else {
				this.scratch.setTRS(l.x, l.y, l.rot, l.sx, l.sy);
				m.setMultiply(pw, this.scratch);
			}
		}
	}

	updateSkin(): void {
		for (let i = 0; i < this.bones.length; i++) this.skin[i]!.setMultiply(this.world[i]!, this.setupWorldInv[i]!);
	}

	/** Recompute world and skin matrices from the current local pose. */
	update(): void {
		this.updateWorld();
		this.updateSkin();
	}

	/** World position of a bone's origin and tip in the current pose. */
	segment(i: number, matrices: Affine[] = this.world): { ax: number; ay: number; bx: number; by: number } {
		const m = matrices[i]!;
		const [bx, by] = m.apply(this.bones[i]!.length, 0);
		return { ax: m.tx, ay: m.ty, bx, by };
	}

	/** World angle (degrees) of a bone's parent in the given matrices; 0 for roots. */
	parentWorldAngle(i: number, matrices: Affine[] = this.world): number {
		const p = this.parent[i]!;
		return p < 0 ? 0 : matrices[p]!.angle();
	}
}
