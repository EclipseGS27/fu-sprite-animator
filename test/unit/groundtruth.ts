import { readFileSync } from 'node:fs';
import type { RigDocument } from '../../src/core/types';
import { rigLabels } from '../../src/rig/document';
import type { ImageDataLike } from '../../src/sprite/image';
import { readPng } from './png';

/** The generator's part names → template roles, per sprite (creatures name parts their own way). */
const SPRITE_MERGE: Record<string, Record<string, string>> = {
	wolf: { body: 'torso' },
	slime: { body: 'torso', 'tendril.back': 'torso', 'tendril.front': 'torso', stalk: 'crest', eye: 'crest', pupil: 'crest' },
	ghost: { 'tail.1': 'tail' },
};
const MERGE: Record<string, string> = { hair: 'head', eye: 'head', hat: 'head', offhand: 'hand.back', cape: 'torso' };

/** Ground-truth role per pixel from the generator's part map ('' = background). */
export function groundTruthRoles(name: string): { roles: string[]; width: number } {
	const map = readPng(new URL(`../sprites/${name}.parts.png`, import.meta.url).pathname);
	const names: string[] = JSON.parse(readFileSync(new URL(`../sprites/${name}.parts.json`, import.meta.url), 'utf8'));
	const own = SPRITE_MERGE[name] ?? {};
	const roles = new Array<string>(map.width * map.height);
	for (let i = 0; i < roles.length; i++) {
		const v = map.data[i * 4]!;
		const n = v ? names[v - 1]! : '';
		roles[i] = own[n] ?? MERGE[n] ?? n;
	}
	return { roles, width: map.width };
}

/**
 * Rig roles scored against a ground truth that draws a limb as one piece: a rig's "tail.tip" or
 * "arm.lower.front" counts as "tail" / "arm.upper.front" when the ground truth has no such part.
 */
function rigRoleMap(rig: RigDocument, gt: Set<string>): Map<number, string> {
	const coarse: Record<string, string> = { 'tail.tip': 'tail', 'arm.lower.front': 'arm.upper.front', 'arm.lower.back': 'arm.upper.back' };
	return new Map(
		rig.parts.map((p) => {
			const r = rig.bones.find((b) => b.id === p.bone)?.role ?? '';
			return [p.label, gt.has(r) ? r : (coarse[r] ?? r)];
		}),
	);
}

/** Fraction of visible pixels whose automatic part has the ground-truth role. */
export function assignmentAccuracy(name: string, rig: RigDocument, image: ImageDataLike): number {
	const { roles } = groundTruthRoles(name);
	const labels = rigLabels(rig);
	const roleOfLabel = rigRoleMap(rig, new Set(roles));
	const known = new Set(roleOfLabel.values());
	let ok = 0;
	let total = 0;
	for (let i = 0; i < labels.length; i++) {
		// pixels the rig has no role for (floating effects) are not scored
		if (!image.data[i * 4 + 3] || !known.has(roles[i]!)) continue;
		total++;
		if (roleOfLabel.get(labels[i]!) === roles[i]) ok++;
	}
	return ok / Math.max(1, total);
}

/**
 * "Oracle" bone segments from the ground truth: each role's main axis (PCA of its pixels),
 * shortened 15 % at each end. Lets us score pixel assignment independently of bone placement.
 */
export function oracleSegments(name: string, rig: RigDocument): { label: number; ax: number; ay: number; bx: number; by: number; bias: number }[] {
	const { roles, width } = groundTruthRoles(name);
	const pts = new Map<string, [number, number][]>();
	roles.forEach((r, i) => {
		if (!r) return;
		if (!pts.has(r)) pts.set(r, []);
		pts.get(r)!.push([(i % width) + 0.5, Math.floor(i / width) + 0.5]);
	});
	const out = [];
	for (const p of rig.parts) {
		const role = rig.bones.find((b) => b.id === p.bone)?.role ?? '';
		const list = pts.get(role);
		if (!list?.length) continue;
		const cx = list.reduce((s, q) => s + q[0], 0) / list.length;
		const cy = list.reduce((s, q) => s + q[1], 0) / list.length;
		let xx = 0, yy = 0, xy = 0;
		for (const [x, y] of list) {
			xx += (x - cx) ** 2;
			yy += (y - cy) ** 2;
			xy += (x - cx) * (y - cy);
		}
		const th = 0.5 * Math.atan2(2 * xy, xx - yy);
		const ux = Math.cos(th), uy = Math.sin(th);
		let lo = Infinity, hi = -Infinity;
		for (const [x, y] of list) {
			const a = (x - cx) * ux + (y - cy) * uy;
			lo = Math.min(lo, a);
			hi = Math.max(hi, a);
		}
		const pad = (hi - lo) * 0.15;
		out.push({ label: p.label, ax: cx + ux * (lo + pad), ay: cy + uy * (lo + pad), bx: cx + ux * (hi - pad), by: cy + uy * (hi - pad), bias: (p.reach ?? 0) * rig.metrics.bodyHeight });
	}
	return out;
}

/** Accuracy of a label map against the ground truth roles. */
export function labelsAccuracy(name: string, rig: RigDocument, labels: Uint8Array, image: ImageDataLike): number {
	const { roles } = groundTruthRoles(name);
	const roleOfLabel = rigRoleMap(rig, new Set(roles));
	const known = new Set(roleOfLabel.values());
	let ok = 0;
	let total = 0;
	for (let i = 0; i < labels.length; i++) {
		// pixels the rig has no role for (floating effects) are not scored
		if (!image.data[i * 4 + 3] || !known.has(roles[i]!)) continue;
		total++;
		if (roleOfLabel.get(labels[i]!) === roles[i]) ok++;
	}
	return ok / Math.max(1, total);
}
