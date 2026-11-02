import type { ClipCategory, ClipDocument } from '../core/types';
import { HUMANOID_CLIPS } from './humanoid';
import { LIBRARY_CLIPS } from './library';

/**
 * The clip library: built-in clips plus any registered at runtime (world clips, other modules).
 * Registered clips with the same id replace built-ins, so a world can override "sword-slash".
 */
const builtIn = new Map<string, ClipDocument>([...HUMANOID_CLIPS, ...LIBRARY_CLIPS].map((c) => [c.id, c]));
const registered = new Map<string, ClipDocument>();

export const CATEGORY_LABELS: Record<ClipCategory, string> = {
	idle: 'Idle',
	movement: 'Movement',
	attack: 'Physical attacks',
	magic: 'Magic',
	defence: 'Defence',
	reaction: 'Reactions',
	other: 'Other',
};

export function getClip(id: string): ClipDocument | undefined {
	return registered.get(id) ?? builtIn.get(id);
}

export function listClips(): ClipDocument[] {
	const all = new Map(builtIn);
	for (const [id, c] of registered) all.set(id, c);
	return [...all.values()];
}

export function isBuiltIn(id: string): boolean {
	return builtIn.has(id) && !registered.has(id);
}

/** Validate and add a clip. Throws with a readable message when the clip is malformed. */
export function registerClip(clip: ClipDocument): void {
	if (!clip || clip.format !== 'fusa-clip') throw new Error('Not a clip (format must be "fusa-clip").');
	if (!clip.id || typeof clip.id !== 'string') throw new Error('A clip needs an id.');
	if (!(clip.duration > 0)) throw new Error(`Clip "${clip.id}" needs a positive duration.`);
	for (const [role, track] of Object.entries(clip.tracks ?? {})) {
		for (const keys of [track.rotate, track.translate, track.scale]) {
			if (!keys) continue;
			for (let i = 1; i < keys.length; i++) {
				if (!(keys[i]!.t >= keys[i - 1]!.t)) throw new Error(`Clip "${clip.id}", role "${role}": keys must be in time order.`);
			}
		}
	}
	registered.set(clip.id, clip);
}

export function unregisterClip(id: string): boolean {
	return registered.delete(id);
}
