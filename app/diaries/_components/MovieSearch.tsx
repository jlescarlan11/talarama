"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { Movie } from "../types/diary";
import Image from "next/image";

interface MovieSearchProps {
  movies: Movie[];
  selectedMovie?: Movie | null;
  onMovieSelect: (movie: Movie) => void;
  error?: string;
}

const MovieSearch: React.FC<MovieSearchProps> = ({
  movies,
  selectedMovie,
  onMovieSelect,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState(selectedMovie?.title || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (selectedMovie) {
      setSearchQuery(selectedMovie.title);
    }
  }, [selectedMovie]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMovies([]);
      return;
    }

    const filtered = movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMovies(filtered.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, movies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleMovieSelect = (movie: Movie) => {
    onMovieSelect(movie);
    setSearchQuery(movie.title);
    setIsDropdownOpen(false);
  };

  const clearSelection = () => {
    setSearchQuery("");
    setIsDropdownOpen(false);
    // You might want to call a clear function here
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a movie..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setIsDropdownOpen(true)}
          className={`input input-bordered w-full pr-16 ${
            error ? "input-error" : ""
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {searchQuery && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={16} />
            </button>
          )}
          <FiSearch className="text-gray-400" size={16} />
        </div>
      </div>

      {/* Error message */}
      {error && <div className="text-error text-sm mt-1">{error}</div>}

      {/* Dropdown */}
      {isDropdownOpen && filteredMovies.length > 0 && (
        <div className="absolute z-50 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto">
          {filteredMovies.map((movie) => (
            <div
              key={movie.id}
              className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
              onClick={() => handleMovieSelect(movie)}
            >
              <div className="flex items-start gap-3">
                {/* Poster thumbnail */}
                <div className="w-12 h-16 bg-base-300 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {movie.posterUrl ? (
                    <Image
                      width={300}
                      height={450}
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">No Image</span>
                  )}
                </div>

                {/* Movie details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {movie.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {movie.releasedYear} • {formatDuration(movie.duration)}
                  </p>
                  {movie.directorFirstName && movie.directorLastName && (
                    <p className="text-xs text-gray-400">
                      Dir. {movie.directorFirstName} {movie.directorLastName}
                    </p>
                  )}
                  {movie.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {movie.description.length > 100
                        ? `${movie.description.substring(0, 100)}...`
                        : movie.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isDropdownOpen && searchQuery && filteredMovies.length === 0 && (
        <div className="absolute z-50 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg mt-1">
          <div className="p-4 text-center text-gray-500">
            No movies found for &quot;{searchQuery}&quot;
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieSearch;
