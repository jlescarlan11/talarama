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
  diaryEntries?: {
    rating: number;
  }[];
  _count?: {
    diaryEntries?: number;
  };
}

export interface MovieFilters {
  genre?: string;
  sort?: string;
  search?: string;
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
    OR?: Array<{
      title?: {
        contains: string;
        mode: "insensitive";
      };
      description?: {
        contains: string;
        mode: "insensitive";
      };
      releasedYear?: {
        equals: number | undefined;
      };
      genres?: {
        some: {
          genre: {
            genreName: {
              contains: string;
              mode: "insensitive";
            };
          };
        };
      };
    }>;
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
    _count?: {
      select: {
        DiaryEntry: true;
      };
    };
  };
}
