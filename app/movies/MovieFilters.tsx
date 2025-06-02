// components/movies/MovieFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Genre } from "../types/movie";
import { SORT_OPTIONS, DEFAULT_GENRE_OPTION } from "../contants/movieConstants";

interface MovieFiltersProps {
  genres: Genre[];
}

const MovieFiltersComponent = ({ genres }: MovieFiltersProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "";
  const currentGenre = searchParams.get("genre") || "all";

  const updateFilters = useCallback(
    (newFilters: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ sort: event.target.value });
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ genre: event.target.value });
  };

  const clearAllFilters = () => {
    router.push("/movies", { scroll: false });
  };

  const hasActiveFilters = currentSort !== "" || currentGenre !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center   p-4">
      <div className="flex flex-col sm:flex-row gap-4 flex-1">
        {/* Genre Filter */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="genre-filter"
            className="text-sm font-medium text-gray-700"
          >
            Genre
          </label>
          <select
            id="genre-filter"
            value={currentGenre}
            onChange={handleGenreChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value={DEFAULT_GENRE_OPTION.value}>
              {DEFAULT_GENRE_OPTION.label}
            </option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.genreName}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="sort-filter"
            className="text-sm font-medium text-gray-700"
          >
            Sort by
          </label>
          <select
            id="sort-filter"
            value={currentSort}
            onChange={handleSortChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default MovieFiltersComponent;
