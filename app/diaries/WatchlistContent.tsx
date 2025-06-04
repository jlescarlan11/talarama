"use client";

import { useEffect, useState } from "react";
import { Movie } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

const WatchlistContent = () => {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch("/api/watchlist");
        if (!response.ok) throw new Error("Failed to fetch watchlist");
        const data = await response.json();
        setWatchlist(data);
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, []);

  if (loading) {
    return <div>Loading watchlist...</div>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-bold mb-4">Your Watchlist is Empty</h3>
        <p className="text-gray-600">
          Add movies to your watchlist to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {watchlist.map((movie) => (
        <Link
          key={movie.id}
          href={`/movies/${movie.id}`}
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
        >
          <figure className="relative h-48">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No poster available</span>
              </div>
            )}
          </figure>
          <div className="card-body">
            <h2 className="card-title">{movie.title}</h2>
            <p className="text-sm text-gray-600">
              {movie.releasedYear} • {movie.duration} min
            </p>
            {movie.directorFirstName && movie.directorLastName && (
              <p className="text-sm text-gray-600">
                Director: {movie.directorFirstName} {movie.directorLastName}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default WatchlistContent; 