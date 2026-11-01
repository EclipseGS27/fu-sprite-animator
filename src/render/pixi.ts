import type * as PIXINS from 'pixi.js';
import type { Affine } from '../core/math';
import { AnimationPlayer } from '../core/player';
import { Skeleton } from '../core/skeleton';
import { deformPart, snapSkins } from '../core/skin';
import type { RigBuild } from '../rig/build';

/**
 * PixiJS 7 adapter (Foundry v13 ships PixiJS 7). The only file that touches PIXI.
 * We never bundle PixiJS: the global one (Foundry's, or the test page's) is used.
 */
export type PIXI = typeof PIXINS;

export function pixi(): PIXI {
	const p = (globalThis as { PIXI?: PIXI }).PIXI;
	if (!p) throw new Error('PixiJS is not loaded.');
	return p;
}

export function pixiMajor(): number {
	return Number(String(pixi().VERSION ?? '0').split('.')[0]) || 0;
}

/**
 * GPU resources shared by every view of one rig revision: the atlas texture. Reference counted;
 * destroyed when the last view lets go.
 */
export class RigAsset {
	readonly build: RigBuild;
	readonly baseTexture: PIXINS.BaseTexture;
	readonly texture: PIXINS.Texture;
	private refs = 0;
	private onFree: (() => void) | null;

	constructor(build: RigBuild, onFree: (() => void) | null = null) {
		const P = pixi();
		this.build = build;
		this.onFree = onFree;
		const pixel = build.rig.render.mode === 'pixel';
		this.baseTexture = P.BaseTexture.fromBuffer(new Uint8Array(build.atlas.data.buffer, build.atlas.data.byteOffset, build.atlas.data.byteLength), build.atlas.width, build.atlas.height, {
			scaleMode: pixel ? P.SCALE_MODES.NEAREST : P.SCALE_MODES.LINEAR,
			mipmap: P.MIPMAP_MODES.OFF,
			alphaMode: P.ALPHA_MODES.UNPACK,
		});
		this.texture = new P.Texture(this.baseTexture);
	}

	acquire(): this {
		this.refs++;
		return this;
	}

	release(): void {
		this.refs = Math.max(0, this.refs - 1);
		if (this.refs === 0) this.destroy();
	}

	get users(): number {
		return this.refs;
	}

	get destroyed(): boolean {
		return !this.texture.baseTexture;
	}

	destroy(): void {
		if (this.destroyed) return;
		this.texture.destroy(true);
		this.onFree?.();
		this.onFree = null;
	}
}

export interface RigViewOptions {
	/** Render resolution multiplier (smooth mode only). */
	resolution?: number;
}

/**
 * One animated instance of a rig: its own skeleton, player, part meshes and render target.
 * Each frame: player.update → deform part vertices → render the parts into `renderTexture`
 * at the sprite's native resolution (pixel mode) so the output is a clean pixel grid.
 */
export class RigView {
	readonly asset: RigAsset;
	readonly skeleton: Skeleton;
	readonly player: AnimationPlayer;
	readonly container: PIXINS.Container;
	readonly renderTexture: PIXINS.RenderTexture;
	readonly resolution: number;
	private readonly meshes: PIXINS.SimpleMesh[] = [];
	private readonly skins: Affine[] = [];
	private destroyed = false;
	/** Set when the pose changed since the last render. */
	dirty = true;

	constructor(asset: RigAsset, o: RigViewOptions = {}) {
		const P = pixi();
		this.asset = asset.acquire();
		const build = asset.build;
		const rig = build.rig;
		this.skeleton = new Skeleton(rig.bones);
		this.player = new AnimationPlayer(this.skeleton, { bodyHeight: rig.metrics.bodyHeight, facing: rig.facing, roleScale: rig.roleScale });
		const pixel = rig.render.mode === 'pixel';
		this.resolution = pixel ? 1 : Math.max(0.25, Math.min(4, o.resolution ?? rig.render.resolution ?? 1));
		this.container = new P.Container();
		this.container.scale.set(this.resolution);
		for (const g of build.geometries) {
			deformPart(g, this.skeleton.skin, build.pad, build.pad);
			const vertices = g.out.slice();
			const mesh = new P.SimpleMesh(asset.texture, vertices as never, g.uvs as never, g.indices as never);
			this.meshes.push(mesh);
			this.container.addChild(mesh);
		}
		this.renderTexture = P.RenderTexture.create({
			width: Math.ceil(build.outWidth * this.resolution),
			height: Math.ceil(build.outHeight * this.resolution),
			scaleMode: pixel ? P.SCALE_MODES.NEAREST : P.SCALE_MODES.LINEAR,
			resolution: 1,
		});
	}

	get build(): RigBuild {
		return this.asset.build;
	}

	/** Advance animation time (seconds). */
	update(dt: number): void {
		this.player.update(dt);
		this.dirty = true;
	}

	/** Write the current skeleton pose into the part meshes. */
	syncMeshes(): void {
		const build = this.asset.build;
		const skins = build.rig.render.mode === 'pixel' && build.rig.render.snap ? snapSkins(this.skeleton.skin, this.skins) : this.skeleton.skin;
		build.geometries.forEach((g, i) => {
			deformPart(g, skins, build.pad, build.pad);
			const mesh = this.meshes[i]!;
			const v = mesh.vertices as unknown as Float32Array;
			v.set(g.out);
			mesh.geometry.getBuffer('aVertexPosition').update();
		});
	}

	/** Render the current pose into the render texture. */
	render(renderer: PIXINS.IRenderer): void {
		if (this.destroyed) return;
		this.syncMeshes();
		renderer.render(this.container, { renderTexture: this.renderTexture, clear: true });
		this.dirty = false;
	}

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		for (const m of this.meshes) m.destroy({ children: true, texture: false, baseTexture: false });
		this.meshes.length = 0;
		this.container.destroy({ children: true });
		this.renderTexture.destroy(true);
		this.asset.release();
	}
}

/**
 * A texture over a rig view's padded render target that reports the sprite's own size: `orig`
 * is the sprite, `trim` places the larger padded area around it. Sprites (and Foundry's
 * SpriteMesh, which follows the same rules) then keep their size and anchor while limbs and
 * weapons draw outside the original edges.
 *
 * @param scale  orig units per sprite pixel (token texture size / rig image size)
 */
export function trimmedTexture(view: RigView, scale = 1): PIXINS.Texture {
	const P = pixi();
	const b = view.build;
	const frame = new P.Rectangle(0, 0, view.renderTexture.width, view.renderTexture.height);
	const orig = new P.Rectangle(0, 0, b.rig.image.width * scale, b.rig.image.height * scale);
	const trim = new P.Rectangle(-b.pad * scale, -b.pad * scale, b.outWidth * scale, b.outHeight * scale);
	return new P.Texture(view.renderTexture.baseTexture, frame, orig, trim);
}

/** A texture over just the sprite-sized window of the render target (no padding: limbs past the edge are clipped). */
export function clippedTexture(view: RigView, scale = 1): PIXINS.Texture {
	const P = pixi();
	const b = view.build;
	const r = view.resolution;
	const frame = new P.Rectangle(b.pad * r, b.pad * r, b.rig.image.width * r, b.rig.image.height * r);
	const orig = new P.Rectangle(0, 0, b.rig.image.width * scale, b.rig.image.height * scale);
	return new P.Texture(view.renderTexture.baseTexture, frame, orig);
}

/** Load an image URL and read its pixels. */
export async function loadImageData(src: string): Promise<{ image: HTMLImageElement; data: ImageData }> {
	const image = new Image();
	image.crossOrigin = 'anonymous';
	image.decoding = 'async';
	await new Promise<void>((resolve, reject) => {
		image.onload = () => resolve();
		image.onerror = () => reject(new Error(`Could not load the image ${src}`));
		image.src = src;
	});
	const canvas = document.createElement('canvas');
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('No 2D canvas available.');
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, 0, 0);
	return { image, data: ctx.getImageData(0, 0, canvas.width, canvas.height) };
}
