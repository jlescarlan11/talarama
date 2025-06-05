// hooks/useDiaryForm.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { DiaryFormData, DiaryEntryWithMovie, Movie } from "../types/diary";
import { diaryFormSchema } from "@/app/validationSchemas";
import { diaryService } from "../diaryService";

interface UseDiaryFormProps {
  movies: Movie[];
  diary?: DiaryEntryWithMovie;
}

export const useDiaryForm = ({ movies, diary }: UseDiaryFormProps) => {
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DiaryFormData>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: {
      movieId: diary?.movieId ?? "",
      rating: diary?.rating ?? 0,
      review: diary?.review,
      watchedDate: diary?.watchedDate
        ? new Date(diary.watchedDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const { setValue, trigger, setError, watch } = form;
  const watchedFields = watch();

  // Set initial selected movie for edit mode
  useEffect(() => {
    if (diary && movies.length > 0) {
      const movie = movies.find((m) => m.id === diary.movieId);
      if (movie) {
        setSelectedMovie(movie);
      }
    }
  }, [diary, movies]);

  const handleMovieSelect = async (movie: Movie): Promise<void> => {
    setSelectedMovie(movie);
    setValue("movieId", movie.id);
    await trigger("movieId");
  };

  const handleRatingChange = async (rating: number): Promise<void> => {
    setValue("rating", rating);
    await trigger("rating");
  };

  const handleFormError = (
    error: unknown,
    setErrorFn: UseFormSetError<DiaryFormData>
  ): void => {
    const errorMessage = diaryService.getErrorMessage(error);
    setErrorFn("root", {
      type: "manual",
      message: errorMessage,
    });
  };

  const handleSubmit = async (data: DiaryFormData): Promise<void> => {
    try {
      setIsSubmitting(true);

      const payload = {
        movieId: data.movieId,
        rating: data.rating,
        notes: data.review?.trim() || undefined,
        date: data.watchedDate,
      };

      if (diary) {
        await diaryService.updateEntry(diary.id, payload);
      } else {
        await diaryService.createEntry(payload);
      }

      router.push("/diaries");
      router.refresh();
    } catch (error) {
      setIsSubmitting(false);
      handleFormError(error, setError);
    }
  };

  return {
    form,
    selectedMovie,
    isSubmitting,
    watchedFields,
    handleMovieSelect,
    handleRatingChange,
    handleSubmit,
  };
};
