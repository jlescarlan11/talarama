import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const provider = vi.hoisted(() => ({ search: vi.fn(), discover: vi.fn() }));
vi.mock('@/app/lib/tmdb/server', () => ({ tmdb: provider }));
import { GET } from '@/app/api/catalog/route';
import { TmdbError } from '@/app/lib/tmdb/client';

it('returns bounded normalized read results with separate discovery parameters', async () => {
  provider.discover.mockResolvedValue({ page: 2, totalPages: 2, totalResults: 1, results: [] });
  const response = await GET(new Request('http://localhost/api/catalog?genre=18&year=2020&page=2'));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ page: 2, results: [] });
  expect(provider.discover).toHaveBeenCalledWith({ genre: 18, year: 2020, page: 2 });
});
it('rejects invalid public input and returns safe retryable provider errors', async () => {
  expect((await GET(new Request('http://localhost/api/catalog?page=900'))).status).toBe(400);
  provider.search.mockRejectedValue(new TmdbError('AUTH'));
  const response = await GET(new Request('http://localhost/api/catalog?mode=search&query=Alien'));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'Movie provider is unavailable. Please try again.' });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
