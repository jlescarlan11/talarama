"use client";

// components/NetflixHero.tsx
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { PiStarFill } from "react-icons/pi";
import NetflixActions from "./NetflixActions";
import { MovieWithReviews } from "./types";

interface MovieCounts {
  diaryEntries: number;
  watchedBy: number;
  likedBy: number;
}

interface Props {
  movie: MovieWithReviews;
  counts: MovieCounts;
  session: Session | null;
  initialWatchlistStatus: boolean;
  initialLikeStatus: boolean;
}

const NetflixHero = ({
  movie,
  counts,
  initialWatchlistStatus,
  initialLikeStatus,
}: Props) => {
  useSession();
  const [isLiked, setIsLiked] = useState(initialLikeStatus);

  const director = [movie.directorFirstName, movie.directorLastName]
    .filter(Boolean)
    .join(" ");

  const averageRating =
    movie.reviews.length > 0
      ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) /
        movie.reviews.length
      : 0;

  return (
    <div className="bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Movie Poster - Left Side */}
          <div className="flex-shrink-0">
            <div className="w-80 h-[480px] relative rounded-lg overflow-hidden shadow-2xl bg-base-300">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-base-200">
                  <div className="text-center text-base-content/50">
                    <svg
                      className="w-16 h-16 mx-auto mb-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm">No poster available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Movie Details - Right Side */}
          <div className="flex-1 space-y-6">
            {/* Movie Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-base-content">
              {movie.title}
            </h1>

            {/* Rating and Meta Info */}
            <div className="flex items-center gap-4 mb-6 text-sm sm:text-base text-base-content/80">
              {averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-warning font-bold text-lg">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <PiStarFill
                        key={star}
                        className={`w-4 h-4 ${
                          star <= averageRating
                            ? "text-warning"
                            : "text-base-content/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <span className="text-base-content/50">{movie.releasedYear}</span>
              <span className="text-base-content/50">
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </span>
              {director && (
                <span className="text-base-content/50">Dir. {director}</span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-primary/80 text-primary-content rounded-full text-sm backdrop-blur-sm"
                >
                  {genre.genreName}
                </span>
              ))}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="text-base-content/90 text-lg leading-relaxed mb-8">
                {movie.description}
              </p>
            )}

            {/* Action Buttons */}
            <NetflixActions
              movieId={movie.id}
              counts={counts}
              movieTitle={movie.title}
              posterUrl={movie.posterUrl || null}
              isLiked={isLiked}
              onLikeChange={setIsLiked}
              initialWatchlistStatus={initialWatchlistStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetflixHero;
