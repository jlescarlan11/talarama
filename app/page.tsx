import Link from 'next/link';
import { MovieService } from './services/movieService';
import MovieCarousel from './components/MovieCarousel';
import CatalogCard from './movies/CatalogCard';
import { tmdb } from './lib/tmdb/server';

export default async function Home() {
 const popular = await tmdb.discover().catch(() => null);
 const local = popular ? [] : await MovieService.getFeaturedMovies();
 return <div className="max-w-7xl mx-auto space-y-12 pb-12"><section className="py-12 md:py-20 max-w-3xl space-y-6"><p className="text-primary font-semibold uppercase tracking-widest text-sm">A home for your love of film</p><h1 className="text-5xl md:text-7xl font-bold leading-tight">Find a film.<br />Keep the feeling.</h1><p className="text-lg text-base-content/70 max-w-xl">Discover your next favorite, save the films on your mind, and keep a diary of every watch.</p><div className="flex flex-wrap gap-3"><Link href="/movies" className="btn btn-primary">Discover movies</Link><Link href="/diaries" className="btn btn-outline">My diary</Link></div></section><section className="space-y-6"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-bold">{popular ? 'Popular right now' : 'From your local catalog'}</h2><Link href="/movies" className="link">Explore movies</Link></div>{popular ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">{popular.results.slice(0,6).map(movie => <CatalogCard key={movie.tmdbId} movie={movie} />)}</div> : <><p className="text-base-content/70">Live discovery is temporarily unavailable. Your saved local movies remain accessible.</p><MovieCarousel movies={local} /></>}</section></div>;
}
