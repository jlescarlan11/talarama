import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const deps = vi.hoisted(() => ({ session: vi.fn(), import: vi.fn(), set: vi.fn(), find: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: deps.session }));
vi.mock('@/app/auth/authOptions', () => ({ default: {} }));
vi.mock('@/app/services/movieImportService', () => ({ importMovie: deps.import }));
vi.mock('@/app/services/movieLibraryService', () => ({ setLibraryEntry: deps.set }));
vi.mock('@/prisma/client', () => ({ default: { movie: { findUnique: deps.find } } }));
import { POST } from '@/app/api/movies/import/route';
import { POST as addLike, DELETE as removeLike } from '@/app/api/movies/[id]/like/route';
import { POST as addWatch, DELETE as removeWatch } from '@/app/api/movies/[id]/watchlist/route';
import { POST as manualCreate } from '@/app/api/movies/route';
import { PATCH as manualEdit, DELETE as manualDelete } from '@/app/api/movies/[id]/route';
import { TmdbError } from '@/app/lib/tmdb/client';
const request = (body: unknown) => new Request('http://localhost/api/movies/import', { method: 'POST', body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: 'local-42' }) };
beforeEach(() => { vi.clearAllMocks(); deps.session.mockResolvedValue({ user: { id: 'owner' } }); deps.find.mockResolvedValue({ id: 'local-42' }); });
it('authenticates import before parsing or invoking a provider', async () => {
  deps.session.mockResolvedValue(null);
  expect((await POST(request({ tmdbId: 42 }))).status).toBe(401);
  expect(deps.import).not.toHaveBeenCalled();
});
it('accepts only a bounded provider identity and ignores no forged metadata', async () => {
  for (const body of [{ tmdbId: 0 }, { tmdbId: '42' }, { tmdbId: 42, title: 'Forged' }]) expect((await POST(request(body))).status).toBe(400);
  expect(deps.import).not.toHaveBeenCalled();
  deps.import.mockResolvedValue({ id: 'local-42' });
  const response = await POST(request({ tmdbId: 42 }));
  expect(await response.json()).toEqual({ movieId: 'local-42' });
  expect(deps.import).toHaveBeenCalledWith(42);
});
it('maps removed or unavailable provider titles to safe errors', async () => {
  deps.import.mockRejectedValue(new TmdbError('NOT_FOUND'));
  expect((await POST(request({ tmdbId: 42 }))).status).toBe(404);
  deps.import.mockRejectedValue(new TmdbError('AUTH'));
  expect((await POST(request({ tmdbId: 42 }))).status).toBe(503);
});
it.each([[addLike, 'favorite', true], [removeLike, 'favorite', false], [addWatch, 'watchlist', true], [removeWatch, 'watchlist', false]] as const)('applies explicit library intent with server session identity', async (handler, kind, present) => {
  deps.set.mockResolvedValue(undefined);
  const response = await handler(request({ userId: 'attacker' }), context);
  expect(response.status).toBe(200);
  expect(deps.set).toHaveBeenCalledWith('owner', 'local-42', kind, present);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('denies anonymous and missing-movie library writes', async () => {
  deps.session.mockResolvedValue(null);
  expect((await addWatch(request({}), context)).status).toBe(401);
  deps.session.mockResolvedValue({ user: { id: 'owner' } }); deps.find.mockResolvedValue(null);
  expect((await addLike(request({}), context)).status).toBe(404);
  expect(deps.set).not.toHaveBeenCalled();
});
it('retires manual catalog writes for authenticated ordinary members', async () => {
  for (const handler of [manualCreate, manualEdit, manualDelete]) {
    const response = await handler();
    expect(response.status).toBe(403);
  }
});
