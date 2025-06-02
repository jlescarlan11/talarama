// app/movies/page.tsx
import { Suspense } from "react";
import { MovieService } from "../services/movieService";
import { MovieFilters } from "../types/movie";
import MovieFiltersComponent from "../movies/MovieFilters";
import MovieGrid from "./MovieGrid";
import {
  MovieListSkeleton,
  MovieFiltersSkeleton,
} from "../movies/MovieSkeleton";

interface MoviesPageProps {
  searchParams: {
    sort?: string;
    genre?: string;
  };
}

// Server Component for Movie Content
const MovieContent = async ({
  searchParams,
}: {
  searchParams: MovieFilters;
}) => {
  const movies = await MovieService.getMovies(searchParams);
  return <MovieGrid movies={movies} />;
};

// Server Component for Movie Filters
const MovieFiltersContainer = async () => {
  const genres = await MovieService.getGenres();
  return <MovieFiltersComponent genres={genres} />;
};

const MoviesPage = async ({ searchParams }: MoviesPageProps) => {
  return (
    <div className="">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Movies</h1>
        <p className="">Discover and explore our collection of movies</p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <Suspense fallback={<MovieFiltersSkeleton />}>
          <MovieFiltersContainer />
        </Suspense>
      </div>

      {/* Movies Grid Section */}
      <Suspense fallback={<MovieListSkeleton />}>
        <MovieContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default MoviesPage;
