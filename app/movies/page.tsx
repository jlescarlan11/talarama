import { Suspense } from 'react';
import Discovery from './Discovery';
import { catalogQueryString, parseCatalogQuery } from '@/app/lib/movies/catalog-query';
import { tmdb } from '@/app/lib/tmdb/server';
import type { CatalogInitial } from '@/app/hooks/useCatalogSearch';

export default async function MoviePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const raw = await searchParams;
 const params = new URLSearchParams();
 for (const [key, value] of Object.entries(raw)) if (typeof value === 'string') params.set(key, value);
 let initial: CatalogInitial = null;
 try {
   const query = parseCatalogQuery(params);
   const key = catalogQueryString(query);
   try {
     const { mode, query: title, page, year, genre } = query;
     const data = mode === 'search' ? title ? await tmdb.search({ query: title, page, year }) : { page, totalPages: 0, totalResults: 0, results: [] } : await tmdb.discover({ page, year, genre });
     initial = { key, data, error: null };
   } catch { initial = { key, data: null, error: 'Movie provider is unavailable. Please try again.' }; }
 } catch { /* Client displays invalid URL controls without a provider call. */ }
 return <section className="max-w-7xl mx-auto pb-12"><header className="py-8 md:py-12 space-y-3"><p className="text-primary text-sm font-semibold uppercase tracking-widest">Your next great watch</p><h1 className="text-4xl md:text-5xl font-bold">Discover movies</h1><p className="max-w-xl text-base-content/70">Explore popular films or find a title you love. Save your picks and make them part of your story.</p></header><Suspense fallback={<p role="status">Loading discovery…</p>}><Discovery initial={initial} /></Suspense></section>;
}
