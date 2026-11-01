import { Skeleton } from '../core/skeleton';
import { buildPartGeometry, type PartGeometry } from '../core/skin';
import type { RigDocument } from '../core/types';
import { buildAtlas, type Atlas } from '../sprite/atlas';
import { computeFills, type PartFill } from '../sprite/fill';
import type { ImageDataLike } from '../sprite/image';
import { rigHints, rigLabels } from './document';

/**
 * Everything derived from a rig and its image that the renderer needs. Built once per rig
 * revision and shared by every view (Studio preview, every token using the rig).
 */
export interface RigBuild {
	rig: RigDocument;
	labels: Uint8Array;
	fills: Map<number, PartFill>;
	atlas: Atlas;
	/** Draw order, back to front. Bone indices refer to `new Skeleton(rig.bones)`. */
	geometries: PartGeometry[];
	/** Transparent margin around the sprite in the output, in sprite pixels. */
	pad: number;
	outWidth: number;
	outHeight: number;
	/** Milliseconds spent building (for diagnostics). */
	ms: number;
}

export function paddingPx(rig: RigDocument): number {
	return Math.round(rig.render.padding * Math.max(rig.image.width, rig.image.height));
}

export function buildRig(rig: RigDocument, image: ImageDataLike, labels: Uint8Array = rigLabels(rig)): RigBuild {
	const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
	if (image.width !== rig.image.width || image.height !== rig.image.height) {
		throw new Error(`The image is ${image.width}×${image.height} but the rig was made for ${rig.image.width}×${rig.image.height}.`);
	}
	const skeleton = new Skeleton(rig.bones);
	const parts = rig.parts.filter((p) => !p.hidden && skeleton.index.has(p.bone));
	const order = parts.map((p) => p.label);
	const fills = computeFills(image, labels, order, {
		radius: Math.max(2, rig.metrics.bodyHeight * 0.15),
		enabled: new Set(parts.filter((p) => p.fill).map((p) => p.label)),
		hints: rigHints(rig),
	});
	const atlas = buildAtlas(image, labels, fills, order);
	const bonesWithParts = new Set(parts.map((p) => skeleton.index.get(p.bone)!));
	const geometries: PartGeometry[] = [];
	for (const p of parts) {
		const rect = atlas.rects.get(p.label);
		const coverage = atlas.coverage.get(p.label);
		if (!rect || !coverage) continue; // part without pixels
		geometries.push(buildPartGeometry(p, rect, coverage, skeleton, { bodyHeight: rig.metrics.bodyHeight, atlasWidth: atlas.width, atlasHeight: atlas.height, bonesWithParts }));
	}
	const pad = paddingPx(rig);
	const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
	return { rig, labels, fills, atlas, geometries, pad, outWidth: rig.image.width + pad * 2, outHeight: rig.image.height + pad * 2, ms: t1 - t0 };
}
