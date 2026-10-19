/** Local IDs and provider IDs occupy different URL namespaces. */
export function movieHref(movie: { id?: string; localId?: string | null; tmdbId?: number | null; wikidataId?: string | null }): string {
  if (movie.wikidataId && /^Q[1-9]\d{0,11}$/.test(movie.wikidataId)) return `/movies/wikidata/${movie.wikidataId}`;
  if (movie.tmdbId && Number.isSafeInteger(movie.tmdbId) && movie.tmdbId > 0) return `/movies/tmdb/${movie.tmdbId}`;
  const id = movie.localId ?? movie.id;
  if (!id) throw new Error('Movie identity is missing');
  return `/movies/${encodeURIComponent(id)}`;
}
