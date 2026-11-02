import { it } from 'vitest';
import { AnimationPlayer } from '../../src/core/player';
import { Skeleton } from '../../src/core/skeleton';
import type { TemplateId } from '../../src/core/types';
import { getClip } from '../../src/presets';
import { createRig } from '../../src/rig/document';
import { readPng, spritePath } from '../unit/png';
// Dev tool: CPU cost of posing (clip evaluation, blending, world and skin matrices) per animated character.
it('posing cost', () => {
	const kinds: [string, TemplateId, string, string][] = [
		['warrior', 'humanoid', 'combat-stance', 'sword-slash'],
		['wolf', 'quadruped', 'beast-idle', 'bite'],
		['dragon', 'winged', 'wing-idle', 'breath'],
		['slime', 'blob', 'blob-idle', 'blob-attack'],
	];
	const N = 50;
	const players = Array.from({ length: N }, (_, i) => {
		const [name, template, idle, act] = kinds[i % kinds.length]!;
		const rig = createRig({ name, src: name, image: readPng(spritePath(name)), template });
		const sk = new Skeleton(rig.bones);
		const p = new AnimationPlayer(sk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
		p.play(getClip(idle)!);
		return { p, act };
	});
	const frames = 600;
	const t0 = performance.now();
	for (let f = 0; f < frames; f++) {
		for (const [i, { p, act }] of players.entries()) {
			if (f % 60 === i % 60) p.play(getClip(act)!, { seed: f + i });
			p.update(1 / 60);
		}
	}
	const ms = (performance.now() - t0) / frames;
	console.log(`POSE ${N} characters: ${ms.toFixed(3)} ms per frame (${((ms / N) * 1000).toFixed(1)} µs each)`);
});
