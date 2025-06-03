// app/movies/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { MovieService } from "../services/movieService";
import MovieFiltersComponent from "./MovieFilters";
import MovieGrid from "./MovieGrid";
import MovieSearch from "./MovieSearch";
import { MovieFiltersSkeleton, MovieListSkeleton } from "./MovieSkeleton";

interface MoviesPageProps {
  searchParams: {
    sort?: string;
    genre?: string;
    search?: string;
  };
}

// ✅ Convert to async function to await searchParams usage
const MoviePage = async ({ searchParams }: MoviesPageProps) => {
  const { search } = await searchParams;
  // Await all data here
  const [genres, movieCount, movies] = await Promise.all([
    MovieService.getGenres(),
    MovieService.getMovieCount(searchParams),
    MovieService.getMovies(searchParams),
  ]);

  return (
    <div className="container max-w-7xl mx-auto pb-12">
      {/* Header with breadcrumb navigation */}
      <div className="mb-4">
        <div className="mb-6">
          <div className="text-sm breadcrumbs">
            <ul>
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>Movies</li>
            </ul>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Discover Movies</h1>
        <p className="text-base-content/70 max-w-2xl">
          Explore our entire movie collection with advanced search and filtering
          options.
        </p>
      </div>

      {/* Main Content */}
      <div>
        <div className="w-full mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex space-x-2">
              <Suspense
                fallback={
                  <div className="h-12 bg-base-200 rounded animate-pulse" />
                }
              >
                <MovieSearch />
              </Suspense>

              {/* Filters */}
              <Suspense fallback={<MovieFiltersSkeleton />}>
                <MovieFiltersComponent genres={genres} />
              </Suspense>
            </div>

            {/* Count display */}
            <div className="flex justify-between items-center">
              <p className="text-base-content/70">
                {movieCount === 0
                  ? "No movies found"
                  : `Showing ${movieCount} movie${movieCount !== 1 ? "s" : ""}`}
                {search && ` for "${search}"`}
              </p>
            </div>
          </div>
        </div>

        <div className="">
          <Suspense fallback={<MovieListSkeleton />}>
            <MovieGrid movies={movies} />
          </Suspense>
        </div>
      </div>

      <footer className="footer footer-center p-4 mt-12 text-base-content border-t border-base-300">
        <div>
          <p className="text-sm">Browse and discover your favorite movies</p>
        </div>
      </footer>
    </div>
  );
};

export default MoviePage;
