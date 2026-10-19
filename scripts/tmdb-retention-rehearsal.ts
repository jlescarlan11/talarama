import { open } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { TmdbClient } from '../app/lib/tmdb/client';
import { createRetentionFixture } from './lib/tmdb-retention-fixtures';
import { DAY_MS, fingerprint } from './lib/tmdb-retention-policy';

async function main() {
  const output = process.argv[2];
  if (!output || process.argv.length !== 3) throw new Error('Usage: npm run retention:rehearse -- NEW_REPORT.jsonl');
  // Reserve exclusively before any connection; existing evidence is never overwritten.
  const journal = await open(output, 'wx', 0o600);
  let scope: Awaited<ReturnType<typeof createRetentionFixture>> | undefined;
  const record = async (value: unknown) => { await journal.appendFile(JSON.stringify(value) + '\n'); await journal.sync(); };
  try {
    const now = new Date();
    scope = await createRetentionFixture(process.env.TEST_DATABASE_URL ?? '', () => now);
    const db = scope.db;
    await db.user.create({ data: { id: 'fixture-owner', username: 'Legacy.Owner', email: 'fixture@example.invalid', accounts: { create: { id: 'fixture-account', provider: 'google', type: 'oauth', providerAccountId: 'synthetic-sub', access_token: 'synthetic-preserved-token' } } } });
    await db.movie.createMany({ data: [
      { id: 'fixture-fresh', tmdbId: 90001, title: 'Fresh synthetic metadata', metadataRefreshedAt: new Date(+now - 10 * DAY_MS) },
      { id: 'fixture-refresh', tmdbId: 90002, title: 'Due synthetic metadata', metadataRefreshedAt: new Date(+now - 150 * DAY_MS) },
      { id: 'fixture-expired', tmdbId: 90003, title: 'Expired synthetic metadata', description: 'Synthetic provider payload', metadataRefreshedAt: new Date(+now - 180 * DAY_MS) },
      { id: 'fixture-unknown', tmdbId: 90004, title: 'Original mixed metadata', metadataRefreshedAt: new Date(+now - 200 * DAY_MS) },
      { id: 'fixture-legacy', title: 'Unmatched legacy record', directorFirstName: 'Original' },
    ] });
    await db.genre.create({ data: { id: 'fixture-genre', genreName: 'Synthetic provider genre', movies: { create: { movieId: 'fixture-expired' } } } });
    await db.diaryEntry.create({ data: { id: 'fixture-diary', userId: 'fixture-owner', movieId: 'fixture-expired', watchedDate: new Date('2020-02-29T23:30:00Z'), review: 'Original member text', rating: 4 } });
    await db.likedBy.create({ data: { movieId: 'fixture-expired', userId: 'fixture-owner' } });
    await db.watchlistEntry.create({ data: { movieId: 'fixture-expired', userId: 'fixture-owner' } });
    await scope.registerProviderFixtures({ movieIds: ['fixture-fresh', 'fixture-refresh', 'fixture-expired'], genreIds: ['fixture-genre'] });
    const members = async () => ({ users: await db.user.findMany(), accounts: await db.account.findMany(), diary: await db.diaryEntry.findMany(), favorites: await db.likedBy.findMany(), watchlist: await db.watchlistEntry.findMany(), movies: await db.movie.findMany({ orderBy: { id: 'asc' }, select: { id: true, tmdbId: true } }), genres: await db.genre.findMany({ orderBy: { id: 'asc' }, select: { id: true } }) });
    const before = fingerprint(await members()); let calls = 0;
    const provider = new TmdbClient({ token: 'synthetic-rehearsal-only', fetcher: async () => { calls++; return Response.json({}, { status: 503 }); } });
    const plan = await scope.preview('scheduled'); const requestId = randomUUID();
    await record({ phase: 'PREPARED', version: 1, fixtureOnly: true, schema: scope.schema, requestId, plan });
    const result = await scope.execute({ requestId, reviewedBy: 'Synthetic rehearsal', plan, provider });
    await record({ phase: 'COMMITTED', result });
    const callCount = calls;
    const replay = await scope.execute({ requestId, reviewedBy: 'Synthetic rehearsal', plan, provider });
    if (fingerprint(replay) !== fingerprint(result) || calls !== callCount) throw new Error('Recovery replay failed');
    const terminationPlan = await scope.preview('termination'); const terminationId = randomUUID();
    await record({ phase: 'PREPARED', fixtureOnly: true, schema: scope.schema, requestId: terminationId, plan: terminationPlan });
    const termination = await scope.execute({ requestId: terminationId, reviewedBy: 'Synthetic rehearsal', plan: terminationPlan, provider });
    if (calls !== callCount) throw new Error('Termination unexpectedly contacted provider');
    await record({ phase: 'COMMITTED', result: termination });
    if (fingerprint(await members()) !== before) throw new Error('Fixture identity/member preservation failed');
    await record({ phase: 'VERIFIED', memberDataAndIdsEqual: true, originalTimestamp: (await db.diaryEntry.findUniqueOrThrow({ where: { id: 'fixture-diary' } })).watchedDate.toISOString(), replayEqualWithoutRefetch: true, terminationProviderCalls: 0, remainingExternalGates: result.externalArtifactsPending });
    console.log('Disposable retention rehearsal passed: preview, expiry, durable replay, termination and exact member/ID preservation.');
  } finally {
    if (scope) await scope.dispose();
    await journal.close();
  }
}
main().catch(() => { console.error('Retention rehearsal failed. Use a fresh report path and a loopback TEST_DATABASE_URL ending _test. No existing schema was targeted; partial reports are not success evidence.'); process.exitCode = 1; });
