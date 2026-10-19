import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const raw = process.env.TEST_DATABASE_URL;
if (!raw) throw new Error('Set TEST_DATABASE_URL to a disposable database ending in _test');
const url = new URL(raw);
if (!decodeURIComponent(url.pathname).endsWith('_test')) throw new Error('Refusing non-test database');
const schema = `history_${randomUUID().replaceAll('-', '')}`;
url.searchParams.set('schema', schema);
const db = new PrismaClient({ datasourceUrl: raw });
const env = { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString() };
try {
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env, stdio: 'pipe' });
  const diff = execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'diff', '--from-url', url.toString(), '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], { env, encoding: 'utf8', stdio: 'pipe' });
  console.log('All historical migrations replayed; no schema drift.');
  console.log(diff.trim());
} catch (error) {
  // Child-process messages can include connection URLs. Keep credentials out of diagnostics.
  console.error(`Migration verification failed (exit ${error.status ?? 'unknown'}). Inspect history against a disposable database; no populated database was reset.`);
  process.exitCode = 1;
} finally {
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
}
