// Screenshot of the "Sprite animations for abilities" window in the Foundry mock (visual review).
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { serve } from './server.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 700, height: 800 } });
await page.goto(`${url}/test/render/foundry-mock.html`);
await page.waitForFunction(() => window.mockReady === true, null, { timeout: 15000 });
await page.evaluate(async () => {
	Hooks.callAll('init');
	Hooks.callAll('ready');
	const api = game.modules.get('fu-sprite-animator').api;
	await api.mapping.set({ rules: { 'weapon:bow': 'throw', 'basic:melee@quadruped': 'bite' }, abilities: { 'spell:fireball': 'area-cast' } });
	const app = api.mapping.open();
	await new Promise((r) => setTimeout(r, 200));
	app.element.style.cssText += 'width:620px;height:760px;';
});
await page.screenshot({ path: OUT + 'mapping_editor.png' });
await browser.close();
server.close();
console.log('wrote', OUT + 'mapping_editor.png');
