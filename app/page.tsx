import { MovieService } from "./services/movieService";
import MovieCarousel from "./components/MovieCarousel";
import { getServerSession } from "next-auth";
import authOptions from "./auth/authOptions";

export default async function Home() {
  // Fetch featured movies from the database
  const movies = await MovieService.getFeaturedMovies();
  const session = await getServerSession(authOptions);

  return (
    <div className="max-h-screen flex flex-col items-center justify-start pt-12">
      <h1 className="text-5xl md:text-7xl font-bold text-center text-white mb-4 drop-shadow-lg">
        {session
          ? `Welcome back, ${session.user.username}`
          : "Welcome to Movie Diary"}
      </h1>
      <p className="text-2xl text-center text-white/80 mb-8">
        Here&apos;s where you left off your movie roll...
      </p>
      <div className="w-full flex justify-center">
        <MovieCarousel movies={movies} />
      </div>
    </div>
  );
}
