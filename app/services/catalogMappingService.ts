import 'server-only';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import type { CatalogProvider } from '@/app/lib/tmdb/types';
import { tmdbIdSchema } from '@/app/lib/tmdb/normalize';
import { catalogTransaction } from './movieImportService';

const rowSchema = z.object({ localId: z.string().min(1).max(200), expectedTitle: z.string().min(1), expectedYear: z.number().int().nullable(), tmdbId: tmdbIdSchema }).strict();
export const mappingManifest = z.object({ version: z.literal(1), reviewedBy: z.string().trim().min(1).max(200), mappings: z.array(rowSchema).min(1).max(1000) }).strict().superRefine(({ mappings }, context) => {
  if (new Set(mappings.map(x => x.localId)).size !== mappings.length || new Set(mappings.map(x => x.tmdbId)).size !== mappings.length) context.addIssue({ code: 'custom', message: 'Duplicate local or TMDB identity; review manually' });
});
type LocalCandidate = { id: string; title: string; releasedYear: number | null };
/** Suggestions only. Even a single title/year candidate requires human review. */
export async function matchCatalog(movies: LocalCandidate[], provider: Pick<CatalogProvider, 'search'>) {
  const rows = [];
  for (const movie of movies) {
    const result = await provider.search({ query: movie.title, ...(movie.releasedYear ? { year: movie.releasedYear } : {}) });
    rows.push({ localId: movie.id, title: movie.title, releasedYear: movie.releasedYear,
      status: result.results.length ? 'REVIEW_REQUIRED' : 'UNMATCHED',
      candidates: result.results.map(x => ({ tmdbId: x.tmdbId, title: x.title, releasedYear: x.releasedYear })),
      moreCandidatePages: result.totalPages > 1,
    });
  }
  const targets = new Map<number, string[]>();
  for (const row of rows) for (const candidate of row.candidates) targets.set(candidate.tmdbId, [...(targets.get(candidate.tmdbId) ?? []), row.localId]);
  return { version: 1, generatedAt: new Date().toISOString(), rows,
    collisions: [...targets].filter(([, localIds]) => localIds.length > 1).map(([tmdbId, localIds]) => ({ tmdbId, localIds })),
  };
}
export async function applyMappings(value: unknown, { db, provider }: { db: PrismaClient; provider: Pick<CatalogProvider, 'details'> }) {
  const manifest = mappingManifest.parse(value);
  // Provider must be the trusted TMDB boundary (same adult restriction as direct import).
  for (const row of manifest.mappings) {
    const detail = await provider.details(row.tmdbId);
    if (detail.tmdbId !== row.tmdbId) throw new Error('Provider identity mismatch');
  }
  return catalogTransaction(db, async tx => {
    const changes: { localId: string; beforeTmdbId: null; afterTmdbId: number }[] = [];
    for (const row of manifest.mappings) {
      const local = await tx.movie.findUnique({ where: { id: row.localId } });
      if (!local || local.title !== row.expectedTitle || local.releasedYear !== row.expectedYear) throw new Error('Stale local snapshot; regenerate and review report');
      if (local.tmdbId === row.tmdbId) continue;
      if (local.tmdbId !== null) throw new Error('Local identity already mapped; manual reconciliation required');
      const target = await tx.movie.findUnique({ where: { tmdbId: row.tmdbId } });
      if (target) throw new Error('TMDB identity already assigned; no automatic merge');
      await tx.movie.update({ where: { id: row.localId }, data: { tmdbId: row.tmdbId } });
      changes.push({ localId: row.localId, beforeTmdbId: null, afterTmdbId: row.tmdbId });
    }
    return tx.catalogMappingAudit.create({ data: { reviewer: manifest.reviewedBy, mappings: changes } });
  });
}
