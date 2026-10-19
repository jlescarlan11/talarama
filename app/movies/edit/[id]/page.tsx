import Link from 'next/link';
export default function RetiredCatalogPage() {
 return <section className="max-w-[36rem] mx-auto py-12 space-y-4"><h1 className="text-3xl font-bold">Discover your next movie</h1><p>Movie metadata now comes from TMDB. Find a title and save it to your library.</p><Link className="btn btn-primary" href="/movies">Discover movies</Link></section>;
}
