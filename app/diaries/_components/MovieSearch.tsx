"use client";

import React, { useState, useRef, useEffect } from "react";
import { Movie } from "../types/diary";
import ErrorMessage from "@/app/components/ErrorMessage";

interface MovieSearchProps {
  movies: Movie[];
  selectedMovie: Movie | null;
  onMovieSelect: (movie: Movie) => void;
  error?: string;
  disabled?: boolean;
}

const MovieSearch: React.FC<MovieSearchProps> = ({
  movies,
  selectedMovie,
  onMovieSelect,
  error,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(selectedMovie?.title || "");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMovies([]);
      return;
    }

    const filtered = movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (movie.directorFirstName &&
          movie.directorLastName &&
          `${movie.directorFirstName} ${movie.directorLastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
    setFilteredMovies(filtered);
  }, [searchTerm, movies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);

    // Clear selection if input doesn't match selected movie
    if (selectedMovie && value !== selectedMovie.title) {
      // Don't clear immediately to allow for editing
    }
  };

  const handleMovieSelect = (movie: Movie) => {
    setSearchTerm(movie.title);
    setIsOpen(false);
    onMovieSelect(movie);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div className="form-control w-full" ref={dropdownRef}>
      <label className="label">
        <span className="label-text font-semibold">
          Movie {disabled && "(Cannot be changed when editing)"}
        </span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={
            disabled ? "Movie selection locked" : "Search for a movie..."
          }
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className={`input input-bordered w-full ${
            error ? "input-error" : ""
          } ${disabled ? "input-disabled" : ""}`}
        />

        {isOpen && !disabled && filteredMovies.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                onClick={() => handleMovieSelect(movie)}
              >
                <div className="font-medium">{movie.title}</div>
                <div className="text-sm text-base-content/60">
                  {movie.releasedYear}
                  {movie.directorFirstName && movie.directorLastName && (
                    <>
                      {" "}
                      • Dir. {movie.directorFirstName} {movie.directorLastName}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isOpen &&
          !disabled &&
          searchTerm.trim() !== "" &&
          filteredMovies.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 text-center text-base-content/60">
              No movies found matching &quot;{searchTerm}&quot;
            </div>
          )}
      </div>
      <ErrorMessage>{error}</ErrorMessage>
    </div>
  );
};

export default MovieSearch;
