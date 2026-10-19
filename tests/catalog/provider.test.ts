// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { TmdbClient, TmdbError } from '@/app/lib/tmdb/client';
import { tmdbImage } from '@/app/lib/tmdb/images';
import { MetadataCache } from '@/app/lib/tmdb/cache';
import { normalizeLocalMovie } from '@/app/lib/tmdb/normalize';

export const movieFixture = (id = 42) => ({
  id, title: 'Fixture movie', adult: false, overview: '', release_date: '',
  poster_path: '/abc.jpg', backdrop_path: null, vote_average: 7.5, vote_count: 11,
  runtime: null, genres: [{ id: 18, name: 'Drama' }],
  credits: { cast: [{ id: 8, name: 'Actor', character: 'Role' }], crew: [{ id: 9, name: 'Director', job: 'Director' }] },
});
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const client = (fetcher: typeof fetch) => new TmdbClient({ token: 'private-test-token', fetcher });

it('normalizes external identity, unknown metadata and separate ten-point score', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(movieFixture()));
  const detail = await client(fetcher).details(42);
  expect(detail).toMatchObject({ localId: null, tmdbId: 42, releasedYear: null, duration: null, tmdbScore: 7.5, posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg', directors: [{ tmdbId: 9, name: 'Director' }] });
  const [url, init] = fetcher.mock.calls[0];
  expect(String(url)).toBe('https://api.themoviedb.org/3/movie/42?language=en-US&append_to_response=credits');
  expect(init).toMatchObject({ redirect: 'error', headers: { Authorization: 'Bearer private-test-token' }, cache: 'no-store' });
  expect(String(url)).not.toContain('private-test-token');
});
it('constructs only safe raster image URLs', () => {
  for (const path of [null, '', '//evil/a.jpg', 'https://evil/x.jpg', '/../a.jpg', '/a.svg', '/a.jpg?q=x', '/a%2f.jpg']) expect(tmdbImage(path)).toBeNull();
  expect(tmdbImage('/valid_1-X.png', 'backdrop')).toBe('https://image.tmdb.org/t/p/w1280/valid_1-X.png');
});
it('filters adult list entries and bounds pagination', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ page: 1, total_pages: 999, total_results: 2, results: [movieFixture(), { ...movieFixture(43), adult: true }] }));
  const result = await client(fetcher).search({ query: ' test ', year: 2020 });
  expect(result.results.map(x => x.tmdbId)).toEqual([42]);
  expect(result.totalPages).toBe(500);
  expect(String(fetcher.mock.calls[0][0])).toContain('include_adult=false');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
  for (const page of [0, 501, 1.5, NaN]) await expect(client(fetcher).search({ query: 'x', page })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(client(fetcher).details(-1)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(client(fetcher).search({ query: ' ' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
});
it('supports bounded genre/year discovery independently from search', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ page: 1, total_pages: 1, total_results: 0, results: [] }));
  await client(fetcher).discover({ genre: 18, year: 2020 });
  expect(String(fetcher.mock.calls[0][0])).toContain('/discover/movie?');
  expect(String(fetcher.mock.calls[0][0])).toContain('with_genres=18');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
});
it('rejects adult details, mismatched IDs, malformed and oversized responses', async () => {
  for (const payload of [{ ...movieFixture(), adult: true }, { ...movieFixture(), id: 77 }, { title: 'bad' }, { ...movieFixture(), vote_average: 99 }]) {
    await expect(client(async () => response(payload)).details(42)).rejects.toBeInstanceOf(TmdbError);
  }
  await expect(client(async () => new Response('x'.repeat(2_000_001))).details(42)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('maps provider failures without exposing credentials or response bodies', async () => {
  for (const [status, code] of [[401, 'AUTH'], [404, 'NOT_FOUND'], [429, 'RATE_LIMITED'], [503, 'UNAVAILABLE']] as const) {
    await expect(client(async () => response({ secret: 'hidden' }, status)).details(42)).rejects.toMatchObject({ code });
  }
  await expect(new TmdbClient({ token: '' }).details(42)).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
  await expect(client(async () => { throw new Error('private-test-token'); }).details(42)).rejects.toThrow('TMDB request unavailable');
});
it('aborts transport after five seconds', async () => {
  vi.useFakeTimers();
  try {
    const provider = client((_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))));
    const assertion = expect(provider.details(42)).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  } finally { vi.useRealTimers(); }
});
it('bounds a stalled response body as well as connection time', async () => {
  vi.useFakeTimers();
  try {
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); } });
    const provider = client(async () => new Response(stream));
    const assertion = expect(provider.details(42)).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  } finally { vi.useRealTimers(); }
}, 1000);
it('normalizes a legacy local snapshot with its preserved ID and separate provider identity', () => {
  expect(normalizeLocalMovie({ id: 'legacy', tmdbId: null, title: 'Legacy', description: 'Kept', releasedYear: 2000, duration: 90, posterUrl: 'https://localc.ph/old.jpg', backdropUrl: null, credits: null, tmdbScore: null })).toMatchObject({ localId: 'legacy', tmdbId: null, title: 'Legacy', posterUrl: 'https://localc.ph/old.jpg', releasedYear: 2000, duration: 90, tmdbScore: null });
});
it('coalesces metadata requests, expires successful entries, evicts failures and bounds cache', async () => {
  let now = 0;
  const cache = new MetadataCache(2, () => now);
  let calls = 0;
  const load = async () => ++calls;
  expect(await Promise.all([cache.get('a', 10, load), cache.get('a', 10, load)])).toEqual([1, 1]);
  now = 11;
  expect(await cache.get('a', 10, load)).toBe(2);
  await expect(cache.get('bad', 10, async () => { throw new Error('failure'); })).rejects.toThrow();
  expect(await cache.get('bad', 10, load)).toBe(3);
  await cache.get('c', 10, load);
  expect(await cache.get('a', 10, load)).toBe(5);
});
