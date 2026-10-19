import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  css: { postcss: { plugins: [] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/catalog/**/*.test.ts'], environment: 'jsdom', globals: true, setupFiles: ['tests/setup.ts'], maxWorkers: 2 },
});
