import 'server-only';
import prisma from '@/prisma/client';
import { tmdb } from '@/app/lib/tmdb/server';
import { normalizeLocalMovie } from '@/app/lib/tmdb/normalize';
import { TmdbError } from '@/app/lib/tmdb/client';
import type { CatalogMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';

/** Read-only detail orchestration. Member data never enters provider/shared caches. */
export async function getMovieDetail(identity: { localId: string } | { tmdbId: number }, userId?: string) {
  const local = await prisma.movie.findUnique({ where: 'localId' in identity ? { id: identity.localId } : { tmdbId: identity.tmdbId }, include: { genres: { include: { genre: true } } } });
  const tmdbId = 'tmdbId' in identity ? identity.tmdbId : local?.tmdbId;
  if (!local && !tmdbId) return null;
  let movie: CatalogMovie | LocalCatalogMovie | null = null;
  let providerUnavailable = false;
  if (tmdbId) {
    try { movie = await tmdb.details(tmdbId); }
    catch (error) {
      if (!local) {
        if (error instanceof TmdbError && ['NOT_FOUND', 'CONTENT_BLOCKED'].includes(error.code)) return null;
        throw error;
      }
      providerUnavailable = true;
    }
  }
  if (!movie && local) {
    movie = normalizeLocalMovie(local);
    movie.genres = local.genres.map(({ genre }) => ({ tmdbId: 0, name: genre.genreName }));
    if (!movie.directors.length) {
      const name = [local.directorFirstName, local.directorLastName].filter(Boolean).join(' ');
      if (name) movie.directors = [{ tmdbId: 0, name }];
    }
  }
  if (!movie) return null;
  const localId = local?.id ?? null;
  const [reviews, aggregate, like, watch] = localId ? await Promise.all([
    prisma.diaryEntry.findMany({ where: { movieId: localId }, include: { user: { select: { id: true, name: true, image: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 10 }),
    prisma.diaryEntry.aggregate({ where: { movieId: localId }, _avg: { rating: true }, _count: { rating: true } }),
    userId ? prisma.likedBy.findUnique({ where: { movieId_userId: { movieId: localId, userId } } }) : null,
    userId ? prisma.watchedList.findUnique({ where: { movieId_userId: { movieId: localId, userId } } }) : null,
  ]) : [[], null, null, null];
  return { movie, localId, providerUnavailable, reviews, favorite: !!like, watchlist: !!watch, rating: { average: aggregate?._avg.rating ?? null, count: aggregate?._count.rating ?? 0 } };
}
