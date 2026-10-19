export interface DiaryCreatePayload {
  movieId: string;
  watchedDate: string;
  rating: number;
  review?: string;
}

export interface DiaryEntry extends DiaryCreatePayload {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
} 