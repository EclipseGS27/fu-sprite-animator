// Bundle src/foundry/main.ts into dist/fu-sprite-animator.mjs (what Foundry loads).
// PixiJS is NOT bundled: the module uses Foundry's global PIXI.
import { build, context } from 'esbuild';

const options = {
	entryPoints: ['src/foundry/main.ts'],
	bundle: true,
	format: 'esm',
	target: 'es2022',
	outfile: 'dist/fu-sprite-animator.mjs',
	sourcemap: 'linked',
	legalComments: 'none',
	logLevel: 'info',
	banner: { js: '// Fabula Ultima Sprite Animator — built from src/ (TypeScript). Do not edit; run `npm run build`.' },
};

if (process.argv.includes('--watch')) {
	const ctx = await context(options);
	await ctx.watch();
} else {
	await build(options);
}
