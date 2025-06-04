// app/movies/page.tsx
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

const MoviePage = async ({ searchParams }: MoviesPageProps) => {
  const { sort, genre, search } = searchParams;
  const movies = await MovieService.getMovies({ sort, genre, search });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-white">Movies</h1>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={<MovieFiltersSkeleton />}>
            <MovieFiltersComponent />
          </Suspense>
          <Suspense fallback={<div className="w-full sm:w-64 h-10 bg-base-200 rounded-lg" />}>
            <MovieSearch />
          </Suspense>
        </div>

        <Suspense fallback={<MovieListSkeleton />}>
          <MovieGrid movies={movies} />
        </Suspense>
      </div>
    </div>
  );
};

export default MoviePage;
