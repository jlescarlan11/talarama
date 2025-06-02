// types/movie.ts
export interface Genre {
  id: string;
  genreName: string;
}

export interface MovieWithGenres {
  id: string;
  title: string;
  description: string | null;
  releasedYear: number;
  duration: number;
  posterUrl: string | null;
  directorFirstName: string | null;
  directorLastName: string | null;
  createdAt: Date;
  genres: {
    movieId: string;
    genreId: string;
    genre: Genre;
  }[];
}

export interface MovieFilters {
  genre?: string;
  sort?: string;
}

export type SortOption =
  | "title-asc"
  | "title-desc"
  | "dateAdded-desc"
  | "dateAdded-asc"
  | "releasedYear-desc"
  | "releasedYear-asc";

export interface MovieQueryOptions {
  where: {
    genres?: {
      some: {
        genreId: string;
      };
    };
  };
  orderBy:
    | { title: "asc" | "desc" }
    | { createdAt: "asc" | "desc" }
    | { releasedYear: "asc" | "desc" };
  include: {
    genres: {
      include: {
        genre: true;
      };
    };
  };
}
