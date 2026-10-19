import { expect, it, vi } from 'vitest';
import type { TmdbClient } from '@/app/lib/tmdb/client';
import { createCachedProvider } from '@/app/lib/tmdb/server';
const shared = vi.hoisted(() => new Map<string, Promise<unknown>>());
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ unstable_cache: (load: (...args: unknown[]) => Promise<unknown>, parts: string[]) => (...args: unknown[]) => {
  const key = JSON.stringify([String(load), parts, args]);
  if (!shared.has(key)) shared.set(key, load(...args));
  return shared.get(key);
} }));
it('never serves cached sample results through the ordinary provider scope', async () => {
  const sample = { discover: vi.fn().mockResolvedValue({ results: ['Invented sample'] }) };
  const live = { discover: vi.fn().mockResolvedValue({ results: ['Real provider result'] }) };
  const preview = createCachedProvider(sample as unknown as TmdbClient, 'preview_disposable');
  const ordinary = createCachedProvider(live as unknown as TmdbClient, 'provider');
  expect(await preview.discover()).toEqual({ results: ['Invented sample'] });
  expect(await ordinary.discover()).toEqual({ results: ['Real provider result'] });
  await ordinary.discover();
  expect(live.discover).toHaveBeenCalledOnce();
});
