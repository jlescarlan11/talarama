import { afterAll, beforeAll, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TmdbClient } from '@/app/lib/tmdb/client';
import { createRetentionFixture } from '@/scripts/lib/tmdb-retention-fixtures';
import { DAY_MS } from '@/scripts/lib/tmdb-retention-policy';

// This suite imports the real client through Vitest's server-only boundary stub.
import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
const now = new Date('2026-10-19T12:00:00Z');
let scope: Awaited<ReturnType<typeof createRetentionFixture>>;
beforeAll(async () => { scope = await createRetentionFixture(process.env.TEST_DATABASE_URL!, () => now); }, 60000);
afterAll(async () => { await scope?.dispose(); });

async function film(id: string, age: number, owned = true) {
  const movie = await scope.db.movie.create({ data: { id, tmdbId: 80000 + await scope.db.movie.count(), title: `Synthetic ${id}`, description: 'PROVIDER_PAYLOAD_MUST_NOT_ENTER_AUDIT', posterUrl: 'https://image.tmdb.org/t/p/w500/fixture.jpg', backdropUrl: 'https://image.tmdb.org/t/p/w1280/fixture.jpg', credits: { cast: [], directors: [] }, tmdbScore: 8, duration: 90, releasedYear: 2000, metadataRefreshedAt: new Date(+now - age * DAY_MS) } });
  if (owned) await scope.registerProviderFixtures({ movieIds: [id] });
  return movie;
}
function provider(ok: boolean, mismatched = false) {
  let calls = 0;
  const client = new TmdbClient({ token: 'synthetic', fetcher: async input => {
    calls++;
    const id = Number(new URL(String(input)).pathname.split('/').at(-1));
    return ok ? Response.json({ id: mismatched ? id + 1 : id, title: 'Fresh synthetic title', adult: false, overview: 'Fresh synthetic details', release_date: '2020-01-01', poster_path: null, backdrop_path: null, vote_average: 7, vote_count: 2, runtime: null, genres: [], credits: { cast: [], crew: [] } }) : Response.json({}, { status: 503 });
  } });
  return { client, calls: () => calls };
}
const memberSnapshot = async () => ({
  users: await scope.db.user.findMany({ orderBy: { id: 'asc' } }), accounts: await scope.db.account.findMany({ orderBy: { id: 'asc' } }),
  diary: await scope.db.diaryEntry.findMany({ orderBy: { id: 'asc' } }), favorites: await scope.db.likedBy.findMany({ orderBy: { movieId: 'asc' } }),
  watchlist: await scope.db.watchlistEntry.findMany({ orderBy: { movieId: 'asc' } }),
});

it('previews without writes; protects legacy/mixed metadata and missing provenance', async () => {
  await film('unknown-expired', 200, false);
  await scope.db.movie.create({ data: { id: 'legacy-retained', title: 'Original member-maintained title', directorFirstName: 'Original' } });
  const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } });
  const plan = await scope.preview('scheduled');
  expect(plan.rows.find(row => row.id === 'unknown-expired')?.action).toBe('REVIEW');
  expect(plan.rows.find(row => row.id === 'legacy-retained')?.action).toBe('KEEP_LEGACY');
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
  expect(JSON.stringify(plan)).not.toContain('PROVIDER_PAYLOAD_MUST_NOT_ENTER_AUDIT');
});
it('retains failed pre-expiry refresh but retires expired fields preserving exact member records and all movie IDs', async () => {
  await film('before-expiry', 179); const expired = await film('expired-owned', 180);
  await scope.db.user.create({ data: { id: 'retention-owner', username: 'Legacy.Owner', email: 'retention@example.invalid', accounts: { create: { id: 'retained-google', provider: 'google', type: 'oauth', providerAccountId: 'retained-sub', access_token: 'synthetic-retained-access' } } } });
  await scope.db.diaryEntry.create({ data: { id: 'retained-entry', userId: 'retention-owner', movieId: expired.id, watchedDate: new Date('2020-02-29T23:30:00Z'), review: 'Retain exact member text', rating: 4 } });
  await scope.db.likedBy.create({ data: { userId: 'retention-owner', movieId: expired.id } });
  await scope.db.watchlistEntry.create({ data: { userId: 'retention-owner', movieId: expired.id } });
  const before = await memberSnapshot(); const ids = (await scope.db.movie.findMany({ orderBy: { id: 'asc' }, select: { id: true } }));
  const remote = provider(false); const plan = await scope.preview('scheduled');
  const result = await scope.execute({ requestId: randomUUID(), reviewedBy: 'Synthetic reviewer', plan, provider: remote.client });
  expect(result.outcomes.find(row => row.id === 'before-expiry')?.status).toBe('RETAINED_UNTIL_EXPIRY');
  expect(result.outcomes.find(row => row.id === expired.id)?.status).toBe('RETIRED');
  expect(await scope.db.movie.findUniqueOrThrow({ where: { id: expired.id } })).toMatchObject({ id: expired.id, tmdbId: expired.tmdbId, title: 'Movie metadata unavailable', description: null, releasedYear: null, duration: null, posterUrl: null, backdropUrl: null, credits: null, tmdbScore: null, metadataRefreshedAt: null });
  expect(await memberSnapshot()).toEqual(before);
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' }, select: { id: true } })).toEqual(ids);
  expect(JSON.stringify(result)).not.toContain('PROVIDER_PAYLOAD_MUST_NOT_ENTER_AUDIT');
});
it('recovers the durable outcome after lost response without refetching or repeating a retirement', async () => {
  const plan = await scope.preview('scheduled'); const remote = provider(false); const requestId = randomUUID();
  const first = await scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
  const count = remote.calls();
  expect(await scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: remote.client })).toEqual(first);
  expect(remote.calls()).toBe(count);
});
it('refreshes successfully and can repopulate retired metadata without changing identities/member data', async () => {
  const before = await memberSnapshot(); const remote = provider(true); const plan = await scope.preview('scheduled');
  const result = await scope.execute({ requestId: randomUUID(), reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
  expect(result.outcomes.find(row => row.id === 'expired-owned')?.status).toBe('REFRESHED');
  expect(await scope.db.movie.findUniqueOrThrow({ where: { id: 'expired-owned' } })).toMatchObject({ title: 'Fresh synthetic title', metadataRefreshedAt: now });
  expect(await memberSnapshot()).toEqual(before);
});
it('rejects provider identity mismatch before any write', async () => {
  await film('mismatch', 180); const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } });
  const plan = await scope.preview('scheduled');
  const valid = provider(true).client;
  const mismatched = { details: async (id: number) => ({ ...await valid.details(id), tmdbId: id + 1 }) };
  await expect(scope.execute({ requestId: randomUUID(), reviewedBy: 'Fixture reviewer', plan, provider: mismatched })).rejects.toThrow('identity');
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
});
it('rejects stale plans and whole-batch conflicts before metadata or audit changes', async () => {
  await film('concurrent-change', 180); const plan = await scope.preview('scheduled');
  await scope.db.movie.update({ where: { id: 'concurrent-change' }, data: { title: 'Newer metadata must survive' } });
  const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } });
  const requestId = randomUUID();
  await expect(scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: provider(false).client })).rejects.toThrow('Stale');
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
  expect(await scope.findRun(requestId)).toBeNull();
  expect((await scope.preview('scheduled')).rows.find(row => row.id === 'concurrent-change')?.action).toBe('REVIEW');
});
it('detects a concurrent metadata change during upstream fetching and rolls back the full staged batch', async () => {
  await film('race-first', 180); await film('race-second', 180);
  const plan = await scope.preview('scheduled'); const valid = provider(true).client; let changed = false;
  const requestId = randomUUID();
  const racing = { details: async (id: number) => {
    if (!changed) { changed = true; await scope.db.movie.update({ where: { id: 'race-second' }, data: { title: 'Concurrent metadata wins' } }); }
    return valid.details(id);
  } };
  await expect(scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: racing })).rejects.toThrow('Stale');
  expect(await scope.db.movie.findUniqueOrThrow({ where: { id: 'race-first' } })).toMatchObject({ title: 'Synthetic race-first' });
  expect(await scope.db.movie.findUniqueOrThrow({ where: { id: 'race-second' } })).toMatchObject({ title: 'Concurrent metadata wins' });
  expect(await scope.findRun(requestId)).toBeNull();
});
it('concurrent identical request UUIDs converge on one durable audit/outcome', async () => {
  await film('concurrent-replay', 180); const plan = await scope.preview('scheduled'); const requestId = randomUUID();
  const remote = provider(false).client;
  const outcomes = await Promise.all(Array.from({ length: 4 }, () => scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: remote })));
  for (const outcome of outcomes) expect(outcome).toEqual(outcomes[0]);
  const count = await scope.db.$queryRaw<{ count: bigint }[]>`SELECT count(*) AS count FROM "_RetentionFixtureAudit" WHERE id=${requestId}`;
  expect(count[0].count).toBe(BigInt(1));
});
it('a database failure after an earlier update rolls back retirement and audit together', async () => {
  await film('rollback-a', 180); await film('rollback-b', 180);
  const plan = await scope.preview('scheduled'); const requestId = randomUUID();
  const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } });
  await scope.db.$executeRawUnsafe(`CREATE FUNCTION block_retention_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.id = 'rollback-b' THEN RAISE EXCEPTION 'Synthetic transaction failure'; END IF; RETURN NEW; END $$`);
  await scope.db.$executeRawUnsafe('CREATE TRIGGER block_retention_fixture BEFORE UPDATE ON "Movie" FOR EACH ROW EXECUTE FUNCTION block_retention_fixture()');
  try {
    await expect(scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: provider(false).client })).rejects.toThrow();
    expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
    expect(await scope.findRun(requestId)).toBeNull();
  } finally { await scope.db.$executeRawUnsafe('DROP TRIGGER block_retention_fixture ON "Movie"'); }
});
it('unexpected provider/programming exceptions cannot silently retire metadata', async () => {
  await film('unexpected-provider-error', 180); const plan = await scope.preview('scheduled');
  const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } });
  await expect(scope.execute({ requestId: randomUUID(), reviewedBy: 'Fixture reviewer', plan, provider: { details: async () => { throw new Error('Synthetic programming error'); } } })).rejects.toThrow('Unexpected');
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
});
it('rejects newly registered orphan genres absent from a reviewed plan without any metadata/audit write', async () => {
  await film('genre-plan-target', 180);
  const plan = await scope.preview('termination');
  await scope.db.genre.create({ data: { id: 'orphan-after-preview', genreName: 'New provider label outside reviewed plan' } });
  await scope.registerProviderFixtures({ movieIds: [], genreIds: ['orphan-after-preview'] });
  const before = await scope.db.movie.findMany({ orderBy: { id: 'asc' } }); const requestId = randomUUID();
  await expect(scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: provider(false).client })).rejects.toThrow('Stale');
  expect(await scope.db.movie.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
  expect(await scope.db.genre.findUniqueOrThrow({ where: { id: 'orphan-after-preview' } })).toMatchObject({ genreName: 'New provider label outside reviewed plan' });
  expect(await scope.findRun(requestId)).toBeNull();
});
it('recovers an identical commit occurring between the initial audit miss and preflight inventory', async () => {
  await film('replay-gap', 180); const plan = await scope.preview('scheduled'); const requestId = randomUUID(); const remote = provider(false);
  const original = scope.db.$queryRaw.bind(scope.db); let intercept = true;
  let committed: Awaited<ReturnType<typeof scope.execute>> | undefined; let committedCalls = 0;
  const spy = vi.spyOn(scope.db, '$queryRaw');
  spy.mockImplementation((async (...args: Parameters<typeof original>) => {
    const result = await original(...args);
    if (intercept && Array.isArray(args[0]) && args[0].join('').includes('SELECT plan_hash') && (result as unknown[]).length === 0) {
      intercept = false;
      committed = await scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
      committedCalls = remote.calls();
    }
    return result;
  }) as unknown as typeof scope.db.$queryRaw);
  try {
    const recovered = await scope.execute({ requestId, reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
    expect(recovered).toEqual(committed); expect(remote.calls()).toBe(committedCalls);
  } finally { spy.mockRestore(); }
});
it('termination never contacts upstream and retires managed orphan genre labels without deleting genre IDs', async () => {
  const movie = await film('terminate-fresh', 1);
  await scope.db.genre.create({ data: { id: 'owned-fixture-genre', genreName: 'PROVIDER_OWNED_LABEL', movies: { create: { movieId: movie.id } } } });
  await scope.registerProviderFixtures({ movieIds: [movie.id], genreIds: ['owned-fixture-genre'] });
  const before = await memberSnapshot(); const remote = provider(true); const plan = await scope.preview('termination');
  const result = await scope.execute({ requestId: randomUUID(), reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
  expect(remote.calls()).toBe(0);
  expect(result.outcomes.find(row => row.id === movie.id)?.status).toBe('RETIRED');
  expect(await scope.db.genre.findUniqueOrThrow({ where: { id: 'owned-fixture-genre' } })).toMatchObject({ id: 'owned-fixture-genre', genreName: 'Unavailable genre owned-fixture-genre' });
  expect(await memberSnapshot()).toEqual(before);
  expect(JSON.stringify(await scope.findRun(result.requestId))).not.toContain('PROVIDER_OWNED_LABEL');
});
it('scheduled runs cannot resume provider fetching after termination', async () => {
  const remote = provider(true); const plan = await scope.preview('scheduled');
  expect(plan.rows.find(row => row.id === 'terminate-fresh')?.action).toBe('KEEP_TERMINATED');
  await scope.execute({ requestId: randomUUID(), reviewedBy: 'Fixture reviewer', plan, provider: remote.client });
  expect(remote.calls()).toBe(0);
  expect(await scope.db.movie.findUniqueOrThrow({ where: { id: 'terminate-fresh' } })).toMatchObject({ title: 'Movie metadata unavailable', metadataRefreshedAt: null });
});
it('runs the actual synthetic rehearsal CLI and refuses to overwrite an existing report', () => {
  const path = join('.superpowers', `retention-rehearsal-test-${randomUUID()}.jsonl`);
  const args = ['--conditions=react-server', '--import', 'tsx', 'scripts/tmdb-retention-rehearsal.ts', path];
  execFileSync(process.execPath, args, { env: { ...process.env }, stdio: 'pipe' });
  const report = readFileSync(path, 'utf8');
  expect(report).toContain('"memberDataAndIdsEqual":true');
  expect(report).toContain('2020-02-29T23:30:00.000Z');
  expect(report).toContain('"terminationProviderCalls":0');
  expect(report).not.toContain('synthetic-preserved-token');
  expect(report).not.toContain('Synthetic provider payload');
  expect(() => execFileSync(process.execPath, args, { env: { ...process.env, TEST_DATABASE_URL: 'postgresql://u:secret@remote.invalid/db_test' }, stdio: 'pipe' })).toThrow();
  expect(readFileSync(path, 'utf8')).toBe(report);
}, 30000);
