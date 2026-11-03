import type { Facing } from '../core/types';
import type { ImageDataLike, Rect } from './image';
import { detectionView, foregroundMask, restoreLandmarks, type Point } from './analysis';
import { components, distanceTransform, skeletonize } from './morph';
import { skeletonBranches } from './landmarks';
import { interiorPath, jointOnPath } from './limbs';

export interface ShapeLandmarks {
	box: Rect;
	facing: Facing;
	placements: Record<string, [Point, Point]>;
	confidence: Record<string, number>;
	notes: string[];
}

/** Fit the chosen body plan to its thick centre, not the full outline of wisps or crests.
 * Serpents use a silhouette path; other plans use a thickness-weighted vertical centreline. */
export function detectShape(source: ImageDataLike, kind: 'floating' | 'serpentine' | 'blob' | 'custom', facing: Facing | 'auto' = 'auto', fallback: Facing = 'right'): ShapeLandmarks | null {
	const view = detectionView(source);
	const img = view.image, w = img.width, h = img.height;
	const pieces = components(foregroundMask(img), w, h).sort((a, b) => b.length - a.length);
	const main = pieces[0];
	if (!main?.length) return null;
	const mask = new Uint8Array(w * h);
	let left = w, right = 0, top = h, bottom = 0;
	for (const i of main) {
		mask[i] = 1;
		const x = i % w, y = Math.floor(i / w);
		left = Math.min(left, x); right = Math.max(right, x);
		top = Math.min(top, y); bottom = Math.max(bottom, y);
	}
	const W = right - left + 1, H = bottom - top + 1;
	const radius = distanceTransform(mask, w, h);
	const centre = (y: number): Point => {
		const row = Math.max(top, Math.min(bottom, Math.round(y)));
		let weighted = 0, mass = 0;
		for (let x = left; x <= right; x++) {
			const weight = radius[row * w + x]! ** 2;
			weighted += (x + 0.5) * weight; mass += weight;
		}
		return [mass ? weighted / mass : (left + right + 1) / 2, row + 0.5];
	};
	const at = (t: number) => centre(top + (H - 1) * t);
	const placements: ShapeLandmarks['placements'] = {};
	const confidence: Record<string, number> = { body: 0.6 };
	const notes: string[] = ['Body centre fitted to the silhouette thickness.'];
	let resultFacing: Facing = facing === 'auto' ? fallback : facing;
	const root = at(1);
	placements.root = [[root[0], bottom + 1], [root[0] + (resultFacing === 'right' ? 1 : -1) * H * 0.12, bottom + 1]];
	if (kind === 'blob' || kind === 'custom') {
		placements.body = [at(kind === 'blob' ? 0.98 : 0.95), at(kind === 'blob' ? 0.42 : 0.2)];
		if (kind === 'blob') placements.crest = [at(0.42), at(0)];
	} else if (kind === 'floating') {
		placements.torso = [at(0.74), at(0.3)];
		placements.head = [at(0.3), at(0)];
		placements.tail = [at(0.74), at(0.88)];
		placements.tail_tip = [at(0.88), at(1)];
		confidence.head = 0.35;
		confidence.arms = 0;
		notes.push('Head boundary is estimated; check it. Arms keep proportions unless a supported branch is found.');
		const branches = skeletonBranches(skeletonize(mask, w, h), w, h);
		for (const [side, role] of [[-1, 'back'], [1, 'front']] as const) {
			const shoulder = at(0.34);
			const worldSide = side * (resultFacing === 'right' ? 1 : -1);
			shoulder[0] += worldSide * W * 0.16;
			const candidates = branches.filter(b => {
				const i = b.path[0]!, j = b.path[b.path.length - 1]!;
				return Math.floor(i / w) > top + H * 0.2 && Math.floor(i / w) < top + H * 0.7 &&
					(i % w - shoulder[0]) * worldSide > 0 && b.length > H * 0.1 &&
					Math.hypot(j % w - shoulder[0], Math.floor(j / w) - shoulder[1]) < H * 0.17;
			}).sort((a, b) => b.length - a.length);
			const branch = candidates[0];
			if (!branch) continue;
			const i = branch.path[0]!;
			const hand: Point = [i % w + 0.5, Math.floor(i / w) + 0.5];
			const route = interiorPath(mask, radius, w, h, shoulder, hand);
			const joint = route ? jointOnPath(route, shoulder, hand, H) : null;
			const elbow: Point = joint?.point ?? [(shoulder[0] + hand[0]) / 2, (shoulder[1] + hand[1]) / 2];
			placements[`arm_upper_${role}`] = [shoulder, elbow];
			placements[`arm_lower_${role}`] = [elbow, hand];
			confidence.arms += 0.25;
		}
	} else {
		const branches = skeletonBranches(skeletonize(mask, w, h), w, h).filter(b => b.length > Math.max(2, H * 0.04));
		const ends = branches.map(b => b.path[0]!);
		let pair: [number, number] | null = null, separation = 0;
		for (const a of ends) for (const b of ends) {
			const d = Math.hypot(a % w - b % w, Math.floor(a / w) - Math.floor(b / w));
			if (d > separation) { separation = d; pair = [a, b]; }
		}
		if (!pair) return null;
		let path = interiorPath(mask, radius, w, h, [pair[0] % w + 0.5, Math.floor(pair[0] / w) + 0.5], [pair[1] % w + 0.5, Math.floor(pair[1] / w) + 0.5]);
		if (!path || path.length < Math.max(W, H) * 0.6) return null;
		const girth = (points: Point[]) => points.reduce((sum, p) => sum + radius[Math.floor(p[1]) * w + Math.floor(p[0])]!, 0) / points.length;
		const n = Math.max(2, Math.ceil(path.length * 0.18));
		const a = girth(path.slice(0, n)), b = girth(path.slice(-n));
		// The thicker end is a head candidate; a tie uses the user's facing choice.
		const ambiguous = Math.abs(a - b) < Math.max(a, b) * 0.2;
		const headAtStart = ambiguous ? (path[0]![0] - path[path.length - 1]![0]) * (resultFacing === 'right' ? 1 : -1) > 0 : a > b;
		if (headAtStart) path = path.reverse();
		const p = (t: number): Point => path![Math.round((path!.length - 1) * t)]!;
		if (facing === 'auto' && !ambiguous) resultFacing = p(1)[0] >= p(0)[0] ? 'right' : 'left';
		placements.body = [p(0.42), p(0.68)];
		placements.neck = [p(0.68), p(0.88)];
		placements.head = [p(0.88), p(1)];
		placements.tail = [p(0.42), p(0.18)];
		placements.tail_tip = [p(0.18), p(0)];
		confidence.body = 0.75; confidence.head = ambiguous ? 0.2 : 0.55;
		notes.push(ambiguous ? 'Serpent ends are ambiguous; head direction uses your facing choice.' : 'Serpent body follows the silhouette; thicker end proposed as the head.');
	}
	if (facing === 'auto' && kind !== 'serpentine') notes.push(`Facing ${resultFacing} is a guess; the silhouette does not establish a viewing direction.`);
	placements.root[1][0] = placements.root[0][0] + (resultFacing === 'right' ? 1 : -1) * H * 0.12;
	return restoreLandmarks({ box: { x: left, y: top, width: W, height: H }, facing: resultFacing, placements, confidence, notes }, view);
}
