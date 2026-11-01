import { readFileSync } from 'node:fs';
import type { RigDocument } from '../../src/core/types';
import { rigLabels } from '../../src/rig/document';
import type { ImageDataLike } from '../../src/sprite/image';
import { readPng } from './png';

/** Ground-truth role per pixel from the generator's part map ('' = background). */
export function groundTruthRoles(name: string): { roles: string[]; width: number } {
	const map = readPng(new URL(`../sprites/${name}.parts.png`, import.meta.url).pathname);
	const names: string[] = JSON.parse(readFileSync(new URL(`../sprites/${name}.parts.json`, import.meta.url), 'utf8'));
	const merge: Record<string, string> = { hair: 'head', eye: 'head', hat: 'head', offhand: 'hand.back' };
	const roles = new Array<string>(map.width * map.height);
	for (let i = 0; i < roles.length; i++) {
		const v = map.data[i * 4]!;
		const n = v ? names[v - 1]! : '';
		roles[i] = merge[n] ?? n;
	}
	return { roles, width: map.width };
}

/** Fraction of visible pixels whose automatic part has the ground-truth role. */
export function assignmentAccuracy(name: string, rig: RigDocument, image: ImageDataLike): number {
	const { roles } = groundTruthRoles(name);
	const labels = rigLabels(rig);
	const roleOfLabel = new Map(rig.parts.map((p) => [p.label, rig.bones.find((b) => b.id === p.bone)?.role ?? '']));
	let ok = 0;
	let total = 0;
	for (let i = 0; i < labels.length; i++) {
		if (!image.data[i * 4 + 3]) continue;
		total++;
		if (roleOfLabel.get(labels[i]!) === roles[i]) ok++;
	}
	return ok / Math.max(1, total);
}
