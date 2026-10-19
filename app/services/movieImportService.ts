import 'server-only';
import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '@/prisma/client';
import { tmdb } from '@/app/lib/tmdb/server';
import { tmdbIdSchema } from '@/app/lib/tmdb/normalize';
import type { CatalogMovie, WikidataMovie } from '@/app/lib/tmdb/types';

type Dependencies = { db?: PrismaClient; provider?: { details(id: number): Promise<CatalogMovie> } };
export function movieMetadata(detail: CatalogMovie | WikidataMovie) {
  return { title: detail.title, description: detail.description, releasedYear: detail.releasedYear, duration: detail.duration,
    posterUrl: detail.posterUrl, backdropUrl: detail.backdropUrl, tmdbScore: detail.tmdbScore,
    credits: { cast: detail.cast, directors: detail.directors } as Prisma.InputJsonValue,
    metadataRefreshedAt: new Date(),
  };
}
async function genreLinks(tx: Prisma.TransactionClient, detail: CatalogMovie) {
  const ids: string[] = [];
  for (const name of new Set(detail.genres.map(x => x.name))) {
    const genre = await tx.genre.upsert({ where: { genreName: name }, create: { genreName: name }, update: {} });
    ids.push(genre.id);
  }
  return ids.map(genreId => ({ genreId }));
}
export async function catalogTransaction<T>(db: PrismaClient, operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(operation, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 10000 }); }
    catch (error) {
      if (attempt >= 4 || !(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2002', 'P2034'].includes(error.code)) throw error;
    }
  }
}
/** Server orchestration primitive. Call only after authenticating a user action; no read path invokes this. */
export async function importMovie(id: number, { db = prisma, provider = tmdb }: Dependencies = {}) {
  const tmdbId = tmdbIdSchema.parse(id);
  const existing = await db.movie.findUnique({ where: { tmdbId } });
  if (existing) return existing;
  const detail = await provider.details(tmdbId);
  if (detail.tmdbId !== tmdbId) throw new Error('Provider identity mismatch');
  return catalogTransaction(db, async tx => {
    const winner = await tx.movie.findUnique({ where: { tmdbId } });
    if (winner) return winner;
    const links = await genreLinks(tx, detail);
    return tx.movie.create({ data: { tmdbId, ...movieMetadata(detail), genres: { create: links } } });
  });
}
/** Fetch before the transaction: failures leave the prior snapshot untouched. */
export async function refreshMovie(id: number, { db = prisma, provider = tmdb }: Dependencies = {}) {
  const tmdbId = tmdbIdSchema.parse(id);
  const detail = await provider.details(tmdbId);
  if (detail.tmdbId !== tmdbId) throw new Error('Provider identity mismatch');
  return catalogTransaction(db, async tx => {
    const links = await genreLinks(tx, detail);
    return tx.movie.update({ where: { tmdbId }, data: { ...movieMetadata(detail), genres: { deleteMany: {}, create: links } } });
  });
}
