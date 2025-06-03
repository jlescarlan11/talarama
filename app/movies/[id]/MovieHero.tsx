// components/MovieHero.tsx
import Image from "next/image";
import { MovieWithGenres } from "./types";

interface Props {
  movie: MovieWithGenres;
}

const MovieHero = ({ movie }: Props) => {
  const director = [movie.directorFirstName, movie.directorLastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative bg-gradient-to-b from-base-300 to-base-100">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Movie Poster */}
          <div className="flex-shrink-0">
            <div className="w-80 h-[480px] relative rounded-xl overflow-hidden shadow-2xl">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-base-300 flex items-center justify-center">
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

          {/* Movie Details */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-base-content mb-2">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-base-content/70">
                <span className="text-lg">{movie.releasedYear}</span>
                <span className="text-lg">•</span>
                <span className="text-lg">
                  {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </span>
                {director && (
                  <>
                    <span className="text-lg">•</span>
                    <span className="text-lg">Directed by {director}</span>
                  </>
                )}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span key={genre.id} className="badge badge-primary badge-lg">
                  {genre.genreName}
                </span>
              ))}
            </div>

            {/* Description */}
            {movie.description && (
              <div className="prose prose-lg max-w-none">
                <p className="text-base-content/80 leading-relaxed">
                  {movie.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;
