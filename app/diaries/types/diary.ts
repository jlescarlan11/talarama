// types/diary.ts
export interface Movie {
  id: string;
  title: string;
  description: string | null;
  releasedYear: number;
  duration: number;
  posterUrl: string | null;
  directorFirstName: string | null;
  directorLastName: string | null;
  createdAt: Date;
}

export interface DiaryFormData {
  movieId: string;
  rating: number;
  review: string;
  watchedDate: string;
}

export interface FormErrors {
  movieId?: string;
  rating?: string;
  review?: string;
  watchedDate?: string;
  general?: string;
  root?: {
    type: string;
    message: string;
  };
}

export interface DiaryEntryWithMovie {
  id: string;
  rating: number;
  review: string;
  watchedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  movieId: string;
  movie: Movie;
}
