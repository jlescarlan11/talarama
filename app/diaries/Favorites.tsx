import React from "react";
import { getServerSession } from "next-auth";
import authOptions from "../auth/authOptions";
import prisma from "@/prisma/client";
import MovieGrid from "../movies/MovieGrid";
import { Movie, MovieCategorizesAs, Genre } from "@prisma/client";

type MovieWithGenres = Movie & {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
  _count?: {
    diaryEntries?: number;
  };
};

const Favorites = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8 bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-base-content">
            Please sign in to view your favorites
          </h2>
        </div>
      </div>
    );
  }

  const likedMovies = await prisma.movie.findMany({
    where: {
      likedBy: {
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

  const moviesWithGenres: MovieWithGenres[] = likedMovies.map((movie) => ({
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
    <div className="px-2 py-4 bg-base-100">
      <MovieGrid
        movies={moviesWithGenres}
        emptyStateTitle="No favorites yet"
        emptyStateDescription="Start adding movies to your favorites by clicking the heart icon on any movie page."
      />
    </div>
  );
};

export default Favorites;
