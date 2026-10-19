// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
it('uses real Next result cache across provider instances with distinct keys, expiry and failed-response recovery', async () => {
  vi.stubGlobal('AsyncLocalStorage', AsyncLocalStorage);
  const { IncrementalCache } = await import('next/dist/server/lib/incremental-cache');
  const { default: FileSystemCache } = await import('next/dist/server/lib/incremental-cache/file-system-cache');
  const { createCachedProvider } = await import('@/app/lib/tmdb/server');
  const { TmdbClient } = await import('@/app/lib/tmdb/client');
  const preview = { previewModeId: 'fixture', previewModeSigningKey: 'fixture', previewModeEncryptionKey: 'fixture' };
  const cache = new IncrementalCache({ dev: false, CurCacheHandler: FileSystemCache, flushToDisk: false, maxMemoryCacheSize: 1_000_000, requestHeaders: {}, previewProps: preview, prerenderManifest: { version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [], preview } });
  vi.stubGlobal('__incrementalCache', cache);
  let now = Date.now();
  const originalPerformance = globalThis.performance;
  const initialNow = now;
  const initialPerformance = originalPerformance.now();
  vi.stubGlobal('performance', { timeOrigin: originalPerformance.timeOrigin, now: () => initialPerformance + now - initialNow });
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  let calls = 0;
  const fetcher: typeof fetch = async url => {
    calls++;
    const id = Number(new URL(String(url)).pathname.split('/').at(-1));
    return new Response(JSON.stringify(calls === 1 ? { malformed: true } : { id, title: `Fixture ${calls}`, adult: false, vote_average: 0, vote_count: 0, runtime: null, genres: [], credits: { cast: [], crew: [] } }));
  };
  const fresh = () => createCachedProvider(new TmdbClient({ token: 'synthetic', fetcher }));
  try {
    await expect(fresh().details(811)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    expect((await fresh().details(811)).title).toBe('Fixture 2');
    expect((await fresh().details(811)).title).toBe('Fixture 2');
    expect(calls).toBe(2);
    expect((await fresh().details(812)).tmdbId).toBe(812);
    expect(calls).toBe(3);
    now += 86_401_000;
    expect((await fresh().details(811)).title).toBe('Fixture 4');
  } finally { vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
