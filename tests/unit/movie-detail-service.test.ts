import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const deps = vi.hoisted(() => ({ find: vi.fn(), detail: vi.fn(), reviews: vi.fn(), aggregate: vi.fn(), like: vi.fn(), watch: vi.fn() }));
vi.mock('@/app/lib/tmdb/server', () => ({ tmdb: { details: deps.detail } }));
vi.mock('@/prisma/client', () => ({ default: { movie: { findUnique: deps.find }, diaryEntry: { findMany: deps.reviews, aggregate: deps.aggregate }, likedBy: { findUnique: deps.like }, watchlistEntry: { findUnique: deps.watch } } }));
import { getMovieDetail } from '@/app/services/movieDetailService';
import { TmdbError } from '@/app/lib/tmdb/client';
beforeEach(() => { vi.clearAllMocks(); deps.reviews.mockResolvedValue([]); deps.aggregate.mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }); deps.like.mockResolvedValue(null); deps.watch.mockResolvedValue(null); });
it('keeps a mapped local snapshot and legacy genres/director readable when provider fails', async () => {
  deps.find.mockResolvedValue({ id: 'legacy', tmdbId: 42, title: 'Preserved', description: 'Keep', releasedYear: 2000, duration: 90, posterUrl: null, backdropUrl: null, credits: null, tmdbScore: 7, directorFirstName: 'Jane', directorLastName: 'Doe', genres: [{ genre: { genreName: 'Drama' } }] });
  deps.detail.mockRejectedValue(new TmdbError('NOT_FOUND'));
  const result = await getMovieDetail({ tmdbId: 42 }, 'owner');
  expect(result).toMatchObject({ localId: 'legacy', providerUnavailable: true, movie: { title: 'Preserved', directors: [{ name: 'Jane Doe' }], genres: [{ name: 'Drama' }] } });
});
it('never fabricates local identity for external reads and distinguishes provider failure from missing', async () => {
  deps.find.mockResolvedValue(null);
  deps.detail.mockRejectedValue(new TmdbError('UNAVAILABLE'));
  await expect(getMovieDetail({ tmdbId: 42 })).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  deps.detail.mockRejectedValue(new TmdbError('NOT_FOUND'));
  expect(await getMovieDetail({ tmdbId: 42 })).toBeNull();
  expect(await getMovieDetail({ localId: 'missing' })).toBeNull();
});
