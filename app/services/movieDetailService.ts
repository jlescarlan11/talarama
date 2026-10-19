import 'server-only';
import prisma from '@/prisma/client';
import { tmdb } from '@/app/lib/tmdb/server';
import { normalizeLocalMovie } from '@/app/lib/tmdb/normalize';
import { TmdbError } from '@/app/lib/tmdb/client';
import type { CatalogMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';
import { getWikidataMovieDetail } from './wikidataDetailService';

/** Read-only detail orchestration. Member data never enters provider/shared caches. */
export async function getMovieDetail(identity: { localId: string } | { tmdbId: number } | { wikidataId:string }, userId?: string) {
  if('wikidataId' in identity)return getWikidataMovieDetail(identity.wikidataId,userId);
  const local = await prisma.movie.findUnique({ where: 'localId' in identity ? { id: identity.localId } : { tmdbId: identity.tmdbId }, include: { externalIdentities:true, genres: { include: { genre: true } } } });
  const wiki=local?.externalIdentities?.find(row=>row.provider==='WIKIDATA');
  if('localId' in identity && wiki)return getWikidataMovieDetail(wiki.externalId,userId);
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
  const [like, watch] = localId && userId ? await Promise.all([
    prisma.likedBy.findUnique({ where: { movieId_userId: { movieId: localId, userId } } }),
    prisma.watchlistEntry.findUnique({ where: { movieId_userId: { movieId: localId, userId } } }),
  ]) : [null, null];
  return { movie, localId, providerUnavailable, favorite: !!like, watchlist: !!watch, rating: { average: null, count: 0 } };
}
