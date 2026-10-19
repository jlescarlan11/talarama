import { z } from 'zod';

export const genres = [
  [28, 'Action'], [12, 'Adventure'], [16, 'Animation'], [35, 'Comedy'], [80, 'Crime'],
  [99, 'Documentary'], [18, 'Drama'], [10751, 'Family'], [14, 'Fantasy'], [36, 'History'],
  [27, 'Horror'], [10402, 'Music'], [9648, 'Mystery'], [10749, 'Romance'], [878, 'Science Fiction'],
  [10770, 'TV Movie'], [53, 'Thriller'], [10752, 'War'], [37, 'Western'],
] as const;
export interface CatalogQuery { mode: 'discover' | 'search'; query: string; year?: number; genre?: number; page: number; sort: 'popular' }
function integer(value: string | null, min: number, max: number): number | undefined {
  if (value === null || value === '') return undefined;
  if (!/^\d+$/.test(value)) throw new Error('Invalid number');
  return z.number().int().min(min).max(max).parse(Number(value));
}
export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const mode = z.enum(['discover', 'search']).parse(params.get('mode') ?? 'discover');
  const sort = z.literal('popular').parse(params.get('sort') ?? 'popular');
  const query = z.string().trim().max(200).parse(params.get('query') ?? '');
  const page = integer(params.get('page'), 1, 500) ?? 1;
  const year = integer(params.get('year'), 1800, 9999);
  const genre = integer(params.get('genre'), 1, 2147483647);
  if ((mode === 'search' && genre !== undefined) || (mode === 'discover' && query)) throw new Error('Unsupported filter combination');
  if (genre !== undefined && !genres.some(([id]) => id === genre)) throw new Error('Unknown genre');
  return { mode, query, page, sort, ...(year !== undefined ? { year } : {}), ...(genre !== undefined ? { genre } : {}) };
}
export function catalogQueryString(value: CatalogQuery): string {
  const params = new URLSearchParams({ mode: value.mode, sort: value.sort, page: String(value.page) });
  if (value.mode === 'search' && value.query) params.set('query', value.query);
  if (value.year !== undefined) params.set('year', String(value.year));
  if (value.mode === 'discover' && value.genre !== undefined) params.set('genre', String(value.genre));
  return params.toString();
}
