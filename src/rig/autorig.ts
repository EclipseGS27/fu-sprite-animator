import type { BoneData, Facing, PartData } from '../core/types';
import type { BeastLandmarks } from '../sprite/creatures';
import type { HumanoidLandmarks, Pt } from '../sprite/landmarks';
import { HUMANOID, buildFromTemplate, type RigTemplate } from './templates';

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

/**
 * A four-legged (or winged) template placed on detected beast landmarks. Bones the landmarks do
 * not cover (a tail that was not found, hidden wings) keep the template's proportions.
 */
export function beastFromLandmarks(L: BeastLandmarks, t: RigTemplate): { bones: BoneData[]; parts: PartData[] } {
	const { box } = L;
	const s = L.facing === 'right' ? 1 : -1;
	const prop = ([u, v]: [number, number]): Pt => [box.x + (s > 0 ? u : 1 - u) * box.width, box.y + v * box.height];
	const legTop = (l: { top: Pt }): Pt => [l.top[0], L.belly - L.thickness * 0.25];
	const ground = box.y + box.height - 1;
	const place: Record<string, [Pt, Pt]> = {
		root: [[box.x + box.width / 2, ground + 1], [box.x + box.width / 2 + s * box.height * 0.12, ground + 1]],
		body: [L.hip, L.shoulder],
		neck: [L.shoulder, L.head.base],
		head: [L.head.base, L.head.tip],
		leg_hind_near: [legTop(L.legs.hindNear), L.legs.hindNear.foot],
		leg_hind_far: [legTop(L.legs.hindFar), L.legs.hindFar.foot],
		leg_front_near: [legTop(L.legs.frontNear), L.legs.frontNear.foot],
		leg_front_far: [legTop(L.legs.frontFar), L.legs.frontFar.foot],
	};
	if (L.tail) {
		place.tail = [L.tail.base, L.tail.mid];
		place.tail_tip = [L.tail.mid, L.tail.tip];
	}
	if (L.wings) {
		place.wing_near = [L.wings.near.base, L.wings.near.tip];
		place.wing_far = [L.wings.far.base, L.wings.far.tip];
	}
	return buildFromTemplate(t, (tb) => {
		const p = place[tb.id];
		return p ? { from: p[0], to: p[1] } : { from: prop(tb.from), to: prop(tb.to) };
	});
}

export type { Facing };
