import Link from 'next/link';
export default function MovieNotFound() {
  return <section className="max-w-[36rem] mx-auto py-16 space-y-5"><h1 className="text-3xl font-bold">Movie not found</h1><p>This movie ID is invalid or the title is no longer available. Try finding another film.</p><Link className="btn btn-primary" href="/movies">Discover movies</Link></section>;
}
