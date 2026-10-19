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
const request = (body: unknown, method = 'POST') => new NextRequest('http://localhost/api/diaries', { method, body: JSON.stringify(body) });

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
  expect(await db.watchedList.count()).toBe(1);
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
