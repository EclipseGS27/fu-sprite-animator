import { orderBones } from '../core/skeleton';
import type { ClipDocument, RigDocument } from '../core/types';
import { countOpaque, type ImageDataLike } from '../sprite/image';
import { labelCounts } from '../sprite/ownership';
import { rigLabels } from './document';

export interface RigIssue {
	level: 'error' | 'warning' | 'info';
	code: string;
	message: string;
	boneId?: string;
	partId?: string;
}

/**
 * Everything that could make a rig look wrong. Errors mean the rig must not be used on tokens;
 * the Studio shows all of them next to the preview.
 */
export function validateRig(rig: RigDocument, o: { image?: ImageDataLike; labels?: Uint8Array; clips?: ClipDocument[] } = {}): RigIssue[] {
	const issues: RigIssue[] = [];
	const err = (code: string, message: string, extra: Partial<RigIssue> = {}) => issues.push({ level: 'error', code, message, ...extra });
	const warn = (code: string, message: string, extra: Partial<RigIssue> = {}) => issues.push({ level: 'warning', code, message, ...extra });
	const info = (code: string, message: string, extra: Partial<RigIssue> = {}) => issues.push({ level: 'info', code, message, ...extra });

	try {
		orderBones(rig.bones);
	} catch (e) {
		err('hierarchy', (e as Error).message);
		return issues;
	}
	const boneIds = new Set(rig.bones.map((b) => b.id));
	const roles = new Map<string, string[]>();
	for (const b of rig.bones) if (b.role) roles.set(b.role, [...(roles.get(b.role) ?? []), b.name]);
	for (const [role, names] of roles) if (names.length > 1) warn('role-duplicate', `Role "${role}" is on ${names.join(', ')}; only the first one is animated.`);

	const labels = new Set<number>();
	for (const p of rig.parts) {
		if (!boneIds.has(p.bone)) err('part-bone', `Part "${p.name}" follows a bone that no longer exists.`, { partId: p.id });
		if (p.label < 1 || p.label > 254) err('part-label', `Part "${p.name}" has an invalid label.`, { partId: p.id });
		if (labels.has(p.label)) err('part-label-dup', `Two parts share label ${p.label}.`, { partId: p.id });
		labels.add(p.label);
	}

	let map = o.labels ?? null;
	if (!map) {
		try {
			map = rig.ownership ? rigLabels(rig) : null;
		} catch (e) {
			err('ownership', (e as Error).message);
		}
	}
	if (!map) warn('ownership-missing', 'No pixels are assigned to bones yet: use "Assign pixels".');
	else {
		const counts = labelCounts(map);
		for (const p of rig.parts) if (!counts.get(p.label)) warn('part-empty', `Part "${p.name}" has no pixels.`, { partId: p.id });
		if (o.image) {
			let lost = 0;
			for (let i = 0; i < map.length; i++) {
				if (o.image.data[i * 4 + 3]! > 0 && !labels.has(map[i]!)) lost++;
			}
			const visible = countOpaque(o.image);
			if (lost > 0) {
				const pct = (lost / Math.max(1, visible)) * 100;
				const text = `${lost} visible pixel${lost === 1 ? '' : 's'} (${pct < 0.1 ? '<0.1' : pct.toFixed(1)}%) belong to no part and would disappear. Paint them onto a bone.`;
				if (pct > 0.5) err('pixels-lost', text);
				else warn('pixels-lost', text);
			}
		}
	}

	if (!rig.bones.some((b) => b.parent === null && b.role === 'root')) info('no-root', 'No bone has the "root" role; whole-body motion (lunges, recoil) will not play.');
	const max = Math.max(rig.image.width, rig.image.height);
	if (max > 2048) warn('large', `The sprite is ${max}px; animating many tokens this size is slow. 1024px or less is recommended.`);
	if (rig.metrics.bodyHeight < 8) warn('tiny', 'The character is under 8px tall; motion will be very coarse.');

	for (const clip of o.clips ?? []) {
		const need = clip.requires ?? [];
		const missing = need.filter((r) => !roles.has(r));
		if (missing.length) info('clip-roles', `"${clip.name}" uses ${missing.join(', ')}, which this rig does not have; those parts stay still.`);
	}
	return issues;
}

export const isUsable = (issues: RigIssue[]): boolean => !issues.some((i) => i.level === 'error');
