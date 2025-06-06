// components/movies/MovieCard.tsx
"use client";
import { Genre, Movie, MovieCategorizesAs } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { PiStarFill } from "react-icons/pi";

interface MovieWithGenres extends Movie {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
  _count?: {
    diaryEntries?: number;
  };
  diaryEntries?: {
    rating: number;
  }[];
}

interface MovieCardProps {
  movie: MovieWithGenres;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  // Calculate average rating for the movie
  const getMovieRating = (movie: MovieWithGenres): number | undefined => {
    if (movie.diaryEntries && movie.diaryEntries.length > 0) {
      const totalRating = movie.diaryEntries.reduce(
        (sum, entry) => sum + entry.rating,
        0
      );
      return totalRating / movie.diaryEntries.length;
    }
    return undefined;
  };

  const rating = getMovieRating(movie);

  return (
    <Link href={`/movies/${movie.id}`}>
      <div className="group aspect-[2/3] rounded-lg overflow-hidden relative cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        {/* Movie Poster */}
        <Image
          src={movie.posterUrl || "/placeholder-movie.jpg"}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://placehold.co/800x1200?text=No+Poster";
          }}
        />

        {/* Base overlay - always visible but subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Hover overlay - enhanced on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge - only visible on hover */}
        {rating !== undefined && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="badge badge-primary gap-1 shadow-lg">
              <PiStarFill className="h-3 w-3" />
              {rating.toFixed(1)}
            </div>
          </div>
        )}

        {/* Movie details - only visible on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {movie.title}
            </h3>

            <p className="text-xs text-white/80 font-medium">
              {movie.releasedYear}
            </p>

            {/* Genres */}
            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {movie.genres.slice(0, 2).map((movieGenre) => (
                  <span
                    key={movieGenre.genre.id}
                    className="text-xs bg-white/25 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20"
                  >
                    {movieGenre.genre.genreName}
                  </span>
                ))}
                {movie.genres.length > 2 && (
                  <span className="text-xs text-white/70 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full">
                    +{movie.genres.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subtle title overlay for non-hover state */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white group-hover:opacity-0 transition-opacity duration-300">
          <div className="text-center">
            <h3 className="text-xs font-medium leading-tight line-clamp-1 drop-shadow-lg">
              {movie.title}
            </h3>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
