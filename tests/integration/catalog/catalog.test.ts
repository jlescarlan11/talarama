import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { importMovie, refreshMovie } from '@/app/services/movieImportService';
import type { CatalogMovie } from '@/app/lib/tmdb/types';
import { applyMappings } from '@/app/services/catalogMappingService';
import { setLibraryEntry } from '@/app/services/movieLibraryService';

const raw = process.env.TEST_DATABASE_URL;
if (!raw || !decodeURIComponent(new URL(raw).pathname).endsWith('_test')) throw new Error('Separate _test database required');
const schema = `catalog_${randomUUID().replaceAll('-', '')}`;
const restoredSchema = `${schema}_restore`;
const url = new URL(raw); url.searchParams.set('schema', schema);
const restoreUrl = new URL(raw); restoreUrl.searchParams.set('schema', restoredSchema);
const admin = new PrismaClient({ datasourceUrl: raw });
const db = new PrismaClient({ datasourceUrl: url.toString() });
const restored = new PrismaClient({ datasourceUrl: restoreUrl.toString() });
const fixture = (tmdbId: number): CatalogMovie => ({ localId: null, tmdbId, title: 'Same title', description: null, releasedYear: 2020, duration: null, posterUrl: null, backdropUrl: null, tmdbScore: 8, tmdbVoteCount: 2, genres: [{ tmdbId: 18, name: 'Drama' }], cast: [], directors: [] });
const provider = { details: async (id: number) => fixture(id) };
const pgBinary = (name: string) => process.env.PG_BIN ? join(process.env.PG_BIN, name) : process.platform === 'win32' ? `C:/Program Files/PostgreSQL/17/bin/${name}.exe` : name;
const pgEnvironment = (target: URL) => ({ ...process.env, PGHOST: target.hostname, PGPORT: target.port, PGDATABASE: target.pathname.slice(1), PGUSER: decodeURIComponent(target.username), PGPASSWORD: decodeURIComponent(target.password) });
let legacySnapshot: unknown;
let legacyDump: string;
async function snapshot(client: PrismaClient) {
  return { movies: await client.movie.findMany({ where: { id: { in: ['legacy', 'unmatched'] } }, orderBy: { id: 'asc' } }), users: await client.user.findMany(), accounts: await client.account.findMany(), diary: await client.diaryEntry.findMany(), likes: await client.likedBy.findMany(), watchlist: await client.watchlistEntry.findMany(), categories: await client.movieCategorizesAs.findMany() };
}
beforeAll(async () => {
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${restoredSchema}"`);
  // Replay real historical SQL first; seed representative old records BEFORE the new migration.
  for (const directory of readdirSync('prisma/migrations').filter(x => /^\d/.test(x) && !x.includes('phase1') && !x.includes('phase3') && !x.includes('phase4')).sort()) {
    // PostgreSQL simple protocol supports multi-statement historical scripts through pg tooling.
    const sql = readFileSync(`prisma/migrations/${directory}/migration.sql`, 'utf8');
    await runSql(sql, url);
  }
  await runSql(`INSERT INTO "User" (id,email,"updatedAt") VALUES ('owner','catalog@example.invalid',now());
    INSERT INTO "Account" (id,"userId",type,provider,"providerAccountId") VALUES ('google-link','owner','oauth','google','unchanged');
    INSERT INTO "Movie" (id,title,"releasedYear",duration) VALUES ('legacy','Same title',2020,100),('unmatched','Unmatched',1999,90);
    INSERT INTO "Genre" (id,"genreName") VALUES ('legacy-drama','Drama');
    INSERT INTO "MovieCategorizesAs" ("movieId","genreId") VALUES ('legacy','legacy-drama');
    INSERT INTO "DiaryEntry" (id,rating,review,"watchedDate","updatedAt","userId","movieId") VALUES ('review',4,'Keep review','2020-02-29T23:30:00Z',now(),'owner','legacy');
    INSERT INTO "LikedBy" ("userId","movieId") VALUES ('owner','legacy');
    INSERT INTO "WatchedList" ("userId","movieId") VALUES ('owner','legacy');`, url);
  // Snapshot via SQL so the old schema is read without selecting new Prisma fields.
  legacySnapshot = await db.$queryRawUnsafe(`SELECT id,title,"releasedYear",duration FROM "Movie" ORDER BY id`);
  legacyDump = execFileSync(pgBinary('pg_dump'), ['--schema', schema, '--no-owner', '--no-acl'], { env: pgEnvironment(url), encoding:'utf8',stdio:'pipe' });
  const migration = readdirSync('prisma/migrations').find(x => x.includes('phase1'))!;
  await runSql(readFileSync(`prisma/migrations/${migration}/migration.sql`, 'utf8'), url);
  const diaryMigration = readdirSync('prisma/migrations').find(x => x.includes('phase3'))!;
  await runSql(readFileSync(`prisma/migrations/${diaryMigration}/migration.sql`, 'utf8'), url);
  const communityMigration = readdirSync('prisma/migrations').find(x=>x.includes('phase4'))!;
  await runSql(readFileSync(`prisma/migrations/${communityMigration}/migration.sql`,'utf8'),url);
}, 60000);

async function runSql(sql: string, target: URL) {
  // psql receives passwords via process environment, never command arguments/output.
  execFileSync(pgBinary('psql'), ['-X', '-v', 'ON_ERROR_STOP=1', '-q'], {
    input: `SET search_path TO "${target.searchParams.get('schema')}";\n${sql}`,
    env: pgEnvironment(target), stdio: ['pipe', 'pipe', 'pipe'],
  });
}
afterAll(async () => {
  await db.$disconnect(); await restored.$disconnect();
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${restoredSchema}" CASCADE`);
  await admin.$disconnect();
});
it('preserves legacy IDs, values, accounts and relationships through SQL migration and logical restoration', async () => {
  expect(await db.$queryRawUnsafe(`SELECT id,title,"releasedYear",duration FROM "Movie" ORDER BY id`)).toEqual(legacySnapshot);
  const before = await snapshot(db);
  expect(before.diary[0]).toMatchObject({ id: 'review', movieId: 'legacy', userId: 'owner', rating: 4, review: 'Keep review', visibility:'PRIVATE', clientRequestId:null, isRewatch:false, containsSpoilers:false });
  expect(before.diary[0].watchedDate.toISOString()).toBe('2020-02-29T23:30:00.000Z');
  expect(before.accounts[0]).toMatchObject({ id: 'google-link', providerAccountId: 'unchanged' });
  expect(before.likes[0].movieId).toBe('legacy'); expect(before.watchlist[0].movieId).toBe('legacy');
  // Restore the pre-upgrade backup first, then apply the same additive migrations.
  await admin.$executeRawUnsafe(`DROP SCHEMA "${restoredSchema}" CASCADE`);
  await runSql(legacyDump.replaceAll(schema,restoredSchema),restoreUrl);
  for(const phase of ['phase1','phase3','phase4']) {
   const directory=readdirSync('prisma/migrations').find(name=>name.includes(phase))!;
   await runSql(readFileSync(`prisma/migrations/${directory}/migration.sql`,'utf8'),restoreUrl);
  }
  expect(await snapshot(restored)).toEqual(before);
  // Real pg_dump/psql logical backup/restore into an independent guarded schema.
  const dump = execFileSync(pgBinary('pg_dump'), ['--schema', schema, '--no-owner', '--no-acl'], { env: pgEnvironment(url), encoding: 'utf8', stdio: 'pipe' });
  await admin.$executeRawUnsafe(`DROP SCHEMA "${restoredSchema}" CASCADE`);
  await runSql(dump.replaceAll(schema, restoredSchema), restoreUrl);
  expect(await snapshot(restored)).toEqual(before);
});
it('converges simultaneous imports and preserves different TMDB identities sharing title/year', async () => {
  const results = await Promise.all(Array.from({ length: 8 }, () => importMovie(42, { db, provider })));
  expect(new Set(results.map(x => x.id)).size).toBe(1);
  const other = await importMovie(43, { db, provider });
  expect(other.id).not.toBe(results[0].id);
  expect(await db.movie.count({ where: { title: 'Same title', releasedYear: 2020 } })).toBe(3);
  expect(await db.movieCategorizesAs.count({ where: { movieId: results[0].id } })).toBe(1);
  expect((await db.diaryEntry.findUniqueOrThrow({ where: { id: 'review' } })).movieId).toBe('legacy');
});
it('converges retry/concurrent library intent without affecting other members or legacy rows', async () => {
  await db.user.create({ data: { id: 'other-member', email: 'other@example.invalid' } });
  const imported = await importMovie(99, { db, provider });
  for (const kind of ['favorite', 'watchlist'] as const) {
    await Promise.all(Array.from({ length: 8 }, async () => {
      const movie = await importMovie(99, { db, provider });
      await setLibraryEntry('owner', movie.id, kind, true, { db });
    }));
    await setLibraryEntry('other-member', imported.id, kind, true, { db });
    const count = (where: { movieId: string; userId: string }) => kind === 'favorite' ? db.likedBy.count({ where }) : db.watchlistEntry.count({ where });
    expect(await count({ movieId: imported.id, userId: 'owner' })).toBe(1);
    await Promise.all(Array.from({ length: 8 }, () => setLibraryEntry('owner', imported.id, kind, false, { db })));
    expect(await count({ movieId: imported.id, userId: 'owner' })).toBe(0);
    expect(await count({ movieId: imported.id, userId: 'other-member' })).toBe(1);
    expect(await count({ movieId: 'legacy', userId: 'owner' })).toBe(1);
  }
});
it('reuses local snapshots on retries and never clears metadata after provider failure', async () => {
  const first = await importMovie(44, { db, provider });
  const failing = { details: async () => { throw new Error('upstream failed'); } };
  expect((await importMovie(44, { db, provider: failing })).id).toBe(first.id);
  await expect(refreshMovie(44, { db, provider: failing })).rejects.toThrow('upstream failed');
  expect(await db.movie.findUnique({ where: { tmdbId: 44 } })).toEqual(first);
  await expect(importMovie(45, { db, provider: failing })).rejects.toThrow();
  expect(await db.movie.findUnique({ where: { tmdbId: 45 } })).toBeNull();
});
it('rolls back a reviewed batch on stale rows and conflicting imported identities', async () => {
  const row = { localId: 'legacy', expectedTitle: 'Same title', expectedYear: 2020, tmdbId: 100 };
  await expect(applyMappings({ version: 1, reviewedBy: 'fixture reviewer', mappings: [row, { localId: 'unmatched', expectedTitle: 'STALE', expectedYear: 1999, tmdbId: 101 }] }, { db, provider })).rejects.toThrow();
  expect((await db.movie.findUniqueOrThrow({ where: { id: 'legacy' } })).tmdbId).toBeNull();
  expect(await db.catalogMappingAudit.count()).toBe(0);
  await expect(applyMappings({ version: 1, reviewedBy: 'fixture reviewer', mappings: [{ ...row, tmdbId: 42 }] }, { db, provider })).rejects.toThrow();
});
it('applies reviewed identities with durable audit, preserving metadata and relationships, and safely repeats', async () => {
  const manifest = { version: 1, reviewedBy: 'fixture reviewer', mappings: [{ localId: 'legacy', expectedTitle: 'Same title', expectedYear: 2020, tmdbId: 100 }] };
  const audit = await applyMappings(manifest, { db, provider });
  expect(audit.mappings).toEqual([{ localId: 'legacy', beforeTmdbId: null, afterTmdbId: 100 }]);
  expect((await db.movie.findUniqueOrThrow({ where: { id: 'legacy' } }))).toMatchObject({ tmdbId: 100, duration: 100, title: 'Same title' });
  expect((await db.diaryEntry.findUniqueOrThrow({ where: { id: 'review' } })).movieId).toBe('legacy');
  expect((await db.catalogMappingAudit.findUniqueOrThrow({ where: { id: audit.id } })).reviewer).toBe('fixture reviewer');
  const repeat = await applyMappings(manifest, { db, provider });
  expect(repeat.mappings).toEqual([]);
});
it('runs actual dry-run/apply CLIs with fixture transport and refuses overwriting audit files', async () => {
  const directory = mkdtempSync(join(process.cwd(), '.superpowers', 'catalog-cli-'));
  const preload = join(directory, 'provider.mjs');
  const reportPath = join(directory, 'report.json');
  const manifestPath = join(directory, 'reviewed.json');
  const auditPath = join(directory, 'audit.jsonl');
  await db.movie.create({ data: { id: 'cli-local', title: 'CLI legacy', releasedYear: 2010, duration: 99 } });
  const detail = { id: 701, title: 'CLI fixture', adult: false, vote_average: 0, vote_count: 0, runtime: null, genres: [], credits: { cast: [], crew: [] } };
  writeFileSync(preload, `globalThis.fetch = async (url) => new Response(JSON.stringify(String(url).includes('/search/movie') ? {page:1,total_pages:1,total_results:1,results:[${JSON.stringify(detail)}]} : ${JSON.stringify(detail)}));`);
  const env = { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString(), TMDB_READ_TOKEN: 'synthetic-fixture-token' };
  const run = (script: string, args: string[]) => execFileSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', '--import', pathToFileURL(preload).href, `scripts/${script}.ts`, ...args], { env, stdio: 'pipe', encoding: 'utf8' });
  try {
    run('catalog-match', [reportPath]);
    expect(JSON.parse(readFileSync(reportPath, 'utf8')).rows.find((x: {localId:string}) => x.localId === 'cli-local')).toMatchObject({ status: 'REVIEW_REQUIRED', candidates: [{ tmdbId: 701 }] });
    expect((await db.movie.findUniqueOrThrow({ where: { id: 'cli-local' } })).tmdbId).toBeNull();
    writeFileSync(manifestPath, JSON.stringify({ version: 1, reviewedBy: 'CLI fixture reviewer', mappings: [{ localId: 'cli-local', expectedTitle: 'CLI legacy', expectedYear: 2010, tmdbId: 701 }] }));
    writeFileSync(auditPath, 'keep existing audit');
    expect(() => run('catalog-apply', ['--reviewed', manifestPath, auditPath])).toThrow();
    expect((await db.movie.findUniqueOrThrow({ where: { id: 'cli-local' } })).tmdbId).toBeNull();
    const newAudit = join(directory, 'new-audit.jsonl');
    run('catalog-apply', ['--reviewed', manifestPath, newAudit]);
    const lines = readFileSync(newAudit, 'utf8').trim().split('\n').map(x => JSON.parse(x));
    expect(lines.map(x => x.state)).toEqual(['PREPARED', 'COMMITTED']);
    expect(await db.catalogMappingAudit.findUnique({ where: { id: lines[1].audit.id } })).toMatchObject({ reviewer: 'CLI fixture reviewer' });
    expect(await db.movie.findUnique({ where: { id: 'cli-local' } })).toMatchObject({ tmdbId: 701, title: 'CLI legacy', duration: 99 });
  } finally { rmSync(directory, { recursive: true, force: true }); }
}, 30000);
