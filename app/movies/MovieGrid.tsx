import { Link } from "@/app/components";
import Image from "next/image";
import { Movie, MovieCategorizesAs, Genre } from "@prisma/client";

interface MovieWithGenres extends Movie {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
}

interface MovieGridProps {
  movies: MovieWithGenres[];
}

const MovieGrid = ({ movies }: MovieGridProps) => {
  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 italic text-lg">
          No movies found. Try adjusting your filters or add a new movie!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <Link href={`/movies/${movie.id}`} key={movie.id}>
          <figure className="group cursor-pointer transition-transform hover:scale-105">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-lg">
              <Image
                src={movie.posterUrl || "/placeholder-movie.jpg"}
                alt={movie.title}
                fill
                className="object-cover transition-opacity group-hover:opacity-90"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="font-semibold text-sm truncate">
                  {movie.title}
                </h3>
                <p className="text-xs text-gray-300">{movie.releasedYear}</p>
                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {movie.genres.slice(0, 2).map((MovieCategorizesAs) => (
                      <span
                        key={MovieCategorizesAs.genre.id}
                        className="text-xs bg-white/20 px-2 py-1 rounded-full"
                      >
                        {MovieCategorizesAs.genre.genreName}
                      </span>
                    ))}
                    {movie.genres.length > 2 && (
                      <span className="text-xs text-gray-300">
                        +{movie.genres.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </figure>
        </Link>
      ))}
    </div>
  );
};

export default MovieGrid;
