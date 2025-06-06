import prisma from "@/prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "../auth/authOptions";
import MovieGrid from "../movies/MovieGrid";

const Watchlist = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-8 bg-base-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-primary">
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

  const moviesWithGenres = watchlistMovies.map((movie) => ({
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
        emptyStateTitle="No movies in watchlist"
        emptyStateDescription="Start adding movies to your watchlist by clicking the plus icon on any movie page."
      />
    </div>
  );
};

export default Watchlist;
