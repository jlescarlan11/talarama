// app/movies/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { MovieService } from "../services/movieService";
import MovieFiltersComponent from "./MovieFilters";
import MovieGrid from "./MovieGrid";
import MovieSearch from "./MovieSearch";
import { MovieFiltersSkeleton, MovieListSkeleton } from "./MovieSkeleton";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function MoviePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const getFirstValue = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const sort = getFirstValue(searchParams.sort);
  const genre = getFirstValue(searchParams.genre);
  const search = getFirstValue(searchParams.search);
  
  const movies = await MovieService.getMovies({ sort, genre, search });

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
          Explore our entire movie collection with advanced search and filtering options.
        </p>
      </div>

      {/* Main Content */}
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

      <footer className="footer footer-center p-4 mt-12 text-base-content border-t border-base-300">
        <div>
          <p className="text-sm">Browse and discover your favorite movies</p>
        </div>
      </footer>
    </div>
  );
}
