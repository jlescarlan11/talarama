import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import retentionPolicy from './lib/tmdb-retention-policy.ts';
const { guardRetentionDatabase } = retentionPolicy;

// Reuses only the URL guard; this preview never runs retention or attaches to data.
if (!existsSync('.next/BUILD_ID')) throw new Error('A production build is required before preview:local.');
const url = guardRetentionDatabase(process.env.TEST_DATABASE_URL || '');
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once('error', () => reject(new Error('Local port3000 is busy; stop its owned preview before starting another.')));
  probe.listen(3000, '127.0.0.1', () => probe.close(accept));
});
const schema = `preview_${randomUUID().replaceAll('-', '')}`;
url.searchParams.set('schema', schema);
mkdirSync('.superpowers', { recursive: true });
const stop = resolve(`.superpowers/${schema}.stop`);
const db = new PrismaClient({ datasourceUrl: url.toString() });
const env = {
  ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString(),
  NEXTAUTH_URL: 'http://127.0.0.1:3000', NEXTAUTH_SECRET: randomUUID() + randomUUID(),
  GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', TMDB_READ_TOKEN: 'synthetic-transport-fixture',
  TALARAMA_PREVIEW_CATALOG: '1', TALARAMA_LOCAL_PREVIEW: '1',
  TALARAMA_DISABLE_COMPILER_CACHE: '1', NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: `--require="${resolve('tests/e2e/tmdb-fixture.cjs').replaceAll('\\', '/')}"`,
};
let child;
let stopping = false;
let created = false;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });
try {
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`); created = true;
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env, stdio: 'pipe' });
  await db.user.create({ data: { id: 'local-preview-member', username: 'synthetic_preview', name: 'Synthetic preview member', email: 'preview@example.invalid', bio: 'Disposable invented member.', profilePublished: true } });
  await db.movie.create({ data: { id: 'local-preview-film', title: 'Sample: Local Film', releasedYear: 2020, duration: 90, description: 'An invented local movie, not live TMDB data.' } });
  await db.diaryEntry.create({ data: { id: 'local-preview-review', userId: 'local-preview-member', movieId: 'local-preview-film', watchedDate: new Date('2020-02-29'), review: 'Invented sample review for the disposable local preview.', rating: 4, visibility: 'PUBLIC' } });
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3000'], { env, stdio: 'inherit' });
  child.once('error', () => { stopping = true; process.exitCode = 1; });
  child.once('exit', code => { stopping = true; if (code) process.exitCode = code; });
  writeFileSync('.superpowers/local-preview-session.json', JSON.stringify({ schema, stop, port: 3000, parentPid: process.pid, serverPid: child.pid }, null, 2));
  console.log('LOCAL SAMPLE PREVIEW http://127.0.0.1:3000 —24 invented films; no live TMDB or Google credentials.');
  while (!stopping && !existsSync(stop)) await new Promise(accept => setTimeout(accept, 500));
} finally {
  if (child && child.exitCode === null && child.pid) { const done = new Promise(accept => child.once('exit', accept)); child.kill(); await done; }
  if (created) await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
  console.log('Owned preview stopped; only its disposable schema removed.');
}
