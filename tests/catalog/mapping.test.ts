// @vitest-environment node
import { it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { matchCatalog, mappingManifest } from '@/app/services/catalogMappingService';
import type { CatalogMovie } from '@/app/lib/tmdb/types';
const candidate = (tmdbId: number) => ({ tmdbId, title: 'Duplicate', releasedYear: 2020 }) as CatalogMovie;
it('reports ambiguous and unmatched candidates without choosing a mapping', async () => {
  const result = await matchCatalog([{ id: 'a', title: 'Duplicate', releasedYear: 2020 }, { id: 'b', title: 'Unmatched', releasedYear: null }], {
    search: async ({ query }) => ({ page: 1, totalPages: 1, totalResults: query === 'Duplicate' ? 2 : 0, results: query === 'Duplicate' ? [candidate(1), candidate(2)] : [] }),
  });
  expect(result.rows[0]).toMatchObject({ localId: 'a', status: 'REVIEW_REQUIRED', candidates: [{ tmdbId: 1 }, { tmdbId: 2 }] });
  expect(result.rows[1]).toMatchObject({ localId: 'b', status: 'UNMATCHED', candidates: [] });
  expect(result).not.toHaveProperty('mappings');
});
it('requires explicit review and rejects duplicate targets or local IDs', () => {
  const row = { localId: 'a', expectedTitle: 'Duplicate', expectedYear: 2020, tmdbId: 1 };
  const manifest = { version: 1, reviewedBy: 'owner', mappings: [row] };
  expect(mappingManifest.safeParse(manifest).success).toBe(true);
  expect(mappingManifest.safeParse({ ...manifest, reviewedBy: '' }).success).toBe(false);
  expect(mappingManifest.safeParse({ ...manifest, mappings: [row, { ...row, localId: 'b' }] }).success).toBe(false);
  expect(mappingManifest.safeParse({ ...manifest, mappings: [row, { ...row, tmdbId: 2 }] }).success).toBe(false);
});
