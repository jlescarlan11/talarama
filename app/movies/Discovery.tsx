'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { catalogQueryString, genres, parseCatalogQuery, type CatalogQuery } from '@/app/lib/movies/catalog-query';
import { useCatalogSearch, type CatalogInitial } from '@/app/hooks/useCatalogSearch';
import CatalogCard from './CatalogCard';

export default function Discovery({ initial }: { initial: CatalogInitial }) {
  const params = useSearchParams();
  let query: CatalogQuery;
  try { query = parseCatalogQuery(new URLSearchParams(params.toString())); }
  catch { return <section role="alert" className="py-10 space-y-4"><h2>Invalid discovery filters</h2><Link className="btn" href="/movies">Reset filters</Link></section>; }
  return <DiscoveryResults query={query} initial={initial} />;
}
function DiscoveryResults({ query, initial }: { query: CatalogQuery; initial: CatalogInitial }) {
  const router = useRouter();
  const key = catalogQueryString(query);
  const [draft, setDraft] = useState(query.query);
  const [previousKey, setPreviousKey] = useState(key);
  if (previousKey !== key) { setPreviousKey(key); setDraft(query.query); }
  const { data, error, loading, retry } = useCatalogSearch(key, initial);
  useEffect(() => {
    if (draft === query.query) return;
    const timer = setTimeout(() => router.push(`/movies?${catalogQueryString({ ...query, query: draft.trim(), page: 1 })}`, { scroll: false }), 300);
    return () => clearTimeout(timer);
  }, [draft, query, router]);
  const navigate = (patch: Partial<CatalogQuery>) => router.push(`/movies?${catalogQueryString({ ...query, ...patch })}`, { scroll: false });
  return <div className="space-y-8">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Discovery mode">
      <button className={`btn ${query.mode === 'discover' ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={query.mode === 'discover'} onClick={() => navigate({ mode: 'discover', query: '', page: 1 })}>Popular movies</button>
      <button className={`btn ${query.mode === 'search' ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={query.mode === 'search'} onClick={() => navigate({ mode: 'search', genre: undefined, page: 1 })}>Search by title</button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end bg-base-200 border border-base-300 p-4 rounded-xl">
      {query.mode === 'search' ? <label className="grid gap-2 text-sm font-medium">Search movies<input type="search" maxLength={200} className="input w-full" value={draft} onChange={event => setDraft(event.target.value)} placeholder="A title you have in mind…" /></label> : <label className="grid gap-2 text-sm font-medium">Genre<select className="select w-full" value={query.genre ?? ''} onChange={event => navigate({ genre: event.target.value ? Number(event.target.value) : undefined, page: 1 })}><option value="">All genres</option>{genres.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}
      <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const year = String(form.get('year') || ''); navigate({ year: year ? Number(year) : undefined, page: 1 }); }} className="flex gap-2 items-end">
        <label className="grid gap-2 text-sm font-medium flex-1 min-w-0">Release year<input key={`${key}-year`} name="year" type="number" min="1800" max="9999" defaultValue={query.year ?? ''} placeholder="Any year" className="input w-full" /></label><button className="btn btn-outline" type="submit">Apply</button>
      </form>
      <p className="text-sm text-base-content/70">{query.mode === 'discover' ? 'Sorted by popularity. Filter by genre and release year.' : 'Search by title, with an optional release year.'}</p>
    </div>
    {query.mode === 'search' && !query.query ? <p role="status" className="py-12 text-center">Enter a movie title to start searching.</p> : <>
      {loading && <div role="status" aria-label="Loading movies" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton aspect-[2/3]" />)}<span className="sr-only">Loading movies…</span></div>}
      {error && <div role="alert" className="p-6 border border-base-300 rounded-xl space-y-4"><p>{error}</p><button className="btn btn-primary" onClick={retry}>Try again</button><p className="text-sm">Saved movies are still available in your diary and library.</p></div>}
      {data && <><p role="status" className="text-sm text-base-content/70">{data.results.length ? `Page ${data.page} of ${data.totalPages}` : 'No movies found. Try a different title or filter.'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">{data.results.map(movie => <CatalogCard key={movie.tmdbId} movie={movie} />)}</div>
        {data.totalPages > 0 && <nav aria-label="Movie pages" className="flex flex-wrap justify-center items-center gap-4"><button className="btn btn-outline" disabled={query.page <= 1} onClick={() => navigate({ page: query.page - 1 })}>Previous</button><span>Page {query.page} of {data.totalPages}</span><button className="btn btn-outline" disabled={query.page >= data.totalPages} onClick={() => navigate({ page: query.page + 1 })}>Next</button></nav>}</>}
    </>}
  </div>;
}
