import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
try { process.loadEnvFile('.env'); } catch { /* CI supplies environment directly. */ }
if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a disposable database ending in _test');
const database = new URL(process.env.TEST_DATABASE_URL);
if (!decodeURIComponent(database.pathname).endsWith('_test')) throw new Error('Browser tests require a disposable database ending in _test');
process.env.TALARAMA_E2E_SCHEMA ??= `e2e_${randomUUID().replaceAll('-', '')}`;
database.searchParams.set('schema', process.env.TALARAMA_E2E_SCHEMA);
process.env.TALARAMA_E2E_DATABASE_URL = database.toString();
process.env.TALARAMA_E2E_SECRET = 'phase0-synthetic-browser-session-only';
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/setup.ts',
  globalTeardown: './tests/e2e/teardown.ts',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:3100', reducedMotion: 'reduce' },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/diaries', reuseExistingServer: false, timeout: 120000,
    env: { DATABASE_URL: database.toString(), DIRECT_URL: database.toString(), NEXTAUTH_URL: 'http://127.0.0.1:3100', NEXTAUTH_SECRET: process.env.TALARAMA_E2E_SECRET, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', TMDB_READ_TOKEN: 'synthetic-transport-fixture', NODE_OPTIONS: `--require="${resolve('tests/e2e/tmdb-fixture.cjs').replaceAll('\\', '/')}"` },
  },
});
