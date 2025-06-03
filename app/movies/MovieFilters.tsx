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

  const hasActiveFilters =
    currentSort !== "" || currentGenre !== "all" || searchParams.get("search");

  return (
    <div className="flex">
      <div className="flex items-center space-x-2">
        {/* Genre Filter */}
        <div className="form-control w-full sm:w-auto">
          <select
            className="select "
            value={currentGenre}
            onChange={handleGenreChange}
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
        <div className="form-control w-full sm:w-auto">
          <select
            className="select"
            value={currentSort}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button onClick={clearAllFilters} className="btn btn-primary">
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieFiltersComponent;
