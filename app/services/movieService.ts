// services/movieService.ts
import prisma from "@/prisma/client";
import { Movie, MovieCategorizesAs, Genre, Prisma } from "@prisma/client";

type MovieWithGenres = Movie & {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
  _count?: {
    diaryEntries?: number;
  };
};

type MovieFilters = {
  search?: string;
  genre?: string;
  sort?: string;
};

type MovieQueryOptions = {
  where?: Prisma.MovieWhereInput;
  orderBy?: Prisma.MovieOrderByWithRelationInput;
};

type SortOption =
  | "title-asc"
  | "title-desc"
  | "dateAdded-desc"
  | "dateAdded-asc"
  | "releasedYear-desc"
  | "releasedYear-asc";

export class MovieService {
  static async getGenres(): Promise<Genre[]> {
    return await prisma.genre.findMany({
      orderBy: { genreName: "asc" },
    });
  }

  static async buildWhereClause(
    filters: MovieFilters
  ): Promise<MovieQueryOptions["where"]> {
    const { search, genre } = await filters;
    const whereClause: MovieQueryOptions["where"] = {};

    if (genre && genre !== "all") {
      const genreIds = genre.split(",");
      whereClause.genres = {
        some: {
          genreId: {
            in: genreIds,
          },
        },
      };
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      whereClause.OR = [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          releasedYear: {
            equals: parseInt(searchTerm) || undefined,
          },
        },
        {
          genres: {
            some: {
              genre: {
                genreName: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            },
          },
        },
      ];
    }

    return whereClause;
  }

  static buildOrderByClause(sortOption?: string): MovieQueryOptions["orderBy"] {
    if (!sortOption) {
      return { title: "asc" };
    }

    switch (sortOption as SortOption) {
      case "title-asc":
        return { title: "asc" };
      case "title-desc":
        return { title: "desc" };
      case "dateAdded-desc":
        return { createdAt: "desc" };
      case "dateAdded-asc":
        return { createdAt: "asc" };
      case "releasedYear-desc":
        return { releasedYear: "desc" };
      case "releasedYear-asc":
        return { releasedYear: "asc" };
      default:
        return { title: "asc" };
    }
  }

  static async getMovies(filters: MovieFilters): Promise<MovieWithGenres[]> {
    try {
      const { sort } = await filters;
      const whereClause = await this.buildWhereClause(filters);
      const orderBy = this.buildOrderByClause(sort);

      const movies = await prisma.movie.findMany({
        where: whereClause,
        orderBy,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
          diaryEntries: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              diaryEntries: true,
            },
          },
        },
      });

      return movies.map((movie) => ({
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
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getMovieCount(filters: MovieFilters): Promise<number> {
    const whereClause = await this.buildWhereClause(filters);
    return await prisma.movie.count({ where: whereClause });
  }

  static async getFeaturedMovies(): Promise<MovieWithGenres[]> {
    try {
      const movies = await prisma.movie.findMany({
        take: 10,
        orderBy: [{ createdAt: "desc" }, { releasedYear: "desc" }],
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
      });

      return movies.map((movie) => ({
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
    } catch (error) {
      console.error('Error fetching featured movies:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}
