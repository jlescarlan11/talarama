import React from "react";
import { getServerSession } from "next-auth";
import authOptions from "../auth/authOptions";
import prisma from "@/prisma/client";
import MovieGrid from "../movies/MovieGrid";
import { MovieWithGenres } from "../movies/types";

const Watchlist = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please sign in to view your watchlist
          </h2>
        </div>
      </div>
    );
  }

  const watchlistMovies = await prisma.movie.findMany({
    where: {
      watchedBy: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      genres: {
        include: {
          genre: true,
        },
      },
      _count: {
        select: {
          diaryEntries: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  const moviesWithGenres: MovieWithGenres[] = watchlistMovies.map((movie) => ({
    ...movie,
    genres: movie.genres.map(({ movieId, genreId, genre }) => ({
      movieId,
      genreId,
      genre,
    })),
    _count: {
      diaryEntries: movie._count?.diaryEntries || 0,
    },
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <MovieGrid
        movies={moviesWithGenres}
        emptyStateTitle="No movies in watchlist"
        emptyStateDescription="Start adding movies to your watchlist by clicking the plus icon on any movie page."
        emptyStateIcon={
          <svg
            className="w-12 h-12 text-base-content/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        }
      />
    </div>
  );
};

export default Watchlist; 