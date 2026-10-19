import { z } from 'zod';
import { tmdbImage } from './images';
import type { CatalogMovie, LocalCatalogMovie } from './types';
import type { Movie } from '@prisma/client';

export const tmdbIdSchema = z.number().int().positive().max(2147483647);
const name = z.string().trim().min(1).max(1000);
const person = z.object({ id: tmdbIdSchema, name });
export const movieSchema = z.object({
  id: tmdbIdSchema, title: name, adult: z.boolean(),
  overview: z.string().max(100000).nullable().optional(),
  release_date: z.string().max(10).optional(),
  poster_path: z.string().max(1000).nullable().optional(),
  backdrop_path: z.string().max(1000).nullable().optional(),
  vote_average: z.number().min(0).max(10), vote_count: z.number().int().nonnegative(),
});
export const detailSchema = movieSchema.extend({
  runtime: z.number().int().nonnegative().max(100000).nullable(),
  genres: z.array(z.object({ id: tmdbIdSchema, name })).max(100),
  credits: z.object({ cast: z.array(person.extend({ character: z.string().max(5000) })).max(10000), crew: z.array(person.extend({ job: z.string().max(1000) })).max(10000) }),
});
export const pageSchema = z.object({
  page: z.number().int().min(1).max(500), total_pages: z.number().int().nonnegative(), total_results: z.number().int().nonnegative(),
  results: z.array(movieSchema).max(20),
});
export function normalizeMovie(raw: z.infer<typeof movieSchema>): CatalogMovie {
  const date = raw.release_date;
  const year = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) ? Number(date.slice(0, 4)) : null;
  return {
    localId: null, tmdbId: raw.id, title: raw.title, description: raw.overview || null,
    releasedYear: year || null, duration: null,
    posterUrl: tmdbImage(raw.poster_path), backdropUrl: tmdbImage(raw.backdrop_path, 'backdrop'),
    tmdbScore: raw.vote_count ? raw.vote_average : null, tmdbVoteCount: raw.vote_count,
    genres: [], cast: [], directors: [],
  };
}
export function normalizeDetail(raw: z.infer<typeof detailSchema>): CatalogMovie {
  return { ...normalizeMovie(raw), duration: raw.runtime || null,
    genres: raw.genres.map(x => ({ tmdbId: x.id, name: x.name })),
    cast: raw.credits.cast.slice(0, 20).map(x => ({ tmdbId: x.id, name: x.name, character: x.character })),
    directors: raw.credits.crew.filter(x => x.job === 'Director').slice(0, 10).map(x => ({ tmdbId: x.id, name: x.name })),
  };
}
/** Local snapshots retain their identity and old artwork; never invent a provider ID or member rating. */
export function normalizeLocalMovie(movie: Pick<Movie, 'id' | 'tmdbId' | 'title' | 'description' | 'releasedYear' | 'duration' | 'posterUrl' | 'backdropUrl' | 'credits' | 'tmdbScore'>): LocalCatalogMovie {
  const credits = z.object({ cast: z.array(z.object({ tmdbId: tmdbIdSchema, name, character: z.string() })), directors: z.array(z.object({ tmdbId: tmdbIdSchema, name })) }).safeParse(movie.credits);
  return { localId: movie.id, tmdbId: movie.tmdbId, title: movie.title, description: movie.description,
    releasedYear: movie.releasedYear, duration: movie.duration, posterUrl: movie.posterUrl, backdropUrl: movie.backdropUrl,
    tmdbScore: movie.tmdbScore, tmdbVoteCount: null, genres: [], cast: credits.success ? credits.data.cast : [], directors: credits.success ? credits.data.directors : [],
  };
}
