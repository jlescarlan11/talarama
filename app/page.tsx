import Link from 'next/link';
import { MovieService } from './services/movieService';
import MovieCarousel from './components/MovieCarousel';
import { tmdb } from './lib/tmdb/server';
import { getServerSession } from 'next-auth';
import authOptions from './auth/authOptions';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const popular = await tmdb.discover().catch(() => null);
  const movies = popular ? popular.results : await MovieService.getFeaturedMovies();
  return (
    <div className="flex flex-col items-center justify-start bg-base-100 pb-12">
      <h1 className="text-5xl md:text-7xl font-bold text-center text-base-content mb-4 drop-shadow-lg break-words max-w-full">
        {session ? `Welcome back, ${session.user.username || session.user.name || 'movie lover'}` : 'Welcome to Movie Diary'}
      </h1>
      <p className="text-2xl text-center text-base-content/80 mb-8">Here&apos;s where you left off your movie roll....</p>
      {!popular && <p role="status" className="text-center text-base-content/70 mb-4">Live discovery is temporarily unavailable. Your saved local movies remain accessible.</p>}
      <div className="w-full flex justify-center"><MovieCarousel movies={movies} /></div>
      <div className="flex flex-wrap justify-center gap-3 mt-8"><Link href="/movies" className="btn btn-primary">Discover movies</Link><Link href="/diaries" className="btn btn-outline">My diary</Link></div>
    </div>
  );
}
