import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));

const auth = vi.hoisted(() => ({ userId: 'phase0-owner' as string | null }));
vi.mock('next-auth', () => ({ getServerSession: async () => auth.userId ? { user: { id: auth.userId } } : null }));
vi.mock('@/app/auth/authOptions', () => ({ default: {} }));

// Require an explicitly named disposable database. Never fall back to DATABASE_URL.
const rawUrl = process.env.TEST_DATABASE_URL;
if (!rawUrl) throw new Error('Set TEST_DATABASE_URL to a separate disposable database ending in _test');
const testUrl = new URL(rawUrl);
if (!decodeURIComponent(testUrl.pathname).endsWith('_test')) throw new Error('Refusing non-test database: name must end in _test');
const schema = `phase0_${randomUUID().replaceAll('-', '')}`;
testUrl.searchParams.set('schema', schema);
const admin = new PrismaClient({ datasourceUrl: rawUrl });
const db = new PrismaClient({ datasourceUrl: testUrl.toString() });
vi.mock('@/prisma/client', () => ({ default: db }));
let post: typeof import('@/app/api/diaries/route').POST;
let patch: typeof import('@/app/api/diaries/[id]/route').PATCH;
let remove: typeof import('@/app/api/diaries/[id]/route').DELETE;
let like: typeof import('@/app/api/movies/[id]/like/route').POST;
let watchlist: typeof import('@/app/api/movies/[id]/watchlist/route').POST;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const request = (body: unknown, method = 'POST') => new NextRequest('http://localhost/api/diaries', { method, body: JSON.stringify(typeof body === 'object' && body ? { isRewatch:false, containsSpoilers:false, visibility:'PRIVATE', clientRequestId:randomUUID(), ...body } : body) });

beforeAll(async () => {
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: testUrl.toString(), DIRECT_URL: testUrl.toString() }, stdio: 'pipe',
  });
  ({ POST: post } = await import('@/app/api/diaries/route'));
  ({ PATCH: patch, DELETE: remove } = await import('@/app/api/diaries/[id]/route'));
  ({ POST: like } = await import('@/app/api/movies/[id]/like/route'));
  ({ POST: watchlist } = await import('@/app/api/movies/[id]/watchlist/route'));
  await db.user.createMany({ data: [
    { id: 'phase0-owner', email: 'owner@example.invalid', username: 'existing_owner' },
    { id: 'phase0-other', email: 'other@example.invalid', username: 'existing_other' },
  ] });
  await db.account.create({ data: { id: 'legacy-account', userId: 'phase0-owner', provider: 'google', providerAccountId: 'existing-google-sub', type: 'oauth' } });
  await db.movie.create({ data: { id: 'legacy-movie', title: 'Phase 0 fixture', releasedYear: 2000, duration: 100 } });
});
afterAll(async () => {
  await db.$disconnect();
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.$disconnect();
});
it('preserves existing IDs and account links through save/log/edit/delete, enforcing ownership', async () => {
  const movieParams = params('legacy-movie');
  expect((await like(request({}), movieParams)).status).toBe(200);
  expect((await watchlist(request({}), movieParams)).status).toBe(200);
  const body = { movieId: 'legacy-movie', rating: 4, review: '', watchedDate: '2020-02-29' };
  const created = await post(request(body));
  expect(created.status).toBe(201);
  const entry = await created.json();
  expect(await db.diaryEntry.findUnique({ where: { id: entry.id } })).toMatchObject({ movieId: 'legacy-movie', userId: 'phase0-owner', review: '', rating: 4 });
  auth.userId = 'phase0-other';
  expect((await patch(request({ ...body, review: 'Intrusion' }, 'PATCH'), params(entry.id))).status).toBe(404);
  expect((await remove(request({}, 'DELETE'), params(entry.id))).status).toBe(404);
  auth.userId = 'phase0-owner';
  expect((await patch(request({ ...body, review: 'Updated', rating: 5 }, 'PATCH'), params(entry.id))).status).toBe(200);
  expect(await db.diaryEntry.findUnique({ where: { id: entry.id } })).toMatchObject({ review: 'Updated', rating: 5 });
  expect((await remove(request({}, 'DELETE'), params(entry.id))).status).toBe(200);
  expect(await db.diaryEntry.count()).toBe(0);
  expect(await db.account.findUnique({ where: { id: 'legacy-account' } })).toMatchObject({ userId: 'phase0-owner', providerAccountId: 'existing-google-sub' });
  expect(await db.likedBy.count()).toBe(1);
  expect(await db.watchlistEntry.count()).toBe(0);
  expect(await db.movie.findUnique({ where: { id: 'legacy-movie' } })).not.toBeNull();
});
it('rejects anonymous writes and malformed dates without storing entries', async () => {
  auth.userId = null;
  expect((await post(request({}))).status).toBe(401);
  auth.userId = 'phase0-owner';
  expect((await post(request({ movieId: 'legacy-movie', rating: 3, review: 'A review', watchedDate: 'bad-date' }))).status).toBe(400);
  expect(await db.diaryEntry.count()).toBe(0);
});
it('treats malformed JSON as bad input without exposing internal errors', async () => {
  auth.userId = 'phase0-owner';
  const response = await post(new NextRequest('http://localhost/api/diaries', { method: 'POST', body: '{' }));
  expect(response.status).toBe(400);
  expect(await response.json()).not.toHaveProperty('details');
});
it('does not log session details or diary content on writes', async () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    auth.userId = 'phase0-owner';
    await post(request({ movieId: 'legacy-movie', rating: 3, review: 'Private test review', watchedDate: '2020-01-01' }));
    expect(log).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});
it('protects the diary edit page from anonymous visitors and other members', async () => {
  const { default: EditPage } = await import('@/app/diaries/edit/[id]/page');
  const entry = await db.diaryEntry.create({ data: { userId: 'phase0-owner', movieId: 'legacy-movie', rating: 4, review: 'Owner only', watchedDate: new Date('2020-01-01') } });
  auth.userId = null;
  await expect(EditPage({ params: Promise.resolve({ id: entry.id }) })).rejects.toThrow('NEXT_REDIRECT');
  auth.userId = 'phase0-other';
  await expect(EditPage({ params: Promise.resolve({ id: entry.id }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  auth.userId = 'phase0-owner';
  expect(await EditPage({ params: Promise.resolve({ id: entry.id }) })).toBeTruthy();
  await db.diaryEntry.delete({ where: { id: entry.id } });
});

it('converges concurrent retries, preserves deliberate rewatches and does not replay watchlist removal', async () => {
 auth.userId='phase0-owner';
 const body={movieId:'legacy-movie',watchedDate:'2020-02-29',rating:null,review:'  private  ',clientRequestId:randomUUID(),isRewatch:true,containsSpoilers:true,visibility:'PRIVATE'};
 await db.watchlistEntry.createMany({data:[{userId:'phase0-owner',movieId:'legacy-movie'}],skipDuplicates:true});
 const responses=await Promise.all(Array.from({length:8},()=>post(request(body))));
 expect(responses.every(r=>[200,201].includes(r.status))).toBe(true);
 const entries=await Promise.all(responses.map(r=>r.json()));
 expect(new Set(entries.map(e=>e.id)).size).toBe(1);
 expect(entries[0]).toMatchObject({rating:null,review:'private',watchedDate:'2020-02-29',isRewatch:true,containsSpoilers:true});
 expect(await db.watchlistEntry.count()).toBe(0);
 await db.watchlistEntry.create({data:{userId:'phase0-owner',movieId:'legacy-movie'}});
 expect((await post(request(body))).status).toBe(200);
 expect(await db.watchlistEntry.count()).toBe(1);
 const rewatch=await post(request({...body,clientRequestId:randomUUID()}));
 expect(rewatch.status).toBe(201);
 expect((await rewatch.json()).id).not.toBe(entries[0].id);
});
it('rolls back creation when watchlist deletion fails and preserves unrelated member data', async () => {
 auth.userId='phase0-owner';
 await db.watchlistEntry.createMany({data:[{userId:'phase0-owner',movieId:'legacy-movie'},{userId:'phase0-other',movieId:'legacy-movie'}],skipDuplicates:true});
 const before=await db.diaryEntry.count();
 await db.$executeRawUnsafe(`CREATE FUNCTION "${schema}".reject_watchlist_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture failure'; END $$`);
 await db.$executeRawUnsafe(`CREATE TRIGGER reject_delete BEFORE DELETE ON "${schema}"."WatchedList" FOR EACH ROW EXECUTE FUNCTION "${schema}".reject_watchlist_delete()`);
 try {
  expect((await post(request({movieId:'legacy-movie',watchedDate:'2020-01-01',rating:null,review:''}))).status).toBe(500);
  expect(await db.diaryEntry.count()).toBe(before);
  expect(await db.watchlistEntry.count()).toBe(2);
 } finally { await db.$executeRawUnsafe(`DROP TRIGGER reject_delete ON "${schema}"."WatchedList"`); }
});
it('uses saved timezone, bounds reads to owner and paginates equal dates without duplicates', async () => {
 const {listDiaryEntries}=await import('@/app/services/diaryEntryService');
 auth.userId='phase0-owner';
 await db.user.update({where:{id:auth.userId},data:{timeZone:'Pacific/Kiritimati'}});
 const body={movieId:'legacy-movie',watchedDate:'2999-01-01',rating:null,review:''};
 expect((await post(request(body))).status).toBe(400);
 await db.diaryEntry.createMany({data:Array.from({length:25},(_,i)=>({id:`page-${String(i).padStart(2,'0')}`,userId:'phase0-owner',movieId:'legacy-movie',watchedDate:new Date('2018-01-01'),rating:null,review:''}))});
 const first=await listDiaryEntries('phase0-owner',{year:2018});
 expect(first.entries).toHaveLength(20);
 const second=await listDiaryEntries('phase0-owner',{year:2018,cursor:first.nextCursor!});
 expect(second.entries).toHaveLength(5);
 expect(new Set([...first.entries,...second.entries].map(e=>e.id)).size).toBe(25);
 expect(first.statistics).toMatchObject({logs:25,movies:1});
 expect((await listDiaryEntries('phase0-other',{year:2018})).entries).toHaveLength(0);
});

it('does not query diary content or counts for movie details, even for signed-in owners',async()=>{
 const {getMovieDetail}=await import('@/app/services/movieDetailService');
 const read=vi.spyOn(db.diaryEntry,'findMany');const aggregate=vi.spyOn(db.diaryEntry,'aggregate');
 try{for(const userId of [undefined,'phase0-other','phase0-owner']){const detail=await getMovieDetail({localId:'legacy-movie'},userId);expect(detail).not.toHaveProperty('reviews');expect(detail?.rating).toEqual({average:null,count:0});}expect(read).not.toHaveBeenCalled();expect(aggregate).not.toHaveBeenCalled();}finally{read.mockRestore();aggregate.mockRestore();}
});
it('initializes timezone once, validates zone names and keeps owner reads private',async()=>{
 const {POST:initialize}=await import('@/app/api/diary-timezone/route');
 const {GET:list}=await import('@/app/api/diaries/route');const {GET:read}=await import('@/app/api/diaries/[id]/route');
 auth.userId='phase0-other';
 expect((await initialize(request({timeZone:'Invalid/zone'}))).status).toBe(400);
 const zoneRequest=(timeZone:string)=>new NextRequest('http://localhost/api/diary-timezone',{method:'POST',body:JSON.stringify({timeZone})});
 expect((await initialize(zoneRequest('Asia/Manila'))).status).toBe(200);
 expect((await initialize(zoneRequest('UTC'))).status).toBe(200);
 expect((await db.user.findUniqueOrThrow({where:{id:'phase0-other'}})).timeZone).toBe('Asia/Manila');
 const entry=await db.diaryEntry.findFirstOrThrow({where:{userId:'phase0-owner'}});
 const denied=await read(new NextRequest('http://localhost/api/diaries/'+entry.id),params(entry.id));
 expect(denied.status).toBe(404);expect(denied.headers.get('cache-control')).toBe('no-store');
 const own=await list(new NextRequest('http://localhost/api/diaries'));
 expect((await own.json()).entries).toEqual([]);
 auth.userId=null;expect((await list(new NextRequest('http://localhost/api/diaries'))).status).toBe(401);
 auth.userId='phase0-owner';
});

it('requires reviewed original timestamps and rolls back stale normalization batches',async()=>{
 const {applyReviewedDates}=await import('@/app/services/diaryDateMigrationService');
 await db.diaryEntry.createMany({data:['legacy-date-a','legacy-date-b'].map(id=>({id,userId:'phase0-owner',movieId:'legacy-movie',watchedDate:new Date('2020-02-29T23:30:00Z'),rating:3,review:'Preserve'}))});
 const mappings=[{id:'legacy-date-a',original:'2020-02-29T23:30:00.000Z',date:'2020-03-01'},{id:'legacy-date-b',original:'2000-01-01T00:00:00.000Z',date:'2020-02-29'}];
 await expect(applyReviewedDates({version:1,reviewedBy:'fixture reviewer',mappings},{db})).rejects.toThrow();
 expect((await db.diaryEntry.findUniqueOrThrow({where:{id:'legacy-date-a'}})).watchedDate.toISOString()).toBe('2020-02-29T23:30:00.000Z');
 mappings[1].original='2020-02-29T23:30:00.000Z';
 expect(await applyReviewedDates({version:1,reviewedBy:'fixture reviewer',mappings},{db})).toHaveLength(2);
 expect((await db.diaryEntry.findUniqueOrThrow({where:{id:'legacy-date-a'}})).watchedDate.toISOString()).toBe('2020-03-01T00:00:00.000Z');
});

it('excludes private diary counts and ratings from legacy catalog endpoints and service consumers',async()=>{
 const {GET:movies}=await import('@/app/api/movies/route');
 const {MovieService}=await import('@/app/services/movieService');
 const response=await movies();expect(response.status).toBe(200);
 const list=await response.json();for(const movie of list){expect(movie).not.toHaveProperty('_count.diaryEntries');expect(movie).not.toHaveProperty('diaryEntries');}
 for(const movie of [...await MovieService.getMovies({}),...await MovieService.getFeaturedMovies()]){expect(movie).not.toHaveProperty('diaryEntries');expect(movie._count?.diaryEntries??0).toBe(0);}
});

it('accepts a completely unrated empty log and scopes retry identity to each owner',async()=>{
 const clientRequestId=randomUUID();const body={movieId:'legacy-movie',rating:null,review:'',watchedDate:'2020-02-29',clientRequestId};
 auth.userId='phase0-owner';const first=await post(request(body));expect(first.status).toBe(201);const owner=await first.json();
 auth.userId='phase0-other';const second=await post(request(body));expect(second.status).toBe(201);const other=await second.json();
 expect(other.id).not.toBe(owner.id);expect(other).toMatchObject({rating:null,review:'',visibility:'PRIVATE'});
 auth.userId='phase0-owner';
});
