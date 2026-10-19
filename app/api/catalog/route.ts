import { catalog } from '@/app/lib/movies/provider';
import { parseCatalogQuery } from '@/app/lib/movies/catalog-query';
import { json, movieError } from '@/app/lib/movies/http';

export async function GET(request: Request) {
  let query;
  try { query = parseCatalogQuery(new URL(request.url).searchParams); }
  catch { return json({ error: 'Invalid discovery filters.' }, 400); }
  try {
    const { mode, query: title, page, year, genre } = query;
    if (mode === 'search' && !title) return json({ page, totalPages: 0, totalResults: 0, results: [] });
    return json(mode === 'search' ? await catalog.search({ query: title, page, year }) : await catalog.discover({ page, year, genre }));
  } catch (error) { return movieError(error); }
}
