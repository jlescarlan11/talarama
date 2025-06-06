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

  const handleGenreClick = (genreId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentGenres = params.get("genre")?.split(",") || [];
    
    if (currentGenres.includes(genreId)) {
      // Remove genre if already selected
      const newGenres = currentGenres.filter(id => id !== genreId);
      if (newGenres.length > 0) {
        params.set("genre", newGenres.join(","));
      } else {
        params.delete("genre");
      }
    } else {
      // Add genre if not selected
      params.set("genre", [...currentGenres, genreId].join(","));
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

  const selectedGenres = searchParams.get("genre")?.split(",") || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Genre Filters */}
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleGenreClick(genre.id)}
            className={`badge badge-lg ${
              selectedGenres.includes(genre.id)
                ? "badge-primary"
                : "badge-outline hover:badge-primary"
            }`}
          >
            {genre.genreName}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <select
        className="select select-bordered w-full sm:w-auto"
        onChange={(e) => handleSortChange(e.target.value)}
        value={searchParams.get("sort") || "title-asc"}
      >
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
        <option value="releasedYear-desc">Newest First</option>
        <option value="releasedYear-asc">Oldest First</option>
        <option value="dateAdded-desc">Recently Added</option>
        <option value="dateAdded-asc">Oldest Added</option>
      </select>
    </div>
  );
};

export default MovieFiltersComponent;
