// services/movieService.ts
import prisma from "@/prisma/client";
import {
  MovieFilters,
  MovieQueryOptions,
  SortOption,
  Genre,
  MovieWithGenres,
} from "../types/movie";

export class MovieService {
  static async getGenres(): Promise<Genre[]> {
    return await prisma.genre.findMany({
      orderBy: { genreName: "asc" },
    });
  }

  static buildWhereClause(filters: MovieFilters) {
    const whereClause: MovieQueryOptions["where"] = {};

    if (filters.genre && filters.genre !== "all") {
      whereClause.genres = {
        some: {
          genreId: filters.genre,
        },
      };
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
    const whereClause = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters.sort);

    return await prisma.movie.findMany({
      where: whereClause,
      orderBy,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });
  }
}
