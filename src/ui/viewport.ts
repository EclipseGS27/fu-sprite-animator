import type * as PIXINS from 'pixi.js';
import { pixi, type RigView } from '../render/pixi';

export interface BoneGizmo {
	id: string;
	ax: number;
	ay: number;
	bx: number;
	by: number;
	color: string;
	selected: boolean;
	hover: boolean;
	/** Dashed line from the parent's tip when not connected. */
	link?: [number, number] | null;
}

export type Handle = { kind: 'origin' | 'tip' | 'body'; id: string };

export interface ViewportEvents {
	down(x: number, y: number, e: PointerEvent): void;
	move(x: number, y: number, e: PointerEvent): void;
	up(x: number, y: number, e: PointerEvent): void;
	hover(x: number, y: number, e: PointerEvent): void;
	frame(dt: number): void;
}

const css = (hex: string): number => parseInt(hex.replace('#', ''), 16) || 0xffffff;

/**
 * The Studio's canvas: its own small PixiJS application (destroyed with the Studio). Image
 * coordinates are sprite pixels; the camera pans and zooms (whole-number zoom in pixel mode so
 * every sprite pixel is the same size on screen).
 */
export class Viewport {
	readonly el: HTMLDivElement;
	readonly app: PIXINS.Application;
	private readonly world: PIXINS.Container;
	private readonly output: PIXINS.Sprite;
	private readonly regions: PIXINS.Sprite;
	private readonly overlay: PIXINS.Graphics;
	private readonly frameGfx: PIXINS.Graphics;
	private ghostSprites: PIXINS.Sprite[] = [];
	private regionCanvas: HTMLCanvasElement | null = null;
	private regionTexture: PIXINS.Texture | null = null;
	view: RigView | null = null;
	zoom = 4;
	panX = 0;
	panY = 0;
	pixelMode = true;
	imageSize = { width: 64, height: 64 };
	private panning: { x: number; y: number; px: number; py: number } | null = null;
	private ro: ResizeObserver;
	private destroyed = false;

	constructor(parent: HTMLElement, private readonly events: ViewportEvents) {
		const P = pixi();
		this.el = document.createElement('div');
		this.el.className = 'fusa-viewport';
		parent.append(this.el);
		const canvas = document.createElement('canvas');
		this.el.append(canvas);
		this.app = new P.Application({ view: canvas, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: window.devicePixelRatio || 1, width: 400, height: 300 });
		this.world = new P.Container();
		this.output = new P.Sprite(P.Texture.EMPTY);
		this.regions = new P.Sprite(P.Texture.EMPTY);
		this.regions.alpha = 0.45;
		this.frameGfx = new P.Graphics();
		this.overlay = new P.Graphics();
		this.world.addChild(this.output, this.regions);
		this.app.stage.addChild(this.frameGfx, this.world, this.overlay);
		this.app.ticker.add(() => {
			if (!this.destroyed) this.events.frame(this.app.ticker.deltaMS / 1000);
		});
		this.ro = new ResizeObserver(() => this.resize());
		this.ro.observe(this.el);
		canvas.addEventListener('pointerdown', this.onDown);
		canvas.addEventListener('pointermove', this.onMove);
		canvas.addEventListener('pointerup', this.onUp);
		canvas.addEventListener('pointercancel', this.onUp);
		canvas.addEventListener('wheel', this.onWheel, { passive: false });
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		this.resize();
	}

	resize(): void {
		const r = this.el.getBoundingClientRect();
		if (r.width < 2 || r.height < 2) return;
		this.app.renderer.resize(Math.floor(r.width), Math.floor(r.height));
		this.applyCamera();
	}

	setView(view: RigView | null, pixelMode: boolean): void {
		this.view = view;
		this.pixelMode = pixelMode;
		if (!view) {
			this.output.texture = pixi().Texture.EMPTY;
			return;
		}
		this.imageSize = { width: view.build.rig.image.width, height: view.build.rig.image.height };
		const old = this.output.texture;
		this.output.texture = new (pixi().Texture)(view.renderTexture.baseTexture);
		if (old && old !== pixi().Texture.EMPTY) old.destroy(false);
		this.output.scale.set(1 / view.resolution);
		this.output.position.set(-view.build.pad, -view.build.pad);
		this.applyCamera();
	}

	/** Colour each part's pixels (labels → RGBA) for the region overlay. */
	setRegions(labels: Uint8Array | null, width: number, height: number, colourOf: (label: number) => string | null, visible: boolean): void {
		const P = pixi();
		this.regions.visible = visible && !!labels;
		if (!labels || !visible) return;
		if (!this.regionCanvas || this.regionCanvas.width !== width || this.regionCanvas.height !== height) {
			this.regionCanvas = document.createElement('canvas');
			this.regionCanvas.width = width;
			this.regionCanvas.height = height;
			this.regionTexture?.destroy(true);
			this.regionTexture = P.Texture.from(this.regionCanvas, { scaleMode: P.SCALE_MODES.NEAREST });
			this.regions.texture = this.regionTexture;
		}
		const ctx = this.regionCanvas.getContext('2d')!;
		const img = ctx.createImageData(width, height);
		const cache = new Map<number, number[] | null>();
		for (let i = 0; i < labels.length; i++) {
			const l = labels[i]!;
			if (!l) continue;
			let c = cache.get(l);
			if (c === undefined) {
				const hex = colourOf(l);
				c = hex ? [(css(hex) >> 16) & 255, (css(hex) >> 8) & 255, css(hex) & 255] : null;
				cache.set(l, c);
			}
			if (!c) continue;
			img.data[i * 4] = c[0]!;
			img.data[i * 4 + 1] = c[1]!;
			img.data[i * 4 + 2] = c[2]!;
			img.data[i * 4 + 3] = 255;
		}
		ctx.putImageData(img, 0, 0);
		this.regionTexture!.baseTexture.update();
	}

	/** Onion-skin frames drawn faintly behind the main output. */
	setGhosts(list: { view: RigView; tint: number; alpha: number }[]): void {
		const P = pixi();
		while (this.ghostSprites.length > list.length) {
			const g = this.ghostSprites.pop()!;
			g.texture.destroy(false);
			g.destroy();
		}
		list.forEach((item, i) => {
			let g = this.ghostSprites[i];
			if (!g) {
				g = new P.Sprite(P.Texture.EMPTY);
				this.ghostSprites.push(g);
				this.world.addChildAt(g, 0);
			}
			if (g.texture.baseTexture !== item.view.renderTexture.baseTexture) {
				const old = g.texture;
				g.texture = new P.Texture(item.view.renderTexture.baseTexture);
				if (old !== P.Texture.EMPTY) old.destroy(false);
			}
			g.tint = item.tint;
			g.alpha = item.alpha;
			g.scale.set(1 / item.view.resolution);
			g.position.set(-item.view.build.pad, -item.view.build.pad);
		});
	}

	setRegionAlpha(a: number): void {
		this.regions.alpha = a;
	}

	/** Fit the sprite (with padding) in the view. */
	fit(): void {
		const pad = this.view?.build.pad ?? 0;
		const w = this.imageSize.width + pad * 2;
		const h = this.imageSize.height + pad * 2;
		const sw = this.app.renderer.width / this.app.renderer.resolution;
		const sh = this.app.renderer.height / this.app.renderer.resolution;
		let z = Math.min(sw / w, sh / h) * 0.92;
		if (this.pixelMode) z = z >= 1 ? Math.floor(z) : 1 / Math.ceil(1 / z);
		this.zoom = Math.max(0.1, z);
		this.panX = Math.round(sw / 2 - (this.imageSize.width / 2) * this.zoom);
		this.panY = Math.round(sh / 2 - (this.imageSize.height / 2) * this.zoom);
		this.applyCamera();
	}

	private applyCamera(): void {
		this.world.position.set(Math.round(this.panX), Math.round(this.panY));
		this.world.scale.set(this.zoom);
		this.frameGfx.clear();
		// the sprite's own bounds, as a faint frame
		const [x0, y0] = this.toScreen(0, 0);
		const [x1, y1] = this.toScreen(this.imageSize.width, this.imageSize.height);
		this.frameGfx.lineStyle(1, 0x9fd0ff, 0.25).drawRect(x0 - 0.5, y0 - 0.5, x1 - x0 + 1, y1 - y0 + 1);
	}

	toImage(sx: number, sy: number): [number, number] {
		return [(sx - this.panX) / this.zoom, (sy - this.panY) / this.zoom];
	}

	toScreen(ix: number, iy: number): [number, number] {
		return [ix * this.zoom + this.panX, iy * this.zoom + this.panY];
	}

	/** Draw bones as tapered wedges with joint circles (screen space, constant line widths). */
	drawBones(bones: BoneGizmo[], visible: boolean, brush: { x: number; y: number; r: number } | null = null): void {
		const g = this.overlay;
		g.clear();
		if (brush) {
			const [bx, by] = this.toScreen(brush.x, brush.y);
			g.lineStyle(1.5, 0xffffff, 0.9).drawCircle(bx, by, brush.r * this.zoom);
			g.lineStyle(1, 0x000000, 0.6).drawCircle(bx, by, brush.r * this.zoom + 1.5);
		}
		if (!visible) return;
		for (const b of bones) {
			if (!b.link) continue;
			const [lx, ly] = this.toScreen(b.link[0], b.link[1]);
			const [ax, ay] = this.toScreen(b.ax, b.ay);
			const len = Math.hypot(ax - lx, ay - ly);
			const n = Math.max(1, Math.floor(len / 6));
			g.lineStyle(1, 0xffffff, 0.35);
			for (let i = 0; i < n; i += 2) {
				g.moveTo(lx + ((ax - lx) * i) / n, ly + ((ay - ly) * i) / n);
				g.lineTo(lx + ((ax - lx) * (i + 1)) / n, ly + ((ay - ly) * (i + 1)) / n);
			}
		}
		const order = [...bones.filter((b) => !b.selected), ...bones.filter((b) => b.selected)];
		for (const b of order) {
			const [ax, ay] = this.toScreen(b.ax, b.ay);
			const [bx, by] = this.toScreen(b.bx, b.by);
			const len = Math.hypot(bx - ax, by - ay);
			const col = css(b.color);
			const line = b.selected ? 0xffffff : b.hover ? 0xf2c45a : 0x0b1220;
			if (len > 3) {
				const ux = (bx - ax) / len;
				const uy = (by - ay) / len;
				const w = Math.max(3, Math.min(10, len * 0.14));
				const mx = ax + ux * Math.min(len * 0.25, w * 1.6);
				const my = ay + uy * Math.min(len * 0.25, w * 1.6);
				g.lineStyle(b.selected ? 2 : 1.25, line, 0.95);
				g.beginFill(col, b.selected ? 0.85 : 0.6);
				g.drawPolygon([ax, ay, mx - uy * w, my + ux * w, bx, by, mx + uy * w, my - ux * w]);
				g.endFill();
			}
			g.lineStyle(b.selected ? 2 : 1.25, line, 1).beginFill(col, 1).drawCircle(ax, ay, b.selected ? 4.5 : 3.5).endFill();
			if (b.selected && len > 3) g.lineStyle(1.5, 0xffffff, 1).beginFill(0x0b1220, 1).drawCircle(bx, by, 3.5).endFill();
		}
	}

	/** Which bone handle is under an image point (screen-space tolerance). */
	pick(bones: BoneGizmo[], ix: number, iy: number, selectedId: string | null): Handle | null {
		const [sx, sy] = this.toScreen(ix, iy);
		const near = (x: number, y: number, r: number) => {
			const [px, py] = this.toScreen(x, y);
			return Math.hypot(px - sx, py - sy) <= r;
		};
		// the selected bone's tip first, then joints, then bodies
		const sel = bones.find((b) => b.id === selectedId);
		if (sel && near(sel.bx, sel.by, 8)) return { kind: 'tip', id: sel.id };
		for (const b of [...bones].reverse()) if (near(b.ax, b.ay, 7)) return { kind: 'origin', id: b.id };
		for (const b of [...bones].reverse()) if (near(b.bx, b.by, 6)) return { kind: 'tip', id: b.id };
		let best: Handle | null = null;
		let bestD = 7;
		for (const b of bones) {
			const [ax, ay] = this.toScreen(b.ax, b.ay);
			const [bx, by] = this.toScreen(b.bx, b.by);
			const dx = bx - ax;
			const dy = by - ay;
			const l2 = dx * dx + dy * dy;
			if (l2 < 1) continue;
			const t = Math.max(0, Math.min(1, ((sx - ax) * dx + (sy - ay) * dy) / l2));
			const d = Math.hypot(ax + dx * t - sx, ay + dy * t - sy);
			if (d < bestD) {
				bestD = d;
				best = { kind: 'body', id: b.id };
			}
		}
		return best;
	}

	private local(e: PointerEvent | WheelEvent): [number, number] {
		const r = (this.app.view as HTMLCanvasElement).getBoundingClientRect();
		return [e.clientX - r.left, e.clientY - r.top];
	}

	private onDown = (e: PointerEvent) => {
		const [sx, sy] = this.local(e);
		(e.target as Element).setPointerCapture?.(e.pointerId);
		if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey && e.shiftKey)) {
			this.panning = { x: sx, y: sy, px: this.panX, py: this.panY };
			return;
		}
		const [ix, iy] = this.toImage(sx, sy);
		this.events.down(ix, iy, e);
	};

	private onMove = (e: PointerEvent) => {
		const [sx, sy] = this.local(e);
		if (this.panning) {
			this.panX = this.panning.px + sx - this.panning.x;
			this.panY = this.panning.py + sy - this.panning.y;
			this.applyCamera();
			return;
		}
		const [ix, iy] = this.toImage(sx, sy);
		if (e.buttons & 1) this.events.move(ix, iy, e);
		else this.events.hover(ix, iy, e);
	};

	private onUp = (e: PointerEvent) => {
		if (this.panning) {
			this.panning = null;
			return;
		}
		const [sx, sy] = this.local(e);
		const [ix, iy] = this.toImage(sx, sy);
		this.events.up(ix, iy, e);
	};

	private onWheel = (e: WheelEvent) => {
		e.preventDefault();
		const [sx, sy] = this.local(e);
		const [ix, iy] = this.toImage(sx, sy);
		const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
		let z = this.zoom * factor;
		if (this.pixelMode) z = z >= 1 ? Math.max(1, Math.round(z)) : 1 / Math.round(1 / z);
		if (this.pixelMode && z === this.zoom) z = e.deltaY < 0 ? (this.zoom >= 1 ? this.zoom + 1 : 1 / (Math.round(1 / this.zoom) - 1)) : this.zoom > 1 ? this.zoom - 1 : 1 / (Math.round(1 / this.zoom) + 1);
		this.zoom = Math.max(0.1, Math.min(64, z));
		this.panX = sx - ix * this.zoom;
		this.panY = sy - iy * this.zoom;
		this.applyCamera();
	};

	destroy(): void {
		if (this.destroyed) return;
		this.destroyed = true;
		this.ro.disconnect();
		this.regionTexture?.destroy(true);
		this.output.texture?.destroy(false);
		this.app.destroy(true, { children: true, texture: false, baseTexture: false });
		this.el.remove();
	}
}
