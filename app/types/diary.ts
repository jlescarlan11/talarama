export interface DiaryCreatePayload {
  movieId: string;
  date: string;
  rating: number;
  notes?: string;
}

export interface DiaryEntry extends DiaryCreatePayload {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
} 