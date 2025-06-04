// types.ts
export interface MovieWithGenres {
  id: string;
  title: string;
  description?: string | null;
  releasedYear: number;
  duration: number;
  posterUrl?: string | null;
  directorFirstName?: string | null;
  directorLastName?: string | null;
  createdAt: Date;
  genres: Genre[];
}

export interface Genre {
  id: string;
  genreName: string;
}

export interface MovieCounts {
  watchedBy: number;
  likedBy: number;
}

export interface Review {
  id: string;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface MovieWithReviews extends MovieWithGenres {
  reviews: Review[];
}
