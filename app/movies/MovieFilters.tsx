// components/movies/MovieFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Genre } from "@prisma/client";
import { useEffect, useState } from "react";

const MovieFiltersComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch("/api/genres");
        if (response.ok) {
          const data = await response.json();
          setGenres(data);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreChange = (genreId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (genreId) {
      params.set("genre", genreId);
    } else {
      params.delete("genre");
    }
    router.push(`/movies?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort) {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }
    router.push(`/movies?${params.toString()}`);
  };

  if (isLoading) {
    return <div className="h-10 bg-base-200 rounded-lg animate-pulse" />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        className="select select-bordered w-full sm:w-auto"
        onChange={(e) => handleGenreChange(e.target.value)}
        value={searchParams.get("genre") || ""}
      >
        <option value="">All Genres</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.genreName}
          </option>
        ))}
      </select>

      <select
        className="select select-bordered w-full sm:w-auto"
        onChange={(e) => handleSortChange(e.target.value)}
        value={searchParams.get("sort") || ""}
      >
        <option value="">Sort By</option>
        <option value="title_asc">Title (A-Z)</option>
        <option value="title_desc">Title (Z-A)</option>
        <option value="year_desc">Newest First</option>
        <option value="year_asc">Oldest First</option>
      </select>
    </div>
  );
};

export default MovieFiltersComponent;
