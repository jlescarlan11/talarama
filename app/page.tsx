import { getServerSession } from "next-auth";
import authOptions from "./auth/authOptions";
import { MovieService } from "./services/movieService";
import MovieCarousel from "./components/MovieCarousel";

export default async function Home() {
  // Fetch featured movies from the database
  const movies = await MovieService.getFeaturedMovies();
  // Get user session for personalized greeting
  const session = await getServerSession(authOptions);
  const username = session?.user?.username || "movie fan";

  return (
    <div className="max-h-screen bg-[#14082b] flex flex-col items-center justify-start pt-12">
      <h1 className="text-6xl md:text-7xl font-bold text-center text-white mb-4 drop-shadow-lg">
        Welcome back, {username}
      </h1>
      <p className="text-2xl text-center text-white/80 mb-8">
        Here's where you left off your movie roll...
      </p>
      <div className="w-full flex justify-center">
        <MovieCarousel movies={movies} />
      </div>
      <div className="flex justify-end w-full max-w-6xl mt-8">
        <a href="/diaries/new" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6c3cff] text-white text-lg font-semibold shadow-md hover:bg-[#7d4cff] transition">
          <span className="text-2xl font-bold">+</span> Add film to My Diary
        </a>
      </div>
    </div>
  );
}
