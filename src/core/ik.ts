import { DEG } from './math';
import type { Skeleton } from './skeleton';

/**
 * Two-bone inverse kinematics: turn bone `child` and its parent so the child's tip reaches
 * (tx, ty) in sprite pixels, keeping the current bend direction (an elbow stays an elbow).
 * Changes the skeleton's local rotations and updates it. Returns false when there is no parent.
 */
export function solveTwoBone(sk: Skeleton, child: number, tx: number, ty: number): boolean {
	const parent = sk.parent[child]!;
	if (parent < 0) return false;
	sk.update();
	const seg = (i: number) => sk.segment(i);
	const a = seg(parent);
	const b = seg(child);
	const A: [number, number] = [a.ax, a.ay];
	const B: [number, number] = [b.ax, b.ay];
	const C: [number, number] = [b.bx, b.by];
	const l1 = Math.hypot(B[0] - A[0], B[1] - A[1]);
	const l2 = Math.hypot(C[0] - B[0], C[1] - B[1]);
	if (l1 < 1e-6 || l2 < 1e-6) return false;
	const dx = tx - A[0];
	const dy = ty - A[1];
	const d = Math.max(Math.abs(l1 - l2) + 1e-4, Math.min(l1 + l2 - 1e-4, Math.hypot(dx, dy)));
	const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
	const alpha = Math.acos(cosA);
	// keep the side the joint bends to
	const bend = Math.sign((B[0] - A[0]) * (C[1] - B[1]) - (B[1] - A[1]) * (C[0] - B[0])) || 1;
	const toT = Math.atan2(dy, dx);
	const newAB = toT - bend * alpha;
	const oldAB = Math.atan2(B[1] - A[1], B[0] - A[0]);
	sk.local[parent]!.rot += (newAB - oldAB) / DEG;
	sk.update();
	const b2 = seg(child);
	const oldBC = Math.atan2(b2.by - b2.ay, b2.bx - b2.ax);
	const newBC = Math.atan2(ty - b2.ay, tx - b2.ax);
	let delta = (newBC - oldBC) / DEG;
	delta -= 360 * Math.round(delta / 360);
	sk.local[child]!.rot += delta;
	sk.update();
	return true;
}
