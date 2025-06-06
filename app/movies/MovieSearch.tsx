// components/movies/MovieSearch.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PiMagnifyingGlass } from "react-icons/pi";

const MovieSearch = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

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

      router.push(`/movies?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    updateSearch(searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  // Real-time search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isSearching) {
        updateSearch(searchQuery);
        setIsSearching(false);
      }
    }, 500); // Increased debounce time to 500ms for better performance

    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateSearch, isSearching]);

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="">
        <label className="input  flex items-center gap-2">
          <PiMagnifyingGlass className="h-[1em] opacity-50" />
          <input
            type="search"
            className="grow w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search movies..."
            aria-label="Search movies"
          />
        </label>
      </form>
    </div>
  );
};

export default MovieSearch;
