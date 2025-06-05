// components/MovieInfo.tsx
import { MovieWithGenres } from "./types";

interface Props {
  movie: MovieWithGenres;
}

const MovieInfo = ({ movie }: Props) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const infoItems = [
    {
      label: "Release Year",
      value: movie.releasedYear.toString(),
      icon: "📅",
    },
    {
      label: "Runtime",
      value: `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`,
      icon: "⏱️",
    },
    {
      label: "Director",
      value:
        [movie.directorFirstName, movie.directorLastName]
          .filter(Boolean)
          .join(" ") || "Unknown",
      icon: "🎬",
    },
    {
      label: "Added to Database",
      value: formatDate(movie.createdAt),
      icon: "📝",
    },
  ];

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6 text-base-content">Movie Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-center space-x-4">
              <div className="text-2xl text-base-content">{item.icon}</div>
              <div>
                <div className="text-sm text-base-content/60 font-medium uppercase tracking-wide">
                  {item.label}
                </div>
                <div className="text-lg font-semibold text-base-content">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {movie.genres.length > 0 && (
          <div className="mt-6">
            <div className="text-sm text-base-content/60 font-medium uppercase tracking-wide mb-3">
              Genres
            </div>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <div key={genre.id} className="badge badge-outline badge-lg">
                  {genre.genreName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieInfo;
