"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import MovieSearch from "./MovieSearch";
import StarRating from "../new/StarRating";
import ErrorMessage from "@/app/components/ErrorMessage";
import { Movie } from "../types/diary";

interface DiaryFormData {
  movieId: string;
  rating: number;
  review: string;
  watchedDate: string;
}

interface DiaryFormFieldsProps {
  movies: Movie[];
  selectedMovie: Movie | null;
  onMovieSelect: (movie: Movie) => void;
  register: UseFormRegister<DiaryFormData>;
  errors: FieldErrors<DiaryFormData>;
  watchedFields: DiaryFormData;
  onRatingChange: (rating: number) => void;
  isEditMode: boolean;
}

const DiaryFormFields: React.FC<DiaryFormFieldsProps> = ({
  movies,
  selectedMovie,
  onMovieSelect,
  register,
  errors,
  watchedFields,
  onRatingChange,
  isEditMode,
}) => {
  return (
    <>
      {/* Movie search and date row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <MovieSearch
            movies={movies}
            selectedMovie={selectedMovie}
            onMovieSelect={onMovieSelect}
            error={errors.movieId?.message}
            disabled={isEditMode}
          />
        </div>

        {/* Date picker */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Watched Date</span>
          </label>
          <input
            type="date"
            {...register("watchedDate")}
            className={`input input-bordered w-full ${
              errors.watchedDate ? "input-error" : ""
            }`}
          />
          <ErrorMessage>{errors.watchedDate?.message}</ErrorMessage>
        </div>
      </div>

      {/* Review textarea */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Review</span>
          <span className="label-text-alt">
            {watchedFields.review?.length || 0}/2000
          </span>
        </label>
        <textarea
          placeholder="Add a review..."
          {...register("review")}
          className={`textarea textarea-bordered h-64 resize-none w-full ${
            errors.review ? "textarea-error" : ""
          }`}
          maxLength={2000}
        />
        <ErrorMessage>{errors.review?.message}</ErrorMessage>
      </div>

      {/* Star rating */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Rating</span>
        </label>
        <StarRating
          rating={watchedFields.rating}
          onRatingChange={onRatingChange}
          error={errors.rating?.message}
        />
      </div>
    </>
  );
};

export default DiaryFormFields;
