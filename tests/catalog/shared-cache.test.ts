// @vitest-environment node
import { it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
// Model Next's persistent result cache: resolved results survive new request wrappers;
// rejected operations are not stored. The transport fixture models HTTP caching independently.
vi.mock('next/cache', () => ({ unstable_cache: (load: (...args: unknown[]) => Promise<unknown>) => {
  const values = new Map<string, unknown>();
  return async (...args: unknown[]) => {
    const key = JSON.stringify(args);
    if (values.has(key)) return values.get(key);
    const value = await load(...args); values.set(key, value); return value;
  };
} }));
import { TmdbClient } from '@/app/lib/tmdb/client';
import { createCachedProvider } from '@/app/lib/tmdb/server';
it('retries malformed HTTP 200 and shares only validated normalized metadata', async () => {
  let requests = 0;
  let cachedHttp: string | undefined;
  const fetcher: typeof fetch = async (_url, init) => {
    requests++;
    const valid = { id: 42, title: 'Corrected', adult: false, vote_average: 0, vote_count: 0, runtime: null, genres: [], credits: { cast: [], crew: [] } };
    const body = cachedHttp ?? JSON.stringify(requests === 1 ? { malformed: true } : valid);
    if (init?.cache !== 'no-store') cachedHttp = body;
    return new Response(body);
  };
  const provider = createCachedProvider(new TmdbClient({ token: 'fixture', fetcher }));
  await expect(provider.details(42)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  expect((await provider.details(42)).title).toBe('Corrected');
  expect((await provider.details(42)).title).toBe('Corrected');
  expect(requests).toBe(2);
});
