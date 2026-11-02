import { it } from 'vitest';
import { createRig } from '../../src/rig/document';
import type { TemplateId } from '../../src/core/types';
import { assignmentAccuracy } from '../unit/groundtruth';
import { readPng, spritePath } from '../unit/png';
// Dev tool: accuracy of creature templates (proportional fit + assignment) against ground truth.
it('creature accuracy', () => {
	const cases: [string, TemplateId][] = [['wolf', 'quadruped'], ['dragon', 'winged'], ['ghost', 'floating'], ['slime', 'blob'], ['golem', 'humanoid']];
	for (const [name, template] of cases) {
		const image = readPng(spritePath(name));
		const rig = createRig({ name, src: name, image, template });
		console.log(name, template, (assignmentAccuracy(name, rig, image) * 100).toFixed(1));
	}
});
