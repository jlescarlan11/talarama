"use client";

import React from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import StarRating from "../new/StarRating";
import { Movie, DiaryFormData } from "../types/diary";
import MovieSearch from "./MovieSearch";

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
          />
        </div>

        {/* Date picker */}
        <div className="form-control">
          <label htmlFor="watched-date" className="label">
            <span className="label-text font-semibold">Watched Date</span>
          </label>
          <input
            id="watched-date"
            type="date"
            aria-invalid={!!errors.watchedDate}
            aria-describedby={errors.watchedDate ? "watched-date-error" : undefined}
            {...register("watchedDate")}
            className={`input input-bordered w-full ${
              errors.watchedDate ? "input-error" : ""
            }`}
          />
          {errors.watchedDate && <p id="watched-date-error" className="text-error text-sm" role="alert">{errors.watchedDate.message}</p>}
        </div>
      </div>

      {/* Review textarea */}
      <div className="form-control">
        <label htmlFor="diary-review" className="label">
          <span className="label-text font-semibold">Review (optional)</span>
          <span className="label-text-alt">
            {watchedFields.review?.length || 0}/2000
          </span>
        </label>
        <textarea
          id="diary-review"
          aria-invalid={!!errors.review}
          aria-describedby={errors.review ? "diary-review-error" : undefined}
          placeholder="Add a review..."
          {...register("review")}
          className={`textarea textarea-bordered h-64 resize-none w-full ${
            errors.review ? "textarea-error" : ""
          }`}
          maxLength={2000}
        />
        {errors.review && <p id="diary-review-error" className="text-error text-sm" role="alert">{errors.review.message}</p>}
      </div>

      {/* Star rating */}
      <div className="form-control">
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
