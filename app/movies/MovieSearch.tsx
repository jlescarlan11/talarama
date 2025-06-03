// components/movies/MovieSearch.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PiMagnifyingGlass, PiX } from "react-icons/pi";

const MovieSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Initialize search query from URL params
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchQuery(currentSearch);
  }, [searchParams]);

  const updateSearch = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.delete("search");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    updateSearch("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Real-time search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateSearch]);

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm ">
      <label className="input w-full flex items-center gap-2">
        <PiMagnifyingGlass className="text-lg" />
        <input
          type="search"
          className="grow w-full"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search movies by title, year, or genre..."
        />
      </label>

      {searchQuery && (
        <button
          type="button"
          onClick={handleClearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
        >
          <PiX className="h-4 w-4" />
        </button>
      )}
    </form>
  );
};

export default MovieSearch;
