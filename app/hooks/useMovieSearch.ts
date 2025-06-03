// hooks/useMovieSearch.ts
import { useState, useEffect, useMemo } from "react";

interface Movie {
  id: string;
  title: string;
  description?: string;
  releasedYear: number;
  duration: number;
  posterUrl?: string;
  directorFirstName?: string;
  directorLastName?: string;
}

export const useMovieSearch = (movies: Movie[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredMovies = useMemo(() => {
    if (!searchTerm.trim()) return [];

    return movies
      .filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${movie.directorFirstName} ${movie.directorLastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          movie.releasedYear.toString().includes(searchTerm)
      )
      .slice(0, 10); // Limit to 10 suggestions
  }, [movies, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    setShowSuggestions(true);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowSuggestions(false);
  };

  return {
    searchTerm,
    filteredMovies,
    isSearching,
    showSuggestions,
    handleSearch,
    clearSearch,
    setShowSuggestions,
  };
};
