import 'server-only';
import { unstable_cache } from 'next/cache';
import { TmdbClient } from './client';

/** Cache normalized, validated public metadata. Never cache raw HTTP 200 bodies or member state.
 * Keep this wrapper in Next server paths; operational CLIs use TmdbClient's bounded process cache.
 * unstable_cache remains supported without enabling Cache Components across this existing app.
 */
export function createCachedProvider(client: TmdbClient) {
  return {
    search: unstable_cache((input: Parameters<TmdbClient['search']>[0]) => client.search(input), ['tmdb-normalized-v1', 'search'], { revalidate: 300 }),
    discover: unstable_cache((input: Parameters<TmdbClient['discover']>[0] = {}) => client.discover(input), ['tmdb-normalized-v1', 'discover'], { revalidate: 3600 }),
    details: unstable_cache((id: number) => client.details(id), ['tmdb-normalized-v1', 'details'], { revalidate: 86400 }),
  };
}
export const tmdb = createCachedProvider(new TmdbClient());
