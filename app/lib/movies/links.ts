/** Local IDs and provider IDs occupy different URL namespaces. */
export function movieHref(movie: { id?: string; localId?: string | null; tmdbId?: number | null }): string {
  if (movie.tmdbId && Number.isSafeInteger(movie.tmdbId) && movie.tmdbId > 0) return `/movies/tmdb/${movie.tmdbId}`;
  const id = movie.localId ?? movie.id;
  if (!id) throw new Error('Movie identity is missing');
  return `/movies/${encodeURIComponent(id)}`;
}
