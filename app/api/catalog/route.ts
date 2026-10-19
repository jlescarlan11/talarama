import { tmdb } from '@/app/lib/tmdb/server';
import { parseCatalogQuery } from '@/app/lib/movies/catalog-query';
import { json, movieError } from '@/app/lib/movies/http';

export async function GET(request: Request) {
  let query;
  try { query = parseCatalogQuery(new URL(request.url).searchParams); }
  catch { return json({ error: 'Invalid discovery filters.' }, 400); }
  try {
    const { mode, query: title, page, year, genre } = query;
    if (mode === 'search' && !title) return json({ page, totalPages: 0, totalResults: 0, results: [] });
    return json(mode === 'search' ? await tmdb.search({ query: title, page, year }) : await tmdb.discover({ page, year, genre }));
  } catch (error) { return movieError(error); }
}
