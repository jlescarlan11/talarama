"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import MovieSearch from "./MovieSearch";
import StarRating from "../new/StarRating";
import { Movie, DiaryFormData, FormErrors } from "../types/diary";
import Image from "next/image";

interface DiaryFormProps {
  movies: Movie[];
}

const DiaryForm: React.FC<DiaryFormProps> = ({ movies }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<DiaryFormData>({
    movieId: "",
    rating: 0,
    review: "",
    watchedDate: new Date().toISOString().split("T")[0], // Default to today
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const movieId = searchParams.get('movieId');
    if (movieId) {
      const movie = movies.find(m => m.id === movieId);
      if (movie) {
        handleMovieSelect(movie);
      }
    }
  }, [searchParams, movies]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setFormData((prev) => ({ ...prev, movieId: movie.id }));
    setErrors((prev) => ({ ...prev, movieId: undefined }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
    setErrors((prev) => ({ ...prev, rating: undefined }));
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, review: e.target.value }));
    setErrors((prev) => ({ ...prev, review: undefined }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, watchedDate: e.target.value }));
    setErrors((prev) => ({ ...prev, watchedDate: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.movieId) {
      newErrors.movieId = "Please select a movie";
    }

    if (formData.rating === 0) {
      newErrors.rating = "Please provide a rating";
    }

    if (formData.review.trim().length < 10) {
      newErrors.review = "Review must be at least 10 characters long";
    }

    if (formData.review.trim().length > 2000) {
      newErrors.review = "Review cannot exceed 2000 characters";
    }

    if (!formData.watchedDate) {
      newErrors.watchedDate = "Please select a watched date";
    } else {
      const selectedDate = new Date(formData.watchedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of day for comparison

      if (selectedDate > today) {
        newErrors.watchedDate = "Watched date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await axios.post("/api/diaries", formData);

      if (response.status === 201) {
        router.push("/diaries"); // Adjust route as needed
        router.refresh();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          if (error.response.status === 400) {
            setErrors({
              general: "Validation failed. Please check your input.",
            });
          } else if (error.response.status === 401) {
            setErrors({
              general: "You must be logged in to create diary entries.",
            });
          } else if (error.response.status === 404) {
            setErrors({ general: "Movie or user not found." });
          } else {
            setErrors({
              general: error.response.data.error || "Server error occurred",
            });
          }
        } else {
          setErrors({
            general: "Network error - please check your connection",
          });
        }
      } else {
        setErrors({ general: "An unexpected error occurred" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Add to your films...</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Form inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Movie search and date row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <MovieSearch
                movies={movies}
                selectedMovie={selectedMovie}
                onMovieSelect={handleMovieSelect}
                error={errors.movieId}
              />

              {/* Date picker */}
              <div className="w-full sm:w-48">
                <input
                  type="date"
                  value={formData.watchedDate}
                  onChange={handleDateChange}
                  className={`input input-bordered w-full ${
                    errors.watchedDate ? "input-error" : ""
                  }`}
                />
                {errors.watchedDate && (
                  <div className="text-error text-sm mt-1">
                    {errors.watchedDate}
                  </div>
                )}
              </div>
            </div>

            {/* Review textarea */}
            <div>
              <label className="label">
                <span className="label-text font-semibold">Review</span>
                <span className="label-text-alt">
                  {formData.review.length}/2000
                </span>
              </label>
              <textarea
                placeholder="Add a review..."
                value={formData.review}
                onChange={handleReviewChange}
                className={`textarea textarea-bordered w-full h-64 resize-none ${
                  errors.review ? "textarea-error" : ""
                }`}
                maxLength={2000}
              />
              {errors.review && (
                <div className="text-error text-sm mt-1">{errors.review}</div>
              )}
            </div>

            {/* Star rating */}
            <StarRating
              rating={formData.rating}
              onRatingChange={handleRatingChange}
              error={errors.rating}
            />
          </div>

          {/* Right side - Movie poster preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="aspect-[2/3] border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center bg-base-200 overflow-hidden">
                {selectedMovie ? (
                  <div className="w-full h-full relative">
                    {selectedMovie.posterUrl ? (
                      <Image
                        width={300}
                        height={450}
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                        <h3 className="font-semibold text-lg mb-2">
                          {selectedMovie.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {selectedMovie.releasedYear}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDuration(selectedMovie.duration)}
                        </p>
                        {selectedMovie.directorFirstName &&
                          selectedMovie.directorLastName && (
                            <p className="text-sm text-gray-500 mt-2">
                              Dir. {selectedMovie.directorFirstName}{" "}
                              {selectedMovie.directorLastName}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-base-content/60">Movie Poster</p>
                    <p className="text-sm text-base-content/40 mt-1">
                      Select a movie to see preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* General error message */}
        {errors.general && (
          <div className="alert alert-error mt-6">
            <span>{errors.general}</span>
          </div>
        )}

        {/* Submit button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn btn-primary px-8 ${isSubmitting ? "loading" : ""}`}
          >
            {isSubmitting ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiaryForm;
