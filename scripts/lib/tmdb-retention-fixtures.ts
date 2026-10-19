import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';
import type { CatalogMovie } from '../../app/lib/tmdb/types';
import { TmdbError } from '../../app/lib/tmdb/client';
import { DAY_MS, EXPIRE_DAYS, fingerprint, guardRetentionDatabase, retentionAction, type Ownership, type RetentionMode } from './tmdb-retention-policy';

type DB = PrismaClient | Prisma.TransactionClient;
const include = { genres: { include: { genre: true } } } as const;
type Movie = Prisma.MovieGetPayload<{ include: typeof include }>;
type Proof = { kind: string; id: string; hash: string; state: string; fetchedAt: Date | null };
type Action = ReturnType<typeof retentionAction>;
type Row = { id: string; tmdbId: number | null; metadataRefreshedAt: string | null; hash: string; ownership: Ownership; action: Action };
type GenreRow = { id: string; hash: string; registeredHash: string | null; state: string; fetchedAt: string | null; references: string[]; action: 'REVIEW' | 'KEEP' | 'KEEP_RETIRED' | 'KEEP_TERMINATED' | 'RETIRE_IF_ORPHAN' };
export type RetentionPlan = { version: 1; mode: RetentionMode; generatedAt: string; terminated: boolean; rows: Row[]; genres: GenreRow[] };
type Outcome = { id: string; status: string };
export type RetentionResult = { requestId: string; mode: RetentionMode; completedAt: string; reviewedBy: string; outcomes: Outcome[]; genres: Outcome[]; externalArtifactsPending: string[] };
type StoredRun = { planHash: string; payload: RetentionResult };
const modeSchema = z.enum(['scheduled', 'termination']);
const requestSchema = z.string().uuid();
const person = z.object({ tmdbId: z.number().int().positive(), name: z.string().min(1), character: z.string().optional() });
const detailSchema = z.object({ localId: z.null(), tmdbId: z.number().int().positive(), title: z.string().min(1), description: z.string().nullable(), releasedYear: z.number().int().nullable(), duration: z.number().int().nonnegative().nullable(), posterUrl: z.string().url().nullable(), backdropUrl: z.string().url().nullable(), tmdbScore: z.number().min(0).max(10).nullable(), tmdbVoteCount: z.number().int().nonnegative(), genres: z.array(z.object({ tmdbId: z.number().int().positive(), name: z.string().min(1) })).max(100), cast: z.array(person), directors: z.array(person) });

function metadata(movie: Movie) {
  return { id: movie.id, tmdbId: movie.tmdbId, title: movie.title, description: movie.description, releasedYear: movie.releasedYear, duration: movie.duration, posterUrl: movie.posterUrl, backdropUrl: movie.backdropUrl, credits: movie.credits, tmdbScore: movie.tmdbScore, metadataRefreshedAt: movie.metadataRefreshedAt,
    genres: movie.genres.map(link => ({ id: link.genreId, name: link.genre.genreName })).sort((a, b) => a.id.localeCompare(b.id)) };
}
async function proofs(db: DB): Promise<Proof[]> {
  return db.$queryRaw`SELECT kind,id,hash,state,fetched_at AS "fetchedAt" FROM "_RetentionFixtureOwnership" ORDER BY kind,id`;
}
async function saveProof(db: DB, kind: string, id: string, hash: string, state: string, fetchedAt: Date | null) {
  await db.$executeRaw`INSERT INTO "_RetentionFixtureOwnership" (kind,id,hash,state,fetched_at) VALUES (${kind},${id},${hash},${state},${fetchedAt}) ON CONFLICT (kind,id) DO UPDATE SET hash=excluded.hash,state=excluded.state,fetched_at=excluded.fetched_at`;
}
async function inventory(db: DB, mode: RetentionMode, now: Date): Promise<RetentionPlan> {
  modeSchema.parse(mode);
  const movies = await db.movie.findMany({ include, orderBy: { id: 'asc' }, take: 1001 });
  if (movies.length > 1000) throw new Error('Fixture inventory exceeds1000 rows; refusing partial plan');
  const registered = await proofs(db);
  const ownership = new Map(registered.filter(row => row.kind === 'MOVIE').map(row => [row.id, row]));
  const control = await db.$queryRaw<{ terminated: boolean }[]>`SELECT terminated FROM "_RetentionFixtureControl"`;
  const terminated = control[0]?.terminated ?? false;
  const genreRecords = await db.genre.findMany({ include: { movies: { select: { movieId: true } } }, orderBy: { id: 'asc' }, take: 1001 });
  if (genreRecords.length > 1000) throw new Error('Fixture genre inventory exceeds1000 rows; refusing partial plan');
  const genres: GenreRow[] = genreRecords.map(genre => {
    const proof = registered.find(item => item.kind === 'GENRE' && item.id === genre.id);
    const references = genre.movies.map(link => link.movieId).sort();
    const known = proof?.hash === fingerprint({ id: genre.id, name: genre.genreName });
    const action: GenreRow['action'] = !known ? 'REVIEW' : proof.state !== 'ACTIVE' ? 'KEEP_RETIRED' : terminated ? 'KEEP_TERMINATED' : mode === 'termination' ? 'RETIRE_IF_ORPHAN' : !proof.fetchedAt || +proof.fetchedAt > +now ? 'REVIEW' : +now - +proof.fetchedAt >= EXPIRE_DAYS * DAY_MS ? 'RETIRE_IF_ORPHAN' : 'KEEP';
    return { id: genre.id, hash: fingerprint({ id: genre.id, name: genre.genreName, references }), registeredHash: proof?.hash ?? null, state: known ? proof.state : 'UNKNOWN', fetchedAt: proof?.fetchedAt?.toISOString() ?? null, references, action };
  });
  return { version: 1, mode, generatedAt: now.toISOString(), terminated, genres, rows: movies.map(movie => {
    const hash = fingerprint(metadata(movie)); const proof = ownership.get(movie.id);
    const source: Ownership = proof ? proof.hash !== hash ? 'UNKNOWN' : control[0]?.terminated || proof.state === 'TERMINATED' ? 'TERMINATED' : proof.state === 'RETIRED' ? 'RETIRED' : 'PROVIDER' : movie.tmdbId === null ? 'LEGACY' : 'UNKNOWN';
    return { id: movie.id, tmdbId: movie.tmdbId, metadataRefreshedAt: movie.metadataRefreshedAt?.toISOString() ?? null, hash, ownership: source, action: retentionAction(movie.metadataRefreshedAt, source, mode, now) };
  }) };
}
async function storedRun(db: DB, requestId: string): Promise<StoredRun | null> {
  const rows = await db.$queryRaw<StoredRun[]>`SELECT plan_hash AS "planHash", payload FROM "_RetentionFixtureAudit" WHERE id=${requestId}`;
  return rows[0] ?? null;
}
function assertCurrent(plan: RetentionPlan, current: RetentionPlan, now: Date) {
  const generated = Date.parse(plan.generatedAt);
  if (!Number.isFinite(generated) || +now < generated || +now - generated > 300000 || plan.version !== 1 || fingerprint({ rows: plan.rows, genres: plan.genres, terminated: plan.terminated }) !== fingerprint({ rows: current.rows, genres: current.genres, terminated: current.terminated })) throw new Error('Stale retention plan; preview and review again');
}

/** Creates its OWN empty fixture schema. It cannot attach to or mutate an existing schema.
 * This operator/test module is deliberately never imported by the application runtime.
 */
export async function createRetentionFixture(raw: string, clock: () => Date = () => new Date()) {
  const url = guardRetentionDatabase(raw);
  const schema = `retention_${randomUUID().replaceAll('-', '')}`;
  url.searchParams.set('schema', schema);
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  let disposed = false;
  async function dispose() {
    if (disposed) return;
    await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await db.$disconnect(); disposed = true;
  }
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString() }, stdio: 'pipe' });
    await db.$executeRawUnsafe('CREATE TABLE "_RetentionFixtureOwnership" (kind TEXT NOT NULL, id TEXT NOT NULL, hash TEXT NOT NULL, state TEXT NOT NULL, fetched_at TIMESTAMPTZ, PRIMARY KEY(kind,id))');
    await db.$executeRawUnsafe('CREATE TABLE "_RetentionFixtureAudit" (id TEXT PRIMARY KEY, plan_hash TEXT NOT NULL, payload JSONB NOT NULL)');
    await db.$executeRawUnsafe('CREATE TABLE "_RetentionFixtureControl" (id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id), terminated BOOLEAN NOT NULL DEFAULT FALSE)');
    await db.$executeRawUnsafe('INSERT INTO "_RetentionFixtureControl" (id,terminated) VALUES (TRUE,FALSE)');
  } catch { await dispose(); throw new Error('Disposable retention fixture initialization failed'); }

  return {
    db, schema, dispose,
    /** Explicit synthetic-source declaration, never inferred from tmdbId or age. */
    async registerProviderFixtures({ movieIds, genreIds = [] }: { movieIds: string[]; genreIds?: string[] }) {
      await db.$transaction(async tx => {
        const control = await tx.$queryRaw<{ terminated: boolean }[]>`SELECT terminated FROM "_RetentionFixtureControl"`;
        if (control[0]?.terminated) throw new Error('Terminated fixture cannot register or resume provider metadata');
        for (const id of movieIds) {
          const movie = await tx.movie.findUniqueOrThrow({ where: { id }, include });
          if (!movie.tmdbId || !movie.metadataRefreshedAt) throw new Error('Synthetic provider fixture needs explicit source and acquisition time');
          await saveProof(tx, 'MOVIE', id, fingerprint(metadata(movie)), 'ACTIVE', movie.metadataRefreshedAt);
        }
        for (const id of genreIds) {
          const genre = await tx.genre.findUniqueOrThrow({ where: { id }, include: { movies: { include: { movie: true } } } });
          const dates = genre.movies.map(link => link.movie.metadataRefreshedAt).filter((date): date is Date => date !== null);
          const fetchedAt = dates.length ? new Date(Math.min(...dates.map(Number))) : clock();
          await saveProof(tx, 'GENRE', id, fingerprint({ id, name: genre.genreName }), 'ACTIVE', fetchedAt);
        }
      });
    },
    preview: (mode: RetentionMode) => inventory(db, mode, clock()),
    async findRun(requestId: string) { return (await storedRun(db, requestSchema.parse(requestId)))?.payload ?? null; },
    async execute({ requestId, reviewedBy, plan, provider }: { requestId: string; reviewedBy: string; plan: RetentionPlan; provider: { details(id: number): Promise<CatalogMovie> } }): Promise<RetentionResult> {
      requestSchema.parse(requestId); reviewedBy = z.string().trim().min(1).max(200).parse(reviewedBy); modeSchema.parse(plan.mode);
      const planHash = fingerprint(plan);
      const replay = async (run: StoredRun | null) => { if (!run) return null; if (run.planHash !== planHash) throw new Error('Request ID belongs to a different reviewed plan'); return run.payload; };
      const prior = await replay(await storedRun(db, requestId)); if (prior) return prior;
      try {
      assertCurrent(plan, await inventory(db, plan.mode, clock()), clock());
      const staged = new Map<string, { status: string; detail?: CatalogMovie }>();
      for (const row of plan.rows) {
        if (row.action === 'RETIRE') { staged.set(row.id, { status: 'RETIRED' }); continue; }
        if (!['REFRESH', 'REFRESH_OR_RETIRE', 'RECOVER'].includes(row.action)) continue;
        let detail: CatalogMovie;
        try { detail = await provider.details(row.tmdbId!); }
        catch (error) {
          if (!(error instanceof TmdbError)) throw new Error('Unexpected fixture provider failure; no retention writes applied');
          staged.set(row.id, { status: row.action === 'REFRESH_OR_RETIRE' ? 'RETIRED' : row.action === 'RECOVER' ? 'RETIRED_STILL_UNAVAILABLE' : 'RETAINED_UNTIL_EXPIRY' }); continue;
        }
        if (detail.tmdbId !== row.tmdbId) throw new Error('Provider identity mismatch; no retention writes applied');
        if (!detailSchema.safeParse(detail).success) throw new Error('Invalid normalized provider metadata; no retention writes applied');
        staged.set(row.id, { status: 'REFRESHED', detail });
      }
      for (let attempt = 0; ; attempt++) {
        try {
          return await db.$transaction(async tx => {
            const already = await replay(await storedRun(tx, requestId)); if (already) return already;
            const now = clock(); assertCurrent(plan, await inventory(tx, plan.mode, now), now);
            const outcomes: Outcome[] = [];
            for (const row of plan.rows) {
              const change = staged.get(row.id); outcomes.push({ id: row.id, status: change?.status ?? row.action });
              if (change?.status === 'REFRESHED') {
                const detail = change.detail!; const genreIds: string[] = [];
                for (const name of new Set(detail.genres.map(item => item.name))) {
                  const existing = await tx.genre.findUnique({ where: { genreName: name } });
                  const genre = existing ?? await tx.genre.create({ data: { genreName: name } }); genreIds.push(genre.id);
                  const known = (await proofs(tx)).find(proof => proof.kind === 'GENRE' && proof.id === genre.id);
                  if (!existing || known?.hash === fingerprint({ id: genre.id, name })) await saveProof(tx, 'GENRE', genre.id, fingerprint({ id: genre.id, name }), 'ACTIVE', now);
                }
                await tx.movie.update({ where: { id: row.id }, data: { title: detail.title, description: detail.description, releasedYear: detail.releasedYear, duration: detail.duration, posterUrl: detail.posterUrl, backdropUrl: detail.backdropUrl, tmdbScore: detail.tmdbScore, credits: { cast: detail.cast, directors: detail.directors } as Prisma.InputJsonValue, metadataRefreshedAt: now, genres: { deleteMany: {}, create: genreIds.map(genreId => ({ genreId })) } } });
              } else if (change?.status === 'RETIRED') {
                await tx.movie.update({ where: { id: row.id }, data: { title: 'Movie metadata unavailable', description: null, releasedYear: null, duration: null, posterUrl: null, backdropUrl: null, credits: Prisma.DbNull, tmdbScore: null, metadataRefreshedAt: null, genres: { deleteMany: {} } } });
              } else continue;
              const updated = await tx.movie.findUniqueOrThrow({ where: { id: row.id }, include });
              await saveProof(tx, 'MOVIE', row.id, fingerprint(metadata(updated)), change.status === 'RETIRED' ? plan.mode === 'termination' ? 'TERMINATED' : 'RETIRED' : 'ACTIVE', updated.metadataRefreshedAt);
            }
            const genres: Outcome[] = [];
            for (const reviewed of plan.genres.filter(item => item.action === 'RETIRE_IF_ORPHAN')) {
              const proof = (await proofs(tx)).find(item => item.kind === 'GENRE' && item.id === reviewed.id);
              if (!proof || proof.state !== 'ACTIVE') { genres.push({ id: reviewed.id, status: 'REVIEW' }); continue; }
              const genre = await tx.genre.findUnique({ where: { id: proof.id } });
              if (!genre || proof.hash !== fingerprint({ id: genre.id, name: genre.genreName })) { genres.push({ id: proof.id, status: 'REVIEW' }); continue; }
              if (plan.mode !== 'termination' && (!proof.fetchedAt || +now - +proof.fetchedAt < EXPIRE_DAYS * DAY_MS)) continue;
              if (await tx.movieCategorizesAs.count({ where: { genreId: proof.id } })) { genres.push({ id: proof.id, status: 'REVIEW_REFERENCED' }); continue; }
              const name = `Unavailable genre ${genre.id}`;
              await tx.genre.update({ where: { id: genre.id }, data: { genreName: name } });
              await saveProof(tx, 'GENRE', genre.id, fingerprint({ id: genre.id, name }), 'RETIRED', null);
              genres.push({ id: genre.id, status: 'RETIRED' });
            }
            const result: RetentionResult = { requestId, mode: plan.mode, completedAt: now.toISOString(), reviewedBy, outcomes, genres, externalArtifactsPending: ['Next shared-result caches', 'optimized images', 'exports/backups', 'production provenance and scheduling'] };
            if (plan.mode === 'termination') await tx.$executeRaw`UPDATE "_RetentionFixtureControl" SET terminated=TRUE`;
            await tx.$executeRaw`INSERT INTO "_RetentionFixtureAudit" (id,plan_hash,payload) VALUES (${requestId},${planHash},${JSON.stringify(result)}::jsonb)`;
            return result;
          }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 10000 });
        } catch (error) {
          if (attempt >= 4 || !(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2034', 'P2002'].includes(error.code)) throw error;
        }
      }
      } catch (error) {
        // Another identical request may commit after our first audit miss but before
        // inventory/provider/conflict checks finish. Its durable outcome wins.
        const completed = await replay(await storedRun(db, requestId));
        if (completed) return completed;
        throw error;
      }
    },
  };
}
