/**
 * Runs in headless Chromium with the real PixiJS 7.4.3 (global PIXI, like Foundry v13) and
 * WebGL. Exposes test functions on window for test/render/run.mjs.
 */
import { Skeleton } from '../../src/core/skeleton';
import { getClip } from '../../src/presets';
import { buildRig } from '../../src/rig/build';
import { createRig } from '../../src/rig/document';
import { rasterize } from '../../src/render/cpu';
import { RigAsset, RigView, loadImageData, pixi, trimmedTexture, clippedTexture } from '../../src/render/pixi';
import type { TemplateId } from '../../src/core/types';

const HUMANOIDS = new Set(['warrior', 'mage', 'greatsword', 'knight', 'tiny', 'illustrated']);

let app: import('pixi.js').Application | null = null;
function renderer() {
	const P = pixi();
	app ??= new P.Application({ width: 256, height: 256, backgroundAlpha: 0, antialias: false, autoStart: false });
	return app.renderer;
}

async function setup(name: string, facing: 'left' | 'right' = 'right') {
	const { data } = await loadImageData(`../sprites/${name}.png`);
	const template: TemplateId = HUMANOIDS.has(name) ? 'humanoid' : 'custom';
	const rig = createRig({ name, src: `${name}.png`, image: data, template, facing });
	const build = buildRig(rig, data);
	const asset = new RigAsset(build);
	const view = new RigView(asset);
	return { data, rig, build, asset, view };
}

function readRT(view: RigView): Uint8Array {
	return renderer().extract.pixels(view.renderTexture) as Uint8Array;
}

/** Rest pose on the GPU vs the source image. */
async function fidelity(name: string) {
	const { data, build, view } = await setup(name);
	view.render(renderer());
	const px = readRT(view);
	let exact = 0;
	let opaqueDiff = 0;
	let partialMax = 0;
	let partialBeyond = 0;
	let total = 0;
	for (let y = 0; y < data.height; y++) {
		for (let x = 0; x < data.width; x++) {
			const a = (y * data.width + x) * 4;
			const b = ((y + build.pad) * build.outWidth + (x + build.pad)) * 4;
			const oa = data.data[a + 3]!;
			if (oa === 0 && px[b + 3] === 0) continue;
			total++;
			const same = [0, 1, 2, 3].every((c) => data.data[a + c] === px[b + c]);
			if (same) exact++;
			else if (oa === 255) opaqueDiff++;
			else {
				// WebGL stores premultiplied colour: un-premultiplying a pixel of alpha a can be off by about 255 / (2a)
				const delta = Math.max(...[0, 1, 2, 3].map((c) => Math.abs(data.data[a + c]! - px[b + c]!)));
				partialMax = Math.max(partialMax, delta);
				if (delta > Math.ceil(255 / (2 * oa)) + 1) partialBeyond++;
			}
		}
	}
	view.destroy();
	return { name, total, exact, opaqueDiff, partialMax, partialBeyond, buildMs: Math.round(build.ms) };
}

/** Sword slash on the GPU vs the CPU reference renderer, frame by frame. */
async function gpuVsCpu(name: string, clipId: string, frames = 12) {
	const { build, rig, view } = await setup(name);
	const cpuSk = new Skeleton(rig.bones);
	const { AnimationPlayer } = await import('../../src/core/player');
	const cpuPlayer = new AnimationPlayer(cpuSk, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing });
	const clip = getClip(clipId)!;
	view.player.play(getClip('idle-breathing')!);
	view.player.play(clip, { mixIn: 0.08, variation: 0 });
	cpuPlayer.play(getClip('idle-breathing')!);
	cpuPlayer.play(clip, { mixIn: 0.08, variation: 0 });
	const dt = (clip.duration + 0.2) / frames;
	let worst = 0;
	const strip: Uint8Array[] = [];
	for (let f = 0; f < frames; f++) {
		view.update(dt);
		cpuPlayer.update(dt);
		view.render(renderer());
		const gpu = readRT(view);
		strip.push(gpu);
		const cpu = rasterize(build, cpuSk, { snap: rig.render.snap }).data;
		let differ = 0;
		let px = 0;
		for (let i = 0; i < gpu.length; i += 4) {
			if (!gpu[i + 3] && !cpu[i + 3]) continue;
			px++;
			if (Math.abs(gpu[i + 3]! - cpu[i + 3]!) > 2 || Math.abs(gpu[i]! - cpu[i]!) > 2) differ++;
		}
		worst = Math.max(worst, differ / Math.max(1, px));
	}
	// contact sheet for visual review
	const W = build.outWidth;
	const H = build.outHeight;
	const canvas = document.createElement('canvas');
	canvas.width = W * frames;
	canvas.height = H;
	const ctx = canvas.getContext('2d')!;
	strip.forEach((px, f) => ctx.putImageData(new ImageData(new Uint8ClampedArray(px.buffer.slice(0)), W, H), f * W, 0));
	view.destroy();
	return { name, clipId, worstFrameDiff: worst, png: canvas.toDataURL('image/png') };
}

/** Trimmed texture keeps a sprite's size and anchor while drawing the padded area. */
async function trimCheck(name: string) {
	const P = pixi();
	const { data, view } = await setup(name);
	view.render(renderer());
	const plain = P.Texture.fromBuffer(new Uint8Array(data.data.buffer.slice(0)), data.width, data.height);
	const a = new P.Sprite(plain);
	a.anchor.set(0.5, 1);
	a.width = 100;
	a.height = 100 * (data.height / data.width);
	const before = a.getLocalBounds().clone();
	const sx = a.scale.x;
	a.texture = trimmedTexture(view);
	const after = a.getLocalBounds().clone();
	const c = new P.Sprite(clippedTexture(view));
	view.destroy();
	return {
		sameScale: Math.abs(a.scale.x - sx) < 1e-9,
		sameBounds: Math.abs(before.x - after.x) < 1e-6 && Math.abs(before.width - after.width) < 1e-6 && Math.abs(before.height - after.height) < 1e-6,
		clippedSize: [c.texture.width, c.texture.height],
		spriteSize: [data.width, data.height],
	};
}

/** Many views at once: time per frame and resource cleanup. */
async function stress(name: string, count: number, frames = 60) {
	const { asset, view: first } = await setup(name);
	const views = [first, ...Array.from({ length: count - 1 }, () => new RigView(asset))];
	views.forEach((v, i) => {
		v.player.play(getClip('combat-stance')!);
		v.player.play(getClip(i % 2 ? 'sword-slash' : 'magic-cast')!, { variation: 1, seed: i });
	});
	const t0 = performance.now();
	for (let f = 0; f < frames; f++) {
		for (const v of views) {
			v.update(1 / 60);
			v.render(renderer());
		}
	}
	(renderer() as unknown as { gl: WebGLRenderingContext }).gl.finish();
	const ms = (performance.now() - t0) / frames;
	const usersBefore = asset.users;
	views.forEach((v) => v.destroy());
	return { count, msPerFrame: Math.round(ms * 100) / 100, usersBefore, usersAfter: asset.users, assetDestroyed: asset.destroyed };
}

Object.assign(window, { fidelity, gpuVsCpu, trimCheck, stress, pixiVersion: () => pixi().VERSION });
(window as unknown as { harnessReady: boolean }).harnessReady = true;
