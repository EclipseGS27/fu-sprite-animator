// Headless GPU tests: real Chromium WebGL + PixiJS 7.4.3. Usage: npm run test:render
import { mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { serve } from './server.mjs';

// Playwright: the project's own install if present, else the machine's global one.
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
await build({ entryPoints: [new URL('./harness.ts', import.meta.url).pathname], bundle: true, format: 'iife', outfile: OUT + 'harness.js', target: 'es2022', logLevel: 'error' });
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${url}/test/render/index.html`);
await page.waitForFunction(() => window.harnessReady === true, null, { timeout: 15000 });

let failed = 0;
const check = (ok, label, detail) => {
	console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`);
	if (!ok) failed++;
};
check(String(await page.evaluate(() => window.pixiVersion())).startsWith('7.'), 'PixiJS 7 loaded', await page.evaluate(() => window.pixiVersion()));

for (const name of ['warrior', 'mage', 'greatsword', 'knight', 'tiny', 'wolf', 'slime', 'dragon', 'ghost', 'illustrated']) {
	const r = await page.evaluate((n) => window.fidelity(n), name);
	// pixel mode: every pixel exact. smooth mode (illustrations): linear filtering may nudge semi-transparent edge pixels a little
	const ok = r.opaqueDiff === 0 && (name === 'illustrated' ? r.partialMax <= 8 : r.exact === r.total);
	check(ok, `rest pose matches the source on the GPU: ${name}`, `${r.exact}/${r.total} exact, opaque diffs ${r.opaqueDiff}, partial-alpha max Δ ${r.partialMax} (beyond premultiply rounding: ${r.partialBeyond}), build ${r.buildMs} ms`);
}
for (const [name, clip] of [['warrior', 'sword-slash'], ['knight', 'heavy-slash'], ['mage', 'magic-cast'], ['greatsword', 'sword-slash'], ['wolf', 'bite'], ['dragon', 'wing-beat'], ['slime', 'blob-attack'], ['ghost', 'float-defeat']]) {
	const r = await page.evaluate(([n, c]) => window.gpuVsCpu(n, c), [name, clip]);
	writeFileSync(`${OUT}gpu_${name}_${clip}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
	check(r.worstFrameDiff < 0.03, `GPU matches the CPU reference: ${name} ${clip}`, `worst frame ${(r.worstFrameDiff * 100).toFixed(2)}% pixels differ → out/gpu_${name}_${clip}.png`);
}
const t = await page.evaluate(() => window.trimCheck('warrior'));
check(t.sameScale && t.sameBounds, 'trimmed texture keeps sprite size and bounds', JSON.stringify(t));
for (const n of [1, 10, 25]) {
	const s = await page.evaluate((c) => window.stress('warrior', c), n);
	check(s.usersAfter === 0 && s.assetDestroyed, `${n} animated views render and clean up`, `${s.msPerFrame} ms/frame (SwiftShader software GL), atlas users ${s.usersBefore} → ${s.usersAfter}`);
}
for (const n of [24, 50]) {
	const p = await page.evaluate((c) => window.party(c), n);
	check(p.after <= p.before && p.assetsDestroyed, `${n} mixed humanoids and creatures animate and release every GPU texture`, `${p.msPerFrame} ms/frame (SwiftShader software GL); GL textures ${p.before} → ${p.during} → ${p.after}`);
}
const big = await page.evaluate(() => window.large());
check(big.diff === 0, `large sprite (${big.width}×${big.height}) rest pose exact on the GPU`, `auto-rig ${big.rigMs} ms, build ${big.buildMs} ms, ${big.frameMs} ms/frame animating`);
check(errors.length === 0, 'no page errors', errors.join(' | '));
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
