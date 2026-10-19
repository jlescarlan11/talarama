import { Suspense } from 'react';
import Discovery from './Discovery';
import { catalogQueryString, parseCatalogQuery } from '@/app/lib/movies/catalog-query';
import { catalog, catalogSource } from '@/app/lib/movies/provider';
import type { CatalogInitial } from '@/app/hooks/useCatalogSearch';
import Link from 'next/link';

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
     const data = mode === 'search' ? title ? await catalog.search({ query: title, page, year }) : { page, totalPages: 0, totalResults: 0, results: [] } : await catalog.discover({ page, year, genre });
     initial = { key, data, error: null };
   } catch { initial = { key, data: null, error: 'Movie provider is unavailable. Please try again.' }; }
 } catch { /* Client displays invalid URL controls without a provider call. */ }
 return <section className="container max-w-7xl mx-auto pb-12"><header className="mb-6"><nav aria-label="Breadcrumb" className="text-sm breadcrumbs mb-6"><ul><li><Link href="/" className="hover:underline">Home</Link></li><li>Movies</li></ul></nav><h1 className="text-3xl font-bold mb-2">Discover Movies</h1><p className="text-base-content/70 max-w-2xl">Explore our entire movie collection with advanced search and filtering options.</p></header><Suspense fallback={<p role="status">Loading discovery…</p>}><Discovery initial={initial} source={catalogSource} /></Suspense><footer className="footer footer-center p-4 mt-12 text-base-content border-t border-base-300"><p className="text-sm">Browse and discover your favorite movies</p></footer></section>;
}
