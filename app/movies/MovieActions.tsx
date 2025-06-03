"use client";

import { Link } from "@/app/components";
import { useRouter, useSearchParams } from "next/navigation";
import { Genre } from "@prisma/client";

interface MovieActionsProps {
  genres?: Genre[]; // Make optional to prevent undefined access
}

const MovieActions = ({ genres = [] }: MovieActionsProps) => {
  // Default to empty array
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "title";
  const currentGenre = searchParams.get("genre") || "all";

  const updateUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all" || value === "Sort") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : "";

    router.push(`/movies${url}`);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value !== "Sort") {
      updateUrl("sort", value);
    }
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    updateUrl("genre", value);
  };

  return (
    <div className="mb-4 flex space-x-2">
      <select
        value={
          currentSort === "title"
            ? "title"
            : currentSort === "dateAdded"
            ? "dateAdded"
            : "Sort"
        }
        onChange={handleSortChange}
        className="select select-bordered"
      >
        <option value="Sort" disabled>
          Sort
        </option>
        <option value="title">Title A-Z</option>
        <option value="title-desc">Title Z-A</option>
        <option value="dateAdded">Date Added (Newest)</option>
        <option value="dateAdded-desc">Date Added (Oldest)</option>
        <option value="releasedYear">Release Year (Newest)</option>
        <option value="releasedYear-desc">Release Year (Oldest)</option>
      </select>

      <select
        value={currentGenre}
        onChange={handleGenreChange}
        className="select select-bordered"
      >
        <option value="all">All Genres</option>
        {genres.map((genre) => (
          <option value={genre.id.toString()} key={genre.id}>
            {genre.genreName}
          </option>
        ))}
      </select>

      <button className="btn btn-primary">
        <Link href="/movies/new">New Movie</Link>
      </button>
    </div>
  );
};

export default MovieActions;
