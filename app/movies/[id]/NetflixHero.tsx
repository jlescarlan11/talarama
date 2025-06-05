"use client";

// components/NetflixHero.tsx
import Image from "next/image";
import { MovieWithReviews, MovieCounts } from "./types";
import NetflixActions from "./NetflixActions";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Props {
  movie: MovieWithReviews;
  counts: MovieCounts;
}

const NetflixHero = ({ movie, counts }: Props) => {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!session) return;

      try {
        const response = await fetch(`/api/movies/${movie.id}/like`);
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [movie.id, session]);

  const director = [movie.directorFirstName, movie.directorLastName]
    .filter(Boolean)
    .join(" ");

  const averageRating =
    movie.reviews.length > 0
      ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) /
        movie.reviews.length
      : 0;

  return (
    <div className="">
      <div className="">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Movie Poster - Left Side */}
          <div className="flex-shrink-0">
            <div className="w-80 h-[480px] relative rounded-lg overflow-hidden shadow-2xl">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full  flex items-center justify-center">
                  <div className="text-center">
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {movie.title}
            </h1>

            {/* Rating and Meta Info */}
            <div className="flex items-center gap-4 mb-6 text-sm sm:text-base">
              {averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 font-bold text-lg">
                    {averageRating.toFixed(1)}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= averageRating
                            ? "text-yellow-400"
                            : "text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              )}
              <span className="text-neutral-content/50">
                {movie.releasedYear}
              </span>
              <span className="text-neutral-content/50">
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </span>
              {director && (
                <span className="text-neutral-content/50">Dir. {director}</span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm"
                >
                  {genre.genreName}
                </span>
              ))}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="text-white/90 text-lg leading-relaxed mb-8 ">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetflixHero;
