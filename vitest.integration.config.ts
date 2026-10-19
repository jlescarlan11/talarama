import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['tests/integration/**/*.test.ts'], environment: 'node', maxWorkers: 1, fileParallelism: false, hookTimeout: 60000 },
});
