import { defineConfig } from 'vitest/config';
// Dev tools that render filmstrips (not tests): SPRITE=warrior CLIP=sword-slash GT=1 npm run film
export default defineConfig({ test: { include: ['test/tools/**/*.test.ts'], environment: 'node' } });
