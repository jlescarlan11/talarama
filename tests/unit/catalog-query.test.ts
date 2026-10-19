import { expect, it } from 'vitest';
import { movieHref } from '@/app/lib/movies/links';
import { parseCatalogQuery, catalogQueryString } from '@/app/lib/movies/catalog-query';

it('preserves legacy identities and prefers distinct external routes for mapped cards', () => {
  expect(movieHref({ id: 'legacy / film', tmdbId: null })).toBe('/movies/legacy%20%2F%20film');
  expect(movieHref({ localId: 'local', tmdbId: 42 })).toBe('/movies/tmdb/42');
  expect(movieHref({ tmdbId: 42 })).toBe('/movies/tmdb/42');
});
it('defaults to popular discovery and round trips shareable search pagination', () => {
  expect(parseCatalogQuery(new URLSearchParams())).toEqual({ mode: 'discover', query: '', page: 1, sort: 'popular' });
  const query = parseCatalogQuery(new URLSearchParams('mode=search&query=Alien&year=1979&page=2'));
  expect(query).toEqual({ mode: 'search', query: 'Alien', year: 1979, page: 2, sort: 'popular' });
  expect(parseCatalogQuery(new URLSearchParams(catalogQueryString(query)))).toEqual(query);
});
it.each(['page=0','page=2x','page=501','year=NaN','genre=0','sort=title','mode=other','mode=search&query=x&genre=18','mode=discover&query=x'])('rejects unsupported or malformed query %s', value => {
  expect(() => parseCatalogQuery(new URLSearchParams(value))).toThrow();
});
