import { createRig } from '../rig/document';
import { buildRig } from '../rig/build';
import { RigAsset, RigView, pixi, pixiMajor, trimmedTexture } from '../render/pixi';
import { getClip } from '../presets';
import { mappingTable } from './combat';
import { NONE } from '../mapping';
import { describeItem } from '../mapping/projectfu';
import { MODULE_ID } from './constants';
import { tokenAnimators } from './tokens';

export interface SelfTestResult {
	name: string;
	ok: boolean;
	detail: string;
}

/** A small procedural character drawn on a canvas (no files needed). */
function testSprite(): ImageData {
	const c = document.createElement('canvas');
	c.width = 32;
	c.height = 40;
	const g = c.getContext('2d')!;
	const rect = (x: number, y: number, w: number, h: number, col: string) => ((g.fillStyle = col), g.fillRect(x, y, w, h));
	rect(10, 2, 12, 11, '#f0c4a0'); // head
	rect(9, 13, 14, 12, '#c43434'); // torso
	rect(6, 14, 3, 10, '#a02a2a'); // back arm
	rect(23, 14, 3, 10, '#c43434'); // front arm
	rect(26, 4, 2, 18, '#c4cede'); // sword
	rect(10, 25, 5, 13, '#6e4a30'); // legs
	rect(17, 25, 5, 13, '#6e4a30');
	return g.getImageData(0, 0, 32, 40);
}

/**
 * Checks that only a real Foundry can answer: run from the console with
 * `await SpriteAnimator.selfTest()` (or the module settings button). Results are logged and returned.
 */
export async function selfTest(): Promise<SelfTestResult[]> {
	const out: SelfTestResult[] = [];
	const add = (name: string, ok: boolean, detail: string) => out.push({ name, ok, detail });
	const P = pixi();
	add('PixiJS 7', pixiMajor() === 7, `PIXI ${P.VERSION}`);
	const renderer = canvas?.app?.renderer;
	add('Canvas renderer', !!renderer && renderer.type === P.RENDERER_TYPE.WEBGL, renderer ? `type ${renderer.type}` : 'no canvas');
	if (!renderer) return report(out);

	// 1. the rest pose renders bit-identical inside Foundry's own renderer
	const img = testSprite();
	const rig = createRig({ name: 'self-test', src: 'self-test', image: img, template: 'humanoid' });
	const build = buildRig(rig, img);
	const asset = new RigAsset(build);
	const view = new RigView(asset);
	view.render(renderer);
	const px = renderer.extract.pixels(view.renderTexture) as Uint8Array;
	let diff = 0;
	for (let y = 0; y < img.height; y++) {
		for (let x = 0; x < img.width; x++) {
			const a = (y * img.width + x) * 4;
			const b = ((y + build.pad) * build.outWidth + x + build.pad) * 4;
			if ([0, 1, 2, 3].some((c) => img.data[a + c] !== px[b + c])) diff++;
		}
	}
	add('Pixel-exact rest pose', diff === 0, `${diff} of ${img.width * img.height} pixels differ`);

	// 2. animation renders without errors
	try {
		view.player.play(getClip('sword-slash')!, { variation: 0 });
		for (let i = 0; i < 30; i++) {
			view.update(1 / 30);
			view.render(renderer);
		}
		add('Sword slash renders', true, '30 frames');
	} catch (e) {
		add('Sword slash renders', false, String(e));
	}

	// 3. a token mesh keeps its size with the padded (trimmed) texture
	try {
		const PSM = foundry.canvas?.primary?.PrimarySpriteMesh;
		const tex = P.Texture.fromBuffer(new Uint8Array(img.data.buffer.slice(0)), img.width, img.height);
		const mesh = PSM ? new PSM(tex) : new P.Sprite(tex);
		mesh.width = 100;
		mesh.height = 125;
		const w0 = mesh.width;
		const h0 = mesh.height;
		mesh.texture = trimmedTexture(view);
		mesh.width = w0;
		mesh.height = h0;
		mesh.getBounds(); // updates the transform, also for an object with no parent
		mesh.calculateVertices?.();
		const v: ArrayLike<number> = mesh.vertexData ?? [];
		const xs = [v[0], v[2], v[4], v[6]].filter((n): n is number => typeof n === 'number');
		const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
		const expected = (w0 * build.outWidth) / img.width;
		const sizeKept = Math.abs(mesh.width - w0) < 0.01 && Math.abs(mesh.height - h0) < 0.01;
		const padded = Math.abs(span - expected) < 0.5;
		add('Token keeps its size', sizeKept, `${mesh.width.toFixed(1)}×${mesh.height.toFixed(1)} (was ${w0}×${h0}), ${PSM ? 'PrimarySpriteMesh' : 'PIXI.Sprite'}`);
		add('Room for weapons past the edge', padded, padded ? 'padded texture works: use "Padded" (default)' : `drawn width ${span.toFixed(1)}, expected ${expected.toFixed(1)}: set "Token texture" to "Clipped" in the module settings`);
		mesh.destroy?.();
		tex.destroy(true);
	} catch (e) {
		add('Token texture check', false, String(e));
	}

	// 4. cleanup
	view.destroy();
	add('Resources released', asset.destroyed && asset.users === 0, `atlas users ${asset.users}`);

	// 5. Fabula Ultima: the system, its data shape, fu-animations, the mapping table
	add('Project FU system', game.system?.id === 'projectfu', `${game.system?.id ?? 'none'} ${game.system?.version ?? ''}`.trim());
	try {
		const weapon = [...(game.items ?? [])].find((i: { type: string }) => i.type === 'weapon') ?? [...(game.actors ?? [])].flatMap((a: { items?: Iterable<{ type: string }> }) => [...(a.items ?? [])]).find((i) => i.type === 'weapon');
		if (weapon) {
			const info = describeItem(weapon);
			add('Project FU weapon data read', !!info.weaponCategory, `"${(weapon as { name?: string }).name}": category ${info.weaponCategory ?? 'not found'}, ${info.ranged ? 'ranged' : 'melee'}`);
		} else add('Project FU weapon data read', true, 'no weapon in this world to check (skipped)');
	} catch (e) {
		add('Project FU weapon data read', false, String(e));
	}
	const fua = game.modules?.get?.('fu-animations');
	add('fu-animations', !fua?.active || typeof fua.api?.resolve === 'function', fua?.active ? (typeof fua.api?.resolve === 'function' ? 'active; its classification and timing are used' : 'active but api.resolve is missing: update it') : 'not active (fine: our own rules are used)');
	const table = mappingTable();
	const missing = [...Object.values(table.rules), ...Object.values(table.abilities)].filter((c) => c !== NONE && !getClip(c));
	add('Ability animations list', missing.length === 0, missing.length ? `chooses animations that no longer exist: ${[...new Set(missing)].join(', ')}` : `${Object.keys(table.rules).length + Object.keys(table.abilities).length} world choices, all valid`);

	// 6. live tokens
	const rigged = (canvas.tokens?.placeables ?? []).filter((t: { id: string }) => tokenAnimators.get(t.id));
	const attached = rigged.filter((t: { id: string; mesh?: { texture?: unknown } }) => t.mesh?.texture && t.mesh.texture !== (t as { texture?: unknown }).texture);
	add('Animated tokens on this scene', attached.length === rigged.length, `${rigged.length} animated, ${attached.length} showing their animation`);
	return report(out);
}

function report(out: SelfTestResult[]): SelfTestResult[] {
	console.table(out);
	const bad = out.filter((r) => !r.ok);
	const msg = bad.length ? `Sprite Animator self-test: ${bad.length} problem(s): ${bad.map((b) => b.name).join(', ')}. See the console (F12).` : `Sprite Animator self-test: all ${out.length} checks passed.`;
	ui.notifications?.[bad.length ? 'warn' : 'info'](msg);
	(globalThis as Record<string, unknown>)[`${MODULE_ID}-selftest`] = out;
	return out;
}
