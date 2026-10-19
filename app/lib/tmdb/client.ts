import 'server-only';
import { z } from 'zod';
import { MetadataCache } from './cache';
import { detailSchema, normalizeDetail, normalizeMovie, pageSchema, tmdbIdSchema } from './normalize';
import type { CatalogMovie, CatalogPage } from './types';

type ErrorCode = 'INVALID_INPUT' | 'NOT_CONFIGURED' | 'AUTH' | 'NOT_FOUND' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'CONTENT_BLOCKED';
export class TmdbError extends Error {
  constructor(public readonly code: ErrorCode) { super(code === 'UNAVAILABLE' ? 'TMDB request unavailable' : `TMDB ${code.toLowerCase().replaceAll('_', ' ')}`); }
}
const pageInput = z.number().int().min(1).max(500).default(1);
const yearInput = z.number().int().min(1800).max(9999).optional();
function input<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new TmdbError('INVALID_INPUT');
  return parsed.data;
}

export class TmdbClient {
  private readonly cache = new MetadataCache();
  private readonly fetcher: typeof fetch;
  private readonly token: string;
  constructor(options: { token?: string; fetcher?: typeof fetch } = {}) {
    this.token = options.token ?? process.env.TMDB_READ_TOKEN ?? '';
    this.fetcher = options.fetcher ?? fetch;
  }
  async search(params: { query: string; year?: number; page?: number }): Promise<CatalogPage<CatalogMovie>> {
    const query = input(z.string().trim().min(1).max(200), params.query);
    const year = input(yearInput, params.year);
    return this.list('search/movie', { query, ...(year ? { year: String(year) } : {}), page: String(input(pageInput, params.page)), include_adult: 'false' }, 300);
  }
  async discover(params: { genre?: number; year?: number; page?: number } = {}): Promise<CatalogPage<CatalogMovie>> {
    const year = input(yearInput, params.year);
    const genre = input(tmdbIdSchema.optional(), params.genre);
    return this.list('discover/movie', { page: String(input(pageInput, params.page)), include_adult: 'false', sort_by: 'popularity.desc', ...(year ? { primary_release_year: String(year) } : {}), ...(genre ? { with_genres: String(genre) } : {}) }, 3600);
  }
  private list(endpoint: 'search/movie' | 'discover/movie', params: Record<string, string>, ttl: number): Promise<CatalogPage<CatalogMovie>> {
    return this.request(endpoint, params, ttl, value => {
      const result = pageSchema.parse(value);
      if (result.page !== Number(params.page)) throw new TmdbError('INVALID_RESPONSE');
      return { page: result.page, totalPages: Math.min(result.total_pages, 500), totalResults: result.total_results, results: result.results.filter(x => !x.adult).map(normalizeMovie) };
    });
  }
  async details(id: number): Promise<CatalogMovie> {
    const tmdbId = input(tmdbIdSchema, id);
    return this.request(`movie/${tmdbId}`, { append_to_response: 'credits' }, 86400, value => {
      const result = detailSchema.parse(value);
      if (result.id !== tmdbId) throw new TmdbError('INVALID_RESPONSE');
      if (result.adult) throw new TmdbError('CONTENT_BLOCKED');
      return normalizeDetail(result);
    });
  }
  private request<T>(endpoint: string, params: Record<string, string>, ttl: number, validate: (value: unknown) => T): Promise<T> {
    if (!this.token.trim()) return Promise.reject(new TmdbError('NOT_CONFIGURED'));
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    url.search = new URLSearchParams({ language: 'en-US', ...params }).toString();
    return this.cache.get(url.toString(), ttl * 1000, async () => {
      const abort = new AbortController();
      let timer: ReturnType<typeof setTimeout>;
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => { abort.abort(); reject(new TmdbError('TIMEOUT')); }, 5000);
      });
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        const response = await Promise.race([this.fetcher(url, { headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' }, redirect: 'error', signal: abort.signal, cache: 'no-store' }), deadline]);
        if (!response.ok) {
          await response.body?.cancel();
          throw new TmdbError(response.status === 404 ? 'NOT_FOUND' : response.status === 429 ? 'RATE_LIMITED' : [401, 403].includes(response.status) ? 'AUTH' : 'UNAVAILABLE');
        }
        if (!response.body) throw new TmdbError('INVALID_RESPONSE');
        reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        while (true) {
          const { done, value } = await Promise.race([reader.read(), deadline]);
          if (done) break;
          length += value.byteLength;
          if (length > 2_000_000) { await reader.cancel(); throw new TmdbError('INVALID_RESPONSE'); }
          chunks.push(value);
        }
        try { return validate(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (error) { if (error instanceof TmdbError) throw error; throw new TmdbError('INVALID_RESPONSE'); }
      } catch (error) {
        if (abort.signal.aborted) throw new TmdbError('TIMEOUT');
        if (error instanceof TmdbError) throw error;
        throw new TmdbError('UNAVAILABLE');
      } finally { clearTimeout(timer!); if (reader) void reader.cancel().catch(() => {}); }
    });
  }
}
