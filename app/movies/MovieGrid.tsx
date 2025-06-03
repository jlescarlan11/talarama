// components/movies/MovieGrid.tsx
"use client";
import { Genre, Movie, MovieCategorizesAs } from "@prisma/client";
import MovieCard from "./MovieCard";
import EmptyMovieState from "./EmptyMovieState";

interface MovieWithGenres extends Movie {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
  _count?: {
    diaryEntries?: number;
  };
}

interface MovieGridProps {
  movies: MovieWithGenres[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: string;
}

const MovieGrid = ({
  movies,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateIcon,
}: MovieGridProps) => {
  // Return empty state if no movies
  if (movies.length === 0) {
    return (
      <EmptyMovieState
        title={emptyStateTitle}
        description={emptyStateDescription}
        icon={emptyStateIcon}
      />
    );
  }

  // Responsive grid classes
  const gridClasses = [
    "grid",
    "grid-cols-2", // 2 columns on mobile
    "sm:grid-cols-3", // 3 columns on small screens
    "md:grid-cols-4", // 4 columns on medium screens
    "lg:grid-cols-5", // 5 columns on large screens
    "xl:grid-cols-6", // 6 columns on extra large screens
    "gap-3", // Gap between items on mobile
    "sm:gap-4", // Larger gap on small screens and up
    "md:gap-5", // Even larger gap on medium screens and up
  ].join(" ");

  return (
    <div className={gridClasses}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
