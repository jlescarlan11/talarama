import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Movie, DiaryFormData } from "../types/diary";

export interface DiaryFormFieldsProps {
  movies: Movie[];
  selectedMovie: Movie | null;
  onMovieSelect: (movie: Movie) => void;
  register: UseFormRegister<DiaryFormData>;
  errors: FieldErrors<DiaryFormData>;
  watchedFields: DiaryFormData;
  onRatingChange: (rating: number) => void;
  isEditMode: boolean;
}
