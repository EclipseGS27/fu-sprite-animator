import type { BoneData, Facing, PartData } from '../core/types';
import type { HumanoidLandmarks, Pt } from '../sprite/landmarks';
import { HUMANOID, buildFromTemplate } from './templates';

/** Humanoid template bones placed on detected landmarks. */
export function humanoidFromLandmarks(L: HumanoidLandmarks): { bones: BoneData[]; parts: PartData[] } {
	const H = L.body.height;
	const s = L.facing === 'right' ? 1 : -1;
	const pelvisLow: Pt = [L.pelvis[0], L.pelvis[1] + H * 0.035];
	const pelvisTop: Pt = [L.pelvis[0], L.pelvis[1] - H * 0.04];
	const weapon: [Pt, Pt] = L.weapon ? [L.weapon.hilt, L.weapon.tip] : [L.handFront, [L.handFront[0] + s * H * 0.22, L.handFront[1] - H * 0.32]];
	const place: Record<string, [Pt, Pt]> = {
		root: [L.ground, [L.ground[0] + s * H * 0.12, L.ground[1]]],
		pelvis: [pelvisLow, pelvisTop],
		torso: [pelvisTop, L.neck],
		head: [L.neck, L.top],
		arm_upper_back: [L.shoulderBack, L.elbowBack],
		arm_lower_back: [L.elbowBack, L.wristBack],
		hand_back: [L.wristBack, L.handBack],
		leg_upper_back: [L.hipBack, L.kneeBack],
		leg_lower_back: [L.kneeBack, L.ankleBack],
		foot_back: [L.ankleBack, L.toeBack],
		leg_upper_front: [L.hipFront, L.kneeFront],
		leg_lower_front: [L.kneeFront, L.ankleFront],
		foot_front: [L.ankleFront, L.toeFront],
		arm_upper_front: [L.shoulderFront, L.elbowFront],
		arm_lower_front: [L.elbowFront, L.wristFront],
		hand_front: [L.wristFront, L.handFront],
		weapon,
	};
	return buildFromTemplate(HUMANOID, (tb) => {
		const p = place[tb.id];
		if (!p) throw new Error(`No placement for ${tb.id}`);
		return { from: p[0], to: p[1] };
	});
}

export type { Facing };
